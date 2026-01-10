-- ================================================================
-- Migration 01: Clients → Workspaces
-- ================================================================
-- This script renames:
--   - clients table → workspaces
--   - client_id columns → workspace_id
--   - All related indexes, constraints, triggers, and RLS policies
-- ================================================================
-- IMPORTANT: Run this migration BEFORE migration_02_projects_to_topics.sql
-- ================================================================

BEGIN;

-- ================================================================
-- Step 1: Rename table
-- ================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
    ALTER TABLE clients RENAME TO workspaces;
    RAISE NOTICE '✅ Table "clients" renamed to "workspaces"';
  ELSE
    RAISE NOTICE 'Table "clients" does not exist, skipping rename';
  END IF;
END $$;

-- ================================================================
-- Step 2: Rename foreign key columns in other tables
-- ================================================================

-- In projects table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'client_id') THEN
      ALTER TABLE projects RENAME COLUMN client_id TO workspace_id;
      RAISE NOTICE '✅ Column "projects.client_id" renamed to "workspace_id"';
    END IF;
  END IF;
END $$;

-- In meetings table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meetings') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'client_id') THEN
      ALTER TABLE meetings RENAME COLUMN client_id TO workspace_id;
      RAISE NOTICE '✅ Column "meetings.client_id" renamed to "workspace_id"';
    END IF;
  END IF;
END $$;

-- ================================================================
-- Step 3: Update foreign key constraints
-- ================================================================

-- Drop old foreign key constraints
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_client_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meetings') THEN
    ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_client_id_fkey;
  END IF;
END $$;

-- Add new foreign key constraints
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'projects_workspace_id_fkey') THEN
      ALTER TABLE projects 
        ADD CONSTRAINT projects_workspace_id_fkey 
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
      RAISE NOTICE '✅ Created foreign key constraint projects_workspace_id_fkey';
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meetings') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'meetings_workspace_id_fkey') THEN
      ALTER TABLE meetings 
        ADD CONSTRAINT meetings_workspace_id_fkey 
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;
      RAISE NOTICE '✅ Created foreign key constraint meetings_workspace_id_fkey';
    END IF;
  END IF;
END $$;

-- ================================================================
-- Step 4: Update unique constraints
-- ================================================================

-- Update unique constraint in projects
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    ALTER TABLE projects DROP CONSTRAINT IF EXISTS unique_client_project;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'unique_workspace_project') THEN
      ALTER TABLE projects 
        ADD CONSTRAINT unique_workspace_project 
        UNIQUE(workspace_id, name);
      RAISE NOTICE '✅ Created unique constraint unique_workspace_project';
    END IF;
  END IF;
END $$;

-- ================================================================
-- Step 5: Update indexes
-- ================================================================

-- Rename indexes for workspaces (formerly clients)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_clients_name') THEN
    ALTER INDEX idx_clients_name RENAME TO idx_workspaces_name;
    RAISE NOTICE '✅ Index renamed: idx_clients_name → idx_workspaces_name';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_clients_search') THEN
    ALTER INDEX idx_clients_search RENAME TO idx_workspaces_search;
    RAISE NOTICE '✅ Index renamed: idx_clients_search → idx_workspaces_search';
  END IF;
END $$;

-- Rename indexes for projects
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_client') THEN
    ALTER INDEX idx_projects_client RENAME TO idx_projects_workspace;
    RAISE NOTICE '✅ Index renamed: idx_projects_client → idx_projects_workspace';
  END IF;
END $$;

-- Rename indexes for meetings
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_meetings_client') THEN
    ALTER INDEX idx_meetings_client RENAME TO idx_meetings_workspace;
    RAISE NOTICE '✅ Index renamed: idx_meetings_client → idx_meetings_workspace';
  END IF;
END $$;

-- ================================================================
-- Step 6: Update triggers
-- ================================================================

-- Rename trigger for workspaces (formerly clients)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clients_updated_at') THEN
    DROP TRIGGER IF EXISTS update_clients_updated_at ON workspaces;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_workspaces_updated_at') THEN
      CREATE TRIGGER update_workspaces_updated_at 
        BEFORE UPDATE ON workspaces
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      RAISE NOTICE '✅ Created trigger update_workspaces_updated_at';
    END IF;
  END IF;
END $$;

-- ================================================================
-- Step 7: Update RLS policies
-- ================================================================

-- Drop old policies and create new ones for workspaces
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspaces') THEN
    -- Drop old policies
    DROP POLICY IF EXISTS "Users can view all clients" ON workspaces;
    DROP POLICY IF EXISTS "Users can insert clients" ON workspaces;
    DROP POLICY IF EXISTS "Users can update clients" ON workspaces;
    
    -- Create new policies
    BEGIN
      CREATE POLICY "Users can view all workspaces" ON workspaces
        FOR SELECT USING (true);
    EXCEPTION WHEN duplicate_object THEN
      -- Policy already exists, skip
    END;
    
    BEGIN
      CREATE POLICY "Users can insert workspaces" ON workspaces
        FOR INSERT WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN
      -- Policy already exists, skip
    END;
    
    BEGIN
      CREATE POLICY "Users can update workspaces" ON workspaces
        FOR UPDATE USING (true);
    EXCEPTION WHEN duplicate_object THEN
      -- Policy already exists, skip
    END;
    
    RAISE NOTICE '✅ Updated RLS policies for workspaces';
  END IF;
END $$;

-- ================================================================
-- Step 8: Update comments
-- ================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspaces') THEN
    COMMENT ON TABLE workspaces IS 'טבלת Workspaces - מכילה מידע על Workspaces';
  END IF;
END $$;

COMMIT;

-- ================================================================
-- Verification
-- ================================================================

DO $$
DECLARE
  workspaces_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workspaces') INTO workspaces_exists;
  
  IF workspaces_exists THEN
    RAISE NOTICE '✅ Table "workspaces" exists';
  ELSE
    RAISE WARNING '⚠️ Table "workspaces" does not exist';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'workspace_id') THEN
      RAISE NOTICE '✅ Column "projects.workspace_id" exists';
    ELSE
      RAISE WARNING '⚠️ Column "projects.workspace_id" does not exist';
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meetings') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'workspace_id') THEN
      RAISE NOTICE '✅ Column "meetings.workspace_id" exists';
    ELSE
      RAISE WARNING '⚠️ Column "meetings.workspace_id" does not exist';
    END IF;
  END IF;
END $$;

SELECT 'Migration 01 completed successfully! ✅' AS status;
SELECT 'Next: Run migration_02_projects_to_topics.sql' AS next_step;
