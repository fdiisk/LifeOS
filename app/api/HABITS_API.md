# Habits and Streak Tracking API Documentation

Comprehensive habit tracking system with streak calculation, consistency scoring, and habit stacking support.

## Table of Contents

- [Habits CRUD API](#habits-crud-api)
- [Habit Completion API](#habit-completion-api)
- [Habit Statistics API](#habit-statistics-api)
- [Habit Calendar API](#habit-calendar-api)
- [Streak Calculation](#streak-calculation)
- [Consistency Scoring](#consistency-scoring)
- [Habit Stacking](#habit-stacking)

---

## Habits CRUD API

Manage habits with support for different frequencies and habit stacking.

### 1. Get All Habits

**Endpoint:** `GET /api/habits`

**Query Parameters:**
- `is_active` (optional): Filter by active status (`true` | `false`)
- `frequency` (optional): Filter by frequency (`daily` | `weekly` | `monthly`)
- `include_stats` (optional): Include streak and consistency stats (`true` | `false`)

**Example Request:**
```bash
curl "http://localhost:3000/api/habits?is_active=true&include_stats=true"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "d1111111-1111-1111-1111-111111111111",
      "name": "Morning Workout",
      "description": "Exercise for at least 30 minutes",
      "frequency": "daily",
      "target_count": 1,
      "is_active": true,
      "ai_parsed_data": {
        "time_block": "morning",
        "stack_with_habit_id": "d2222222-2222-2222-2222-222222222222",
        "stack_with_habit_name": "Meditation"
      },
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z",
      "stats": {
        "current_streak": 14,
        "longest_streak": 21,
        "consistency_score": 85,
        "total_completions": 45,
        "completions_last_7_days": 7,
        "completions_last_30_days": 28,
        "completion_rate_7_days": 100,
        "completion_rate_30_days": 93
      }
    }
  ],
  "count": 1
}
```

### 2. Get Single Habit

**Endpoint:** `GET /api/habits?id=<uuid>`

**Example Request:**
```bash
curl "http://localhost:3000/api/habits?id=d1111111-1111-1111-1111-111111111111"
```

### 3. Create Habit

**Endpoint:** `POST /api/habits`

**Request Body:**
```json
{
  "name": "Morning Workout",
  "description": "Exercise for at least 30 minutes",
  "frequency": "daily",
  "target_count": 1,
  "is_active": true,
  "time_block": "morning",
  "stack_with_habit_id": "d2222222-2222-2222-2222-222222222222"
}
```

**Fields:**
- `name` (required): Habit name
- `description` (optional): Detailed description
- `frequency` (optional): `daily` | `weekly` | `monthly` (default: `daily`)
- `target_count` (optional): Number of times to complete (default: 1)
- `is_active` (optional): Whether habit is active (default: `true`)
- `time_block` (optional): Time of day (morning, afternoon, evening, night)
- `stack_with_habit_id` (optional): UUID of habit to stack with
- `ai_parsed_data` (optional): Additional metadata

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "d1111111-1111-1111-1111-111111111111",
    "name": "Morning Workout",
    "frequency": "daily",
    "target_count": 1,
    "is_active": true,
    "ai_parsed_data": {
      "time_block": "morning",
      "stack_with_habit_id": "d2222222-2222-2222-2222-222222222222",
      "stack_with_habit_name": "Meditation"
    },
    ...
  }
}
```

### 4. Update Habit

**Endpoint:** `PATCH /api/habits?id=<uuid>`

**Request Body:**
```json
{
  "name": "Morning Workout & Cardio",
  "is_active": true,
  "time_block": "early_morning"
}
```

### 5. Delete Habit

**Endpoint:** `DELETE /api/habits?id=<uuid>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Habit deleted successfully"
}
```

---

## Habit Completion API

Mark habits as completed or undo completions.

### 1. Complete Habit

**Endpoint:** `POST /api/habits/complete?habit_id=<uuid>&date=YYYY-MM-DD`

**Query Parameters:**
- `habit_id` (required): Habit UUID
- `date` (required): Date to mark complete (YYYY-MM-DD)

**Request Body (optional):**
```json
{
  "notes": "Great 45-minute run this morning",
  "mood": "energized",
  "energy_level": 9
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/habits/complete?habit_id=d1111111-1111-1111-1111-111111111111&date=2025-12-22" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Great workout!", "mood": "energized", "energy_level": 9}'
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Habit completed successfully",
  "data": {
    "daily_log": {
      "id": "e1111111-1111-1111-1111-111111111111",
      "log_date": "2025-12-22",
      "habit_id": "d1111111-1111-1111-1111-111111111111",
      "notes": "Great workout!",
      "mood": "energized",
      "energy_level": 9
    },
    "habit": {
      "id": "d1111111-1111-1111-1111-111111111111",
      "name": "Morning Workout"
    },
    "stats": {
      "current_streak": 15,
      "longest_streak": 21,
      "consistency_score": 86,
      "total_completions": 46,
      "completions_last_7_days": 7,
      "completions_last_30_days": 29,
      "completion_rate_7_days": 100,
      "completion_rate_30_days": 97
    }
  }
}
```

**Already Completed Response (200):**
```json
{
  "success": true,
  "message": "Habit already completed on this date",
  "already_completed": true
}
```

### 2. Undo Habit Completion

**Endpoint:** `DELETE /api/habits/complete?habit_id=<uuid>&date=YYYY-MM-DD`

**Example Request:**
```bash
curl -X DELETE "http://localhost:3000/api/habits/complete?habit_id=d1111111-1111-1111-1111-111111111111&date=2025-12-22"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Habit completion removed",
  "data": {
    "stats": {
      "current_streak": 14,
      "longest_streak": 21,
      "consistency_score": 85,
      ...
    }
  }
}
```

---

## Habit Statistics API

Get comprehensive statistics including streaks and consistency scores.

### Get Habit Statistics

**Endpoint:** `GET /api/habits/stats?habit_id=<uuid>`

**Query Parameters:**
- `habit_id` (optional): Get stats for specific habit
- `is_active` (optional): Filter by active status (if getting all habits)
- `frequency` (optional): Filter by frequency (if getting all habits)

**Example Request (Single Habit):**
```bash
curl "http://localhost:3000/api/habits/stats?habit_id=d1111111-1111-1111-1111-111111111111"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "current_streak": 14,
    "longest_streak": 21,
    "consistency_score": 85,
    "total_completions": 45,
    "completions_last_7_days": 7,
    "completions_last_30_days": 28,
    "completion_rate_7_days": 100,
    "completion_rate_30_days": 93
  }
}
```

**Example Request (All Habits):**
```bash
curl "http://localhost:3000/api/habits/stats?is_active=true"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "d1111111-1111-1111-1111-111111111111",
      "name": "Morning Workout",
      "frequency": "daily",
      "stats": {
        "current_streak": 14,
        "longest_streak": 21,
        "consistency_score": 85,
        ...
      }
    }
  ],
  "count": 1
}
```

---

## Habit Calendar API

View habit completions over a date range.

### Get Habit Calendar

**Endpoint:** `GET /api/habits/calendar?habit_id=<uuid>&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

**Query Parameters:**
- `habit_id` (required): Habit UUID
- `start_date` (required): Start date (YYYY-MM-DD)
- `end_date` (required): End date (YYYY-MM-DD)

**Example Request:**
```bash
curl "http://localhost:3000/api/habits/calendar?habit_id=d1111111-1111-1111-1111-111111111111&start_date=2025-12-01&end_date=2025-12-31"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "habit_id": "d1111111-1111-1111-1111-111111111111",
    "start_date": "2025-12-01",
    "end_date": "2025-12-31",
    "total_days": 31,
    "completed_days": 28,
    "completion_rate": 90,
    "calendar": [
      {
        "date": "2025-12-01",
        "completed": true,
        "notes": "Great workout!",
        "mood": "energized",
        "energy_level": 9
      },
      {
        "date": "2025-12-02",
        "completed": true,
        "notes": null,
        "mood": null,
        "energy_level": null
      },
      {
        "date": "2025-12-03",
        "completed": false,
        "notes": null,
        "mood": null,
        "energy_level": null
      }
    ]
  }
}
```

---

## Streak Calculation

Streaks measure consecutive days of habit completion.

### Current Streak

**Algorithm:**
```
1. Start from today
2. If today or yesterday is NOT completed, streak = 0
3. Count backwards while consecutive days are completed
4. Return count
```

**Example:**
```
Today: Dec 22 ✓
Dec 21: ✓
Dec 20: ✓
Dec 19: ✗
Dec 18: ✓

Current Streak = 3 days
```

**Grace Period:**
- 1 day grace period: If you missed today but completed yesterday, streak continues
- This accounts for checking habits the next morning

### Longest Streak

**Algorithm:**
```
1. Get all completions ordered by date
2. For each completion:
   - If gap from previous = 1 day, increment current streak
   - If gap > 1 day, reset current streak to 1
   - Track maximum streak seen
3. Return maximum
```

**Example:**
```
Jan 1-7: ✓✓✓✓✓✓✓ (7 days)
Jan 8-9: ✗✗
Jan 10-15: ✓✓✓✓✓✓ (6 days)
Jan 16: ✗
Jan 17-25: ✓✓✓✓✓✓✓✓✓ (9 days)

Longest Streak = 9 days
```

---

## Consistency Scoring

Consistency score (0-100) rewards regular completion and penalizes sporadic bursts.

### Calculation Formula

```
consistency_score = (completion_rate × 0.7 + consistency_factor × 0.3) × 100
```

**Where:**
- `completion_rate` = completions / total_days (over 30 days)
- `consistency_factor` = 1 - (std_dev_of_gaps / 7)
- `std_dev_of_gaps` = standard deviation of days between completions

### Why This Works

**Scenario 1: Perfect Consistency**
```
Days: ✓✓✓✓✓✓✓ (every day)
Gaps between completions: [1, 1, 1, 1, 1, 1]
Standard Deviation: 0
Consistency Factor: 1.0
Completion Rate: 1.0
Score: (1.0 × 0.7 + 1.0 × 0.3) × 100 = 100
```

**Scenario 2: Sporadic Bursts**
```
Days: ✓✓✓✗✗✗✗✗✗✓✓✓✗✗✗✗✗✗ (bursts)
Gaps: [1, 1, 6, 1, 1, 6]
Standard Deviation: ~2.8
Consistency Factor: 0.6
Completion Rate: 0.33
Score: (0.33 × 0.7 + 0.6 × 0.3) × 100 = 41
```

**Scenario 3: Good Consistency with Occasional Misses**
```
Days: ✓✓✓✓✗✓✓✓✓✓✗✓✓✓ (mostly daily)
Gaps: [1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1]
Standard Deviation: ~0.4
Consistency Factor: 0.94
Completion Rate: 0.86
Score: (0.86 × 0.7 + 0.94 × 0.3) × 100 = 88
```

### Scoring Breakdown

| Score | Interpretation |
|-------|---------------|
| 90-100 | Excellent - Near perfect consistency |
| 75-89 | Good - Consistent with occasional misses |
| 60-74 | Fair - Some consistency issues |
| 40-59 | Poor - Sporadic completion |
| 0-39 | Very Poor - Rarely or irregularly completed |

### Why It Penalizes Bursts

The standard deviation of gaps captures the **variability** in completion patterns:
- **Low variance** (consistent gaps of ~1 day) = regular habit
- **High variance** (gaps of 1, 1, 1, 7, 1, 1, 7) = sporadic bursts

By penalizing high variance, the score rewards **steady, regular completion** over **infrequent bursts of activity**.

---

## Habit Stacking

Link habits together to build habit chains and leverage existing routines.

### What is Habit Stacking?

Habit stacking means performing a new habit immediately after an existing habit, using the existing habit as a trigger.

**Example:**
```
After I [EXISTING HABIT], I will [NEW HABIT]
After I pour my morning coffee, I will meditate for 5 minutes
After I meditate, I will journal for 10 minutes
```

### Setting Up Habit Stacks

**Create a stacked habit:**
```bash
curl -X POST "http://localhost:3000/api/habits" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Meditation",
    "time_block": "morning",
    "stack_with_habit_id": "coffee-habit-id"
  }'
```

**Response includes stack info:**
```json
{
  "id": "meditation-habit-id",
  "name": "Meditation",
  "ai_parsed_data": {
    "time_block": "morning",
    "stack_with_habit_id": "coffee-habit-id",
    "stack_with_habit_name": "Pour morning coffee"
  }
}
```

### Time Blocks

Organize habits by time of day:
- `morning` - 6am-12pm
- `afternoon` - 12pm-5pm
- `evening` - 5pm-9pm
- `night` - 9pm-12am

**Create habits in a time block:**
```json
{
  "name": "Evening reading",
  "time_block": "evening"
}
```

### Building Habit Chains

**Example morning routine chain:**
```
1. Wake up (trigger)
2. Pour coffee → stack_with_habit_id: null
3. Meditate (5 min) → stack_with_habit_id: "coffee-id"
4. Journal (10 min) → stack_with_habit_id: "meditate-id"
5. Workout (30 min) → stack_with_habit_id: "journal-id"
```

All habits have `time_block: "morning"` for grouping.

---

## Usage Examples

### Creating a Habit Tracking Routine

```bash
# 1. Create morning workout habit
WORKOUT_ID=$(curl -X POST "http://localhost:3000/api/habits" \
  -H "Content-Type: application/json" \
  -d '{"name": "Morning Workout", "frequency": "daily", "time_block": "morning"}' \
  | jq -r '.data.id')

# 2. Complete the habit for today
curl -X POST "http://localhost:3000/api/habits/complete?habit_id=$WORKOUT_ID&date=$(date +%Y-%m-%d)" \
  -H "Content-Type: application/json" \
  -d '{"notes": "30 min run", "mood": "energized", "energy_level": 9}'

# 3. View statistics
curl "http://localhost:3000/api/habits/stats?habit_id=$WORKOUT_ID"

# 4. View calendar for this month
MONTH_START=$(date +%Y-%m-01)
MONTH_END=$(date +%Y-%m-31)
curl "http://localhost:3000/api/habits/calendar?habit_id=$WORKOUT_ID&start_date=$MONTH_START&end_date=$MONTH_END"
```

### Building a Habit Stack

```bash
# 1. Create anchor habit
COFFEE_ID=$(curl -X POST "http://localhost:3000/api/habits" \
  -d '{"name": "Pour morning coffee", "time_block": "morning"}' | jq -r '.data.id')

# 2. Stack meditation after coffee
MEDITATE_ID=$(curl -X POST "http://localhost:3000/api/habits" \
  -d "{\"name\": \"Meditate 5 min\", \"time_block\": \"morning\", \"stack_with_habit_id\": \"$COFFEE_ID\"}" \
  | jq -r '.data.id')

# 3. Stack journaling after meditation
JOURNAL_ID=$(curl -X POST "http://localhost:3000/api/habits" \
  -d "{\"name\": \"Journal 10 min\", \"time_block\": \"morning\", \"stack_with_habit_id\": \"$MEDITATE_ID\"}" \
  | jq -r '.data.id')

# 4. View all morning habits with stats
curl "http://localhost:3000/api/habits?include_stats=true" | jq '.data[] | select(.ai_parsed_data.time_block == "morning")'
```

### Dashboard View

```bash
# Get all active habits with stats
curl "http://localhost:3000/api/habits?is_active=true&include_stats=true"
```

Returns habits sorted by consistency score, showing:
- Current streaks
- Consistency scores
- Completion rates
- Habit stacks

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

---

## Best Practices

### 1. Start Small
Begin with 1-3 daily habits. Add more as consistency improves.

### 2. Use Habit Stacking
Leverage existing routines by stacking new habits after established ones.

### 3. Track Consistently
Complete habits daily to build streaks and maintain high consistency scores.

### 4. Review Weekly
Check stats weekly to identify patterns and adjust as needed.

### 5. Grace Period
The 1-day grace period allows flexibility—if you check in the morning for yesterday, your streak continues.

### 6. Focus on Consistency Over Intensity
A consistent 10-minute habit scores better than sporadic 60-minute bursts.

---

## Metrics Summary

| Metric | Range | Description |
|--------|-------|-------------|
| Current Streak | 0-∞ | Consecutive days from today |
| Longest Streak | 0-∞ | Best streak in history |
| Consistency Score | 0-100 | Quality of completion pattern |
| Completion Rate (7d) | 0-100% | % of last 7 days completed |
| Completion Rate (30d) | 0-100% | % of last 30 days completed |
| Total Completions | 0-∞ | All-time completions |
