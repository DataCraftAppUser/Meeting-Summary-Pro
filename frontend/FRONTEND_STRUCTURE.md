# 📁 Frontend Structure - Meeting Summary Pro

## מבנה הקבצים המלא

```
frontend/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
│
├── src/
│   ├── components/          # React Components
│   │   ├── layout/
│   │   │   ├── Layout.tsx           # Main layout with sidebar
│   │   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   │   ├── TopBar.tsx           # Top navigation bar
│   │   │   └── Footer.tsx
│   │   │
│   │   ├── meetings/
│   │   │   ├── MeetingCard.tsx      # Meeting summary card
│   │   │   ├── MeetingList.tsx      # List of meetings
│   │   │   ├── MeetingFilters.tsx   # Search & filter UI
│   │   │   ├── MeetingForm.tsx      # Create/Edit form
│   │   │   ├── RichTextEditor.tsx   # Quill editor wrapper
│   │   │   ├── MeetingView.tsx      # View single meeting
│   │   │   └── VersionsDialog.tsx   # Version history modal
│   │   │
│   │   ├── common/
│   │   │   ├── Button.tsx           # Custom button
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   ├── Toast.tsx            # Notifications
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── EmptyState.tsx
│   │   │
│   │   ├── clients/
│   │   │   ├── ClientSelect.tsx     # Client autocomplete
│   │   │   └── ClientDialog.tsx     # Add/Edit client
│   │   │
│   │   └── projects/
│   │       ├── ProjectSelect.tsx    # Project autocomplete
│   │       └── ProjectDialog.tsx    # Add/Edit project
│   │
│   ├── pages/               # Main pages
│   │   ├── MeetingsListPage.tsx     # /meetings
│   │   ├── MeetingEditorPage.tsx    # /meetings/new, /meetings/:id/edit
│   │   ├── MeetingViewPage.tsx      # /meetings/:id
│   │   ├── ClientsPage.tsx          # /clients
│   │   └── ProjectsPage.tsx         # /projects
│   │
│   ├── services/            # API calls
│   │   ├── api.ts                   # Axios instance
│   │   ├── supabase.ts              # Supabase client
│   │   ├── meetingsApi.ts           # Meetings endpoints
│   │   ├── clientsApi.ts            # Clients endpoints
│   │   ├── projectsApi.ts           # Projects endpoints
│   │   └── aiApi.ts                 # AI endpoints
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useMeetings.ts           # React Query hook for meetings
│   │   ├── useClients.ts            # React Query hook for clients
│   │   ├── useProjects.ts           # React Query hook for projects
│   │   ├── useAutoSave.ts           # Auto-save hook (60s)
│   │   ├── useLocalStorage.ts       # LocalStorage hook
│   │   └── useToast.ts              # Toast notifications hook
│   │
│   ├── contexts/            # React Context
│   │   ├── AuthContext.tsx          # Authentication (Supabase Auth)
│   │   └── ThemeContext.tsx         # Theme toggle (optional)
│   │
│   ├── types/               # TypeScript interfaces
│   │   ├── Meeting.ts
│   │   ├── Client.ts
│   │   ├── Project.ts
│   │   ├── Version.ts
│   │   └── Translation.ts
│   │
│   ├── utils/               # Helper functions
│   │   ├── formatters.ts            # Date, currency formatting
│   │   ├── validators.ts            # Form validation
│   │   ├── htmlUtils.ts             # HTML sanitization
│   │   └── exportUtils.ts           # PDF/Word export
│   │
│   ├── styles/              # Global styles (if needed)
│   │   └── theme.ts                 # MUI theme configuration
│   │
│   ├── App.tsx              # Main app component
│   ├── App.css
│   ├── index.tsx            # Entry point
│   └── index.css
│
├── .env                     # Environment variables (DO NOT COMMIT!)
├── .env.example             # Template for .env
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## קבצים קריטיים שנדרשים בהקמה:

### ✅ כבר קיימים:
- `package.json`
- `tsconfig.json`
- `.env.example`
- `FRONTEND_STRUCTURE.md` (זה!)

### 🔴 נדרשים מיד (להריץ את האפליקציה):
1. `src/index.tsx` - Entry point
2. `src/App.tsx` - Main component
3. `src/services/api.ts` - Axios config
4. `src/services/supabase.ts` - Supabase client
5. `src/services/meetingsApi.ts` - Meetings API calls

### 🟡 נדרשים לפונקציונאליות מלאה:
6. `src/components/layout/Layout.tsx` - Main layout
7. `src/pages/MeetingsListPage.tsx` - Meetings list
8. `src/pages/MeetingEditorPage.tsx` - Create/Edit meeting
9. `src/components/meetings/RichTextEditor.tsx` - Quill editor
10. `src/hooks/useMeetings.ts` - React Query hook
11. `src/hooks/useAutoSave.ts` - Auto-save every 60s

### 🟢 נחמדים אבל לא קריטיים:
12. Version history dialog
13. Translation UI
14. PDF export
15. Theme toggle

---

## ניווט מהיר:

**צריך דוגמה לקובץ ספציפי?** תגיד לי איזה קובץ ואיצור אותו!

**Example:**
- "צור את src/index.tsx"
- "צור את src/components/meetings/RichTextEditor.tsx"
- "צור את src/hooks/useAutoSave.ts"

---

## הערות חשובות:

1. **React Query** משמש ל-state management (במקום Redux)
2. **Material-UI** לכל הUI components
3. **React Quill** לעורך טקסט עשיר
4. **React Hook Form** לטפסים
5. **Supabase Auth** לאימות (בעתיד)

---

## סדר בנייה מומלץ:

```
1. services/ - API calls ראשון
2. types/ - TypeScript interfaces
3. hooks/ - Custom hooks
4. components/common/ - Reusable components
5. components/layout/ - Layout structure
6. components/meetings/ - Meeting components
7. pages/ - Main pages
8. App.tsx + index.tsx - Wire everything together
```

---

**Ready to continue building? Let me know which files to create next!** 🚀
