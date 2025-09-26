-- Create api_keys table untuk menyimpan API keys user
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_name VARCHAR(100) NOT NULL,
  key_type VARCHAR(20) NOT NULL DEFAULT 'production', -- 'production', 'development', 'test'
  key_value VARCHAR(255) NOT NULL UNIQUE,
  key_prefix VARCHAR(20) NOT NULL, -- 'sk-prod', 'sk-dev', 'sk-test'
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  permissions JSONB DEFAULT '{}', -- permissions untuk key ini
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index untuk performa
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_value ON api_keys(key_value);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_type ON api_keys(key_type);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

-- Enable Row Level Security
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own API keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys" ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" ON api_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" ON api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_keys_updated_at();

-- Create function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key(
  p_user_id UUID,
  p_key_name VARCHAR(100),
  p_key_type VARCHAR(20) DEFAULT 'production'
)
RETURNS TABLE(
  id UUID,
  key_name VARCHAR(100),
  key_type VARCHAR(20),
  key_value VARCHAR(255),
  key_prefix VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key_prefix VARCHAR(20);
  v_key_value VARCHAR(255);
  v_key_id UUID;
  v_key_name VARCHAR(100);
  v_key_type VARCHAR(20);
  v_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set prefix berdasarkan type
  CASE p_key_type
    WHEN 'production' THEN v_key_prefix := 'sk-prod';
    WHEN 'development' THEN v_key_prefix := 'sk-dev';
    WHEN 'test' THEN v_key_prefix := 'sk-test';
    ELSE v_key_prefix := 'sk-prod';
  END CASE;

  -- Generate random key value (32 karakter) menggunakan random() dan md5
  v_key_value := v_key_prefix || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 32);

  -- Insert new API key
  INSERT INTO api_keys (user_id, key_name, key_type, key_value, key_prefix)
  VALUES (p_user_id, p_key_name, p_key_type, v_key_value, v_key_prefix)
  RETURNING api_keys.id, api_keys.key_name, api_keys.key_type, api_keys.key_value, api_keys.key_prefix, api_keys.created_at
  INTO v_key_id, v_key_name, v_key_type, v_key_value, v_key_prefix, v_created_at;

  -- Return the values
  id := v_key_id;
  key_name := v_key_name;
  key_type := v_key_type;
  key_value := v_key_value;
  key_prefix := v_key_prefix;
  created_at := v_created_at;
  
  RETURN NEXT;
END;
$$;
