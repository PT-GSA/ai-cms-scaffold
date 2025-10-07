# Database Setup untuk AI CMS Scaffold

## Masalah yang Diselesaikan

Jika Anda mendapatkan error `"Content type not found"` saat mengakses `/api/public/content-types`, ini berarti database belum diinisialisasi dengan schema dan data yang diperlukan.

## Solusi yang Disediakan

### 1. Endpoint Setup Database

#### `/api/setup/status` (GET)
Memeriksa status database dan content types yang ada.

**Response:**
```json
{
  "success": true,
  "message": "Database status berhasil diperiksa",
  "status": {
    "database": {
      "initialized": true,
      "tables": {
        "content_types": true,
        "content_type_fields": true,
        "content_entries": true
      }
    },
    "content_types": {
      "exists": true,
      "count": 3,
      "fields_count": 10,
      "data": [...]
    },
    "overall": {
      "ready": true,
      "needs_setup": false
    }
  }
}
```

#### `/api/setup/init-database` (POST)
Menginisialisasi database dengan schema dan sample data.

**Response:**
```json
{
  "success": true,
  "message": "Database berhasil diinisialisasi dengan sample data",
  "data": {
    "content_types": [...],
    "total_content_types": 3
  }
}
```

### 2. Komponen DatabaseSetup

Komponen React yang menyediakan UI untuk:
- Memeriksa status database
- Menginisialisasi database
- Menampilkan informasi content types yang tersedia

### 3. Script Otomatis

#### `scripts/setup-database.js`
Script Node.js untuk setup database secara otomatis.

**Cara menjalankan:**
```bash
# Pastikan server development berjalan
npm run dev

# Di terminal lain, jalankan script setup
node scripts/setup-database.js
```

## Cara Menggunakan

### Opsi 1: Melalui UI Dashboard
1. Buka `http://localhost:3000/dashboard/playground`
2. Di bagian "Database Setup", klik tombol "Refresh" untuk memeriksa status
3. Jika status menunjukkan "Needs Setup", klik "Inisialisasi Database"

### Opsi 2: Melalui API Langsung
```bash
# Cek status database
curl http://localhost:3000/api/setup/status

# Inisialisasi database
curl -X POST http://localhost:3000/api/setup/init-database
```

### Opsi 3: Menggunakan Script Otomatis
```bash
# Jalankan script setup
node scripts/setup-database.js
```

## Content Types yang Dibuat

Setelah inisialisasi, akan tersedia 3 content types:

### 1. Article
- **Fields:** title, content, excerpt, published_date
- **Deskripsi:** Blog articles and news posts

### 2. Page
- **Fields:** title, content, meta_description
- **Deskripsi:** Static pages like About, Contact

### 3. Product
- **Fields:** name, description, price, sku
- **Deskripsi:** E-commerce products

## Verifikasi

Setelah setup selesai, Anda dapat mengakses:
- `http://localhost:3000/api/public/content-types` - Daftar content types
- `http://localhost:3000/dashboard/playground` - UI untuk testing

## Troubleshooting

### Error: "Failed to execute content types schema"
- Pastikan Supabase service role key sudah dikonfigurasi dengan benar
- Pastikan database memiliki permission untuk membuat tabel

### Error: "Content type not found" masih muncul
- Pastikan database sudah diinisialisasi dengan benar
- Cek apakah ada data di tabel `content_types`
- Pastikan `is_active = true` untuk content types

### Error: "execute_sql function not found"
- Pastikan Supabase project memiliki function `execute_sql`
- Atau gunakan script SQL langsung di Supabase dashboard
