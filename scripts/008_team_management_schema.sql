-- Team Management Schema untuk AI CMS Scaffold
-- Script ini membuat tabel-tabel yang diperlukan untuk team management dan RBAC

-- Enum untuk user roles
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin', 
  'editor',
  'author',
  'viewer'
);

-- Enum untuk invitation status
CREATE TYPE invitation_status AS ENUM (
  'pending',
  'accepted',
  'expired',
  'cancelled'
);

-- Enum untuk user status
CREATE TYPE user_status AS ENUM (
  'active',
  'inactive',
  'suspended'
);

-- Tabel untuk menyimpan informasi user tambahan
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'viewer',
  status user_status NOT NULL DEFAULT 'active',
  permissions JSONB DEFAULT '{}', -- Custom permissions per user
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabel untuk menyimpan undangan user
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  status invitation_status NOT NULL DEFAULT 'pending',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  token VARCHAR(255) NOT NULL UNIQUE, -- Token untuk verifikasi undangan
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel untuk menyimpan team/organization info
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel untuk relasi user-team (many-to-many)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'viewer',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Tabel untuk menyimpan audit log
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'user.created', 'user.updated', 'invitation.sent', etc.
  resource_type VARCHAR(50), -- 'user', 'invitation', 'team', etc.
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires_at ON user_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies untuk user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() 
      AND up.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update profiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() 
      AND up.role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies untuk user_invitations
CREATE POLICY "Admins can view invitations" ON user_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() 
      AND up.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can create invitations" ON user_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() 
      AND up.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update invitations" ON user_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() 
      AND up.role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies untuk teams
CREATE POLICY "Team members can view team" ON teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = teams.id 
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can manage team" ON teams
  FOR ALL USING (owner_id = auth.uid());

-- RLS Policies untuk team_members
CREATE POLICY "Team members can view team members" ON team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can manage team members" ON team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = team_members.team_id 
      AND t.owner_id = auth.uid()
    )
  );

-- RLS Policies untuk audit_logs
CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() 
      AND up.role IN ('super_admin', 'admin')
    )
  );

-- Function untuk auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers untuk auto-update timestamps
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_invitations_updated_at 
  BEFORE UPDATE ON user_invitations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at 
  BEFORE UPDATE ON teams 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function untuk generate invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function untuk create user profile saat user register
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, display_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), 'viewer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto-create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Function untuk log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_action VARCHAR(100),
  p_resource_type VARCHAR(50) DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, action, resource_type, resource_id, 
    details, ip_address, user_agent
  ) VALUES (
    p_user_id, p_action, p_resource_type, p_resource_id,
    p_details, p_ip_address, p_user_agent
  );
END;
$$ LANGUAGE plpgsql;

-- Insert default team
INSERT INTO teams (name, slug, description, owner_id)
SELECT 
  'Default Team',
  'default-team',
  'Default team for the organization',
  u.id
FROM auth.users u
WHERE u.email = (SELECT email FROM auth.users LIMIT 1)
ON CONFLICT (slug) DO NOTHING;

-- Add default team owner to team_members
INSERT INTO team_members (team_id, user_id, role)
SELECT 
  t.id,
  t.owner_id,
  'super_admin'
FROM teams t
WHERE t.slug = 'default-team'
ON CONFLICT (team_id, user_id) DO NOTHING;
