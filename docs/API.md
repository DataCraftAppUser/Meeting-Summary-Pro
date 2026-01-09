# 🔌 API Documentation - Meeting Summary Pro

REST API reference for backend endpoints

---

## 🌐 Base URL

```
Development: http://localhost:5000/api
Production: https://your-backend.vercel.app/api
```

---

## 🔐 Authentication

**Note:** Authentication via Supabase JWT will be added in future versions.  
Currently, all endpoints are open for development.

```http
Authorization: Bearer {SUPABASE_JWT_TOKEN}
```

---

## 📝 Response Format

### Success Response:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response:
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400
  },
  "timestamp": "2025-01-08T12:00:00.000Z",
  "path": "/api/meetings"
}
```

---

## 📋 Meetings Endpoints

### GET /api/meetings

Get list of meetings with filters and pagination.

**Query Parameters:**
```
client_id       string   Filter by client ID
project_id      string   Filter by project ID
status          string   Filter by status (draft/processed/final)
search          string   Search in title and content
sort            string   Sort field (default: meeting_date)
order           string   Sort order: asc/desc (default: desc)
page            number   Page number (default: 1)
limit           number   Items per page (default: 50)
```

**Example Request:**
```bash
GET /api/meetings?search=budget&status=processed&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Budget Planning Meeting",
      "meeting_date": "2025-01-08",
      "status": "processed",
      "clients": { "id": "uuid", "name": "Acme Corp" },
      "projects": { "id": "uuid", "name": "Website Redesign" },
      "participants": ["John", "Jane"],
      "duration_minutes": 60,
      "created_at": "2025-01-08T10:00:00Z",
      "updated_at": "2025-01-08T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

### GET /api/meetings/:id

Get single meeting by ID with full details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Budget Planning Meeting",
    "meeting_date": "2025-01-08",
    "participants": ["John", "Jane"],
    "content": "Original raw content...",
    "processed_content": "<div>Formatted HTML...</div>",
    "status": "processed",
    "duration_minutes": 60,
    "clients": {
      "id": "uuid",
      "name": "Acme Corp",
      "email": "contact@acme.com"
    },
    "projects": {
      "id": "uuid",
      "name": "Website Redesign"
    },
    "versions": [
      { "id": "uuid", "version_number": 2, "created_at": "..." },
      { "id": "uuid", "version_number": 1, "created_at": "..." }
    ],
    "translations": [
      { "id": "uuid", "language": "en", "created_at": "..." }
    ]
  }
}
```

---

### POST /api/meetings

Create new meeting summary.

**Request Body:**
```json
{
  "client_id": "uuid",         // optional
  "project_id": "uuid",        // optional
  "title": "Meeting Title",    // required
  "meeting_date": "2025-01-08", // required (YYYY-MM-DD)
  "participants": ["John", "Jane"],
  "content": "Meeting notes...", // required (min 10 chars)
  "duration_minutes": 60,      // optional
  "meeting_location": "Office", // optional
  "created_by": "uuid"         // optional (user ID)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Meeting created successfully",
  "data": { /* created meeting */ }
}
```

---

### PUT /api/meetings/:id

Update existing meeting.

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "status": "final",
  "participants": ["John", "Jane", "Bob"]
}
```

---

### DELETE /api/meetings/:id

Delete meeting (cascades to versions, translations).

**Response:**
```json
{
  "success": true,
  "message": "Meeting deleted successfully"
}
```

---

### POST /api/meetings/:id/process

Process meeting with AI (Gemini 1.5 Flash).

**Rate Limit:** 10 requests/minute

**Request Body:** None (uses meeting content)

**Response:**
```json
{
  "success": true,
  "message": "Meeting processed successfully with AI",
  "data": {
    "id": "uuid",
    "processed_content": "<div>Beautifully formatted HTML...</div>",
    "status": "processed"
  }
}
```

---

### POST /api/meetings/:id/translate

Translate meeting to another language.

**Rate Limit:** 10 requests/minute

**Request Body:**
```json
{
  "language": "en"  // ISO 639-1 code
}
```

**Response:**
```json
{
  "success": true,
  "message": "Meeting translated to en successfully",
  "data": {
    "id": "uuid",
    "meeting_id": "uuid",
    "language": "en",
    "translated_processed_content": "<div>Translated content...</div>"
  }
}
```

---

### POST /api/meetings/:id/enrich

Enrich content with additional context/information.

**Rate Limit:** 10 requests/minute

**Response:**
```json
{
  "success": true,
  "message": "Content enriched successfully",
  "data": { /* updated meeting */ }
}
```

---

### GET /api/meetings/:id/versions

Get version history for a meeting.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "meeting_id": "uuid",
      "version_number": 3,
      "content": "Version 3 content...",
      "processed_content": "<div>...</div>",
      "created_at": "2025-01-08T12:00:00Z"
    },
    { /* version 2 */ },
    { /* version 1 */ }
  ]
}
```

---

## 👥 Clients Endpoints

### GET /api/clients

Get all clients.

**Query Parameters:**
```
search    string   Search by name
sort      string   Sort field (default: name)
order     string   asc/desc (default: asc)
```

---

### GET /api/clients/:id

Get single client with related projects and meetings.

---

### POST /api/clients

Create new client.

**Request Body:**
```json
{
  "name": "Acme Corp",      // required, unique
  "email": "contact@acme.com",
  "phone": "+1234567890",
  "company": "Acme Corporation",
  "notes": "Important client notes"
}
```

---

### PUT /api/clients/:id

Update client.

---

### DELETE /api/clients/:id

Delete client (cascades to projects, meetings).

---

## 📁 Projects Endpoints

### GET /api/projects

Get all projects.

**Query Parameters:**
```
client_id     string   Filter by client
status        string   active/completed/on_hold/cancelled
search        string   Search by name
```

---

### GET /api/projects/:id

Get single project with client and meetings.

---

### POST /api/projects

Create new project.

**Request Body:**
```json
{
  "client_id": "uuid",
  "name": "Website Redesign",  // required
  "description": "Full website redesign project",
  "status": "active",          // default: active
  "estimated_hours": 120.5,
  "budget_amount": 60000.00,
  "hourly_rate": 500.00,
  "start_date": "2025-01-01",
  "deadline": "2025-06-30"
}
```

---

### PUT /api/projects/:id

Update project.

---

### DELETE /api/projects/:id

Delete project.

---

## 🤖 AI Endpoints

### POST /api/ai/process

Process raw text with AI (standalone, not tied to meeting).

**Rate Limit:** 10 requests/minute

**Request Body:**
```json
{
  "content": "Raw meeting notes to process..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "processed": "<div>Formatted HTML...</div>"
  }
}
```

---

### POST /api/ai/translate

Translate text (standalone).

**Request Body:**
```json
{
  "content": "Text to translate",
  "language": "en"
}
```

---

### POST /api/ai/enrich

Enrich text with context (standalone).

---

### GET /api/ai/test

Test Gemini API connection.

**Response:**
```json
{
  "success": true,
  "message": "Gemini API is working"
}
```

---

## 🏥 System Endpoints

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-08T12:00:00.000Z",
  "uptime": 12345.67,
  "environment": "production",
  "version": "1.0.0"
}
```

---

## ⚠️ Error Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 201  | Created |
| 400  | Bad Request (validation error) |
| 404  | Not Found |
| 429  | Too Many Requests (rate limit) |
| 500  | Internal Server Error |

---

## 🔄 Rate Limiting

### Global Limit:
- **100 requests per minute** per IP

### AI Endpoints:
- **10 requests per minute** per IP
- Applies to: `/process`, `/translate`, `/enrich`

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704715200000
```

---

## 📊 Pagination

For list endpoints (meetings, clients, projects):

**Request:**
```
?page=2&limit=20
```

**Response:**
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## 🔍 Search & Filtering

### Search:
Uses partial match (ILIKE in PostgreSQL):
```
?search=budget
```
Searches in title, content, etc.

### Filters:
Exact match:
```
?client_id=uuid&status=processed
```

### Sorting:
```
?sort=created_at&order=desc
```

---

## 🧪 Testing Examples

### cURL:

```bash
# Get all meetings
curl http://localhost:5000/api/meetings

# Create meeting
curl -X POST http://localhost:5000/api/meetings \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Meeting",
    "meeting_date": "2025-01-08",
    "content": "This is a test meeting content."
  }'

# Process with AI
curl -X POST http://localhost:5000/api/meetings/{id}/process

# Get health
curl http://localhost:5000/health
```

### JavaScript (axios):

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Get meetings
const meetings = await api.get('/meetings', {
  params: { search: 'budget', page: 1 }
});

// Create meeting
const newMeeting = await api.post('/meetings', {
  title: 'New Meeting',
  meeting_date: '2025-01-08',
  content: 'Meeting notes...'
});

// Process with AI
const processed = await api.post(`/meetings/${id}/process`);
```

---

## 📖 Additional Resources

- **Supabase API:** Direct database access via Supabase client
- **Views:** Use `vw_meetings_summary` for optimized queries
- **RLS:** Row Level Security configured (future auth)

---

**API Version:** 1.0.0  
**Last Updated:** January 2025

---

**Built with ❤️ | Documented with 📝**
