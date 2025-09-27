# Content Versioning System Documentation

## 🎯 Overview

AI CMS Scaffold sekarang dilengkapi dengan **Content Versioning System** yang komprehensif, memungkinkan tracking perubahan content, rollback ke versi sebelumnya, dan collaboration yang aman antar pengguna.

## ✨ Features

### 🔄 **Auto-Versioning**
- ✅ Otomatis membuat versi baru setiap kali content diupdate
- ✅ Track perubahan pada semua field content
- ✅ Mencatat summary perubahan (fields changed, status, slug)
- ✅ Timestamp dan user tracking untuk setiap versi

### 📋 **Version Management**
- ✅ List semua versi dengan pagination
- ✅ View detail versi tertentu
- ✅ Manual version creation (checkpoint)
- ✅ Version deletion dengan protection untuk versi penting

### 🔍 **Version Comparison**
- ✅ Compare versi dengan versi lain
- ✅ Compare versi dengan current content
- ✅ Detailed diff showing added/modified/deleted fields
- ✅ Visual representation of changes

### ⏪ **Rollback Capability**
- ✅ Rollback ke versi manapun
- ✅ Automatic backup sebelum rollback
- ✅ Rollback dengan custom comment
- ✅ Safety checks untuk mencegah data loss

### 🗂️ **Storage Management**
- ✅ Automated cleanup old versions
- ✅ Retention policies (configurable)
- ✅ Protection untuk versi penting (version 1, recent versions)
- ✅ Storage optimization

## 📡 API Endpoints

### 1. **Get All Versions**
```bash
GET /api/content-entries/{id}/versions?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": "uuid",
        "version_number": 3,
        "title": "Updated Article",
        "slug": "my-article",
        "status": "published",
        "field_values": {...},
        "created_by_user": {
          "display_name": "John Doe",
          "email": "john@example.com"
        },
        "created_at": "2025-01-15T10:30:00Z",
        "comment": "Auto-generated on update",
        "is_auto_generated": true,
        "change_summary": {
          "fields_changed": 2,
          "status_changed": false,
          "slug_changed": false
        }
      }
    ],
    "current_data": {...},
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "total_pages": 1
    }
  }
}
```

### 2. **Create Manual Version (Checkpoint)**
```bash
POST /api/content-entries/{id}/versions
Content-Type: application/json

{
  "comment": "Before major revision"
}
```

### 3. **Get Version Details**
```bash
GET /api/content-entries/{id}/versions/{versionId}
```

### 4. **Compare Versions**
```bash
GET /api/content-entries/{id}/versions/{versionId}?compare_with=current
GET /api/content-entries/{id}/versions/{versionId}?compare_with=2
```

**Response:**
```json
{
  "success": true,
  "data": {
    "version": {...},
    "comparison": {
      "type": "current",
      "target": "current",
      "diff": [
        {
          "field": "title",
          "old_value": "Old Title",
          "new_value": "New Title",
          "change_type": "modified"
        },
        {
          "field": "content",
          "old_value": null,
          "new_value": "New content added",
          "change_type": "added"
        }
      ]
    }
  }
}
```

### 5. **Rollback to Version**
```bash
POST /api/content-entries/{id}/versions/{versionId}
Content-Type: application/json

{
  "create_backup": true,
  "comment": "Rolling back to stable version"
}
```

### 6. **Delete Version**
```bash
DELETE /api/content-entries/{id}/versions/{versionId}
```

**Protection Rules:**
- ❌ Cannot delete version 1 (initial version)
- ❌ Cannot delete last 3 versions
- ✅ Can delete old auto-generated versions

## 🗄️ Database Schema

### **content_entry_versions** Table
```sql
CREATE TABLE content_entry_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_entry_id UUID REFERENCES content_entries(id),
  version_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL,
  field_values JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- New versioning columns
  comment TEXT,
  is_auto_generated BOOLEAN DEFAULT true,
  change_summary JSONB,
  
  UNIQUE(content_entry_id, version_number)
);
```

### **Indexes untuk Performance**
```sql
-- Composite index untuk versioning queries
CREATE INDEX idx_content_entry_versions_entry_version 
  ON content_entry_versions(content_entry_id, version_number DESC);

-- Index untuk time-based queries  
CREATE INDEX idx_content_entry_versions_created_at 
  ON content_entry_versions(created_at DESC);

-- Index untuk filtering auto vs manual versions
CREATE INDEX idx_content_entry_versions_auto_generated 
  ON content_entry_versions(is_auto_generated);
```

### **content_version_stats** View
```sql
CREATE VIEW content_version_stats AS
SELECT 
  ce.id as content_entry_id,
  ce.slug,
  COALESCE(ce.data->>'title', ce.slug) as title,
  ct.name as content_type_name,
  ct.display_name as content_type_display_name,
  COUNT(cev.id) as total_versions,
  MAX(cev.version_number) as latest_version,
  MIN(cev.created_at) as first_version_at,
  MAX(cev.created_at) as latest_version_at,
  COUNT(CASE WHEN cev.is_auto_generated = false THEN 1 END) as manual_versions,
  COUNT(CASE WHEN cev.is_auto_generated = true THEN 1 END) as auto_versions
FROM content_entries ce
LEFT JOIN content_entry_versions cev ON ce.id = cev.content_entry_id
LEFT JOIN content_types ct ON ce.content_type_id = ct.id
GROUP BY ce.id, ce.slug, ce.data, ct.name, ct.display_name;
```

## 🚀 Setup & Installation

### 1. **Apply Database Schema**
```bash
curl -X POST "http://localhost:3000/api/schema/apply-versioning" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Content versioning schema applied successfully",
  "features": [
    "Auto-versioning on content updates",
    "Manual version creation", 
    "Version comparison and diff",
    "Rollback capability",
    "Version cleanup policies",
    "Performance indexes",
    "Row Level Security"
  ]
}
```

### 2. **Database Triggers**

**Auto-versioning trigger:**
- Membuat versi baru setiap kali content_entries diupdate
- Tidak membuat versi pada INSERT (handled by initial version trigger)
- Mencatat change summary untuk tracking perubahan

**Initial version trigger:**
- Membuat version 1 saat content entry pertama kali dibuat
- Memastikan setiap content entry memiliki initial version

## 🔒 Security & Permissions

### **Row Level Security (RLS)**
```sql
-- Users can view versions of published content or their own content
CREATE POLICY "Users can view content entry versions" 
  ON content_entry_versions FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_entries ce 
      WHERE ce.id = content_entry_versions.content_entry_id 
      AND (ce.status = 'published' OR ce.created_by = auth.uid())
    )
  );

-- Users can manage versions of their own content
CREATE POLICY "Users can manage their content entry versions" 
  ON content_entry_versions FOR ALL USING (
    EXISTS (
      SELECT 1 FROM content_entries ce 
      WHERE ce.id = content_entry_versions.content_entry_id 
      AND ce.created_by = auth.uid()
    )
  );
```

### **Rate Limiting**
- All versioning endpoints protected dengan rate limiting
- API rate limit: 100 requests per 15 minutes
- Prevents abuse dan ensures system stability

## 🧹 Maintenance & Cleanup

### **Automated Cleanup Function**
```sql
-- Cleanup old versions dengan retention policy
SELECT cleanup_old_versions(90, true);
```

**Cleanup Rules:**
- ✅ Hapus auto-generated versions lebih dari 90 hari
- ✅ Simpan manual versions (jika keep_manual_versions = true)  
- ✅ Selalu simpan 10 versi terbaru per content entry
- ✅ Tidak pernah hapus version 1 (initial version)

### **Scheduled Maintenance**
Untuk production, setup scheduled job untuk cleanup:

```bash
# Crontab example - cleanup monthly
0 2 1 * * psql -d your_db -c "SELECT cleanup_old_versions(90, true);"
```

## 💡 Best Practices

### **Version Management**
1. **Manual Checkpoints**: Buat manual version sebelum perubahan besar
2. **Meaningful Comments**: Gunakan comment yang descriptive untuk manual versions
3. **Regular Cleanup**: Setup automated cleanup untuk manage storage
4. **Backup Before Rollback**: Selalu create backup sebelum rollback

### **Performance Optimization**
1. **Pagination**: Gunakan pagination untuk list versions dengan data besar
2. **Selective Loading**: Load version data sesuai kebutuhan
3. **Index Usage**: Manfaatkan composite indexes untuk query performance
4. **Cleanup Policy**: Implement retention policy sesuai business needs

### **Security**
1. **Permission Checks**: Validasi user permissions sebelum version operations
2. **Audit Trail**: Semua version operations dicatat untuk audit
3. **Rate Limiting**: Monitor dan adjust rate limits sesuai usage patterns
4. **Data Validation**: Validate version data sebelum rollback

## 🔗 Integration Examples

### **Frontend Integration**
```typescript
// Get version history
const versions = await fetch('/api/content-entries/123/versions?page=1&limit=10')
  .then(res => res.json())

// Create manual checkpoint
await fetch('/api/content-entries/123/versions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ comment: 'Before major revision' })
})

// Compare versions
const comparison = await fetch('/api/content-entries/123/versions/2?compare_with=current')
  .then(res => res.json())

// Rollback to version
await fetch('/api/content-entries/123/versions/2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    create_backup: true, 
    comment: 'Rolling back to stable version' 
  })
})
```

### **Workflow Integration**
```typescript
// Pre-publish checkpoint
async function beforePublish(contentId: string) {
  await createCheckpoint(contentId, 'Before publish')
  // ... publish logic
}

// Auto-backup on major changes
async function onContentUpdate(contentId: string, changes: any) {
  if (changes.major) {
    await createCheckpoint(contentId, 'Before major update')
  }
  // ... update logic
}
```

## 📊 Monitoring & Analytics

### **Version Statistics**
```sql
-- Get version stats per content type
SELECT 
  content_type_name,
  COUNT(*) as total_entries,
  AVG(total_versions) as avg_versions_per_entry,
  SUM(manual_versions) as total_manual_versions,
  SUM(auto_versions) as total_auto_versions
FROM content_version_stats
GROUP BY content_type_name;

-- Find entries dengan banyak versions
SELECT * FROM content_version_stats 
WHERE total_versions > 20 
ORDER BY total_versions DESC;
```

### **Storage Usage**
```sql
-- Monitor storage usage by versions
SELECT 
  pg_size_pretty(pg_total_relation_size('content_entry_versions')) as table_size,
  COUNT(*) as total_versions,
  COUNT(*) FILTER (WHERE is_auto_generated) as auto_versions,
  COUNT(*) FILTER (WHERE NOT is_auto_generated) as manual_versions
FROM content_entry_versions;
```

---

## 🎉 Summary

Content Versioning System sekarang memberikan:

✅ **Complete Version Control** - Track semua perubahan content  
✅ **Safe Collaboration** - Multiple users dapat bekerja dengan aman  
✅ **Easy Rollback** - Kembalikan ke versi manapun dengan 1 klik  
✅ **Change Tracking** - Lihat exactly apa yang berubah  
✅ **Storage Optimization** - Automated cleanup dan retention policies  
✅ **Enterprise Ready** - RLS, rate limiting, dan audit trails  

Ini adalah foundation yang solid untuk content management yang professional dan scalable! 🚀