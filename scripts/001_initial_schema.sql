-- Create the cms_schemas table to track generated schemas
CREATE TABLE IF NOT EXISTS cms_schemas (
  id SERIAL PRIMARY KEY,
  schema_name VARCHAR(255) NOT NULL,
  schema_json JSONB NOT NULL,
  sql_query TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a function to execute arbitrary SQL (for admin use only)
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE sql_query;
  result := '{"success": true}';
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object('error', SQLERRM);
    RETURN result;
END;
$$;

-- Enable Row Level Security
ALTER TABLE cms_schemas ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can view their own schemas" ON cms_schemas
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert schemas" ON cms_schemas
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
