-- ================================================================
-- Meeting Summary Pro - Database Schema
-- ================================================================
-- Platform: Supabase (PostgreSQL 15)
-- Author: Meeting Summary Pro Team
-- Last Updated: January 2025
-- ================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ================================================================
-- 1. CLIENTS TABLE - לקוחות
-- ================================================================

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic info
  name VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(company, ''))
  ) STORED
);

-- Indexes
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_search ON clients USING GIN(search_vector);

-- Comments
COMMENT ON TABLE clients IS 'טבלת לקוחות - מכילה מידע על לקוחות';
COMMENT ON COLUMN clients.search_vector IS 'וקטור חיפוש אוטומטי לביצועים טובים';

-- ================================================================
-- 2. PROJECTS TABLE - פרויקטים
-- ================================================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
  
  -- Time Tracking fields (מוכן לעתיד)
  estimated_hours DECIMAL(10,2),
  budget_amount DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  
  -- Dates
  start_date DATE,
  deadline DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_client_project UNIQUE(client_id, name),
  CONSTRAINT valid_dates CHECK (deadline IS NULL OR start_date IS NULL OR deadline >= start_date)
);

-- Indexes
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_deadline ON projects(deadline) WHERE deadline IS NOT NULL;

-- Comments
COMMENT ON TABLE projects IS 'טבלת פרויקטים - מקושרת ללקוחות';
COMMENT ON COLUMN projects.estimated_hours IS 'הערכת שעות לפרויקט (מוכן ל-Time Tracking)';

-- ================================================================
-- 3. MEETINGS TABLE - סיכומי פגישות
-- ================================================================

CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Basic info
  title VARCHAR(500) NOT NULL,
  meeting_date DATE NOT NULL,
  participants TEXT[], -- Array of participant names
  
  -- Content
  content TEXT NOT NULL, -- Original raw content
  processed_content TEXT, -- AI-processed HTML content
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'processed', 'final')),
  
  -- Metadata for Time Tracking (מוכן לעתיד)
  duration_minutes INTEGER,
  meeting_location VARCHAR(255),
  
  -- User tracking
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_edited_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('simple', 
      coalesce(title, '') || ' ' || 
      coalesce(content, '') || ' ' ||
      coalesce(processed_content, '')
    )
  ) STORED
);

-- Indexes
CREATE INDEX idx_meetings_client ON meetings(client_id);
CREATE INDEX idx_meetings_project ON meetings(project_id);
CREATE INDEX idx_meetings_date ON meetings(meeting_date DESC);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_created_by ON meetings(created_by);
CREATE INDEX idx_meetings_search ON meetings USING GIN(search_vector);

-- Comments
COMMENT ON TABLE meetings IS 'טבלת סיכומי פגישות - ליבת המערכת';
COMMENT ON COLUMN meetings.content IS 'תוכן מקורי שהמשתמש כתב';
COMMENT ON COLUMN meetings.processed_content IS 'תוכן מעובד ע"י AI (HTML)';
COMMENT ON COLUMN meetings.participants IS 'רשימת משתתפים (PostgreSQL Array)';

-- ================================================================
-- 4. MEETING_VERSIONS TABLE - גרסאות סיכומים
-- ================================================================

CREATE TABLE IF NOT EXISTS meeting_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  -- Content snapshots
  content TEXT NOT NULL,
  processed_content TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  change_description TEXT,
  
  -- Constraints
  CONSTRAINT unique_meeting_version UNIQUE(meeting_id, version_number)
);

-- Indexes
CREATE INDEX idx_versions_meeting ON meeting_versions(meeting_id, version_number DESC);
CREATE INDEX idx_versions_created_at ON meeting_versions(created_at DESC);

-- Comments
COMMENT ON TABLE meeting_versions IS 'היסטוריית גרסאות של סיכומי פגישות';
COMMENT ON COLUMN meeting_versions.version_number IS 'מספר גרסה (1, 2, 3, ...)';

-- ================================================================
-- 5. MEETING_TRANSLATIONS TABLE - תרגומים
-- ================================================================

CREATE TABLE IF NOT EXISTS meeting_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL, -- 'en', 'he', etc.
  
  -- Translated content
  translated_content TEXT NOT NULL,
  translated_processed_content TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_meeting_language UNIQUE(meeting_id, language)
);

-- Indexes
CREATE INDEX idx_translations_meeting ON meeting_translations(meeting_id);
CREATE INDEX idx_translations_language ON meeting_translations(language);

-- Comments
COMMENT ON TABLE meeting_translations IS 'תרגומים של סיכומי פגישות';
COMMENT ON COLUMN meeting_translations.language IS 'קוד שפה (ISO 639-1): en, he, וכו';

-- ================================================================
-- 6. TIME_ENTRIES TABLE - רישום שעות (מוכן לעתיד)
-- ================================================================

CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
  
  -- Time tracking
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  
  -- Details
  description TEXT,
  is_billable BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time IS NULL OR end_time > start_time),
  CONSTRAINT valid_duration CHECK (duration_minutes IS NULL OR duration_minutes > 0)
);

-- Indexes
CREATE INDEX idx_time_entries_user ON time_entries(user_id);
CREATE INDEX idx_time_entries_project ON time_entries(project_id);
CREATE INDEX idx_time_entries_date ON time_entries(start_time DESC);
CREATE INDEX idx_time_entries_meeting ON time_entries(meeting_id) WHERE meeting_id IS NOT NULL;

-- Comments
COMMENT ON TABLE time_entries IS 'רישום שעות עבודה (Time Tracking) - מוכן להרחבה עתידית';
COMMENT ON COLUMN time_entries.duration_minutes IS 'משך בדקות - מחושב אוטומטית או ידני';

-- ================================================================
-- TRIGGERS - עדכון אוטומטי של updated_at
-- ================================================================

-- Function לעדכון updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translations_updated_at BEFORE UPDATE ON meeting_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- FUNCTIONS - פונקציות עזר
-- ================================================================

-- Function: חישוב אוטומטי של duration_minutes ב-time_entries
CREATE OR REPLACE FUNCTION calculate_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER time_entries_calculate_duration 
BEFORE INSERT OR UPDATE ON time_entries
FOR EACH ROW EXECUTE FUNCTION calculate_duration();

-- Function: יצירת גרסה חדשה אוטומטית
CREATE OR REPLACE FUNCTION create_meeting_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
  FROM meeting_versions
  WHERE meeting_id = NEW.id;
  
  -- Insert new version only if content changed
  IF OLD.content IS DISTINCT FROM NEW.content OR 
     OLD.processed_content IS DISTINCT FROM NEW.processed_content THEN
    
    INSERT INTO meeting_versions (
      meeting_id, 
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

CREATE TRIGGER meetings_create_version 
AFTER UPDATE ON meetings
FOR EACH ROW EXECUTE FUNCTION create_meeting_version();

-- ================================================================
-- ROW LEVEL SECURITY (RLS) - אבטחה
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Policies: משתמשים רואים הכל (לעכשיו - אפשר להחמיר בהמשך)
CREATE POLICY "Users can view all clients" ON clients
  FOR SELECT USING (true);

CREATE POLICY "Users can view all projects" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Users can view all meetings" ON meetings
  FOR SELECT USING (true);

CREATE POLICY "Users can view all versions" ON meeting_versions
  FOR SELECT USING (true);

CREATE POLICY "Users can view all translations" ON meeting_translations
  FOR SELECT USING (true);

CREATE POLICY "Users can view all time entries" ON time_entries
  FOR SELECT USING (true);

-- Policies: משתמשים יכולים להוסיף/לערוך
CREATE POLICY "Users can insert clients" ON clients
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update clients" ON clients
  FOR UPDATE USING (true);

CREATE POLICY "Users can insert projects" ON projects
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update projects" ON projects
  FOR UPDATE USING (true);

CREATE POLICY "Users can insert meetings" ON meetings
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own meetings" ON meetings
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own meetings" ON meetings
  FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can insert time entries" ON time_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time entries" ON time_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- ================================================================
-- SEED DATA - נתוני דוגמה (אופציונלי)
-- ================================================================

-- הוסף לקוח דוגמה
INSERT INTO clients (name, email, company) VALUES 
('דני כהן', 'danny@example.com', 'חברת אקסל בע"מ')
ON CONFLICT (name) DO NOTHING;

-- הוסף פרויקט דוגמה
INSERT INTO projects (client_id, name, description, status, hourly_rate) 
SELECT id, 'פיתוח אתר חדש', 'בניית אתר תדמית מודרני', 'active', 500.00
FROM clients WHERE name = 'דני כהן'
ON CONFLICT (client_id, name) DO NOTHING;

-- ================================================================
-- MAINTENANCE - תחזוקה
-- ================================================================

-- Vacuum and analyze for performance
VACUUM ANALYZE clients;
VACUUM ANALYZE projects;
VACUUM ANALYZE meetings;
VACUUM ANALYZE meeting_versions;
VACUUM ANALYZE meeting_translations;
VACUUM ANALYZE time_entries;

-- ================================================================
-- END OF SCHEMA
-- ================================================================

COMMENT ON SCHEMA public IS 'Meeting Summary Pro - Main Schema';

-- סיימנו! 🎉
SELECT 'Database schema created successfully! ✅' AS status;
