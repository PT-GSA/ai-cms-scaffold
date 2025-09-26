-- Update function generate_api_key untuk mengatasi error gen_random_bytes
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