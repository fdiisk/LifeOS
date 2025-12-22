# Life OS API Documentation

Backend API routes for Life OS application.

## Base URL

Development: `http://localhost:3000/api`
Production: `https://your-vercel-app.vercel.app/api`

## Authentication

Currently, no authentication is required. Row Level Security (RLS) will be added in future updates.

---

## Daily Logs API

Endpoints for managing daily logs, reflections, and habit/task tracking.

### 1. Get Daily Log by Date

Fetch a daily log summary with completion statistics.

**Endpoint:** `GET /api/daily-logs`

**Query Parameters:**
- `date` (required): Date in YYYY-MM-DD format

**Example Request:**
```bash
curl "http://localhost:3000/api/daily-logs?date=2025-12-22"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "date": "2025-12-22",
    "morning_reflection": "Feeling energized and ready for the day...",
    "evening_journal": "Great day, accomplished most of my goals...",
    "mood": "happy",
    "energy_level": 8,
    "tasks": [
      {
        "id": "c1111111-1111-1111-1111-111111111111",
        "title": "Complete project documentation",
        "status": "completed",
        "completed_at": "2025-12-22T14:30:00Z"
      }
    ],
    "habits": [
      {
        "id": "d1111111-1111-1111-1111-111111111111",
        "name": "Morning workout",
        "completed": true
      }
    ],
    "stats": {
      "task_completion_percentage": 75,
      "habit_completion_percentage": 100,
      "total_tasks": 4,
      "completed_tasks": 3,
      "total_habits": 3,
      "completed_habits": 3
    }
  }
}
```

**Error Response (400):**
```json
{
  "error": "Date parameter is required (format: YYYY-MM-DD)"
}
```

---

### 2. Create Daily Log

Create a new daily log entry.

**Endpoint:** `POST /api/daily-logs`

**Request Body:**
```json
{
  "log_date": "2025-12-22",
  "task_id": "c1111111-1111-1111-1111-111111111111",
  "habit_id": null,
  "notes": "Completed morning workout routine",
  "mood": "energetic",
  "energy_level": 9,
  "ai_parsed_data": {
    "sentiment": "positive",
    "keywords": ["workout", "energetic"]
  }
}
```

**Fields:**
- `log_date` (required): Date in YYYY-MM-DD format
- `task_id` (optional): UUID of the task
- `habit_id` (optional): UUID of the habit
- `notes` (optional): Free-form text notes
- `mood` (optional): Mood descriptor (e.g., "happy", "tired", "stressed")
- `energy_level` (optional): Integer 1-10
- `ai_parsed_data` (optional): JSON object with AI parsing results

**Note:** At least one of `task_id`, `habit_id`, or `notes` must be provided.

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "e1111111-1111-1111-1111-111111111111",
    "log_date": "2025-12-22",
    "task_id": "c1111111-1111-1111-1111-111111111111",
    "habit_id": null,
    "notes": "Completed morning workout routine",
    "mood": "energetic",
    "energy_level": 9,
    "ai_parsed_data": {
      "sentiment": "positive",
      "keywords": ["workout", "energetic"]
    },
    "created_at": "2025-12-22T08:00:00Z",
    "updated_at": "2025-12-22T08:00:00Z"
  }
}
```

---

### 3. Update Morning Reflection

Add or update morning reflection for a specific date.

**Endpoint:** `PATCH /api/daily-logs/morning`

**Query Parameters:**
- `date` (required): Date in YYYY-MM-DD format

**Request Body:**
```json
{
  "reflection": "Today I want to focus on completing my project and exercising. Feeling motivated!",
  "mood": "motivated",
  "energy_level": 8
}
```

**Fields:**
- `reflection` (required): Morning reflection text
- `mood` (optional): Current mood
- `energy_level` (optional): Energy level 1-10

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "e2222222-2222-2222-2222-222222222222",
    "log_date": "2025-12-22",
    "notes": "[MORNING] Today I want to focus on completing my project and exercising. Feeling motivated!",
    "mood": "motivated",
    "energy_level": 8,
    "created_at": "2025-12-22T07:00:00Z",
    "updated_at": "2025-12-22T07:00:00Z"
  }
}
```

---

### 4. Update Evening Journal

Add or update evening journal for a specific date.

**Endpoint:** `PATCH /api/daily-logs/evening`

**Query Parameters:**
- `date` (required): Date in YYYY-MM-DD format

**Request Body:**
```json
{
  "journal": "Accomplished most of my goals today. Completed the project documentation and worked out. Feeling satisfied with the progress.",
  "mood": "satisfied",
  "energy_level": 6
}
```

**Fields:**
- `journal` (required): Evening journal text
- `mood` (optional): Current mood
- `energy_level` (optional): Energy level 1-10

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "e3333333-3333-3333-3333-333333333333",
    "log_date": "2025-12-22",
    "notes": "[EVENING] Accomplished most of my goals today. Completed the project documentation and worked out. Feeling satisfied with the progress.",
    "mood": "satisfied",
    "energy_level": 6,
    "created_at": "2025-12-22T21:00:00Z",
    "updated_at": "2025-12-22T21:00:00Z"
  }
}
```

---

### 5. Attach Completed Tasks

Attach completed tasks to a daily log.

**Endpoint:** `POST /api/daily-logs/tasks`

**Query Parameters:**
- `date` (required): Date in YYYY-MM-DD format

**Request Body:**
```json
{
  "task_ids": [
    "c1111111-1111-1111-1111-111111111111",
    "c2222222-2222-2222-2222-222222222222",
    "c3333333-3333-3333-3333-333333333333"
  ],
  "notes": "Completed all planned tasks for today"
}
```

**Fields:**
- `task_ids` (required): Array of task UUIDs
- `notes` (optional): Notes about task completion

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "logs_created": 3,
    "tasks_completed": 2,
    "logs": [
      {
        "id": "e4444444-4444-4444-4444-444444444444",
        "log_date": "2025-12-22",
        "task_id": "c1111111-1111-1111-1111-111111111111",
        "notes": "Completed all planned tasks for today",
        "created_at": "2025-12-22T18:00:00Z"
      }
    ]
  }
}
```

**Notes:**
- Creates a daily log entry for each task
- Automatically marks tasks as "completed" if not already
- Returns count of logs created and tasks completed

---

### 6. Attach Completed Habits

Attach completed habits to a daily log.

**Endpoint:** `POST /api/daily-logs/habits`

**Query Parameters:**
- `date` (required): Date in YYYY-MM-DD format

**Request Body:**
```json
{
  "habit_ids": [
    "d1111111-1111-1111-1111-111111111111",
    "d2222222-2222-2222-2222-222222222222"
  ],
  "notes": "Completed morning workout and reading"
}
```

**Fields:**
- `habit_ids` (required): Array of habit UUIDs
- `notes` (optional): Notes about habit completion

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "logs_created": 2,
    "already_logged": 0,
    "logs": [
      {
        "id": "e5555555-5555-5555-5555-555555555555",
        "log_date": "2025-12-22",
        "habit_id": "d1111111-1111-1111-1111-111111111111",
        "notes": "Completed morning workout and reading",
        "created_at": "2025-12-22T09:00:00Z"
      }
    ]
  }
}
```

**Notes:**
- Creates a daily log entry for each habit
- Prevents duplicate logging of habits for the same date
- Only allows logging active habits
- Returns count of logs created and already logged habits

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "Human-readable error message",
  "details": "Technical error details (if available)"
}
```

**Common HTTP Status Codes:**
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `500 Internal Server Error`: Server-side error

---

## Statistics Calculation

### Task Completion Percentage

```
task_completion_percentage = (completed_tasks / total_tasks) * 100
```

- `total_tasks`: All active tasks with due_date <= specified date
- `completed_tasks`: Tasks with status = 'completed'
- Excludes cancelled tasks

### Habit Completion Percentage

```
habit_completion_percentage = (completed_habits / total_habits) * 100
```

- `total_habits`: All active daily habits
- `completed_habits`: Habits logged for the specified date
- Only counts daily frequency habits

---

## Usage Examples

### Morning Routine

1. Add morning reflection:
```bash
curl -X PATCH "http://localhost:3000/api/daily-logs/morning?date=2025-12-22" \
  -H "Content-Type: application/json" \
  -d '{"reflection": "Ready to tackle the day!", "mood": "energized", "energy_level": 9}'
```

2. Log morning habits:
```bash
curl -X POST "http://localhost:3000/api/daily-logs/habits?date=2025-12-22" \
  -H "Content-Type: application/json" \
  -d '{"habit_ids": ["workout-id", "meditation-id"]}'
```

### Evening Routine

1. Mark tasks as completed:
```bash
curl -X POST "http://localhost:3000/api/daily-logs/tasks?date=2025-12-22" \
  -H "Content-Type: application/json" \
  -d '{"task_ids": ["task-1-id", "task-2-id"]}'
```

2. Add evening journal:
```bash
curl -X PATCH "http://localhost:3000/api/daily-logs/evening?date=2025-12-22" \
  -H "Content-Type: application/json" \
  -d '{"journal": "Great day, accomplished all goals!", "mood": "satisfied", "energy_level": 7}'
```

3. Fetch daily summary:
```bash
curl "http://localhost:3000/api/daily-logs?date=2025-12-22"
```

---

## Future Enhancements

- [ ] User authentication and authorization
- [ ] Row Level Security (RLS) policies
- [ ] Pagination for large datasets
- [ ] Filtering and sorting options
- [ ] Bulk operations
- [ ] Webhook notifications
- [ ] Analytics endpoints
