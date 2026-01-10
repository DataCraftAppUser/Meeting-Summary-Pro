# תוכנית ריפקטורינג מסודרת

## שלב 1: Database Migrations (להרצה ב-Supabase)

### 1.1 Migration: Clients → Workspaces
**קובץ:** `migration_01_clients_to_workspaces.sql`
- Rename table `clients` → `workspaces`
- Rename column `client_id` → `workspace_id` בכל הטבלאות
- Update foreign keys, indexes, constraints, triggers, RLS policies

### 1.2 Migration: Projects → Topics  
**קובץ:** `migration_02_projects_to_topics.sql`
- Rename table `projects` → `topics`
- Rename column `project_id` → `topic_id` בכל הטבלאות
- Update foreign keys, indexes, constraints, triggers, RLS policies

### 1.3 Migration: Meetings → Items
**קובץ:** `migration_03_meetings_to_items.sql`
- Rename table `meetings` → `items`
- Rename table `meeting_versions` → `item_versions`
- Rename table `meeting_translations` → `item_translations`
- Rename column `meeting_id` → `item_id` בכל הטבלאות
- Add `content_type` column אם לא קיים
- Update foreign keys, indexes, constraints, triggers, RLS policies

### 1.4 Migration: Update Views
**קובץ:** `migration_04_update_views.sql`
- Update all views to use new table/column names

## שלב 2: Backend Refactoring

### 2.1 Routes
- `routes/clients.ts` → `routes/workspaces.ts`
- `routes/projects.ts` → `routes/topics.ts`
- `routes/meetings.ts` → `routes/items.ts`
- Update `server.ts` to use new routes

### 2.2 Services
- Update `services/supabase.ts` - types and queries
- Update `services/gemini.ts` - function names if needed
- Update `services/prompts.ts` - terminology

### 2.3 Types & Interfaces
- Update all TypeScript interfaces

## שלב 3: Frontend Refactoring

### 3.1 Pages
- `pages/MeetingsList.tsx` → `pages/ItemsList.tsx`
- `pages/MeetingEditor.tsx` → `pages/ItemEditor.tsx`
- `pages/MeetingView.tsx` → `pages/ItemView.tsx`
- Update `pages/Settings.tsx`

### 3.2 Components
- `components/Meetings/` → `components/Items/`
- Update all component names and props

### 3.3 Hooks
- `hooks/useMeetings.ts` → `hooks/useItems.ts`
- `hooks/useClients.ts` → `hooks/useWorkspaces.ts`
- `hooks/useProjects.ts` → `hooks/useTopics.ts`

### 3.4 Services & Types
- Update `services/api.ts`
- Update `types/index.ts`

### 3.5 Routing
- Update `App.tsx` routes
- Update all navigation links

## סדר ביצוע מומלץ:

1. ✅ Database migrations (1.1 → 1.2 → 1.3 → 1.4)
2. ✅ Backend refactoring (2.1 → 2.2 → 2.3)
3. ✅ Frontend refactoring (3.1 → 3.2 → 3.3 → 3.4 → 3.5)
4. ✅ Testing & Verification

## הערות חשובות:

- כל migration צריך להיות idempotent (אפשר להריץ מספר פעמים)
- לבדוק אחרי כל שלב שהכל עובד
- לעשות commit אחרי כל שלב מוצלח
- לשמור גיבוי לפני התחלה
