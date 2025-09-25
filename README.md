# AI CMS Scaffold

[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2015-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## 🚀 Overview

AI CMS Scaffold adalah sistem manajemen konten (CMS) modern yang dibangun dengan teknologi terdepan. Proyek ini menyediakan platform headless CMS yang fleksibel dengan fitur-fitur canggih untuk mengelola konten digital secara efisien.

### ✨ Fitur Utama yang Sudah Diimplementasi

#### 🎯 Content Management System (CMS Core)
- ✅ **Dynamic Content Types**: Buat dan kelola tipe konten secara dinamis
- ✅ **Field Types**: Mendukung berbagai jenis field (Text, Number, Boolean, Date, Rich Text, dll)
- ✅ **Content CRUD**: Operasi Create, Read, Update, Delete untuk semua konten
- ✅ **Draft/Published States**: Sistem status konten (Draft, Published, Archived)
- ✅ **Slug Generation**: Auto-generate URL-friendly slugs

#### 🔌 API Layer (Headless CMS)
- ✅ **RESTful API**: Endpoint lengkap untuk content types dan entries
- ✅ **Authentication**: Sistem autentikasi terintegrasi dengan Supabase
- ✅ **Data Validation**: Validasi data menggunakan Zod schemas

#### 📁 Media Management System
- ✅ **File Upload & Storage**: Upload file ke Supabase Storage
- ✅ **Media Library**: Galeri media dengan preview dan metadata
- ✅ **Storage Quota**: Sistem kuota penyimpanan 2GB per user
- ✅ **File Validation**: Validasi tipe dan ukuran file
- ✅ **Folder Organization**: Organisasi file dalam folder

#### 🎨 Admin Dashboard
- ✅ **Modern UI**: Interface yang clean dan responsive
- ✅ **Content Management**: Dashboard untuk mengelola semua konten
- ✅ **Media Gallery**: Interface untuk mengelola file media
- ✅ **Real-time Updates**: Update data secara real-time

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **UI Components**: Radix UI, Tailwind CSS
- **Form Handling**: React Hook Form, Zod
- **Icons**: Lucide React
- **Package Manager**: Bun

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ atau Bun
- Supabase account
- Git

### 1. Clone Repository
```bash
git clone https://github.com/your-username/ai-cms-scaffold.git
cd ai-cms-scaffold
```

### 2. Install Dependencies
```bash
# Menggunakan Bun (recommended)
bun install

# Atau menggunakan npm
npm install
```

### 3. Setup Environment Variables
Buat file `.env.local` untuk development:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Buat file `.env` untuk production:
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
```

### 4. Setup Database
Jalankan SQL scripts di Supabase SQL Editor:
```bash
# 1. Initial schema
scripts/001_initial_schema.sql

# 2. Content types schema
scripts/002_content_types_schema.sql

# 3. Content entries schema
scripts/003_content_entries_schema.sql

# 4. Media schema
scripts/004_media_schema.sql

# 5. Setup storage bucket
scripts/setup-supabase-storage.sql
```

### 5. Run Development Server
```bash
# Menggunakan Bun
bun dev

# Atau menggunakan npm
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 🔧 Available Scripts

```bash
# Development
bun dev          # Start development server
bun build        # Build for production
bun start        # Start production server
bun lint         # Run ESLint
```

## 📚 API Documentation

### Content Types Endpoints
- `GET /api/content-types` - Fetch all content types
- `POST /api/content-types` - Create new content type
- `GET /api/content-types/[id]` - Fetch single content type
- `PUT /api/content-types/[id]` - Update content type

### Content Entries Endpoints
- `GET /api/content-entries` - Fetch content entries (with filtering)
- `POST /api/content-entries` - Create new content entry
- `GET /api/content-entries/[id]` - Fetch single content entry
- `PUT /api/content-entries/[id]` - Update content entry
- `DELETE /api/content-entries/[id]` - Delete content entry

### Media Endpoints
- `POST /api/media` - Upload media file
- `PUT /api/media/[id]` - Update media metadata

### Storage Endpoints
- `GET /api/storage` - Get storage usage info
- `POST /api/storage/validate` - Validate file before upload

## 🗂️ Project Structure

```
ai-cms-scaffold/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── dashboard/         # Admin dashboard pages
│   └── auth/              # Authentication pages
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── scripts/               # Database setup scripts
└── utils/                 # Helper utilities
```

## 🚧 Roadmap

### Phase 2: User Management & RBAC (Prioritas Tinggi)
- [ ] RBAC implementation (Admin, Editor, Author, Viewer roles)
- [ ] User invitation system
- [ ] Permission management UI
- [ ] User management dashboard

### Phase 3: Content Enhancement (Prioritas Sedang)
- [ ] Content versioning system
- [ ] Advanced publishing workflow
- [ ] Bulk operations untuk content
- [ ] Content relations (One-to-many, Many-to-many)

### Phase 4: Advanced Features (Prioritas Rendah)
- [ ] Plugin system
- [ ] Webhook integration
- [ ] i18n support
- [ ] SEO & metadata management
- [ ] Advanced analytics

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

Jika Anda mengalami masalah atau memiliki pertanyaan:
1. Check [Issues](https://github.com/your-username/ai-cms-scaffold/issues) yang sudah ada
2. Buat issue baru jika diperlukan
3. Hubungi tim development

---

**Built with ❤️ using Next.js 15 and Supabase**