-- Create user_settings table untuk menyimpan pengaturan user
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings_type VARCHAR(50) NOT NULL, -- 'profile', 'appearance', 'notifications', 'security'
  settings_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, settings_type)
);

-- Create index untuk performa
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_type ON user_settings(settings_type);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- Create function to get or create user settings
CREATE OR REPLACE FUNCTION get_or_create_user_settings(
  p_user_id UUID,
  p_settings_type VARCHAR(50),
  p_default_data JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Try to get existing settings
  SELECT settings_data INTO result
  FROM user_settings
  WHERE user_id = p_user_id AND settings_type = p_settings_type;
  
  -- If not found, create with default data
  IF result IS NULL THEN
    INSERT INTO user_settings (user_id, settings_type, settings_data)
    VALUES (p_user_id, p_settings_type, p_default_data)
    ON CONFLICT (user_id, settings_type)
    DO UPDATE SET settings_data = EXCLUDED.settings_data, updated_at = NOW()
    RETURNING settings_data INTO result;
  END IF;
  
  RETURN result;
END;
$$;
