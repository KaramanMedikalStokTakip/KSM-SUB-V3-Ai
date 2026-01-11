import requests
import sys
import json
from datetime import datetime

class AIDescriptionTester:
    def __init__(self, base_url="https://ai-caption-builder.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, endpoint, data, expected_checks):
        """Run a single API test with multiple validation checks"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"Request data: {json.dumps(data, indent=2, ensure_ascii=False)}")
        
        try:
            response = requests.post(url, json=data, headers=headers, timeout=30)
            print(f"Response status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                print(f"Response text: {response.text}")
                self.test_results.append({
                    'name': name,
                    'status': 'FAILED',
                    'reason': f'HTTP {response.status_code}',
                    'response': response.text
                })
                return False

            try:
                response_data = response.json()
                print(f"Response data: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
            except json.JSONDecodeError:
                print(f"❌ Failed - Invalid JSON response")
                print(f"Response text: {response.text}")
                self.test_results.append({
                    'name': name,
                    'status': 'FAILED',
                    'reason': 'Invalid JSON response',
                    'response': response.text
                })
                return False

            # Run validation checks
            all_checks_passed = True
            failed_checks = []
            
            for check_name, check_func in expected_checks.items():
                try:
                    if check_func(response_data):
                        print(f"✅ {check_name}: PASSED")
                    else:
                        print(f"❌ {check_name}: FAILED")
                        failed_checks.append(check_name)
                        all_checks_passed = False
                except Exception as e:
                    print(f"❌ {check_name}: ERROR - {str(e)}")
                    failed_checks.append(f"{check_name} (Error: {str(e)})")
                    all_checks_passed = False

            if all_checks_passed:
                self.tests_passed += 1
                print(f"✅ {name}: ALL CHECKS PASSED")
                self.test_results.append({
                    'name': name,
                    'status': 'PASSED',
                    'response': response_data
                })
            else:
                print(f"❌ {name}: FAILED CHECKS - {', '.join(failed_checks)}")
                self.test_results.append({
                    'name': name,
                    'status': 'FAILED',
                    'reason': f'Failed checks: {", ".join(failed_checks)}',
                    'response': response_data
                })

            return all_checks_passed

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout (30s)")
            self.test_results.append({
                'name': name,
                'status': 'FAILED',
                'reason': 'Request timeout',
                'response': None
            })
            return False
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                'name': name,
                'status': 'FAILED',
                'reason': str(e),
                'response': None
            })
            return False

    def test_normal_product_description(self):
        """Test Case 1: Normal Product Description Generation"""
        data = {
            "product_name": "Dijital Tansiyon Aleti",
            "brand": "Omron",
            "category": "Tansiyon Aletleri"
        }
        
        checks = {
            "success_is_true": lambda r: r.get('success') is True,
            "description_exists": lambda r: r.get('description') and len(r.get('description', '')) > 0,
            "description_length": lambda r: len(r.get('description', '')) > 50,
            "no_error": lambda r: r.get('error') is None,
            "contains_turkish": lambda r: any(char in r.get('description', '') for char in 'çğıöşüÇĞIÖŞÜ') or 'tansiyon' in r.get('description', '').lower()
        }
        
        return self.run_test("Normal Product Description", "api/generate-description", data, checks)

    def test_without_brand(self):
        """Test Case 2: Without Brand"""
        data = {
            "product_name": "Ateş Ölçer",
            "brand": "",
            "category": "Ateş Ölçerler"
        }
        
        checks = {
            "success_is_true": lambda r: r.get('success') is True,
            "description_exists": lambda r: r.get('description') and len(r.get('description', '')) > 0,
            "no_error": lambda r: r.get('error') is None,
            "handles_empty_brand": lambda r: len(r.get('description', '')) > 30  # Should still generate meaningful description
        }
        
        return self.run_test("Without Brand", "api/generate-description", data, checks)

    def test_different_category(self):
        """Test Case 3: Different Category"""
        data = {
            "product_name": "Eldiven",
            "brand": "Bioglan",
            "category": "Eldiven ve Maskeler"
        }
        
        checks = {
            "success_is_true": lambda r: r.get('success') is True,
            "description_exists": lambda r: r.get('description') and len(r.get('description', '')) > 0,
            "no_error": lambda r: r.get('error') is None,
            "category_relevant": lambda r: 'eldiven' in r.get('description', '').lower() or 'koruma' in r.get('description', '').lower()
        }
        
        return self.run_test("Different Category", "api/generate-description", data, checks)

    def test_long_product_name(self):
        """Test Case 4: Long Product Name"""
        data = {
            "product_name": "Omron M3 Comfort Tam Otomatik Koldan Dijital Tansiyon Ölçüm Cihazı",
            "brand": "Omron",
            "category": "Tansiyon Aletleri"
        }
        
        checks = {
            "success_is_true": lambda r: r.get('success') is True,
            "description_exists": lambda r: r.get('description') and len(r.get('description', '')) > 0,
            "no_error": lambda r: r.get('error') is None,
            "handles_long_name": lambda r: len(r.get('description', '')) > 50,
            "mentions_product": lambda r: 'omron' in r.get('description', '').lower() or 'tansiyon' in r.get('description', '').lower()
        }
        
        return self.run_test("Long Product Name", "api/generate-description", data, checks)

    def test_health_endpoint(self):
        """Test health endpoint"""
        print(f"\n🔍 Testing Health Endpoint...")
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                print(f"✅ Health endpoint: PASSED")
                return True
            else:
                print(f"❌ Health endpoint: FAILED - Status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Health endpoint: ERROR - {str(e)}")
            return False

def main():
    print("🚀 Starting AI Product Description Generation Tests")
    print("=" * 60)
    
    # Setup
    tester = AIDescriptionTester()
    
    # Test health endpoint first
    tester.test_health_endpoint()
    
    # Run all test cases
    print(f"\n📋 Running Test Cases...")
    tester.test_normal_product_description()
    tester.test_without_brand()
    tester.test_different_category()
    tester.test_long_product_name()

    # Print summary
    print(f"\n" + "=" * 60)
    print(f"📊 TEST SUMMARY")
    print(f"=" * 60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    # Print detailed results
    print(f"\n📋 DETAILED RESULTS:")
    for result in tester.test_results:
        status_emoji = "✅" if result['status'] == 'PASSED' else "❌"
        print(f"{status_emoji} {result['name']}: {result['status']}")
        if result['status'] == 'FAILED' and 'reason' in result:
            print(f"   Reason: {result['reason']}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())