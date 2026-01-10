-- ================================================================
-- Meeting Summary Pro - סקריפט הקמת סביבת פיתוח (DEV)
-- ================================================================
-- Platform: Supabase (PostgreSQL 15)
-- Description: יצירת כל האובייקטים הנדרשים (טבלאות, פונקציות, טריגרים, ויוז)
-- תואם למבנה החדש: Workspaces, Topics, Items
-- ================================================================

-- 0. הרחבות (Extensions)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- לחיפוש טקסטואלי

-- ================================================================
-- 1. פונקציות עזר (Helper Functions)
-- ================================================================

-- פונקציה לעדכון אוטומטי של updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- פונקציה לחישוב משך זמן אוטומטי ב-time_entries
CREATE OR REPLACE FUNCTION calculate_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 2. טבלאות ליבה (Core Tables)
-- ================================================================

-- 2.1 WORKSPACES (לשעבר Clients)
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(company, ''))
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_workspaces_name ON workspaces(name);
CREATE INDEX IF NOT EXISTS idx_workspaces_search ON workspaces USING GIN(search_vector);

-- 2.2 TOPICS (לשעבר Projects)
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
  estimated_hours DECIMAL(10,2),
  budget_amount DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  start_date DATE,
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_workspace_topic UNIQUE(workspace_id, name)
);

CREATE INDEX IF NOT EXISTS idx_topics_workspace ON topics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);

-- 2.3 ITEMS (לשעבר Meetings)
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  meeting_date DATE NOT NULL,
  meeting_time TIME,
  participants TEXT[],
  content_type VARCHAR(50) DEFAULT 'meeting', -- 'meeting', 'note', etc.
  content TEXT NOT NULL,
  full_raw_content TEXT,
  processed_content TEXT,
  is_processed_manually_updated BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'processed', 'final')),
  duration_minutes INTEGER,
  meeting_location VARCHAR(255),
  action_items JSONB DEFAULT '[]'::jsonb,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_time TIME,
  follow_up_tbd BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_edited_at TIMESTAMPTZ DEFAULT NOW(),
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('simple', 
      coalesce(title, '') || ' ' || 
      coalesce(content, '') || ' ' ||
      coalesce(processed_content, '')
    )
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_items_workspace ON items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_items_topic ON items(topic_id);
CREATE INDEX IF NOT EXISTS idx_items_date ON items(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_items_search ON items USING GIN(search_vector);

-- 2.4 ITEM_VERSIONS
CREATE TABLE IF NOT EXISTS item_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  processed_content TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  change_description TEXT,
  CONSTRAINT unique_item_version UNIQUE(item_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_versions_item ON item_versions(item_id, version_number DESC);

-- 2.5 ITEM_TRANSLATIONS
CREATE TABLE IF NOT EXISTS item_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL, -- 'en', 'he', etc.
  translated_content TEXT NOT NULL,
  translated_processed_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_item_language UNIQUE(item_id, language)
);

-- 2.6 TIME_ENTRIES
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  description TEXT,
  is_billable BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 3. טריגרים (Triggers)
-- ================================================================

-- עדכון updated_at
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_item_translations_updated_at BEFORE UPDATE ON item_translations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- חישוב משך זמן ב-time_entries
CREATE TRIGGER time_entries_calculate_duration BEFORE INSERT OR UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION calculate_duration();

-- יצירת גרסה חדשה אוטומטית בשינוי תוכן
CREATE OR REPLACE FUNCTION create_item_version_trigger()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content OR 
     OLD.processed_content IS DISTINCT FROM NEW.processed_content THEN
    
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
    FROM item_versions WHERE item_id = NEW.id;
    
    INSERT INTO item_versions (item_id, version_number, content, processed_content, created_by)
    VALUES (NEW.id, next_version, NEW.content, NEW.processed_content, NEW.created_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_create_version AFTER UPDATE ON items FOR EACH ROW EXECUTE FUNCTION create_item_version_trigger();

-- ================================================================
-- 4. ויוז (Views) - מעודכן לשמות החדשים
-- ================================================================

-- 4.1 VIEW: vw_items_summary - סיכום פריטים מלא
CREATE OR REPLACE VIEW vw_items_summary AS
SELECT 
  i.id, i.title, i.meeting_date, i.meeting_time, i.status, i.duration_minutes, i.meeting_location, i.content_type,
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

-- 4.2 VIEW: vw_time_tracking_report - דוח שעות
CREATE OR REPLACE VIEW vw_time_tracking_report AS
SELECT 
  te.id, te.start_time, te.end_time, te.start_time::date AS work_date, te.duration_minutes,
  te.duration_minutes / 60.0 AS hours, te.description, te.is_billable, te.hourly_rate,
  CASE WHEN te.is_billable AND te.hourly_rate IS NOT NULL THEN (te.duration_minutes / 60.0) * te.hourly_rate ELSE 0 END AS amount,
  te.user_id, w.name AS workspace_name, w.company AS workspace_company,
  t.name AS topic_name, t.status AS topic_status, t.budget_amount AS topic_budget, t.estimated_hours AS topic_estimated_hours,
  i.title AS item_title, i.meeting_date,
  te.created_at, te.updated_at,
  EXTRACT(YEAR FROM te.start_time) AS year, EXTRACT(MONTH FROM te.start_time) AS month,
  TO_CHAR(te.start_time, 'YYYY-MM') AS year_month
FROM time_entries te
LEFT JOIN topics t ON te.topic_id = t.id
LEFT JOIN workspaces w ON t.workspace_id = w.id
LEFT JOIN items i ON te.item_id = i.id;

-- 4.3 VIEW: vw_workspace_summary - סיכום לפי Workspace
CREATE OR REPLACE VIEW vw_workspace_summary AS
SELECT 
  w.id, w.name, w.company, w.email, w.phone,
  (SELECT COUNT(*) FROM topics t WHERE t.workspace_id = w.id) AS total_topics,
  (SELECT COUNT(*) FROM topics t WHERE t.workspace_id = w.id AND t.status = 'active') AS active_topics,
  (SELECT COUNT(*) FROM items i WHERE i.workspace_id = w.id) AS total_items,
  (SELECT MAX(meeting_date) FROM items i WHERE i.workspace_id = w.id) AS last_activity_date,
  w.created_at, w.updated_at
FROM workspaces w;

-- 4.4 VIEW: vw_topic_summary - סיכום לפי Topic
CREATE OR REPLACE VIEW vw_topic_summary AS
SELECT 
  t.id, t.name, t.description, t.status, t.estimated_hours, t.budget_amount, t.hourly_rate, t.start_date, t.deadline,
  w.name AS workspace_name,
  (SELECT COUNT(*) FROM items i WHERE i.topic_id = t.id) AS total_items,
  (SELECT MAX(meeting_date) FROM items i WHERE i.topic_id = t.id) AS last_item_date,
  (SELECT SUM(duration_minutes) / 60.0 FROM time_entries te WHERE te.topic_id = t.id) AS total_hours_worked,
  t.created_at, t.updated_at
FROM topics t
LEFT JOIN workspaces w ON t.workspace_id = w.id;

-- 4.5 VIEW: vw_monthly_stats - סטטיסטיקה חודשית
CREATE OR REPLACE VIEW vw_monthly_stats AS
SELECT 
  TO_CHAR(meeting_date, 'YYYY-MM') AS year_month,
  EXTRACT(YEAR FROM meeting_date) AS year,
  EXTRACT(MONTH FROM meeting_date) AS month,
  COUNT(*) AS total_items,
  COUNT(*) FILTER (WHERE status = 'processed') AS processed_items,
  COUNT(DISTINCT workspace_id) AS unique_workspaces,
  COUNT(DISTINCT topic_id) AS unique_topics,
  SUM(duration_minutes) / 60.0 AS total_hours
FROM items
GROUP BY year_month, year, month
ORDER BY year_month DESC;

-- 4.6 GRANT PERMISSIONS
GRANT SELECT ON vw_items_summary TO authenticated;
GRANT SELECT ON vw_time_tracking_report TO authenticated;
GRANT SELECT ON vw_workspace_summary TO authenticated;
GRANT SELECT ON vw_topic_summary TO authenticated;
GRANT SELECT ON vw_monthly_stats TO authenticated;

-- ================================================================
-- 5. אבטחה (RLS - Row Level Security)
-- ================================================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- פוליסיות פשוטות לסביבת פיתוח (גישה לכל המשתמשים המחוברים)
CREATE POLICY "Allow all to authenticated users" ON workspaces FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated users" ON topics FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated users" ON items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated users" ON item_versions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated users" ON item_translations FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated users" ON time_entries FOR ALL TO authenticated USING (true);

-- ================================================================
-- 6. נתוני דוגמה (Seed Data)
-- ================================================================

INSERT INTO workspaces (name, company) VALUES ('Workspace פיתוח', 'חברה לדוגמה') ON CONFLICT (name) DO NOTHING;

INSERT INTO topics (workspace_id, name, status) 
SELECT id, 'פרויקט פיתוח ראשון', 'active' FROM workspaces WHERE name = 'Workspace פיתוח'
ON CONFLICT DO NOTHING;

-- ================================================================
-- סיום
-- ================================================================
SELECT 'DEV Database Setup Completed Successfully! ✅' AS message;
