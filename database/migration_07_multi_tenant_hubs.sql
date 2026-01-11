-- ================================================================
-- Migration 07: Multi-Tenant Hub Architecture
-- ================================================================
-- This migration implements:
-- 1. User profiles with status (pending/approved) and is_admin
-- 2. Hubs table (personal/shared)
-- 3. Hub members table
-- 4. Add hub_id to items, workspaces, topics
-- 5. Update RLS policies for hub-scoped access
-- ================================================================

BEGIN;

-- ================================================================
-- Step 1: Create user_profiles table
-- ================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_admin BOOLEAN DEFAULT false,
  last_active_hub_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

COMMENT ON TABLE user_profiles IS 'User profiles with approval status and admin flag';
COMMENT ON COLUMN user_profiles.status IS 'pending/approved/rejected - controls access';
COMMENT ON COLUMN user_profiles.is_admin IS 'Admin users can approve others and manage hubs';

-- ================================================================
-- Step 2: Create hubs table
-- ================================================================

CREATE TABLE IF NOT EXISTS hubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('personal', 'shared')),
  color_theme VARCHAR(50) DEFAULT 'green' CHECK (color_theme IN ('green', 'navy')),
  icon VARCHAR(100) DEFAULT 'folder',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hubs_type ON hubs(type);
CREATE INDEX IF NOT EXISTS idx_hubs_created_by ON hubs(created_by);

COMMENT ON TABLE hubs IS 'Multi-tenant hubs - personal or shared workspaces';
COMMENT ON COLUMN hubs.type IS 'personal: single user, shared: multiple users';
COMMENT ON COLUMN hubs.color_theme IS 'green for personal, navy for shared';

-- ================================================================
-- Step 3: Create hub_members table
-- ================================================================

CREATE TABLE IF NOT EXISTS hub_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hub_id UUID NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_hub_member UNIQUE(hub_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_hub_members_hub ON hub_members(hub_id);
CREATE INDEX IF NOT EXISTS idx_hub_members_user ON hub_members(user_id);
CREATE INDEX IF NOT EXISTS idx_hub_members_role ON hub_members(role);

COMMENT ON TABLE hub_members IS 'Membership table linking users to hubs';
COMMENT ON COLUMN hub_members.role IS 'owner: creator/admin, member: regular access';

-- ================================================================
-- Step 4: Add hub_id to existing tables
-- ================================================================

-- Add hub_id to workspaces
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'hub_id') THEN
    ALTER TABLE workspaces ADD COLUMN hub_id UUID REFERENCES hubs(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_workspaces_hub ON workspaces(hub_id);
    RAISE NOTICE '✅ Added hub_id to workspaces';
  END IF;
END $$;

-- Add hub_id to topics
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'topics' AND column_name = 'hub_id') THEN
    ALTER TABLE topics ADD COLUMN hub_id UUID REFERENCES hubs(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_topics_hub ON topics(hub_id);
    RAISE NOTICE '✅ Added hub_id to topics';
  END IF;
END $$;

-- Add hub_id to items (required field)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'hub_id') THEN
    ALTER TABLE items ADD COLUMN hub_id UUID REFERENCES hubs(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_items_hub ON items(hub_id);
    RAISE NOTICE '✅ Added hub_id to items';
  END IF;
END $$;

-- Ensure created_by exists in items (should already exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'created_by') THEN
    ALTER TABLE items ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_items_created_by ON items(created_by);
    RAISE NOTICE '✅ Added created_by to items';
  END IF;
END $$;

-- ================================================================
-- Step 5: Create trigger for user_profiles updated_at
-- ================================================================

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hubs_updated_at 
  BEFORE UPDATE ON hubs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- Step 6: Create function to auto-create Personal Hub on approval
-- ================================================================

CREATE OR REPLACE FUNCTION create_personal_hub_on_approval()
RETURNS TRIGGER AS $$
DECLARE
  new_hub_id UUID;
BEGIN
  -- When user is approved and doesn't have a personal hub yet
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    -- Check if user already has a personal hub
    SELECT h.id INTO new_hub_id
    FROM hubs h
    INNER JOIN hub_members hm ON h.id = hm.hub_id
    WHERE hm.user_id = NEW.id AND h.type = 'personal'
    LIMIT 1;
    
    -- Create personal hub if doesn't exist
    IF new_hub_id IS NULL THEN
      INSERT INTO hubs (name, type, color_theme, icon, created_by)
      VALUES (
        COALESCE(NEW.full_name, NEW.email) || '''s Hub',
        'personal',
        'green',
        'person',
        NEW.id
      )
      RETURNING id INTO new_hub_id;
      
      -- Add user as owner
      INSERT INTO hub_members (hub_id, user_id, role)
      VALUES (new_hub_id, NEW.id, 'owner')
      ON CONFLICT (hub_id, user_id) DO NOTHING;
      
      -- Update last_active_hub_id
      UPDATE user_profiles 
      SET last_active_hub_id = new_hub_id 
      WHERE id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_personal_hub_on_approval
  AFTER UPDATE OF status ON user_profiles
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status = 'pending')
  EXECUTE FUNCTION create_personal_hub_on_approval();

-- ================================================================
-- Step 7: Enable RLS and create policies
-- ================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_members ENABLE ROW LEVEL SECURITY;

-- User profiles: users can view their own, admins can view all
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;
CREATE POLICY "Admins can update any profile" ON user_profiles
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Hubs: users can view hubs they are members of
DROP POLICY IF EXISTS "Users can view hub if member" ON hubs;
CREATE POLICY "Users can view hub if member" ON hubs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM hub_members WHERE hub_id = hubs.id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Admins can view all hubs" ON hubs;
CREATE POLICY "Admins can view all hubs" ON hubs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

DROP POLICY IF EXISTS "Users can create hubs" ON hubs;
CREATE POLICY "Users can create hubs" ON hubs
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND status = 'approved')
  );

DROP POLICY IF EXISTS "Owners can update hub" ON hubs;
CREATE POLICY "Owners can update hub" ON hubs
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM hub_members 
    WHERE hub_id = hubs.id AND user_id = auth.uid() AND role = 'owner'
  ));

-- Hub members: users can view members of their hubs
DROP POLICY IF EXISTS "Users can view hub members" ON hub_members;
CREATE POLICY "Users can view hub members" ON hub_members
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM hub_members hm 
    WHERE hm.hub_id = hub_members.hub_id AND hm.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Owners can add members" ON hub_members;
CREATE POLICY "Owners can add members" ON hub_members
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM hub_members 
    WHERE hub_id = hub_members.hub_id AND user_id = auth.uid() AND role = 'owner'
  ));

DROP POLICY IF EXISTS "Owners can remove members" ON hub_members;
CREATE POLICY "Owners can remove members" ON hub_members
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM hub_members 
    WHERE hub_id = hub_members.hub_id AND user_id = auth.uid() AND role = 'owner'
  ));

-- Items: scoped by hub membership
DROP POLICY IF EXISTS "Users can view items in their hubs" ON items;
CREATE POLICY "Users can view items in their hubs" ON items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM hub_members 
    WHERE hub_id = items.hub_id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can create items in their hubs" ON items;
CREATE POLICY "Users can create items in their hubs" ON items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_members 
      WHERE hub_id = items.hub_id AND user_id = auth.uid()
    ) AND
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND status = 'approved')
  );

DROP POLICY IF EXISTS "Users can update items in their hubs" ON items;
CREATE POLICY "Users can update items in their hubs" ON items
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM hub_members 
    WHERE hub_id = items.hub_id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete items in their hubs" ON items;
CREATE POLICY "Users can delete items in their hubs" ON items
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM hub_members 
    WHERE hub_id = items.hub_id AND user_id = auth.uid()
  ));

-- Workspaces: scoped by hub membership
DROP POLICY IF EXISTS "Users can view workspaces in their hubs" ON workspaces;
CREATE POLICY "Users can view workspaces in their hubs" ON workspaces
  FOR SELECT USING (
    hub_id IS NULL OR EXISTS (
      SELECT 1 FROM hub_members 
      WHERE hub_id = workspaces.hub_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage workspaces in their hubs" ON workspaces;
CREATE POLICY "Users can manage workspaces in their hubs" ON workspaces
  FOR ALL USING (
    hub_id IS NULL OR EXISTS (
      SELECT 1 FROM hub_members 
      WHERE hub_id = workspaces.hub_id AND user_id = auth.uid()
    )
  );

-- Topics: scoped by hub membership
DROP POLICY IF EXISTS "Users can view topics in their hubs" ON topics;
CREATE POLICY "Users can view topics in their hubs" ON topics
  FOR SELECT USING (
    hub_id IS NULL OR EXISTS (
      SELECT 1 FROM hub_members 
      WHERE hub_id = topics.hub_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage topics in their hubs" ON topics;
CREATE POLICY "Users can manage topics in their hubs" ON topics
  FOR ALL USING (
    hub_id IS NULL OR EXISTS (
      SELECT 1 FROM hub_members 
      WHERE hub_id = topics.hub_id AND user_id = auth.uid()
    )
  );

COMMIT;

-- ================================================================
-- Verification
-- ================================================================

SELECT 'Migration 07 completed successfully! ✅' AS status;
SELECT 'Next: Set up Google OAuth and create first admin user' AS next_step;
