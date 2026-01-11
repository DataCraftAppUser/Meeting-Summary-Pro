-- ================================================================
-- Migration 08: Move all existing items to DataCraft Shared Hub
-- ================================================================
-- This migration:
-- 1. Creates or finds "DataCraft Shared Hub"
-- 2. Moves all existing items to this hub
-- 3. Adds all users who have items as members of the hub
-- ================================================================

BEGIN;

-- ================================================================
-- Step 1: Create or find "DataCraft Shared Hub"
-- ================================================================

DO $$
DECLARE
  shared_hub_id UUID;
  admin_user_id UUID;
BEGIN
  -- Try to find existing "DataCraft Shared Hub"
  SELECT id INTO shared_hub_id
  FROM hubs
  WHERE name = 'DataCraft Shared Hub'
  LIMIT 1;

  -- If not found, create it
  IF shared_hub_id IS NULL THEN
    -- Find first admin user to be the creator, or use first approved user
    SELECT id INTO admin_user_id
    FROM user_profiles
    WHERE is_admin = true AND status = 'approved'
    LIMIT 1;

    -- If no admin, use first approved user
    IF admin_user_id IS NULL THEN
      SELECT id INTO admin_user_id
      FROM user_profiles
      WHERE status = 'approved'
      LIMIT 1;
    END IF;

    -- Create the hub
    INSERT INTO hubs (name, type, color_theme, icon, created_by)
    VALUES ('DataCraft Shared Hub', 'shared', 'navy', 'folder', admin_user_id)
    RETURNING id INTO shared_hub_id;

    RAISE NOTICE '✅ Created DataCraft Shared Hub with ID: %', shared_hub_id;

    -- Add creator as owner
    IF admin_user_id IS NOT NULL THEN
      INSERT INTO hub_members (hub_id, user_id, role)
      VALUES (shared_hub_id, admin_user_id, 'owner')
      ON CONFLICT (hub_id, user_id) DO NOTHING;
    END IF;
  ELSE
    RAISE NOTICE '✅ Found existing DataCraft Shared Hub with ID: %', shared_hub_id;
  END IF;

  -- Store hub_id in a temporary table for use in next steps
  CREATE TEMP TABLE IF NOT EXISTS temp_shared_hub AS SELECT shared_hub_id AS id;
  DELETE FROM temp_shared_hub;
  INSERT INTO temp_shared_hub VALUES (shared_hub_id);
END $$;

-- ================================================================
-- Step 2: Update all items to point to the shared hub
-- ================================================================

DO $$
DECLARE
  shared_hub_id UUID;
  items_updated INTEGER;
BEGIN
  -- Get the hub ID from temp table
  SELECT id INTO shared_hub_id FROM temp_shared_hub LIMIT 1;

  -- Update all items that don't have a hub_id or have invalid hub_id
  UPDATE items
  SET hub_id = shared_hub_id
  WHERE hub_id IS NULL 
     OR hub_id NOT IN (SELECT id FROM hubs)
     OR hub_id = shared_hub_id; -- This ensures consistency

  GET DIAGNOSTICS items_updated = ROW_COUNT;
  RAISE NOTICE '✅ Updated % items to DataCraft Shared Hub', items_updated;
END $$;

-- ================================================================
-- Step 3: Add all users who have items as members of the shared hub
-- ================================================================

DO $$
DECLARE
  shared_hub_id UUID;
  users_added INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Get the hub ID from temp table
  SELECT id INTO shared_hub_id FROM temp_shared_hub LIMIT 1;

  -- Add all users who have items (or created items) as members
  FOR user_record IN
    SELECT DISTINCT COALESCE(created_by, (SELECT user_id FROM hub_members WHERE hub_id = shared_hub_id LIMIT 1)) AS user_id
    FROM items
    WHERE created_by IS NOT NULL
    UNION
    SELECT DISTINCT user_id
    FROM hub_members
    WHERE hub_id = shared_hub_id
  LOOP
    -- Add user as member if not already a member
    INSERT INTO hub_members (hub_id, user_id, role)
    VALUES (shared_hub_id, user_record.user_id, 'member')
    ON CONFLICT (hub_id, user_id) DO NOTHING;
    
    users_added := users_added + 1;
  END LOOP;

  RAISE NOTICE '✅ Added % users as members of DataCraft Shared Hub', users_added;
END $$;

-- ================================================================
-- Step 4: Update workspaces and topics to point to shared hub
-- ================================================================

DO $$
DECLARE
  shared_hub_id UUID;
  workspaces_updated INTEGER;
  topics_updated INTEGER;
BEGIN
  -- Get the hub ID from temp table
  SELECT id INTO shared_hub_id FROM temp_shared_hub LIMIT 1;

  -- Update workspaces that don't have a hub_id
  UPDATE workspaces
  SET hub_id = shared_hub_id
  WHERE hub_id IS NULL 
     OR hub_id NOT IN (SELECT id FROM hubs);

  GET DIAGNOSTICS workspaces_updated = ROW_COUNT;
  RAISE NOTICE '✅ Updated % workspaces to DataCraft Shared Hub', workspaces_updated;

  -- Update topics that don't have a hub_id
  UPDATE topics
  SET hub_id = shared_hub_id
  WHERE hub_id IS NULL 
     OR hub_id NOT IN (SELECT id FROM hubs);

  GET DIAGNOSTICS topics_updated = ROW_COUNT;
  RAISE NOTICE '✅ Updated % topics to DataCraft Shared Hub', topics_updated;
END $$;

-- ================================================================
-- Step 5: Cleanup temp table
-- ================================================================

DROP TABLE IF EXISTS temp_shared_hub;

-- ================================================================
-- Verification
-- ================================================================

DO $$
DECLARE
  shared_hub_id UUID;
  items_count INTEGER;
  members_count INTEGER;
BEGIN
  -- Find the hub
  SELECT id INTO shared_hub_id
  FROM hubs
  WHERE name = 'DataCraft Shared Hub'
  LIMIT 1;

  IF shared_hub_id IS NOT NULL THEN
    -- Count items in the hub
    SELECT COUNT(*) INTO items_count
    FROM items
    WHERE hub_id = shared_hub_id;

    -- Count members
    SELECT COUNT(*) INTO members_count
    FROM hub_members
    WHERE hub_id = shared_hub_id;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration 08 completed successfully! ✅';
    RAISE NOTICE 'Hub ID: %', shared_hub_id;
    RAISE NOTICE 'Items in hub: %', items_count;
    RAISE NOTICE 'Members in hub: %', members_count;
    RAISE NOTICE '========================================';
  ELSE
    RAISE EXCEPTION 'Failed to find or create DataCraft Shared Hub';
  END IF;
END $$;

COMMIT;

-- ================================================================
-- Summary Query (for verification)
-- ================================================================

SELECT 
  'DataCraft Shared Hub' AS hub_name,
  h.id AS hub_id,
  COUNT(DISTINCT i.id) AS total_items,
  COUNT(DISTINCT hm.user_id) AS total_members,
  COUNT(DISTINCT w.id) AS total_workspaces,
  COUNT(DISTINCT t.id) AS total_topics
FROM hubs h
LEFT JOIN items i ON i.hub_id = h.id
LEFT JOIN hub_members hm ON hm.hub_id = h.id
LEFT JOIN workspaces w ON w.hub_id = h.id
LEFT JOIN topics t ON t.hub_id = h.id
WHERE h.name = 'DataCraft Shared Hub'
GROUP BY h.id;
