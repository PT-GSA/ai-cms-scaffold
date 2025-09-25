-- Content Types Schema untuk Headless CMS
-- Script ini membuat tabel-tabel yang diperlukan untuk content types dan field types

-- Tabel untuk menyimpan content types (seperti Article, Product, Page, dll)
CREATE TABLE IF NOT EXISTS content_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE, -- nama content type (e.g., "article", "product")
  display_name VARCHAR(255) NOT NULL, -- nama yang ditampilkan (e.g., "Article", "Product")
  description TEXT,
  icon VARCHAR(100), -- icon untuk UI
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enum untuk field types yang didukung
CREATE TYPE field_type AS ENUM (
  'text',
  'textarea', 
  'rich_text',
  'number',
  'boolean',
  'date',
  'datetime',
  'email',
  'url',
  'select',
  'multi_select',
  'media',
  'relation',
  'json'
);

-- Tabel untuk menyimpan field definitions dalam content type
CREATE TABLE IF NOT EXISTS content_type_fields (
  id SERIAL PRIMARY KEY,
  content_type_id INTEGER REFERENCES content_types(id) ON DELETE CASCADE,
  field_name VARCHAR(255) NOT NULL, -- nama field (e.g., "title", "body", "price")
  display_name VARCHAR(255) NOT NULL, -- nama yang ditampilkan
  field_type field_type NOT NULL,
  is_required BOOLEAN DEFAULT false,
  is_unique BOOLEAN DEFAULT false,
  default_value TEXT,
  validation_rules JSONB, -- rules untuk validasi (min, max, pattern, dll)
  field_options JSONB, -- options untuk select, relation config, dll
  help_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(content_type_id, field_name)
);

-- Tabel untuk menyimpan content entries (data aktual)
CREATE TABLE IF NOT EXISTS content_entries (
  id SERIAL PRIMARY KEY,
  content_type_id INTEGER REFERENCES content_types(id) ON DELETE CASCADE,
  slug VARCHAR(255), -- untuk SEO-friendly URLs
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, archived
  data JSONB NOT NULL, -- data content dalam format JSON
  meta_data JSONB, -- SEO meta, custom fields, dll
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(content_type_id, slug)
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_content_types_name ON content_types(name);
CREATE INDEX IF NOT EXISTS idx_content_type_fields_content_type ON content_type_fields(content_type_id);
CREATE INDEX IF NOT EXISTS idx_content_entries_content_type ON content_entries(content_type_id);
CREATE INDEX IF NOT EXISTS idx_content_entries_status ON content_entries(status);
CREATE INDEX IF NOT EXISTS idx_content_entries_slug ON content_entries(slug);
CREATE INDEX IF NOT EXISTS idx_content_entries_published_at ON content_entries(published_at);

-- Enable Row Level Security
ALTER TABLE content_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_type_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies untuk content_types
CREATE POLICY "Users can view content types" ON content_types
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create content types" ON content_types
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Users can update their content types" ON content_types
  FOR UPDATE USING (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- RLS Policies untuk content_type_fields
CREATE POLICY "Users can view content type fields" ON content_type_fields
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage content type fields" ON content_type_fields
  FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM content_types 
      WHERE id = content_type_fields.content_type_id 
      AND created_by = auth.uid()
    )
  );

-- RLS Policies untuk content_entries
CREATE POLICY "Users can view published content entries" ON content_entries
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    (status = 'published' OR created_by = auth.uid())
  );

CREATE POLICY "Users can create content entries" ON content_entries
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Users can update their content entries" ON content_entries
  FOR UPDATE USING (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- Function untuk auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers untuk auto-update timestamps
CREATE TRIGGER update_content_types_updated_at 
  BEFORE UPDATE ON content_types 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_type_fields_updated_at 
  BEFORE UPDATE ON content_type_fields 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_entries_updated_at 
  BEFORE UPDATE ON content_entries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert beberapa content types default
INSERT INTO content_types (name, display_name, description, icon, created_by) VALUES
('article', 'Article', 'Blog articles and news posts', 'FileText', (SELECT auth.uid())),
('page', 'Page', 'Static pages like About, Contact', 'File', (SELECT auth.uid())),
('product', 'Product', 'E-commerce products', 'Package', (SELECT auth.uid()))
ON CONFLICT (name) DO NOTHING;

-- Insert default fields untuk Article content type
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
  ('slug', 'Slug', 'text', true, 2),
  ('excerpt', 'Excerpt', 'textarea', false, 3),
  ('content', 'Content', 'rich_text', true, 4),
  ('featured_image', 'Featured Image', 'media', false, 5),
  ('published_date', 'Published Date', 'datetime', false, 6),
  ('tags', 'Tags', 'multi_select', false, 7)
) AS fields(field_name, display_name, field_type, is_required, sort_order)
WHERE ct.name = 'article'
ON CONFLICT (content_type_id, field_name) DO NOTHING;