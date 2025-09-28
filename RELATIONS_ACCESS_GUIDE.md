# Content Relations System - Access Guide

## 🎯 Cara Mengakses Sistem Relations

### 1. **Dashboard Relations (Utama)**
- **URL**: `http://localhost:3000/dashboard/relations`
- **Lokasi di Sidebar**: Dashboard → Relations (dengan badge "New")
- **Fitur**:
  - Overview dengan statistik
  - Manajemen definisi relasi
  - Analitik dan monitoring
  - Interface admin lengkap

### 2. **Demo Page (Testing)**
- **URL**: `http://localhost:3000/demo/relations`
- **Akses**: Klik tombol "Demo Page" di dashboard relations
- **Fitur**:
  - Testing semua komponen
  - Mock data untuk demo
  - Tab-tab untuk setiap komponen
  - API testing tools

## 📁 File Structure yang Telah Dibuat

```
├── components/relations/
│   ├── RelationItem.tsx              # Item relasi individual
│   ├── RelationPickerModal.tsx       # Modal pemilih konten
│   ├── RelationField.tsx             # Field form untuk relasi
│   ├── RelationManager.tsx           # Manager multi-relasi
│   ├── RelationDefinitionManager.tsx # Interface admin
│   └── RelationDefinitionForm.tsx    # Form CRUD definisi

├── hooks/
│   └── use-relations.ts              # Custom hooks untuk data

├── app/
│   ├── dashboard/relations/
│   │   └── page.tsx                  # Halaman dashboard utama
│   ├── demo/relations/
│   │   └── page.tsx                  # Halaman demo/testing
│   └── api/relations/
│       ├── definitions/route.ts      # API definisi relasi
│       ├── route.ts                  # API relasi utama
│       └── [id]/route.ts            # API relasi individual

├── types/
│   └── relations.ts                  # TypeScript definitions

└── scripts/
    ├── 006_content_relations_schema.sql  # Database schema
    └── check-relations.js               # Script checker
```

## 🚀 Langkah-Langkah Setup

### 1. **Jalankan Development Server**
```bash
npm run dev
```

### 2. **Apply Database Schema** (Jika belum)
```bash
# Jalankan script SQL untuk membuat tables
npm run db:migrate
# atau langsung apply via API
curl -X POST http://localhost:3000/api/schema/apply-relations
```

### 3. **Akses Interface**
1. Buka browser: `http://localhost:3000`
2. Login ke dashboard
3. Klik "Relations" di sidebar kiri
4. Mulai membuat definisi relasi

## 🎛️ Cara Menggunakan

### A. **Membuat Definisi Relasi**
1. Masuk ke tab "Definitions" di dashboard relations
2. Klik tombol "Create Definition"
3. Isi form:
   - Display Name: "Article Tags"
   - Source Content Type: "Article"
   - Target Content Type: "Tag"
   - Relation Type: "Many-to-Many"
   - Configure constraints dan cascade behavior
4. Save

### B. **Mengelola Relations**
1. Di content editor, gunakan `RelationField` component
2. Atau gunakan `RelationManager` untuk multi-field
3. Klik "Add Relations" untuk memilih target content
4. Save changes

### C. **Testing Components**
1. Buka demo page: `http://localhost:3000/demo/relations`
2. Explore setiap tab:
   - **Overview**: Sistem summary
   - **Hooks**: Test React hooks
   - **Components**: Individual component demos
   - **Manager**: Relation management
   - **Admin**: Definition management
   - **API**: Test API endpoints

## 🔧 API Endpoints yang Tersedia

### Definitions Management
- `GET /api/relations/definitions` - List all definitions
- `POST /api/relations/definitions` - Create new definition
- `PUT /api/relations/definitions/[id]` - Update definition
- `DELETE /api/relations/definitions/[id]` - Delete definition

### Relations Management
- `GET /api/relations?entry_id=1` - Get relations for entry
- `POST /api/relations` - Create new relation
- `PUT /api/relations/[id]` - Update relation
- `DELETE /api/relations/[id]` - Delete relation

### Schema Management
- `POST /api/schema/apply-relations` - Apply database schema

## 🎯 Components Usage dalam Kode

### 1. **RelationField** (Single Field)
```tsx
import RelationField from '@/components/relations/RelationField';

<RelationField
  definition={relationDefinition}
  entryId={contentEntryId}
  contentType="article"
/>
```

### 2. **RelationManager** (Multiple Fields)
```tsx
import RelationManager from '@/components/relations/RelationManager';

<RelationManager
  contentType="article"
  entryId={1}
  entry={contentEntry}
/>
```

### 3. **RelationDefinitionManager** (Admin)
```tsx
import RelationDefinitionManager from '@/components/relations/RelationDefinitionManager';

<RelationDefinitionManager />
```

### 4. **Using Hooks**
```tsx
import { useRelationDefinitions, useContentRelations } from '@/hooks/use-relations';

const { definitions, isLoading } = useRelationDefinitions();
const { relations, createRelation, updateRelation, deleteRelation } = useContentRelations(entryId);
```

## 🔍 Troubleshooting

### Problem: Sidebar tidak muncul menu Relations
**Solusi**: 
1. Cek apakah `components/dashboard-layout.tsx` sudah di-update
2. Restart development server
3. Clear browser cache

### Problem: Database error saat akses API
**Solusi**:
1. Pastikan database schema sudah di-apply
2. Cek koneksi database di `.env.local`
3. Jalankan migration script

### Problem: Component tidak bisa di-import
**Solusi**:
1. Cek path import sesuai dengan struktur file
2. Pastikan TypeScript types sudah benar
3. Restart TypeScript server

## ✅ Features yang Sudah Tersedia

- ✅ **Database Schema**: Tables, constraints, RLS policies
- ✅ **API Endpoints**: Full CRUD operations
- ✅ **React Hooks**: Data fetching & state management
- ✅ **UI Components**: All relation management components
- ✅ **Dashboard Integration**: Professional sidebar menu
- ✅ **Demo Page**: Complete testing interface
- ✅ **TypeScript**: Full type definitions
- ✅ **Documentation**: API docs dan usage examples

## 🚀 Next Steps

1. **Test the system** - Buka dashboard dan demo page
2. **Create definitions** - Buat definisi relasi pertama
3. **Integrate components** - Gunakan di content editor
4. **Customize styling** - Sesuaikan dengan design system
5. **Add real data** - Replace mock data dengan data sebenarnya

---

**Sistem Content Relations sudah siap digunakan!** 🎉

Mulai dengan mengakses dashboard relations di: `http://localhost:3000/dashboard/relations`