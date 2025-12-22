# Ratings API Documentation

The Ratings API provides endpoints for tracking both subjective (focus, effort, mood) and objective (actual performance) ratings, with weekly aggregations and perceived vs actual comparisons.

All scores are normalized to a 0-100 scale.

## Overview

- **Subjective Ratings**: User-provided ratings for focus, effort, and mood
- **Objective Ratings**: Automatically calculated based on actual performance (task completion, habit completion, workout adherence, nutrition logging)
- **Weekly Aggregations**: Summary statistics with trend analysis
- **Perceived vs Actual**: Compare subjective effort with objective performance to identify gaps

---

## Endpoints

### 1. Create Daily Rating

**POST** `/api/ratings`

Create a new daily rating with subjective scores.

**Request Body:**
```json
{
  "date": "2025-01-15",
  "focus_rating": 75,
  "effort_rating": 80,
  "mood_rating": 70,
  "notes": "Productive day, felt energized"
}
```

**Response (201):**
```json
{
  "rating": {
    "id": "uuid",
    "date": "2025-01-15",
    "focus_rating": 75,
    "effort_rating": 80,
    "mood_rating": 70,
    "notes": "Productive day, felt energized",
    "created_at": "2025-01-15T20:00:00Z",
    "updated_at": "2025-01-15T20:00:00Z"
  },
  "objective": {
    "date": "2025-01-15",
    "overall_score": 73,
    "task_completion_score": 80,
    "habit_completion_score": 85,
    "workout_adherence_score": 100,
    "nutrition_logging_score": 66,
    "breakdown": {
      "tasks": { "completed": 4, "total": 5, "percentage": 80 },
      "habits": { "completed": 6, "total": 7, "percentage": 85 },
      "workouts": { "logged": true, "score": 100 },
      "nutrition": { "meals_logged": 2, "expected": 3, "percentage": 66 }
    }
  },
  "message": "Rating created successfully"
}
```

**Validation:**
- All ratings must be between 0-100
- Date must be unique (one rating per day)
- Required fields: `date`, `focus_rating`, `effort_rating`, `mood_rating`

---

### 2. Get Rating(s)

**GET** `/api/ratings`

Get rating for a specific date or date range.

**Query Parameters:**
- `date` (string): Specific date (YYYY-MM-DD)
- `start_date` (string): Start of date range (YYYY-MM-DD)
- `end_date` (string): End of date range (YYYY-MM-DD)
- `include_objective` (boolean): Include objective ratings (default: false)

**Examples:**

**Single Date:**
```
GET /api/ratings?date=2025-01-15&include_objective=true
```

**Response (200):**
```json
{
  "rating": {
    "id": "uuid",
    "date": "2025-01-15",
    "focus_rating": 75,
    "effort_rating": 80,
    "mood_rating": 70,
    "notes": "Productive day",
    "created_at": "2025-01-15T20:00:00Z",
    "updated_at": "2025-01-15T20:00:00Z"
  },
  "objective": {
    "date": "2025-01-15",
    "overall_score": 73,
    "task_completion_score": 80,
    "habit_completion_score": 85,
    "workout_adherence_score": 100,
    "nutrition_logging_score": 66,
    "breakdown": { ... }
  }
}
```

**Date Range:**
```
GET /api/ratings?start_date=2025-01-10&end_date=2025-01-16
```

**Response (200):**
```json
{
  "ratings": [
    {
      "id": "uuid",
      "date": "2025-01-16",
      "focus_rating": 85,
      "effort_rating": 90,
      "mood_rating": 80,
      "notes": null,
      "created_at": "2025-01-16T20:00:00Z",
      "updated_at": "2025-01-16T20:00:00Z"
    },
    {
      "id": "uuid",
      "date": "2025-01-15",
      "focus_rating": 75,
      "effort_rating": 80,
      "mood_rating": 70,
      "notes": "Productive day",
      "created_at": "2025-01-15T20:00:00Z",
      "updated_at": "2025-01-15T20:00:00Z"
    }
  ]
}
```

---

### 3. Update Rating

**PATCH** `/api/ratings`

Update an existing daily rating.

**Request Body:**
```json
{
  "date": "2025-01-15",
  "focus_rating": 80,
  "notes": "Updated reflection"
}
```

**Response (200):**
```json
{
  "rating": {
    "id": "uuid",
    "date": "2025-01-15",
    "focus_rating": 80,
    "effort_rating": 80,
    "mood_rating": 70,
    "notes": "Updated reflection",
    "created_at": "2025-01-15T20:00:00Z",
    "updated_at": "2025-01-15T21:00:00Z"
  },
  "message": "Rating updated successfully"
}
```

**Notes:**
- Only provided fields will be updated
- At least one field besides `date` must be provided

---

### 4. Delete Rating

**DELETE** `/api/ratings`

Delete a daily rating.

**Query Parameters:**
- `date` (string, required): Date to delete (YYYY-MM-DD)

**Example:**
```
DELETE /api/ratings?date=2025-01-15
```

**Response (200):**
```json
{
  "message": "Rating deleted successfully"
}
```

---

### 5. Weekly Summary

**GET** `/api/ratings/weekly`

Get weekly aggregation of subjective and objective ratings with trend analysis.

**Query Parameters:**
- `week_start` (string, optional): Start date of the week (YYYY-MM-DD, defaults to current week's Monday)

**Example:**
```
GET /api/ratings/weekly?week_start=2025-01-13
```

**Response (200):**
```json
{
  "summary": {
    "week_start": "2025-01-13",
    "week_end": "2025-01-19",
    "subjective": {
      "avg_focus": 78,
      "avg_effort": 82,
      "avg_mood": 75,
      "avg_overall_subjective": 78
    },
    "objective": {
      "avg_overall": 76,
      "avg_task_completion": 80,
      "avg_habit_completion": 85,
      "avg_workout_adherence": 71,
      "avg_nutrition_logging": 57
    },
    "trend": {
      "focus": "improving",
      "effort": "stable",
      "mood": "improving",
      "objective": "improving"
    },
    "days_rated": 5,
    "total_days": 7
  },
  "message": "Weekly summary calculated successfully"
}
```

**Trend Values:**
- `improving`: Score increased by >5 points from first half to second half of week
- `stable`: Score changed by ≤5 points
- `declining`: Score decreased by >5 points

---

### 6. Perceived vs Actual Comparison

**GET** `/api/ratings/comparison`

Compare perceived effort (subjective) with actual performance (objective) to identify gaps and provide insights.

**Query Parameters:**
- `date` (string): Specific date (YYYY-MM-DD)
- `start_date` (string): Start of date range (YYYY-MM-DD)
- `end_date` (string): End of date range (YYYY-MM-DD)

**Single Date Example:**
```
GET /api/ratings/comparison?date=2025-01-15
```

**Response (200):**
```json
{
  "comparison": {
    "date": "2025-01-15",
    "subjective": {
      "focus": 75,
      "effort": 80,
      "mood": 70,
      "average": 75
    },
    "objective": {
      "overall": 73,
      "task_completion": 80,
      "habit_completion": 85
    },
    "gap": {
      "effort_vs_completion": 7,
      "perception_accuracy": 93,
      "category": "accurate"
    },
    "insight": "Your perceived effort aligns well with actual performance. Great self-awareness!"
  },
  "message": "Comparison calculated successfully"
}
```

**Date Range Example:**
```
GET /api/ratings/comparison?start_date=2025-01-10&end_date=2025-01-16
```

**Response (200):**
```json
{
  "comparisons": [
    {
      "date": "2025-01-10",
      "subjective": { "focus": 70, "effort": 75, "mood": 65, "average": 70 },
      "objective": { "overall": 68, "task_completion": 75, "habit_completion": 80 },
      "gap": { "effort_vs_completion": 7, "perception_accuracy": 93, "category": "accurate" },
      "insight": "Your perceived effort aligns well with actual performance. Great self-awareness!"
    },
    {
      "date": "2025-01-11",
      "subjective": { "focus": 85, "effort": 90, "mood": 80, "average": 85 },
      "objective": { "overall": 65, "task_completion": 60, "habit_completion": 70 },
      "gap": { "effort_vs_completion": 25, "perception_accuracy": 75, "category": "overestimating" },
      "insight": "You felt you put in significant effort, but completion was lower than expected..."
    }
  ],
  "summary": {
    "date_range": { "start": "2025-01-10", "end": "2025-01-16" },
    "total_days": 7,
    "avg_absolute_gap": 12,
    "avg_perception_accuracy": 88,
    "category_breakdown": {
      "accurate": 5,
      "overestimating": 2,
      "underestimating": 0
    },
    "dominant_category": "accurate",
    "insight": "Excellent self-awareness! Your perceived effort consistently aligns with actual performance."
  },
  "message": "Comparisons calculated successfully"
}
```

**Gap Categories:**
- `accurate`: Effort rating within ±15 points of objective score
- `overestimating`: Effort rating >15 points higher than objective score (felt harder than it was)
- `underestimating`: Effort rating >15 points lower than objective score (achieved more than perceived)

---

## Objective Rating Calculation

Objective ratings are automatically calculated based on actual performance:

### Components (weighted):
1. **Task Completion (35%)**: Percentage of tasks completed on the date
2. **Habit Completion (35%)**: Percentage of active habits completed on the date
3. **Workout Adherence (15%)**: 100 if gym log exists for the date, 0 otherwise
4. **Nutrition Logging (15%)**: Percentage of expected meals logged (3 meals: breakfast, lunch, dinner)

### Formula:
```
overall_score = (task_completion × 0.35) +
                (habit_completion × 0.35) +
                (workout_adherence × 0.15) +
                (nutrition_logging × 0.15)
```

All scores are rounded and normalized to 0-100.

---

## Use Cases

### 1. Daily Check-in
Create a rating at the end of each day to track subjective experience:
```bash
POST /api/ratings
{
  "date": "2025-01-15",
  "focus_rating": 75,
  "effort_rating": 80,
  "mood_rating": 70
}
```

### 2. Weekly Review
Get weekly summary to understand trends:
```bash
GET /api/ratings/weekly?week_start=2025-01-13
```

### 3. Self-awareness Analysis
Compare perceived vs actual to identify patterns:
```bash
GET /api/ratings/comparison?start_date=2025-01-01&end_date=2025-01-31
```

### 4. Performance Dashboard
Get ratings with objectives for visualization:
```bash
GET /api/ratings?start_date=2025-01-01&end_date=2025-01-31&include_objective=true
```

---

## Error Codes

- **400**: Invalid request (missing fields, invalid rating range)
- **404**: Rating not found for specified date
- **409**: Rating already exists for date (use PATCH to update)
- **500**: Server error

---

## Notes

- All ratings must be between 0-100
- One rating per day (unique constraint on date)
- Objective ratings are calculated in real-time and not stored
- Weekly summaries default to the current week if no `week_start` is provided
- Trend analysis compares first half vs second half of the week
- Perception accuracy is calculated as `100 - |effort_rating - objective_score|`
