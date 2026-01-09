-- ================================================================
-- Meeting Summary Pro - Database Views for Analytics & Power BI
-- ================================================================
-- Platform: Supabase (PostgreSQL 15)
-- Purpose: Views מוכנים לחיבור Power BI ודוחות
-- ================================================================

-- ================================================================
-- VIEW 1: vw_meetings_summary - סיכום פגישות מלא
-- ================================================================

CREATE OR REPLACE VIEW vw_meetings_summary AS
SELECT 
  -- Meeting details
  m.id,
  m.title,
  m.meeting_date,
  m.status,
  m.duration_minutes,
  m.meeting_location,
  
  -- Client & Project
  c.name AS client_name,
  c.company AS client_company,
  c.email AS client_email,
  p.name AS project_name,
  p.status AS project_status,
  p.hourly_rate AS project_hourly_rate,
  
  -- Participants
  m.participants,
  COALESCE(array_length(m.participants, 1), 0) AS participant_count,
  
  -- Content stats
  LENGTH(m.content) AS original_content_length,
  LENGTH(m.processed_content) AS processed_content_length,
  CASE 
    WHEN m.processed_content IS NOT NULL THEN true 
    ELSE false 
  END AS is_processed,
  
  -- Translations
  (SELECT COUNT(*) FROM meeting_translations mt WHERE mt.meeting_id = m.id) AS translation_count,
  (SELECT array_agg(language) FROM meeting_translations mt WHERE mt.meeting_id = m.id) AS available_languages,
  
  -- Versions
  (SELECT COUNT(*) FROM meeting_versions mv WHERE mv.meeting_id = m.id) AS version_count,
  
  -- Timestamps
  m.created_at,
  m.updated_at,
  m.last_edited_at,
  
  -- Calculated fields
  CASE 
    WHEN m.meeting_date > CURRENT_DATE THEN 'future'
    WHEN m.meeting_date = CURRENT_DATE THEN 'today'
    WHEN m.meeting_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'this_week'
    WHEN m.meeting_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'this_month'
    ELSE 'older'
  END AS time_category,
  
  EXTRACT(YEAR FROM m.meeting_date) AS meeting_year,
  EXTRACT(MONTH FROM m.meeting_date) AS meeting_month,
  EXTRACT(WEEK FROM m.meeting_date) AS meeting_week,
  TO_CHAR(m.meeting_date, 'Day') AS meeting_day_name,
  
  -- Duration in hours (for reporting)
  CASE 
    WHEN m.duration_minutes IS NOT NULL THEN m.duration_minutes / 60.0 
    ELSE NULL 
  END AS duration_hours

FROM meetings m
LEFT JOIN clients c ON m.client_id = c.id
LEFT JOIN projects p ON m.project_id = p.id
ORDER BY m.meeting_date DESC, m.created_at DESC;

COMMENT ON VIEW vw_meetings_summary IS 'סיכום מלא של כל הפגישות - מוכן ל-Power BI';

-- ================================================================
-- VIEW 2: vw_time_tracking_report - דוח שעות (מוכן לעתיד)
-- ================================================================

CREATE OR REPLACE VIEW vw_time_tracking_report AS
SELECT 
  -- Time entry details
  te.id,
  te.start_time,
  te.end_time,
  te.start_time::date AS work_date,
  te.duration_minutes,
  te.duration_minutes / 60.0 AS hours,
  te.description,
  te.is_billable,
  te.hourly_rate,
  
  -- Calculated amount
  CASE 
    WHEN te.is_billable AND te.hourly_rate IS NOT NULL 
    THEN (te.duration_minutes / 60.0) * te.hourly_rate 
    ELSE 0 
  END AS amount,
  
  -- User info (from Supabase Auth)
  te.user_id,
  -- Note: auth.users.email requires service_role or proper RLS
  
  -- Client & Project
  c.name AS client_name,
  c.company AS client_company,
  p.name AS project_name,
  p.status AS project_status,
  p.budget_amount AS project_budget,
  p.estimated_hours AS project_estimated_hours,
  
  -- Meeting link (if exists)
  m.title AS meeting_title,
  m.meeting_date,
  
  -- Timestamps
  te.created_at,
  te.updated_at,
  
  -- Date dimensions (for Power BI)
  EXTRACT(YEAR FROM te.start_time) AS year,
  EXTRACT(MONTH FROM te.start_time) AS month,
  EXTRACT(WEEK FROM te.start_time) AS week,
  TO_CHAR(te.start_time, 'Day') AS day_name,
  EXTRACT(HOUR FROM te.start_time) AS hour_of_day,
  
  -- Week/Month labels
  TO_CHAR(te.start_time, 'YYYY-MM') AS year_month,
  TO_CHAR(te.start_time, 'YYYY-"W"IW') AS year_week

FROM time_entries te
LEFT JOIN projects p ON te.project_id = p.id
LEFT JOIN clients c ON p.client_id = c.id
LEFT JOIN meetings m ON te.meeting_id = m.id
ORDER BY te.start_time DESC;

COMMENT ON VIEW vw_time_tracking_report IS 'דוח שעות מפורט - מוכן ל-Power BI ו-Time Tracking';

-- ================================================================
-- VIEW 3: vw_client_summary - סיכום לפי לקוח
-- ================================================================

CREATE OR REPLACE VIEW vw_client_summary AS
SELECT 
  -- Client info
  c.id,
  c.name,
  c.company,
  c.email,
  c.phone,
  
  -- Projects count
  (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id) AS total_projects,
  (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id AND p.status = 'active') AS active_projects,
  
  -- Meetings count
  (SELECT COUNT(*) FROM meetings m WHERE m.client_id = c.id) AS total_meetings,
  (SELECT COUNT(*) FROM meetings m WHERE m.client_id = c.id AND m.status = 'processed') AS processed_meetings,
  
  -- Recent meeting
  (SELECT MAX(meeting_date) FROM meetings m WHERE m.client_id = c.id) AS last_meeting_date,
  
  -- Time tracking (future)
  (SELECT SUM(duration_minutes) / 60.0 
   FROM time_entries te 
   JOIN projects p ON te.project_id = p.id 
   WHERE p.client_id = c.id) AS total_hours_worked,
  
  (SELECT SUM((duration_minutes / 60.0) * hourly_rate)
   FROM time_entries te 
   JOIN projects p ON te.project_id = p.id 
   WHERE p.client_id = c.id AND te.is_billable = true) AS total_billable_amount,
  
  -- Timestamps
  c.created_at,
  c.updated_at

FROM clients c
ORDER BY c.name;

COMMENT ON VIEW vw_client_summary IS 'סיכום מצטבר לכל לקוח - פרויקטים, פגישות, שעות';

-- ================================================================
-- VIEW 4: vw_project_summary - סיכום לפי פרויקט
-- ================================================================

CREATE OR REPLACE VIEW vw_project_summary AS
SELECT 
  -- Project info
  p.id,
  p.name,
  p.description,
  p.status,
  p.estimated_hours,
  p.budget_amount,
  p.hourly_rate,
  p.start_date,
  p.deadline,
  
  -- Client
  c.name AS client_name,
  c.company AS client_company,
  
  -- Meetings count
  (SELECT COUNT(*) FROM meetings m WHERE m.project_id = p.id) AS total_meetings,
  (SELECT MAX(meeting_date) FROM meetings m WHERE m.project_id = p.id) AS last_meeting_date,
  
  -- Time tracking (future)
  (SELECT SUM(duration_minutes) / 60.0 
   FROM time_entries te 
   WHERE te.project_id = p.id) AS total_hours_worked,
  
  (SELECT SUM((duration_minutes / 60.0) * COALESCE(te.hourly_rate, p.hourly_rate))
   FROM time_entries te 
   WHERE te.project_id = p.id AND te.is_billable = true) AS total_billable_amount,
  
  -- Budget utilization
  CASE 
    WHEN p.estimated_hours IS NOT NULL AND p.estimated_hours > 0 
    THEN (SELECT SUM(duration_minutes) / 60.0 FROM time_entries te WHERE te.project_id = p.id) / p.estimated_hours * 100
    ELSE NULL 
  END AS hours_utilization_percent,
  
  CASE 
    WHEN p.budget_amount IS NOT NULL AND p.budget_amount > 0 
    THEN (SELECT SUM((duration_minutes / 60.0) * COALESCE(te.hourly_rate, p.hourly_rate))
          FROM time_entries te 
          WHERE te.project_id = p.id AND te.is_billable = true) / p.budget_amount * 100
    ELSE NULL 
  END AS budget_utilization_percent,
  
  -- Days tracking
  CASE 
    WHEN p.deadline IS NOT NULL 
    THEN p.deadline - CURRENT_DATE 
    ELSE NULL 
  END AS days_until_deadline,
  
  CASE 
    WHEN p.start_date IS NOT NULL 
    THEN CURRENT_DATE - p.start_date 
    ELSE NULL 
  END AS days_since_start,
  
  -- Timestamps
  p.created_at,
  p.updated_at

FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
ORDER BY p.created_at DESC;

COMMENT ON VIEW vw_project_summary IS 'סיכום מפורט לכל פרויקט - תקציב, שעות, התקדמות';

-- ================================================================
-- VIEW 5: vw_monthly_stats - סטטיסטיקה חודשית
-- ================================================================

CREATE OR REPLACE VIEW vw_monthly_stats AS
SELECT 
  TO_CHAR(meeting_date, 'YYYY-MM') AS year_month,
  EXTRACT(YEAR FROM meeting_date) AS year,
  EXTRACT(MONTH FROM meeting_date) AS month,
  
  -- Meetings
  COUNT(*) AS total_meetings,
  COUNT(*) FILTER (WHERE status = 'processed') AS processed_meetings,
  COUNT(DISTINCT client_id) AS unique_clients,
  COUNT(DISTINCT project_id) AS unique_projects,
  
  -- Average participants
  AVG(array_length(participants, 1)) AS avg_participants,
  
  -- Duration
  SUM(duration_minutes) / 60.0 AS total_meeting_hours,
  AVG(duration_minutes) / 60.0 AS avg_meeting_hours

FROM meetings
GROUP BY year_month, year, month
ORDER BY year_month DESC;

COMMENT ON VIEW vw_monthly_stats IS 'סטטיסטיקה חודשית - מספר פגישות, לקוחות, שעות';

-- ================================================================
-- VIEW 6: vw_weekly_activity - פעילות שבועית
-- ================================================================

CREATE OR REPLACE VIEW vw_weekly_activity AS
SELECT 
  TO_CHAR(meeting_date, 'YYYY-"W"IW') AS year_week,
  EXTRACT(YEAR FROM meeting_date) AS year,
  EXTRACT(WEEK FROM meeting_date) AS week,
  MIN(meeting_date) AS week_start,
  MAX(meeting_date) AS week_end,
  
  -- Meetings
  COUNT(*) AS total_meetings,
  COUNT(*) FILTER (WHERE status = 'processed') AS processed_meetings,
  
  -- Clients & Projects
  COUNT(DISTINCT client_id) AS unique_clients,
  COUNT(DISTINCT project_id) AS unique_projects,
  
  -- Top client
  MODE() WITHIN GROUP (ORDER BY client_id) AS most_active_client_id,
  
  -- Duration
  SUM(duration_minutes) / 60.0 AS total_hours

FROM meetings
GROUP BY year_week, year, week
ORDER BY year_week DESC;

COMMENT ON VIEW vw_weekly_activity IS 'סיכום פעילות שבועי - למעקב ודאשבורדים';

-- ================================================================
-- MATERIALIZED VIEWS (Optional - for performance)
-- ================================================================

-- אם יש הרבה נתונים, אפשר להפוך ל-MATERIALIZED VIEW:
-- CREATE MATERIALIZED VIEW mv_client_summary AS SELECT * FROM vw_client_summary;
-- REFRESH MATERIALIZED VIEW mv_client_summary; -- להרצה ידנית או בcron

-- ================================================================
-- GRANT PERMISSIONS
-- ================================================================

-- Allow authenticated users to read views
GRANT SELECT ON vw_meetings_summary TO authenticated;
GRANT SELECT ON vw_time_tracking_report TO authenticated;
GRANT SELECT ON vw_client_summary TO authenticated;
GRANT SELECT ON vw_project_summary TO authenticated;
GRANT SELECT ON vw_monthly_stats TO authenticated;
GRANT SELECT ON vw_weekly_activity TO authenticated;

-- ================================================================
-- USAGE EXAMPLES FOR POWER BI
-- ================================================================

/*
-- Example 1: Total meetings by client
SELECT 
  client_name,
  COUNT(*) as total_meetings,
  SUM(duration_hours) as total_hours
FROM vw_meetings_summary
WHERE meeting_date >= '2025-01-01'
GROUP BY client_name
ORDER BY total_meetings DESC;

-- Example 2: Monthly trend
SELECT 
  year_month,
  total_meetings,
  processed_meetings,
  unique_clients
FROM vw_monthly_stats
ORDER BY year_month DESC
LIMIT 12;

-- Example 3: Project budget tracking
SELECT 
  client_name,
  name as project_name,
  budget_amount,
  total_billable_amount,
  budget_utilization_percent
FROM vw_project_summary
WHERE status = 'active'
ORDER BY budget_utilization_percent DESC;

-- Example 4: Time entries by project (when Time Tracking is active)
SELECT 
  client_name,
  project_name,
  work_date,
  SUM(hours) as daily_hours,
  SUM(amount) as daily_amount
FROM vw_time_tracking_report
WHERE work_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY client_name, project_name, work_date
ORDER BY work_date DESC, daily_hours DESC;
*/

-- ================================================================
-- END OF VIEWS
-- ================================================================

SELECT 'Database views created successfully! ✅' AS status;
SELECT 'Ready for Power BI connection! 📊' AS message;
