# ✅ YAPILACAKLAR LİSTESİ

**Proje:** Karaman Medikal Stok Takip Sistemi  
**Son Güncelleme:** 11 Ocak 2025 - 09:20  
**Durum:** Aktif Geliştirme

---

## 🔴 KRİTİK ÖNCELİK (Hemen Yapılmalı)

### 1. Supabase Branch Migration ❌

**Görev ID:** CRITICAL-001  
**Durum:** ❌ Yapılmadı  
**Tahmini Süre:** 5 dakika  
**Yapacak Kişi:** Kullanıcı (Manuel)

**Açıklama:**
Şube sistemi için gerekli database değişikliklerini Supabase'de çalıştır.

**Adımlar:**
1. Supabase Dashboard'a git: https://supabase.com/dashboard/project/bqrxjhppxlzcllgwrkxf
2. Sol menüden "SQL Editor" seç
3. "+" butonuna tıkla, "New query" seç
4. `/app/supabase-migration-add-branch.sql` dosyasının içeriğini kopyala
5. "RUN" butonuna tıkla
6. "Success. No rows returned" mesajını kontrol et

**Kontrol:**
```sql
-- Supabase SQL Editor'de çalıştır:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'branch';

-- Sonuç: 1 satır dönmeli (branch kolonu var)
```

**Bağımlılıklar:** Yok  
**Engeller:** Yok  
**Test Gerekli:** ✅ Evet (ürün ekleme)

---

### 2. getProductByBarcode Fonksiyonu Güncelleme ❌

**Görev ID:** CRITICAL-002  
**Durum:** ❌ Yapılmadı  
**Tahmini Süre:** 15 dakika  
**Yapacak Kişi:** AI Assistant

**Açıklama:**
Barkod arama fonksiyonuna şube desteği ekle. Aynı barkod farklı şubelerde olabilir.

**Değiştirilecek Dosyalar:**
1. `/app/frontend/src/lib/api.js` - getProductByBarcode fonksiyonu
2. `/app/frontend/src/pages/Dashboard.js` - handleBarcodeSearch
3. `/app/frontend/src/pages/POS.js` - barkod ile ürün ekleme
4. `/app/frontend/src/pages/Stock.js` - scanner kullanımı

**Kod Değişikliği:**
```javascript
// ÖNCESİ:
export const getProductByBarcode = async (barcode) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .single();
  // ...
};

// SONRASI:
export const getProductByBarcode = async (barcode, branch = null) => {
  let query = supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode);
  
  if (branch) {
    query = query.eq('branch', branch);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Birden fazla sonuç varsa kullanıcıya seçim sun
  if (data.length > 1 && !branch) {
    return { multiple: true, products: data };
  }
  
  return data.length > 0 ? data[0] : null;
};
```

**Bağımlılıklar:** CRITICAL-001 (branch migration)  
**Engeller:** Migration yapılmadan çalışmaz  
**Test Gerekli:** ✅ Evet

---

### 3. Dashboard Barkod Arama Güncelleme ❌

**Görev ID:** CRITICAL-003  
**Durum:** ❌ Yapılmadı  
**Tahmini Süre:** 10 dakika  
**Yapacak Kişi:** AI Assistant

**Açıklama:**
Dashboard'da barkod arama yaptığında birden fazla şubede aynı barkod varsa, kullanıcıya seçim yaptır.

**Değiştirilecek Dosya:**
`/app/frontend/src/pages/Dashboard.js`

**Eklenmesi Gerekenler:**
- Şube seçim dialogu
- "Bu barkod 2 şubede mevcut. Hangi şubeyi görmek istersiniz?" mesajı
- Şube listesi ve seçim butonu

**Bağımlılıklar:** CRITICAL-002  
**Engeller:** Yok  
**Test Gerekli:** ✅ Evet

---

## 🟡 ORTA ÖNCELİK (Bu Hafta İçinde)

### 4. AI Entegrasyonu Seçimi ⏸️

**Görev ID:** MEDIUM-001  
**Durum:** ⏸️ Karar bekleniyor  
**Tahmini Süre:** 20 dakika (eğer değiştirilirse)  
**Yapacak Kişi:** Kullanıcı (Karar) + AI Assistant (Uygulama)

**Açıklama:**
Mevcut durumda Gemini AI kullanılıyor. OpenAI'a geçilsin mi?

**Seçenekler:**

**A) Gemini AI ile Devam Et**
- Değişiklik yok
- Mevcut kod çalışıyor
- Free tier: 60 req/min

**B) OpenAI GPT-4o-mini'ye Geç**
- Emergent LLM Key kullanılır
- Daha güçlü model
- Kod değişikliği gerekiyor

**Kodu Değiştirmek İçin:**
```javascript
// api.js - generateProductDescription fonksiyonu
export const generateProductDescription = async (productName, brand, category) => {
  const apiKey = process.env.REACT_APP_EMERGENT_LLM_KEY;
  
  const prompt = `Sen bir medikal ürün uzmanısın...`;
  
  const response = await fetch(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300
      })
    }
  );
  
  const data = await response.json();
  return data.choices[0].message.content.trim();
};
```

**Bağımlılıklar:** Yok  
**Engeller:** Kullanıcı kararı  
**Test Gerekli:** ✅ Evet (eğer değiştirilirse)

---

### 5. Manuel Test ve Doğrulama ⏸️

**Görev ID:** MEDIUM-002  
**Durum:** ⏸️ Kritik görevler bekleniyor  
**Tahmini Süre:** 30 dakika  
**Yapacak Kişi:** Kullanıcı

**Açıklama:**
Tüm özellikleri manuel olarak test et.

**Test Senaryoları:**

1. **Login Testi**
   - [ ] Admin girişi (admin / Admin123!)
   - [ ] Dashboard'a yönlendirme
   - [ ] Kullanıcı bilgileri doğru görünüyor

2. **Şube Sistemi Testi**
   - [ ] Ürün ekle (MUT Şubesi)
   - [ ] Aynı barkodla ürün ekle (KARAMAN Şubesi)
   - [ ] Şube filtresi çalışıyor
   - [ ] Grid/liste görünümünde şube görünüyor

3. **Barkod Arama Testi**
   - [ ] Dashboard'da barkod ara
   - [ ] Birden fazla şubede varsa seçim yapılıyor
   - [ ] Doğru ürün bilgileri gösteriliyor

4. **AI Açıklama Testi**
   - [ ] Yeni ürün ekle
   - [ ] "AI ile Açıklama Oluştur" butonuna tıkla
   - [ ] Açıklama oluşuyor ve form alanına dolduruluyor

5. **Rol Bazlı Yetkilendirme**
   - [ ] Yönetici: Tüm özellikler erişilebilir
   - [ ] Yönetici: Raporlar sekmesi görünüyor
   - [ ] Depo/Satış: Stokta düzenleme yapamıyor
   - [ ] Depo/Satış: Raporlar sekmesi görünmüyor

6. **Dark Mode Testi**
   - [ ] Tema değiştir
   - [ ] Tüm sayfalar okunabilir
   - [ ] Butonlar ve formlar düzgün görünüyor

7. **PWA Testi**
   - [ ] Mobil cihazda aç
   - [ ] "Ana ekrana ekle" önerisi geliyor
   - [ ] Kurulumdan sonra app gibi açılıyor

**Bağımlılıklar:** CRITICAL-001, CRITICAL-002, CRITICAL-003  
**Engeller:** Yok  
**Test Gerekli:** N/A (Bu zaten test)

---

## 🟢 DÜŞÜK ÖNCELİK (İsteğe Bağlı)

### 6. Fiyat Karşılaştırma Gerçek API Entegrasyonu ⏸️

**Görev ID:** LOW-001  
**Durum:** ⏸️ Karar bekleniyor  
**Tahmini Süre:** 2-3 saat  
**Yapacak Kişi:** AI Assistant

**Açıklama:**
Şu anda mock data kullanıyor. Gerçek fiyat karşılaştırma API'si entegre edilsin mi?

**Seçenekler:**

**A) Mock Data ile Devam Et**
- Değişiklik yok
- Kullanıcı zaten manuel arama yapıyor

**B) Google Custom Search API Kullan**
- Günlük 100 sorgu ücretsiz
- Basit entegrasyon
- Sonuçlar tutarlı olmayabilir

**C) SERPAPI Kullan**
- Ücretli servis (100 sorgu = $50/ay)
- Daha güvenilir sonuçlar
- E-ticaret siteleri özgü arama

**D) Özelliği Kaldır**
- Kullanıcı deneyimini basitleştirir
- Yanlış bilgi riski yok

**Bağımlılıklar:** Yok  
**Engeller:** Bütçe, API key gereksinimi  
**Test Gerekli:** ✅ Evet (eğer değiştirilirse)

---

### 7. MongoDB Servisini Durdur ⏸️

**Görev ID:** LOW-002  
**Durum:** ⏸️ Bekliyor  
**Tahmini Süre:** 2 dakika  
**Yapacak Kişi:** Kullanıcı veya AI

**Açıklama:**
Proje Supabase kullanıyor, MongoDB servisi gereksiz.

**Komut:**
```bash
sudo supervisorctl stop mongodb
sudo supervisorctl status  # Kontrol et
```

**Not:** Eğer ileride tekrar gerekirse `sudo supervisorctl start mongodb` ile başlatılabilir.

**Bağımlılıklar:** Yok  
**Engeller:** Yok  
**Test Gerekli:** ❌ Hayır

---

### 8. GitHub'a Push ⏸️

**Görev ID:** LOW-003  
**Durum:** ⏸️ Tüm değişiklikler tamamlanınca  
**Tahmini Süre:** 5 dakika  
**Yapacak Kişi:** Kullanıcı

**Açıklama:**
Tüm değişiklikleri GitHub'a yükle.

**Commit Mesajı Önerisi:**
```
fix: Critical bug fixes and branch system preparation

- Fixed duplicate fetchUsers function in Settings.js
- Prepared branch system for Supabase (migration pending)
- Updated documentation (DEVAM_NOKTASI.md, YAPILACAKLAR.md)
- Frontend compiled successfully with no errors

Pending:
- Supabase branch migration to be executed by user
- getProductByBarcode function to be updated after migration
```

**Adımlar:**
```bash
cd /app
git add .
git commit -m "fix: Critical bug fixes and branch system preparation"
git push origin main
```

**Bağımlılıklar:** CRITICAL-001, CRITICAL-002, CRITICAL-003  
**Engeller:** Yok  
**Test Gerekli:** ❌ Hayır

---

## 📊 GÖREV DURUMU ÖZETİ

| Öncelik | Toplam | Tamamlandı | Bekliyor | Yapılacak |
|---------|--------|------------|----------|-----------|
| 🔴 Kritik | 3 | 0 | 0 | 3 |
| 🟡 Orta | 2 | 0 | 2 | 0 |
| 🟢 Düşük | 3 | 0 | 3 | 0 |
| **TOPLAM** | **8** | **0** | **5** | **3** |

---

## 📅 ZAMAN ÇİZELGESİ (Tahmini)

### Bugün (11 Ocak 2025)
- ⏰ 09:30-09:35 → Kullanıcı: Supabase branch migration (5 dk)
- ⏰ 09:35-09:50 → AI: getProductByBarcode güncelleme (15 dk)
- ⏰ 09:50-10:00 → AI: Dashboard barkod arama güncelleme (10 dk)
- ⏰ 10:00-10:30 → Kullanıcı: Manuel test (30 dk)

### Bu Hafta
- 🗓️ AI entegrasyonu kararı
- 🗓️ Fiyat karşılaştırma kararı
- 🗓️ GitHub push

---

## ✅ TAMAMLANAN GÖREVLER

### 11 Ocak 2025 - Sabah
- ✅ Proje GitHub'dan yüklendi ve incelendi
- ✅ Frontend dependencies yüklendi (yarn install)
- ✅ Frontend başarıyla başlatıldı
- ✅ Settings.js duplicate fetchUsers bug'ı düzeltildi
- ✅ Webpack compilation başarılı
- ✅ Dokümantasyon oluşturuldu (DEVAM_NOKTASI.md, YAPILACAKLAR.md)
- ✅ test_result.md güncellendi

---

**Son Güncelleme:** 11 Ocak 2025 - 09:20  
**Hazırlayan:** AI Assistant  
**Durum:** ✅ Güncel
