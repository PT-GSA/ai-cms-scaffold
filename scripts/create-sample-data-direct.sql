-- Script SQL untuk membuat sample data content type
-- Jalankan script ini langsung ke database

-- Disable RLS sementara untuk insert data
ALTER TABLE content_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_type_fields DISABLE ROW LEVEL SECURITY;

-- Insert content type "article"
INSERT INTO content_types (name, display_name, description, icon, is_active) VALUES
('article', 'Article', 'Blog article content type', 'FileText', true)
ON CONFLICT (name) DO NOTHING;

-- Insert fields untuk article content type
INSERT INTO content_type_fields (content_type_id, field_name, display_name, field_type, is_required, sort_order) 
SELECT 
  ct.id,
  fields.field_name,
  fields.display_name,
  fields.field_type::field_type,
  fields.is_required,
  fields.sort_order
FROM content_types ct,
(VALUES 
  ('title', 'Title', 'text', true, 1),
  ('content', 'Content', 'textarea', true, 2),
  ('excerpt', 'Excerpt', 'textarea', false, 3),
  ('published_date', 'Published Date', 'datetime', false, 4)
) AS fields(field_name, display_name, field_type, is_required, sort_order)
WHERE ct.name = 'article'
ON CONFLICT (content_type_id, field_name) DO NOTHING;

-- Enable RLS kembali
ALTER TABLE content_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_type_fields ENABLE ROW LEVEL SECURITY;

-- Tampilkan hasil
SELECT 
  ct.id,
  ct.name,
  ct.display_name,
  ct.description,
  ct.icon,
  COUNT(ctf.id) as field_count
FROM content_types ct 
LEFT JOIN content_type_fields ctf ON ct.id = ctf.content_type_id 
WHERE ct.name = 'article'
GROUP BY ct.id, ct.name, ct.display_name, ct.description, ct.icon;

-- Tampilkan fields
SELECT 
  ctf.field_name,
  ctf.display_name,
  ctf.field_type,
  ctf.is_required,
  ctf.sort_order
FROM content_types ct 
JOIN content_type_fields ctf ON ct.id = ctf.content_type_id 
WHERE ct.name = 'article'
ORDER BY ctf.sort_order;