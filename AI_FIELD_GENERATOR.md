# AI Field Generator untuk Content Types

## Fitur Baru: Auto Generate Fields dengan AI

Fitur AI Field Generator memungkinkan Anda untuk secara otomatis membuat fields untuk content types berdasarkan deskripsi dan kebutuhan bisnis Anda.

### 🚀 **Cara Menggunakan**

#### 1. **Melalui UI Dashboard**
1. Buka `http://localhost:3000/dashboard/content-types`
2. Klik "New Content Type" atau edit content type yang sudah ada
3. Di form content type, klik tab "AI Generator"
4. Isi informasi yang diperlukan:
   - **Nama Content Type**: Contoh: "Product", "Article", "Event"
   - **Deskripsi Content Type**: Jelaskan apa yang akan disimpan
   - **Domain Bisnis**: Pilih domain yang sesuai (e-commerce, blog, dll)
   - **Target Audience**: Siapa yang akan menggunakan content ini
   - **Requirements Tambahan**: Kebutuhan khusus jika ada
5. Klik "Generate Fields dengan AI"
6. Review fields yang di-generate
7. Klik "Apply Fields" untuk menerapkan ke form

#### 2. **Melalui API Langsung**
```bash
curl -X POST http://localhost:3000/api/ai/generate-fields \
  -H "Content-Type: application/json" \
  -d '{
    "contentTypeName": "Product",
    "contentTypeDescription": "E-commerce product with pricing and inventory",
    "businessDomain": "ecommerce",
    "targetAudience": "customers",
    "additionalRequirements": "Include inventory tracking"
  }'
```

### 📋 **Domain Bisnis yang Didukung**

- **General**: Untuk content types umum
- **E-commerce**: Produk, kategori, inventory
- **Blog/News**: Artikel, kategori, author
- **Portfolio**: Project, skills, testimonials
- **Corporate**: Company info, services, team
- **Education**: Courses, lessons, students
- **Healthcare**: Services, doctors, appointments
- **Real Estate**: Properties, agents, locations
- **Restaurant**: Menu, reservations, reviews
- **Travel**: Destinations, packages, bookings

### 🎯 **Field Types yang Dihasilkan**

AI akan secara cerdas memilih field types yang sesuai:

- **text**: Judul, nama, SKU
- **textarea**: Deskripsi singkat, excerpt
- **rich_text**: Konten utama dengan formatting
- **number**: Harga, rating, quantity
- **boolean**: Status aktif/tidak aktif
- **date/datetime**: Tanggal publikasi, event date
- **email**: Email contact
- **url**: Website, social media links
- **select**: Kategori, status, pilihan tunggal
- **multi_select**: Tags, multiple categories
- **media**: Gambar, file upload
- **relation**: Relasi ke content type lain
- **json**: Data kompleks custom

### 🔧 **Contoh Penggunaan**

#### **Product Content Type**
```json
{
  "contentTypeName": "Product",
  "contentTypeDescription": "E-commerce product with pricing and inventory",
  "businessDomain": "ecommerce",
  "targetAudience": "customers"
}
```

**Fields yang dihasilkan:**
- Title, Slug, Description, Price, SKU
- Product Images, Meta Title, Meta Description
- Status, Published Date, Category, Tags

#### **Blog Article Content Type**
```json
{
  "contentTypeName": "Blog Article",
  "contentTypeDescription": "Blog post for website content",
  "businessDomain": "blog",
  "targetAudience": "readers"
}
```

**Fields yang dihasilkan:**
- Title, Slug, Content, Excerpt
- Featured Image, Meta Title, Meta Description
- Status, Published Date, Category, Author

### 🧠 **Kecerdasan AI**

AI Field Generator menggunakan logika cerdas untuk:

1. **Menganalisis nama content type** untuk menentukan field yang relevan
2. **Mempertimbangkan domain bisnis** untuk field khusus
3. **Menambahkan field SEO** secara otomatis
4. **Menyertakan field publishing** (status, tanggal)
5. **Memberikan suggestions** untuk pengembangan lebih lanjut

### 📊 **Response Format**

```json
{
  "success": true,
  "data": {
    "fields": [
      {
        "field_name": "title",
        "display_name": "Title",
        "field_type": "text",
        "is_required": true,
        "is_unique": false,
        "help_text": "Judul utama content",
        "validation_rules": {"min_length": 5, "max_length": 100},
        "sort_order": 1
      }
    ],
    "suggestions": [
      "Pertimbangkan menambahkan field untuk analytics tracking",
      "Field untuk custom metadata bisa ditambahkan sesuai kebutuhan"
    ],
    "reasoning": "Penjelasan mengapa field-field ini dipilih"
  }
}
```

### ⚙️ **Konfigurasi Gemini AI (Opsional)**

Untuk menggunakan Gemini AI yang lebih canggih, tambahkan API key:

```bash
# Di file .env.local
GEMINI_API_KEY=your_gemini_api_key_here
```

Tanpa API key, sistem akan menggunakan smart fallback yang tetap menghasilkan fields yang relevan.

### 🎉 **Keunggulan**

- ✅ **Cepat**: Generate fields dalam hitungan detik
- ✅ **Cerdas**: Memahami konteks dan kebutuhan bisnis
- ✅ **Lengkap**: Termasuk SEO, publishing, dan business fields
- ✅ **Fleksibel**: Mendukung berbagai domain bisnis
- ✅ **User-friendly**: Interface yang mudah digunakan
- ✅ **Fallback**: Tetap berfungsi tanpa API key eksternal

### 🔄 **Workflow Lengkap**

1. **Buat Content Type** dengan informasi dasar
2. **Generate Fields** menggunakan AI Generator
3. **Review & Customize** fields yang dihasilkan
4. **Apply Fields** ke content type
5. **Save Content Type** untuk digunakan
6. **Buat Content Entries** menggunakan struktur yang sudah dibuat

Fitur ini menghemat waktu dan memastikan struktur content type yang optimal untuk kebutuhan bisnis Anda! 🚀
