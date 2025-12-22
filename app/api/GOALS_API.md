# Goals and Tasks API Documentation

Comprehensive CRUD API for managing macro goals, micro goals, and tasks with automatic progress tracking.

## Table of Contents

- [Macro Goals API](#macro-goals-api)
- [Micro Goals API](#micro-goals-api)
- [Tasks API](#tasks-api)
- [Progress Calculation](#progress-calculation)
- [Life Areas](#life-areas)

---

## Macro Goals API

6-month top-level goals with progress rollups from micro goals and tasks.

### 1. Get All Macro Goals

**Endpoint:** `GET /api/macro-goals`

**Query Parameters:**
- `group_by_area` (optional): If `true`, groups goals by life area

**Example Request:**
```bash
curl "http://localhost:3000/api/macro-goals"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "a1111111-1111-1111-1111-111111111111",
      "title": "Get Healthy & Fit",
      "description": "Achieve optimal health through exercise and nutrition",
      "status": "active",
      "target_date": "2026-12-31",
      "progress": 45,
      "micro_goals": [
        {
          "id": "b1111111-1111-1111-1111-111111111111",
          "title": "Lose 20 pounds",
          "progress": 60,
          "task_count": 5
        }
      ],
      "micro_goal_count": 2,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

### 2. Get Single Macro Goal

**Endpoint:** `GET /api/macro-goals?id=<uuid>`

**Example Request:**
```bash
curl "http://localhost:3000/api/macro-goals?id=a1111111-1111-1111-1111-111111111111"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "a1111111-1111-1111-1111-111111111111",
    "title": "Get Healthy & Fit",
    "description": "Achieve optimal health",
    "status": "active",
    "target_date": "2026-12-31",
    "progress": 45,
    "micro_goals": [...],
    "micro_goal_count": 2,
    "ai_parsed_data": {
      "life_area": "health"
    }
  }
}
```

### 3. Get Goals Grouped by Life Area

**Endpoint:** `GET /api/macro-goals?group_by_area=true`

**Example Request:**
```bash
curl "http://localhost:3000/api/macro-goals?group_by_area=true"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "health": [
      {
        "id": "a1111111-1111-1111-1111-111111111111",
        "title": "Get Healthy & Fit",
        "progress": 45,
        "micro_goal_count": 2
      }
    ],
    "professional": [
      {
        "id": "a2222222-2222-2222-2222-222222222222",
        "title": "Build Successful Career",
        "progress": 30,
        "micro_goal_count": 3
      }
    ],
    "financial": [...]
  }
}
```

### 4. Create Macro Goal

**Endpoint:** `POST /api/macro-goals`

**Request Body:**
```json
{
  "title": "Get Healthy & Fit",
  "description": "Achieve optimal health through exercise and nutrition",
  "status": "active",
  "target_date": "2026-12-31",
  "life_area": "health",
  "ai_parsed_data": {
    "keywords": ["health", "fitness", "wellness"]
  }
}
```

**Fields:**
- `title` (required): Goal title
- `description` (optional): Detailed description
- `status` (optional): `active` | `completed` | `archived` | `abandoned` (default: `active`)
- `target_date` (optional): Target completion date (YYYY-MM-DD)
- `life_area` (optional): Category (health, professional, financial, etc.)
- `ai_parsed_data` (optional): Additional metadata

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "a1111111-1111-1111-1111-111111111111",
    "title": "Get Healthy & Fit",
    "progress": 0,
    "micro_goals": [],
    "micro_goal_count": 0,
    ...
  }
}
```

### 5. Update Macro Goal

**Endpoint:** `PATCH /api/macro-goals?id=<uuid>`

**Request Body:**
```json
{
  "title": "Get Super Healthy & Fit",
  "status": "active",
  "life_area": "health"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "a1111111-1111-1111-1111-111111111111",
    "title": "Get Super Healthy & Fit",
    "progress": 45,
    ...
  }
}
```

### 6. Delete Macro Goal

**Endpoint:** `DELETE /api/macro-goals?id=<uuid>`

**Note:** Cascades to micro goals (which set tasks' micro_goal_id to null)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Macro goal deleted successfully"
}
```

---

## Micro Goals API

Sub-goals that contribute to macro goals with progress calculated from tasks.

### 1. Get All Micro Goals

**Endpoint:** `GET /api/micro-goals`

**Query Parameters:**
- `macro_goal_id` (optional): Filter by parent macro goal

**Example Request:**
```bash
curl "http://localhost:3000/api/micro-goals?macro_goal_id=a1111111-1111-1111-1111-111111111111"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "b1111111-1111-1111-1111-111111111111",
      "macro_goal_id": "a1111111-1111-1111-1111-111111111111",
      "title": "Lose 20 pounds",
      "description": "Reach target weight of 180 lbs",
      "status": "active",
      "target_date": "2026-06-30",
      "progress": 60,
      "tasks": [...],
      "task_count": 5,
      "completed_task_count": 3,
      "macro_goals": {
        "id": "a1111111-1111-1111-1111-111111111111",
        "title": "Get Healthy & Fit",
        "status": "active"
      }
    }
  ],
  "count": 1
}
```

### 2. Get Single Micro Goal

**Endpoint:** `GET /api/micro-goals?id=<uuid>`

**Example Request:**
```bash
curl "http://localhost:3000/api/micro-goals?id=b1111111-1111-1111-1111-111111111111"
```

### 3. Create Micro Goal

**Endpoint:** `POST /api/micro-goals`

**Request Body:**
```json
{
  "macro_goal_id": "a1111111-1111-1111-1111-111111111111",
  "title": "Lose 20 pounds",
  "description": "Reach target weight of 180 lbs",
  "status": "active",
  "target_date": "2026-06-30"
}
```

**Fields:**
- `macro_goal_id` (optional): Parent macro goal UUID
- `title` (required): Goal title
- `description` (optional): Detailed description
- `status` (optional): `active` | `completed` | `archived` | `abandoned` (default: `active`)
- `target_date` (optional): Target completion date (YYYY-MM-DD)
- `ai_parsed_data` (optional): Additional metadata

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "b1111111-1111-1111-1111-111111111111",
    "title": "Lose 20 pounds",
    "progress": 0,
    "tasks": [],
    "task_count": 0,
    ...
  }
}
```

### 4. Update Micro Goal

**Endpoint:** `PATCH /api/micro-goals?id=<uuid>`

**Request Body:**
```json
{
  "title": "Lose 25 pounds",
  "status": "in_progress"
}
```

### 5. Delete Micro Goal

**Endpoint:** `DELETE /api/micro-goals?id=<uuid>`

**Note:** Sets tasks' micro_goal_id to null (doesn't delete tasks)

---

## Tasks API

Daily actionable items that contribute to micro goal progress.

### 1. Get All Tasks

**Endpoint:** `GET /api/tasks`

**Query Parameters:**
- `status` (optional): Filter by status (`pending` | `in_progress` | `completed` | `cancelled`)
- `priority` (optional): Filter by priority (`low` | `medium` | `high` | `urgent`)
- `micro_goal_id` (optional): Filter by parent micro goal
- `include_stats` (optional): If `true`, includes task statistics

**Example Request:**
```bash
curl "http://localhost:3000/api/tasks?status=pending&include_stats=true"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "c1111111-1111-1111-1111-111111111111",
      "micro_goal_id": "b1111111-1111-1111-1111-111111111111",
      "title": "Track calories daily",
      "description": "Use app to log meals",
      "status": "in_progress",
      "priority": "high",
      "due_date": "2025-12-31",
      "completed_at": null,
      "micro_goals": {
        "id": "b1111111-1111-1111-1111-111111111111",
        "title": "Lose 20 pounds",
        "macro_goals": {
          "id": "a1111111-1111-1111-1111-111111111111",
          "title": "Get Healthy & Fit"
        }
      },
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "count": 1,
  "stats": {
    "total": 10,
    "by_status": {
      "pending": 3,
      "in_progress": 2,
      "completed": 4,
      "cancelled": 1
    },
    "by_priority": {
      "low": 2,
      "medium": 4,
      "high": 3,
      "urgent": 1
    }
  }
}
```

### 2. Get Single Task

**Endpoint:** `GET /api/tasks?id=<uuid>`

**Example Request:**
```bash
curl "http://localhost:3000/api/tasks?id=c1111111-1111-1111-1111-111111111111"
```

### 3. Create Task

**Endpoint:** `POST /api/tasks`

**Request Body:**
```json
{
  "micro_goal_id": "b1111111-1111-1111-1111-111111111111",
  "title": "Track calories daily",
  "description": "Use app to log all meals",
  "status": "pending",
  "priority": "high",
  "due_date": "2025-12-31"
}
```

**Fields:**
- `micro_goal_id` (optional): Parent micro goal UUID
- `title` (required): Task title
- `description` (optional): Detailed description
- `status` (optional): `pending` | `in_progress` | `completed` | `cancelled` (default: `pending`)
- `priority` (optional): `low` | `medium` | `high` | `urgent` (default: `medium`)
- `due_date` (optional): Due date (YYYY-MM-DD)
- `ai_parsed_data` (optional): Additional metadata

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "c1111111-1111-1111-1111-111111111111",
    "title": "Track calories daily",
    "status": "pending",
    ...
  }
}
```

### 4. Update Task

**Endpoint:** `PATCH /api/tasks?id=<uuid>`

**Request Body:**
```json
{
  "status": "completed",
  "priority": "high"
}
```

**Note:** When status is set to `completed`, `completed_at` is automatically set to current timestamp.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "c1111111-1111-1111-1111-111111111111",
    "status": "completed",
    "completed_at": "2025-12-22T15:30:00Z",
    ...
  }
}
```

### 5. Delete Task

**Endpoint:** `DELETE /api/tasks?id=<uuid>`

---

## Progress Calculation

Progress is calculated hierarchically and normalized to 0-100.

### Task Progress

```
progress = status === 'completed' ? 100 : 0
```

### Micro Goal Progress

```
progress = (completed_tasks / total_tasks) × 100
```

- Excludes cancelled tasks
- Returns 0 if no tasks exist

### Macro Goal Progress

```
progress = average(all_micro_goal_progress)
```

- Calculates progress for each micro goal
- Averages all micro goal progress values
- Excludes abandoned micro goals
- Returns 0 if no micro goals exist

### Example Calculation

Given:
- Macro Goal: "Get Healthy & Fit"
  - Micro Goal 1: "Lose 20 pounds" (3 of 5 tasks completed = 60%)
  - Micro Goal 2: "Run a marathon" (1 of 2 tasks completed = 50%)

Macro Goal Progress:
```
(60 + 50) / 2 = 55%
```

---

## Life Areas

Goals can be categorized into life areas for better organization.

### Supported Life Areas

- `health`: Physical health, fitness, nutrition
- `professional`: Career, skills, work
- `financial`: Money, investments, savings
- `personal`: Relationships, hobbies, self-improvement
- `general`: Uncategorized goals

### Setting Life Area

Life area is stored in `ai_parsed_data.life_area`:

```json
{
  "title": "Get Healthy & Fit",
  "life_area": "health"
}
```

Or directly in ai_parsed_data:

```json
{
  "title": "Get Healthy & Fit",
  "ai_parsed_data": {
    "life_area": "health",
    "other_metadata": "..."
  }
}
```

### Querying by Life Area

```bash
curl "http://localhost:3000/api/macro-goals?group_by_area=true"
```

Returns goals grouped by life area:

```json
{
  "health": [
    {"id": "...", "title": "Get Healthy & Fit", "progress": 55}
  ],
  "professional": [
    {"id": "...", "title": "Build Career", "progress": 30}
  ]
}
```

---

## Usage Examples

### Creating a Complete Goal Hierarchy

```bash
# 1. Create macro goal
MACRO_ID=$(curl -X POST "http://localhost:3000/api/macro-goals" \
  -H "Content-Type: application/json" \
  -d '{"title": "Get Healthy", "life_area": "health"}' \
  | jq -r '.data.id')

# 2. Create micro goal
MICRO_ID=$(curl -X POST "http://localhost:3000/api/micro-goals" \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"Lose 20 lbs\", \"macro_goal_id\": \"$MACRO_ID\"}" \
  | jq -r '.data.id')

# 3. Create tasks
curl -X POST "http://localhost:3000/api/tasks" \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"Track calories\", \"micro_goal_id\": \"$MICRO_ID\", \"priority\": \"high\"}"

curl -X POST "http://localhost:3000/api/tasks" \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"Workout 3x/week\", \"micro_goal_id\": \"$MICRO_ID\", \"priority\": \"high\"}"
```

### Completing a Task and Viewing Progress

```bash
# Complete a task
curl -X PATCH "http://localhost:3000/api/tasks?id=$TASK_ID" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'

# View updated micro goal progress
curl "http://localhost:3000/api/micro-goals?id=$MICRO_ID"

# View updated macro goal progress
curl "http://localhost:3000/api/macro-goals?id=$MACRO_ID"
```

### Dashboard Overview

```bash
# Get all goals grouped by life area with progress
curl "http://localhost:3000/api/macro-goals?group_by_area=true"

# Get pending tasks with stats
curl "http://localhost:3000/api/tasks?status=pending&include_stats=true"
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Human-readable error message",
  "details": "Technical details (if available)"
}
```

**Common HTTP Status Codes:**
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error
