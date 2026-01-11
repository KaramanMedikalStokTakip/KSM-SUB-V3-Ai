# Karaman Medical Stock - Supabase Version

Medikal stok yönetim sistemi - Supabase ve Gemini AI ile çalışan tam frontend uygulama.

## 🚀 Teknolojiler

- **Frontend:** React 19, Tailwind CSS, Radix UI
- **Backend:** Supabase (Database + Auth)
- **AI:** Google Gemini API (ürün açıklamaları için)
- **State Management:** React Context API
- **Routing:** React Router v7

## 📋 Özellikler

- ✅ Stok Yönetimi (Stock)
- ✅ Satış Noktası (POS)
- ✅ Müşteri Takibi (Customers)
- ✅ Raporlama (Reports)
- ✅ Takvim/Randevu (Calendar)
- ✅ Ayarlar (Settings)
- ✅ AI Destekli Ürün Açıklama Üretimi (Gemini)
- ✅ Barkod Okuma
- ✅ PWA Desteği
- ✅ Dark Mode

## 🔧 Kurulum

### 1. Supabase Yapılandırması

`.env` dosyasındaki Supabase bilgilerini güncelle:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_GEMINI_API_KEY=your-gemini-api-key
```

### 2. Dependencies Kurulumu

```bash
cd frontend
yarn install
```

### 3. Uygulamayı Başlatma

```bash
yarn start
```

## 📁 Proje Yapısı

```
/app/
├── frontend/
│   ├── src/
│   │   ├── components/    # UI bileşenleri
│   │   ├── pages/         # Sayfa bileşenleri
│   │   ├── lib/
│   │   │   ├── supabase.js   # Supabase client
│   │   │   ├── gemini.js     # Gemini AI utility
│   │   │   └── api.js        # API fonksiyonları
│   │   ├── App.js         # Ana uygulama + Auth
│   │   └── index.js
│   ├── .env              # Environment variables
│   └── package.json
└── README.md
```

## 🗄️ Supabase Veritabanı Şeması

Uygulamanın çalışması için aşağıdaki tablolar gereklidir:

- `users` - Kullanıcı bilgileri ve authentication
- `products` - Ürün/stok bilgileri
- `customers` - Müşteri bilgileri
- `sales` - Satış kayıtları
- `appointments` - Randevu bilgileri

## 🔐 Authentication

Supabase Auth entegrasyonu kullanılıyor:
- Session yönetimi
- Auto-refresh token
- Auth state change listener

## 🤖 AI Özellikleri

Gemini API ile:
- Otomatik ürün açıklaması üretimi
- Medikal ürün bilgilendirmesi
- Türkçe dil desteği

## 📱 PWA

Progressive Web App olarak:
- Offline çalışma desteği
- Mobil cihazlara yüklenebilir
- Push notification hazır

## 🔄 Değişiklikler (Backend Kaldırıldı)

Önceki versiyonda FastAPI backend vardı, şimdi:
- ✅ Backend tamamen kaldırıldı
- ✅ Tüm işlemler Supabase üzerinden
- ✅ AI işlemleri Gemini API ile frontend'den direkt
- ✅ MongoDB kaldırıldı, Supabase PostgreSQL kullanılıyor

## 📞 Destek

Sorularınız için: support@karamanmedical.com
