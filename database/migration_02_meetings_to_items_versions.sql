-- ================================================================
-- Migration 02: Meetings → Items (Versions & Translations)
-- ================================================================
-- This script renames:
--   - meeting_versions table → item_versions
--   - meeting_translations table → item_translations
--   - meeting_id columns → item_id
--   - All related indexes, constraints, triggers, and RLS policies
-- ================================================================
-- IMPORTANT: Run this migration AFTER meetings table is renamed to items
-- ================================================================

BEGIN;

-- ================================================================
-- Step 1: Rename meeting_versions table to item_versions
-- ================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_versions') THEN
    ALTER TABLE meeting_versions RENAME TO item_versions;
    RAISE NOTICE '✅ Table "meeting_versions" renamed to "item_versions"';
  ELSE
    RAISE NOTICE 'Table "meeting_versions" does not exist, skipping rename';
  END IF;
END $$;

-- ================================================================
-- Step 2: Rename meeting_translations table to item_translations
-- ================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_translations') THEN
    ALTER TABLE meeting_translations RENAME TO item_translations;
    RAISE NOTICE '✅ Table "meeting_translations" renamed to "item_translations"';
  ELSE
    RAISE NOTICE 'Table "meeting_translations" does not exist, skipping rename';
  END IF;
END $$;

-- ================================================================
-- Step 3: Rename meeting_id columns to item_id
-- ================================================================

-- In item_versions table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'item_versions') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'item_versions' AND column_name = 'meeting_id') THEN
      ALTER TABLE item_versions RENAME COLUMN meeting_id TO item_id;
      RAISE NOTICE '✅ Column "item_versions.meeting_id" renamed to "item_id"';
    END IF;
  END IF;
END $$;

-- In item_translations table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'item_translations') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'item_translations' AND column_name = 'meeting_id') THEN
      ALTER TABLE item_translations RENAME COLUMN meeting_id TO item_id;
      RAISE NOTICE '✅ Column "item_translations.meeting_id" renamed to "item_id"';
    END IF;
  END IF;
END $$;

-- ================================================================
-- Step 4: Update foreign key constraints
-- ================================================================

-- Drop old foreign key constraints
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'item_versions') THEN
    ALTER TABLE item_versions DROP CONSTRAINT IF EXISTS meeting_versions_meeting_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'item_translations') THEN
    ALTER TABLE item_translations DROP CONSTRAINT IF EXISTS meeting_translations_meeting_id_fkey;
  END IF;
END $$;

-- Add new foreign key constraints
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'item_versions') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'items') THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'item_versions_item_id_fkey') THEN
        ALTER TABLE item_versions 
          ADD CONSTRAINT item_versions_item_id_fkey 
          FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Created foreign key constraint item_versions_item_id_fkey';
      END IF;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'item_translations') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'items') THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'item_translations_item_id_fkey') THEN
        ALTER TABLE item_translations 
          ADD CONSTRAINT item_translations_item_id_fkey 
          FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Created foreign key constraint item_translations_item_id_fkey';
      END IF;
    END IF;
  END IF;
END $$;

-- ================================================================
-- Step 5: Update unique constraints
-- ================================================================

-- Update unique constraint in item_versions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'item_versions') THEN
    ALTER TABLE item_versions DROP CONSTRAINT IF EXISTS unique_meeting_version;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'unique_item_version') THEN
      ALTER TABLE item_versions 
        ADD CONSTRAINT unique_item_version 
        UNIQUE(item_id, version_number);
      RAISE NOTICE '✅ Created unique constraint unique_item_version';
    END IF;
  END IF;
END $$;

-- Update unique constraint in item_translations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'item_translations') THEN
    ALTER TABLE item_translations DROP CONSTRAINT IF EXISTS unique_meeting_language;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'unique_item_language') THEN
      ALTER TABLE item_translations 
        ADD CONSTRAINT unique_item_language 
        UNIQUE(item_id, language);
      RAISE NOTICE '✅ Created unique constraint unique_item_language';
    END IF;
  END IF;
END $$;

-- ================================================================
-- Step 6: Update indexes
-- ================================================================

-- Rename indexes for item_versions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_versions_meeting') THEN
    ALTER INDEX idx_versions_meeting RENAME TO idx_versions_item;
    RAISE NOTICE '✅ Index renamed: idx_versions_meeting → idx_versions_item';
  END IF;
END $$;

-- Rename indexes for item_translations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_translations_meeting') THEN
    ALTER INDEX idx_translations_meeting RENAME TO idx_translations_item;
    RAISE NOTICE '✅ Index renamed: idx_translations_meeting → idx_translations_item';
  END IF;
END $$;

-- ================================================================
-- Step 7: Update function and trigger
-- ================================================================

-- Drop old trigger
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'meetings_create_version') THEN
    DROP TRIGGER IF EXISTS meetings_create_version ON items;
    RAISE NOTICE '✅ Dropped old trigger meetings_create_version';
  END IF;
END $$;

-- Create or replace function with new name
CREATE OR REPLACE FUNCTION create_item_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
  FROM item_versions
  WHERE item_id = NEW.id;
  
  -- Insert new version only if content changed
  IF OLD.content IS DISTINCT FROM NEW.content OR 
     OLD.processed_content IS DISTINCT FROM NEW.processed_content THEN
    
    INSERT INTO item_versions (
      item_id, 
      version_number, 
      content, 
      processed_content,
      created_by
    ) VALUES (
      NEW.id,
      next_version,
      NEW.content,
      NEW.processed_content,
      NEW.created_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'items') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'items_create_version') THEN
      CREATE TRIGGER items_create_version 
        AFTER UPDATE ON items
        FOR EACH ROW EXECUTE FUNCTION create_item_version();
      RAISE NOTICE '✅ Created trigger items_create_version';
    END IF;
  END IF;
END $$;

-- ================================================================
-- Step 8: Update RLS policies
-- ================================================================

-- Drop old policies and create new ones for item_versions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'item_versions') THEN
    -- Drop old policies
    DROP POLICY IF EXISTS "Users can view all versions" ON item_versions;
    
    -- Create new policies
    BEGIN
      CREATE POLICY "Users can view all versions" ON item_versions
        FOR SELECT USING (true);
    EXCEPTION WHEN duplicate_object THEN
      -- Policy already exists, skip
    END;
    
    RAISE NOTICE '✅ Updated RLS policies for item_versions';
  END IF;
END $$;

-- Drop old policies and create new ones for item_translations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'item_translations') THEN
    -- Drop old policies
    DROP POLICY IF EXISTS "Users can view all translations" ON item_translations;
    
    -- Create new policies
    BEGIN
      CREATE POLICY "Users can view all translations" ON item_translations
        FOR SELECT USING (true);
    EXCEPTION WHEN duplicate_object THEN
      -- Policy already exists, skip
    END;
    
    RAISE NOTICE '✅ Updated RLS policies for item_translations';
  END IF;
END $$;

-- ================================================================
-- Step 9: Update comments
-- ================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'item_versions') THEN
    COMMENT ON TABLE item_versions IS 'היסטוריית גרסאות של פריטים';
    COMMENT ON COLUMN item_versions.version_number IS 'מספר גרסה (1, 2, 3, ...)';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'item_translations') THEN
    COMMENT ON TABLE item_translations IS 'תרגומים של פריטים';
    COMMENT ON COLUMN item_translations.language IS 'קוד שפה (ISO 639-1): en, he, וכו';
  END IF;
END $$;

COMMIT;

-- ================================================================
-- Verification
-- ================================================================

DO $$
DECLARE
  item_versions_exists BOOLEAN;
  item_translations_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'item_versions') INTO item_versions_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'item_translations') INTO item_translations_exists;
  
  IF item_versions_exists THEN
    RAISE NOTICE '✅ Table "item_versions" exists';
  ELSE
    RAISE WARNING '⚠️ Table "item_versions" does not exist';
  END IF;
  
  IF item_translations_exists THEN
    RAISE NOTICE '✅ Table "item_translations" exists';
  ELSE
    RAISE WARNING '⚠️ Table "item_translations" does not exist';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'item_versions') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'item_versions' AND column_name = 'item_id') THEN
      RAISE NOTICE '✅ Column "item_versions.item_id" exists';
    ELSE
      RAISE WARNING '⚠️ Column "item_versions.item_id" does not exist';
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'item_translations') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'item_translations' AND column_name = 'item_id') THEN
      RAISE NOTICE '✅ Column "item_translations.item_id" exists';
    ELSE
      RAISE WARNING '⚠️ Column "item_translations.item_id" does not exist';
    END IF;
  END IF;
END $$;

SELECT 'Migration 02 completed successfully! ✅' AS status;
