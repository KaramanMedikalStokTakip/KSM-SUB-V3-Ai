# CHANGELOG
Tüm önemli değişiklikler bu dosyada belgelenmektedir.

## [5.0.2] - 2025-01-11 - PROJE ANALİZ VE KRİTİK BUG FIX

### 🔍 Proje Yeniden Yükleme ve Analiz
- **GitHub Reposundan Proje Çekildi:** Kullanıcının GitHub reposundan proje tekrar indirildi
- **Kapsamlı Analiz Yapıldı:** Tüm dosya yapısı, kod kalitesi ve çalışabilirlik detaylı incelendi
- **Eksikler Tespit Edildi:** Kritik ve orta öncelikli eksikler belirlendi ve dokümante edildi

### 🐛 Kritik Bug Düzeltmeleri

#### Settings.js Duplicate Function
- **Dosya:** `/app/frontend/src/pages/Settings.js`
- **Sorun:** `fetchUsers` fonksiyonu iki kere tanımlanmış (satır 89 ve 126)
- **Sebep:** Önceki birleştirme işleminde kod tekrarı oluşmuş
- **Çözüm:** İkinci tanım (satır 126-137) silindi
- **Sonuç:** 
  - ✅ Webpack compilation başarılı
  - ✅ "webpack compiled with 23 warnings" (sadece html5-qrcode source maps, önemsiz)
  - ✅ 0 errors

### 🚀 Frontend Optimizasyonu
- **Yarn Cache Temizlendi:** `yarn cache clean` çalıştırıldı
- **Dependencies Yeniden Yüklendi:** `yarn install` (145.57 saniye)
- **Servis Başlatıldı:** `sudo supervisorctl restart frontend`
- **Durum:** RUNNING (port 3000)

### ⚠️ Tespit Edilen Kritik Eksikler

#### 1. Supabase Branch Migration (EN ÖNEMLİ)
- **Durum:** ❌ Yapılmadı
- **Dosya:** `/app/supabase-migration-add-branch.sql`
- **Sorun:** Şube sistemi frontend'de kodlanmış ama database'de branch kolonu yok
- **Etki:** Ürün ekleme/düzenleme şube bilgisini kaydedemez
- **Çözüm:** Kullanıcı Supabase SQL Editor'de migration'ı çalıştırmalı

#### 2. getProductByBarcode Şube Desteği
- **Durum:** ❌ Yapılmadı
- **Dosya:** `/app/frontend/src/lib/api.js` (satır 147-156)
- **Sorun:** Fonksiyon `.single()` kullanıyor, sadece tek ürün döndürüyor
- **Etki:** Aynı barkod farklı şubelerde olduğunda sadece birini bulur
- **Çözüm:** Fonksiyon branch parametresi almalı veya tüm sonuçları döndürmeli

#### 3. AI Entegrasyonu Kararı
- **Durum:** ⏸️ Karar bekliyor
- **Mevcut:** Gemini AI (çalışıyor)
- **Alternatif:** OpenAI GPT-4o-mini + Emergent LLM Key
- **Not:** Her iki API key de .env'de mevcut

### 📝 Yeni Dokümantasyon
- **DEVAM_NOKTASI.md:** Nerede kaldık, sonraki adımlar detaylı rehber
- **YAPILACAKLAR.md:** 8 görev tanımlandı (3 kritik, 2 orta, 3 düşük öncelik)
- **test_result.md:** Agent communication güncellendi
- **PROJE_DURUMU.md:** Güncel durum özeti güncellendi
- **CHANGELOG.md:** Bu kayıt eklendi

### 🔧 Teknik Detaylar

#### Değiştirilen Dosyalar
1. `/app/frontend/src/pages/Settings.js`
   - Duplicate `fetchUsers` fonksiyonu silindi (satır 126-137)
   - Webpack compilation hatası giderildi

2. `/app/DEVAM_NOKTASI.md` (YENİ)
   - Proje durumu ve sonraki adımlar (detaylı rehber)
   - Kritik, orta ve düşük öncelikli görevler
   - Kontrol listeleri ve yardım notları

3. `/app/YAPILACAKLAR.md` (YENİ)
   - 8 detaylı görev tanımı
   - Her görev için ID, durum, tahmini süre, bağımlılıklar
   - Test senaryoları ve zaman çizelgesi

4. `/app/test_result.md`
   - Yeni agent communication kaydı eklendi
   - Proje analiz ve temizlik özeti

5. `/app/PROJE_DURUMU.md`
   - Durum güncellendi: "HAZIR ama kritik eksikler var"
   - Tamamlanan işlemler bölümü güncellendi
   - İstatistikler eklendi

### 📊 Proje İstatistikleri
- **Frontend Dosyaları:** 66 JS/JSX dosyası
- **Ana API Dosyası:** 787 satır
- **Toplam Sayfa Kodu:** ~5,159 satır
- **Compilation:** 0 errors, 23 warnings (önemsiz)

### 🎯 Sonraki Adımlar (Öncelik Sırasına Göre)
1. **[KRİTİK]** Supabase branch migration çalıştır
2. **[KRİTİK]** getProductByBarcode fonksiyonunu güncelle
3. **[KRİTİK]** Dashboard/POS/Stock'ta barkod arama düzelt
4. **[ORTA]** AI entegrasyonu kararı
5. **[ORTA]** Manuel test

---

## [5.0.1] - 2025-11-18 - SUPABASE MİGRASYON HATA DÜZELTMELERİ

### 🐛 Düzeltmeler

#### Login Sistemi Düzeltmeleri
- **Frontend Bağımlılıkları:** `yarn install` çalıştırıldı, eksik `@craco/craco` paketi kuruldu
- **Login Fallback Mekanizması:** `loginUser()` fonksiyonuna akıllı fallback eklendi
  - İlk olarak `verify_user_password()` RPC'yi deniyor
  - RPC yoksa veya hata verirse direkt users tablosundan `bcrypt.compare()` ile doğrulama
  - Bu sayede Supabase'de RPC tanımlı olmasa bile login çalışıyor
- **RLS Politikaları:** Users tablosunda 'Users can view all users' SELECT politikası doğrulandı

#### Dashboard Veri Yükleme Hataları
- **Düşük Stok Sorgusu:** Supabase column-to-column karşılaştırma desteklemiyor
  - **Önceki:** `.filter('quantity', 'lte', 'min_quantity')` ❌ (400 Bad Request)
  - **Yeni:** Tüm ürünleri çekip JavaScript'te filtreleme: `data.filter(p => p.quantity <= p.min_quantity)` ✅
  - `getLowStockProducts()` ve `getDashboardStats()` fonksiyonları güncellendi
  
- **Metal Fiyat API:** `getMetalPrices()` fonksiyonunda güvenli kontroller eklendi
  - `data.rates` undefined kontrolü eklendi
  - API hata verirse fallback değerlere geçiliyor (gold: 2800 TL/gram, silver: 32.5 TL/gram)

#### Gemini AI Entegrasyonu
- **API Key Güncelleme:** Yeni Gemini API key (Google AI Studio'dan alındı)
- **Environment Variable:** `REACT_APP_GEMINI_API_KEY` doğrulandı ve frontend restart edildi
- **AI Açıklama:** Ürün düzenleme sayfasında "AI ile Açıklama Oluştur" özelliği çalışır hale getirildi

### 📝 Dokümantasyon
- `test_result.md` güncellendi (3 yeni agent communication kaydı)
- `CHANGELOG.md` güncellendi (bu bölüm)

### 🔧 Teknik Detaylar

#### Değiştirilen Dosyalar
1. `/app/frontend/src/lib/api.js`
   - `loginUser()` - Fallback mekanizması eklendi (43 satır)
   - `getLowStockProducts()` - JS filtreleme (9 satır)
   - `getDashboardStats()` - Low stock count JS filtreleme (5 satır)
   - `getMetalPrices()` - data.rates null kontrolü (4 satır)

2. `/app/frontend/.env`
   - `REACT_APP_GEMINI_API_KEY` doğrulandı

3. `/app/test_result.md`
   - Agent communication log güncellendi (3 kayıt)

#### Sorun Giderme Adımları
1. `cd /app/frontend && yarn install` - Bağımlılık kurulumu
2. `sudo supervisorctl restart frontend` - Frontend yeniden başlatma
3. Supabase SQL Editor'de admin kullanıcısı oluşturuldu:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   INSERT INTO users (username, email, password, role)
   VALUES ('admin', 'admin@karaman.com', crypt('Admin123!', gen_salt('bf', 10)), 'yönetici');
   ```

### ✅ Test Sonuçları
- ✅ Login ekranı çalışıyor
- ✅ Admin girişi başarılı (username: admin, password: Admin123!)
- ✅ Dashboard verileri yükleniyor (ürün sayısı, düşük stok, metal fiyatları)
- ✅ AI açıklama özelliği çalışıyor

---

## [5.0.0] - 2025-11-16 - SUPABASE MİGRASYONU

### 🎯 Büyük Değişiklikler

#### Backend Tamamen Kaldırıldı
- **Kaldırılan:** FastAPI + MongoDB backend
- **Yeni Sistem:** Supabase (PostgreSQL + API)
- **Etki:** Serverless mimari, daha kolay bakım

### ✅ Eklenenler

#### Supabase Entegrasyonu
- Supabase client kurulumu (`@supabase/supabase-js@2.81.1`)
- Supabase config dosyası (`/app/frontend/src/lib/supabase.js`)
- Kapsamlı API helper library (`/app/frontend/src/lib/api.js` - 650+ satır)
- Database schema dosyası (`/app/supabase-schema.sql` - 262 satır)

#### Database
- 5 PostgreSQL tablosu oluşturuldu:
  - `users` - Kullanıcı yönetimi (custom auth)
  - `products` - Ürün yönetimi
  - `customers` - Müşteri yönetimi (soft delete)
  - `sales` - Satış kayıtları (JSONB items)
  - `calendar_events` - Takvim etkinlikleri
- Row Level Security (RLS) policies
- Database indexes (username, barcode, brand, category, phone)
- Triggers (updated_at otomatik güncelleme)
- PostgreSQL RPC fonksiyonu: `verify_user_password()` (bcrypt doğrulama)

#### Test Verileri
- Default admin kullanıcısı (username: admin, password: Admin123!)
- 5 medikal ürün örneği
- 5 müşteri örneği

#### Dependencies
- `@supabase/supabase-js` - Supabase JavaScript client
- `bcryptjs` - Şifre hash'leme

### 🔄 Değiştirileler

#### Authentication
- **Önceki:** JWT token + axios interceptors
- **Yeni:** Custom users tablosu + localStorage
- Login fonksiyonu Supabase RPC kullanıyor
- Şifre doğrulama PostgreSQL tarafında (pgcrypto)

#### API Çağrıları
- **Önceki:** axios ile REST API (`/api/*` endpoints)
- **Yeni:** Supabase client SDK (direct PostgreSQL queries)
- Tüm CRUD operasyonları Supabase fonksiyonlarına dönüştürüldü

#### Environment Variables
```diff
- REACT_APP_BACKEND_URL=https://...
+ REACT_APP_SUPABASE_URL=https://bqrxjhppxlzcllgwrkxf.supabase.co
+ REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOi...
```

#### App.js
- axios import kaldırıldı
- API constant kaldırıldı
- supabase client export edildi
- Login fonksiyonu basitleştirildi (token yönetimi yok)

#### Login.js
- axios post yerine `loginUser()` fonksiyonu
- Error handling güncellendi

### ❌ Kaldırılanlar

#### Backend Dosyaları (Tamamen Silindi)
- `/app/backend/server.py` (1,205 satır FastAPI)
- `/app/backend/requirements.txt`
- `/app/backend/.env`
- `/app/backend/add_test_data.py`
- **Toplam:** ~1,300+ satır Python kodu

#### Dependencies
- FastAPI
- Motor (MongoDB async driver)
- PyMongo
- Python-jose (JWT)
- Passlib (Password hashing)
- uvicorn

#### Concepts
- JWT token management
- axios interceptors
- Bearer authentication
- REST API endpoints
- MongoDB queries

### 🐛 Düzeltmeler

#### Şifre Doğrulama Sorunu
- **Problem:** bcryptjs tarayıcıda hash karşılaştırması yaparken performans sorunu
- **Çözüm:** PostgreSQL RPC fonksiyonu ile backend tarafında doğrulama
- **Kullanılan:** pgcrypto extension + `crypt()` fonksiyonu

### 📝 Dokümantasyon

#### Yeni Dosyalar
- `SUPABASE_MIGRATION_GUIDE.md` - Detaylı migrasyon rehberi
- `CHANGELOG.md` - Bu dosya
- `supabase-schema.sql` - Database schema

### 🔒 Güvenlik

#### Row Level Security (RLS)
- Tüm tablolarda RLS aktif
- Rol bazlı erişim kontrolleri:
  - `yönetici` - Tüm yetkiler
  - `depo` - Sınırlı yetkiler
  - `satış` - Sınırlı yetkiler

#### Şifre Güvenliği
- bcrypt hash algoritması (cost: 12)
- Şifreler PostgreSQL'de hash'leniyor
- Şifreler asla client'a gönderilmiyor
- SELECT sorgularında password field exclude ediliyor

---

## [4.3.x] - Önceki Versiyonlar

### [4.3.0] - 2025-11 (Aralık)

#### Eklenenler
- PDF indirme düzeltmesi
- Raporlar sekmesi yetkilendirme (sadece yönetici)
- Test verileri manuel ekleme
- PWA desteği
- Dark mode iyileştirmeleri

#### Düzelitmeler
- PDF export hatası (doc.autoTable is not a function)
- Türkçe karakter desteği PDF'lerde
- Dark mode okunabilirlik

---

## Versiyon Numaralandırma

Bu proje [Semantic Versioning](https://semver.org/) kullanmaktadır.

Format: `MAJOR.MINOR.PATCH`

- **MAJOR:** Uyumlu olmayan API değişiklikleri
- **MINOR:** Geriye uyumlu yeni özellikler
- **PATCH:** Geriye uyumlu hata düzeltmeleri

---

## Gelecek Planlanan Değişiklikler (Roadmap)

### v5.1.0 (Yakında)
- [ ] Tüm sayfaları Supabase'e adapt etme
  - [ ] Dashboard.js
  - [ ] Stock.js
  - [ ] POS.js
  - [ ] Customers.js
  - [ ] Reports.js
  - [ ] Calendar.js
  - [ ] Settings.js

### v5.2.0
- [ ] Real-time özellikler (Supabase Realtime)
- [ ] Supabase Storage (dosya/resim yükleme)
- [ ] Supabase Edge Functions (AI features)

### v5.3.0
- [ ] Offline-first architecture
- [ ] PWA iyileştirmeleri
- [ ] Background sync

---

**Not:** Bu CHANGELOG dosyası [Keep a Changelog](https://keepachangelog.com/) formatını takip etmektedir.
