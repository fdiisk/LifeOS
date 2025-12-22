# Health Metrics API Documentation

Track body metrics, calculate calories burned, and generate health summaries for visualization.

## Table of Contents

- [Body Metrics API](#body-metrics-api)
- [Health Summary API](#health-summary-api)
- [Health Trends API](#health-trends-api)
- [Calculation Formulas](#calculation-formulas)

---

## Body Metrics API

Track weight, body fat, muscle mass, and measurements over time.

### 1. Get All Body Metrics

**Endpoint:** `GET /api/body-metrics`

**Query Parameters:**
- `start_date` (optional): Filter from date (YYYY-MM-DD)
- `end_date` (optional): Filter to date (YYYY-MM-DD)

**Example Request:**
```bash
curl "http://localhost:3000/api/body-metrics?start_date=2025-12-01&end_date=2025-12-31"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "log_date": "2025-12-22",
      "weight_kg": 75.5,
      "body_fat_percentage": 15.2,
      "muscle_mass_kg": 60.8,
      "measurements": {
        "chest_cm": 98,
        "waist_cm": 82,
        "hips_cm": 95,
        "biceps_cm": 35,
        "thighs_cm": 55
      },
      "notes": "Morning weigh-in, before breakfast",
      "created_at": "2025-12-22T08:00:00Z",
      "updated_at": "2025-12-22T08:00:00Z"
    }
  ],
  "count": 1
}
```

### 2. Get Single Body Metric

**Endpoint:** `GET /api/body-metrics?id=<uuid>`

### 3. Create Body Metric

**Endpoint:** `POST /api/body-metrics`

**Request Body:**
```json
{
  "log_date": "2025-12-22",
  "weight_kg": 75.5,
  "body_fat_percentage": 15.2,
  "muscle_mass_kg": 60.8,
  "measurements": {
    "chest_cm": 98,
    "waist_cm": 82,
    "hips_cm": 95
  },
  "notes": "Morning weigh-in"
}
```

**Alternative (using lbs):**
```json
{
  "log_date": "2025-12-22",
  "weight_lbs": 166.4,
  "muscle_mass_lbs": 134.0
}
```

**Fields:**
- `log_date` (required): Date of measurement
- `weight_kg` (optional): Weight in kilograms
- `weight_lbs` (optional): Weight in pounds (auto-converted to kg)
- `body_fat_percentage` (optional): Body fat %
- `muscle_mass_kg` (optional): Muscle mass in kg
- `muscle_mass_lbs` (optional): Muscle mass in lbs (auto-converted)
- `measurements` (optional): JSON object with measurements
- `notes` (optional): Additional notes

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "log_date": "2025-12-22",
    "weight_kg": 75.5,
    ...
  }
}
```

### 4. Update Body Metric

**Endpoint:** `PATCH /api/body-metrics?id=<uuid>`

### 5. Delete Body Metric

**Endpoint:** `DELETE /api/body-metrics?id=<uuid>`

---

## Health Summary API

Get daily net calories or weekly summaries combining nutrition, activity, and body metrics.

### 1. Daily Net Calories

**Endpoint:** `GET /api/health/summary?date=YYYY-MM-DD`

**Example Request:**
```bash
curl "http://localhost:3000/api/health/summary?date=2025-12-22"
```

**Success Response (200):**
```json
{
  "success": true,
  "type": "daily",
  "data": {
    "date": "2025-12-22",
    "intake": 2100,
    "burned": {
      "bmr": 1680,
      "gym": 450,
      "sedentary": 180,
      "total": 2310
    },
    "net_calories": -210,
    "status": "deficit"
  }
}
```

**Response Fields:**
- `intake`: Total calories consumed (from nutrition logs)
- `burned.bmr`: Basal Metabolic Rate calories
- `burned.gym`: Calories from gym workouts
- `burned.sedentary`: Calories from focus sessions
- `burned.total`: Total calories burned
- `net_calories`: Intake - Burned
- `status`: `surplus`, `deficit`, or `maintenance`

### 2. Weekly Summary

**Endpoint:** `GET /api/health/summary?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

**Example Request:**
```bash
curl "http://localhost:3000/api/health/summary?start_date=2025-12-15&end_date=2025-12-22"
```

**Success Response (200):**
```json
{
  "success": true,
  "type": "weekly",
  "data": {
    "period": {
      "start_date": "2025-12-15",
      "end_date": "2025-12-22",
      "days": 8
    },
    "weight": {
      "average_kg": 75.3,
      "average_lbs": 166.0,
      "change_kg": -0.5,
      "change_lbs": -1.1,
      "measurements": 3
    },
    "nutrition": {
      "total_calories": 15400,
      "avg_calories_per_day": 1925,
      "logged_days": 8
    },
    "activity": {
      "total_workout_minutes": 240,
      "workout_count": 4,
      "avg_workout_duration": 60
    },
    "calories": {
      "avg_net_per_day": -250,
      "total_net": -2000,
      "status": "deficit"
    },
    "daily_breakdown": [
      {
        "date": "2025-12-15",
        "intake": 2000,
        "burned": {"bmr": 1680, "gym": 450, "total": 2130},
        "net_calories": -130,
        "status": "deficit"
      }
    ]
  }
}
```

### 3. Default Summary (Last 7 Days)

**Endpoint:** `GET /api/health/summary`

Returns weekly summary for the last 7 days.

---

## Health Trends API

Get time-series data for graphs and charts.

### 1. Weight Trend

**Endpoint:** `GET /api/health/trends?type=weight&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

**Example Request:**
```bash
curl "http://localhost:3000/api/health/trends?type=weight&start_date=2025-11-01&end_date=2025-12-31"
```

**Success Response (200):**
```json
{
  "success": true,
  "type": "weight",
  "period": {
    "start_date": "2025-11-01",
    "end_date": "2025-12-31"
  },
  "data": [
    {
      "date": "2025-11-01",
      "weight_kg": 78.2,
      "weight_lbs": 172.4,
      "body_fat_percentage": 18.5,
      "muscle_mass_kg": 62.0,
      "muscle_mass_lbs": 136.7
    },
    {
      "date": "2025-11-08",
      "weight_kg": 77.5,
      "weight_lbs": 170.9,
      "body_fat_percentage": 17.8,
      "muscle_mass_kg": 62.3,
      "muscle_mass_lbs": 137.4
    }
  ],
  "count": 2
}
```

**Use Case:** Graph weight loss/gain over time.

### 2. Calories Trend

**Endpoint:** `GET /api/health/trends?type=calories&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

**Example Request:**
```bash
curl "http://localhost:3000/api/health/trends?type=calories&start_date=2025-12-01&end_date=2025-12-31"
```

**Success Response (200):**
```json
{
  "success": true,
  "type": "calories",
  "period": {
    "start_date": "2025-12-01",
    "end_date": "2025-12-31"
  },
  "data": [
    {
      "date": "2025-12-01",
      "intake": 2200,
      "burned": 2400,
      "net": -200,
      "status": "deficit"
    },
    {
      "date": "2025-12-02",
      "intake": 1900,
      "burned": 2100,
      "net": -200,
      "status": "deficit"
    }
  ],
  "count": 31
}
```

**Use Case:** Visualize calorie intake vs. burned over time.

### 3. Workout Trend

**Endpoint:** `GET /api/health/trends?type=workout&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

**Example Request:**
```bash
curl "http://localhost:3000/api/health/trends?type=workout&start_date=2025-12-01&end_date=2025-12-31"
```

**Success Response (200):**
```json
{
  "success": true,
  "type": "workout",
  "period": {
    "start_date": "2025-12-01",
    "end_date": "2025-12-31"
  },
  "data": [
    {
      "date": "2025-12-01",
      "duration_minutes": 60,
      "workout_count": 1,
      "workout_types": ["strength"]
    },
    {
      "date": "2025-12-03",
      "duration_minutes": 90,
      "workout_count": 2,
      "workout_types": ["strength", "cardio"]
    }
  ],
  "count": 15
}
```

**Use Case:** Track workout frequency and duration.

---

## Calculation Formulas

### Calories from Steps

```
calories_burned = steps × 0.04 × (weight_lbs / 150)
```

**Example:**
- 10,000 steps, 165 lbs person
- Calories = 10,000 × 0.04 × (165 / 150) = 440 calories

### Calories from Running

```
calories_burned = distance_km × weight_kg × 1.036
```

**Example:**
- 5 km run, 70 kg person
- Calories = 5 × 70 × 1.036 = 363 calories

### Pace Calculation

```
pace_per_unit = duration_minutes / distance
```

**Example:**
- 30 minutes, 5 km
- Pace = 30 / 5 = 6 min/km

### Basal Metabolic Rate (BMR)

Simplified Mifflin-St Jeor:
```
BMR_daily = weight_kg × 24 × 1.2
```

**Example:**
- 70 kg person
- BMR = 70 × 24 × 1.2 = 2,016 calories/day

### Gym Calories Burned

Estimate based on duration:
```
calories_burned = duration_minutes × 7.5
```

**Note:** This is an average estimate. Actual burn varies by intensity.

**Intensity Multipliers:**
- Low intensity (yoga, stretching): 3-4 cal/min
- Moderate (weight training): 6-8 cal/min
- High intensity (HIIT, running): 10-12 cal/min

### Sedentary Activity Calories

For focus sessions and desk work:
```
calories_burned = duration_minutes × 1.5
```

### Net Calories

```
net_calories = intake - burned
```

**Status:**
- Positive (surplus): Gaining weight
- Negative (deficit): Losing weight
- Zero (maintenance): Maintaining weight

---

## Unit Conversions

### Weight

**kg to lbs:**
```
lbs = kg × 2.20462
```

**lbs to kg:**
```
kg = lbs / 2.20462
```

### Distance

**km to miles:**
```
miles = km × 0.621371
```

**miles to km:**
```
km = miles / 0.621371
```

---

## Usage Examples

### Complete Health Tracking Flow

```bash
# 1. Log body weight
curl -X POST "http://localhost:3000/api/body-metrics" \
  -H "Content-Type: application/json" \
  -d '{"log_date": "2025-12-22", "weight_kg": 75.5, "body_fat_percentage": 15.2}'

# 2. Get daily summary
curl "http://localhost:3000/api/health/summary?date=2025-12-22"

# 3. Get weekly summary
curl "http://localhost:3000/api/health/summary?start_date=2025-12-15&end_date=2025-12-22"

# 4. Get weight trend for charts
curl "http://localhost:3000/api/health/trends?type=weight&start_date=2025-11-01&end_date=2025-12-31"
```

### Dashboard View

```bash
# Get overview for today
TODAY=$(date +%Y-%m-%d)

# Daily net calories
curl "http://localhost:3000/api/health/summary?date=$TODAY"

# Last 7 days summary
curl "http://localhost:3000/api/health/summary"

# Weight trend (last 30 days)
START=$(date -d "30 days ago" +%Y-%m-%d)
curl "http://localhost:3000/api/health/trends?type=weight&start_date=$START&end_date=$TODAY"
```

### Progress Tracking

```bash
# Compare weight: start of month vs now
curl "http://localhost:3000/api/health/trends?type=weight&start_date=2025-12-01&end_date=2025-12-31" | jq '
  {
    start_weight: .data[0].weight_kg,
    current_weight: .data[-1].weight_kg,
    change_kg: (.data[-1].weight_kg - .data[0].weight_kg),
    change_lbs: ((.data[-1].weight_kg - .data[0].weight_kg) * 2.20462)
  }
'
```

---

## Graph Data Format

All trend endpoints return data optimized for graphing libraries (Chart.js, Recharts, etc.).

### Example: Weight Chart

```javascript
// Fetch data
const response = await fetch('/api/health/trends?type=weight&start_date=2025-11-01&end_date=2025-12-31');
const { data } = await response.json();

// Chart.js format
const chartData = {
  labels: data.map(d => d.date),
  datasets: [
    {
      label: 'Weight (kg)',
      data: data.map(d => d.weight_kg),
      borderColor: 'rgb(75, 192, 192)',
    },
    {
      label: 'Body Fat %',
      data: data.map(d => d.body_fat_percentage),
      borderColor: 'rgb(255, 99, 132)',
    }
  ]
};
```

### Example: Calories Chart

```javascript
// Fetch data
const response = await fetch('/api/health/trends?type=calories&start_date=2025-12-01&end_date=2025-12-31');
const { data } = await response.json();

// Recharts format
const chartData = data.map(d => ({
  date: d.date,
  intake: d.intake,
  burned: d.burned,
  net: d.net,
}));

// In Recharts
<LineChart data={chartData}>
  <Line dataKey="intake" stroke="#82ca9d" />
  <Line dataKey="burned" stroke="#8884d8" />
  <Line dataKey="net" stroke="#ffc658" />
</LineChart>
```

---

## Best Practices

### 1. Consistent Weigh-Ins

Weigh in at the same time each day for accuracy:
- Morning, before breakfast
- After using bathroom
- Minimal clothing

### 2. Daily Logging

Log daily for best trend analysis:
- Body weight: Daily or every other day
- Nutrition: Every meal
- Workouts: Every session

### 3. Weekly Reviews

Use weekly summaries to:
- Track progress
- Adjust calorie targets
- Modify workout plans

### 4. Trend Over Time

Focus on trends, not daily fluctuations:
- Weight can fluctuate 2-3 lbs daily
- Look at 7-day or 30-day trends
- Use moving averages for smoothing

---

## Health Goals Examples

### Goal: Lose 1 lb per week

**Target:** -500 cal/day deficit

**Track:**
```bash
# Check daily net calories
curl "http://localhost:3000/api/health/summary?date=2025-12-22"
# Ensure net_calories is around -500

# Check weekly progress
curl "http://localhost:3000/api/health/summary?start_date=2025-12-15&end_date=2025-12-22"
# weight.change_lbs should be around -1
```

### Goal: Maintain weight

**Target:** Net zero calories

**Track:**
```bash
# Weekly summary
curl "http://localhost:3000/api/health/summary"
# calories.avg_net_per_day should be near 0
# weight.change_kg should be minimal
```

### Goal: Gain muscle

**Target:** +300 cal/day surplus + strength training

**Track:**
```bash
# Ensure surplus
curl "http://localhost:3000/api/health/summary"
# calories.avg_net_per_day should be +300

# Track muscle mass
curl "http://localhost:3000/api/health/trends?type=weight&start_date=2025-12-01&end_date=2025-12-31"
# muscle_mass_kg should increase
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
