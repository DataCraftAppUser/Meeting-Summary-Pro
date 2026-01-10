-- Quick check: Do the tables exist with the correct names?
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('item_versions', 'item_translations') THEN '✅ Correct name'
    WHEN table_name IN ('meeting_versions', 'meeting_translations') THEN '⚠️ Old name - needs migration'
    ELSE '❓ Unknown'
  END AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('item_versions', 'item_translations', 'meeting_versions', 'meeting_translations')
ORDER BY table_name;

-- Check if trigger exists
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  CASE 
    WHEN tgname = 'items_create_version' THEN '✅ Correct trigger'
    WHEN tgname = 'meetings_create_version' THEN '⚠️ Old trigger - needs update'
    ELSE '❓ Unknown'
  END AS status
FROM pg_trigger
WHERE tgname IN ('items_create_version', 'meetings_create_version');
