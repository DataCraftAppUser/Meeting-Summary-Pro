-- ================================================================
-- Create item_versions and item_translations tables if they don't exist
-- ================================================================
-- This is a simpler script that creates the tables from scratch
-- Use this if the migration script doesn't work or if tables don't exist
-- ================================================================

-- ================================================================
-- 1. Create item_versions table
-- ================================================================

CREATE TABLE IF NOT EXISTS item_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  -- Content snapshots
  content TEXT NOT NULL,
  processed_content TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  change_description TEXT,
  
  -- Constraints
  CONSTRAINT unique_item_version UNIQUE(item_id, version_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_versions_item ON item_versions(item_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_versions_created_at ON item_versions(created_at DESC);

-- Comments
COMMENT ON TABLE item_versions IS 'היסטוריית גרסאות של פריטים';
COMMENT ON COLUMN item_versions.version_number IS 'מספר גרסה (1, 2, 3, ...)';

-- ================================================================
-- 2. Create item_translations table
-- ================================================================

CREATE TABLE IF NOT EXISTS item_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL, -- 'en', 'he', etc.
  
  -- Translated content
  translated_content TEXT NOT NULL,
  translated_processed_content TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_item_language UNIQUE(item_id, language)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_translations_item ON item_translations(item_id);
CREATE INDEX IF NOT EXISTS idx_translations_language ON item_translations(language);

-- Comments
COMMENT ON TABLE item_translations IS 'תרגומים של פריטים';
COMMENT ON COLUMN item_translations.language IS 'קוד שפה (ISO 639-1): en, he, וכו';

-- ================================================================
-- 3. Create or replace function for version creation
-- ================================================================

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

-- ================================================================
-- 4. Create trigger (drop old one first if exists)
-- ================================================================

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS meetings_create_version ON items;
DROP TRIGGER IF EXISTS items_create_version ON items;

-- Create new trigger
CREATE TRIGGER items_create_version 
  AFTER UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION create_item_version();

-- ================================================================
-- 5. Enable RLS and create policies
-- ================================================================

-- Enable RLS
ALTER TABLE item_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_translations ENABLE ROW LEVEL SECURITY;

-- Drop old policies if exist
DROP POLICY IF EXISTS "Users can view all versions" ON item_versions;
DROP POLICY IF EXISTS "Users can view all translations" ON item_translations;

-- Create policies
CREATE POLICY "Users can view all versions" ON item_versions
  FOR SELECT USING (true);

CREATE POLICY "Users can view all translations" ON item_translations
  FOR SELECT USING (true);

-- ================================================================
-- Verification
-- ================================================================

SELECT '✅ Tables created successfully!' AS status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('item_versions', 'item_translations')
ORDER BY table_name;
