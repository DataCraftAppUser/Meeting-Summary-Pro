-- ================================================================
-- Migration 06: Add processed_by column to items
-- ================================================================

BEGIN;

-- 1. Add processed_by column to items table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'processed_by') THEN
        ALTER TABLE items ADD COLUMN processed_by VARCHAR(100);
        RAISE NOTICE '✅ Column "processed_by" added to "items"';
    END IF;
END $$;

-- 2. Add processed_by column to item_versions table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'item_versions' AND column_name = 'processed_by') THEN
        ALTER TABLE item_versions ADD COLUMN processed_by VARCHAR(100);
        RAISE NOTICE '✅ Column "processed_by" added to "item_versions"';
    END IF;
END $$;

-- 3. Add processed_by column to item_translations table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'item_translations' AND column_name = 'processed_by') THEN
        ALTER TABLE item_translations ADD COLUMN processed_by VARCHAR(100);
        RAISE NOTICE '✅ Column "processed_by" added to "item_translations"';
    END IF;
END $$;

-- 4. Update view vw_items_summary to include processed_by
DROP VIEW IF EXISTS vw_items_summary;
CREATE VIEW vw_items_summary AS
SELECT 
  i.id, i.title, i.meeting_date, i.meeting_time, i.status, i.duration_minutes, i.meeting_location, i.content_type,
  i.processed_by,
  w.name AS workspace_name, w.company AS workspace_company, w.email AS workspace_email,
  t.name AS topic_name, t.status AS topic_status, t.hourly_rate AS topic_hourly_rate,
  i.participants, COALESCE(array_length(i.participants, 1), 0) AS participant_count,
  LENGTH(i.content) AS original_content_length,
  LENGTH(i.processed_content) AS processed_content_length,
  CASE WHEN i.processed_content IS NOT NULL THEN true ELSE false END AS is_processed,
  (SELECT COUNT(*) FROM item_translations it WHERE it.item_id = i.id) AS translation_count,
  (SELECT array_agg(language) FROM item_translations it WHERE it.item_id = i.id) AS available_languages,
  (SELECT COUNT(*) FROM item_versions iv WHERE iv.item_id = i.id) AS version_count,
  i.created_at, i.updated_at, i.last_edited_at,
  CASE 
    WHEN i.meeting_date > CURRENT_DATE THEN 'future'
    WHEN i.meeting_date = CURRENT_DATE THEN 'today'
    WHEN i.meeting_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'this_week'
    WHEN i.meeting_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'this_month'
    ELSE 'older'
  END AS time_category,
  EXTRACT(YEAR FROM i.meeting_date) AS meeting_year,
  EXTRACT(MONTH FROM i.meeting_date) AS meeting_month,
  TO_CHAR(i.meeting_date, 'Day') AS meeting_day_name,
  CASE WHEN i.duration_minutes IS NOT NULL THEN i.duration_minutes / 60.0 ELSE NULL END AS duration_hours
FROM items i
LEFT JOIN workspaces w ON i.workspace_id = w.id
LEFT JOIN topics t ON i.topic_id = t.id;

-- 5. Update item versions trigger function
CREATE OR REPLACE FUNCTION create_item_version_trigger()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content OR 
     OLD.processed_content IS DISTINCT FROM NEW.processed_content OR
     OLD.processed_by IS DISTINCT FROM NEW.processed_by THEN
    
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
    FROM item_versions WHERE item_id = NEW.id;
    
    INSERT INTO item_versions (item_id, version_number, content, processed_content, processed_by, created_by)
    VALUES (NEW.id, next_version, NEW.content, NEW.processed_content, NEW.processed_by, NEW.created_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
