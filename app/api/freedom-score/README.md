# Freedom Score API

## Overview
Weekly "Freedom Score" that quantifies progress toward escaping daily chaos through AI-powered systems.

## Algorithm

**Weights:**
- Financial (runway): 40%
- Time (work/life): 30%
- Health (sleep): 20%
- Systems (automation): 10%

**Formula:**
```typescript
financial = min(100, (runwayMonths / 12) * 100)
time = max(0, 100 - |hoursWorked - 40| * 5)
health = (sleepAvg / 8) * 100
systems = min(100, aiPrsMerged * 10 + automationHours * 2)
overall = financial*0.40 + time*0.30 + health*0.20 + systems*0.10
```

## Endpoints

### GET /api/freedom-score
Get current week's freedom score

### GET /api/freedom-score/history
Get last 12 weeks of scores

### POST /api/freedom-score/calculate
Calculate and store new score. Body optional:
```json
{
  "runwayMonths": 16,
  "hoursWorked": 45,
  "sleepAvg": 7.2,
  "aiPrsMerged": 5,
  "automationHours": 10
}
```

### GET /api/freedom-score/report
Generate full weekly report with wins and focus areas

## Score Interpretation

| Range | Label | Meaning |
|-------|-------|---------|
| 90-100 | Fully Free | Systems running, time yours |
| 70-89 | Building Freedom | Good momentum |
| 50-69 | Surviving | Holding on |
| 30-49 | Chaos Zone | Overworked |
| 0-29 | Emergency | Immediate intervention |

## UI Components

- `FreedomScoreWidget` — Dashboard card with score breakdown
- `WeeklyReport` — Full weekly report page

## Cron Job

Weekly report runs Sundays at 21:00 CET.

## Dependencies

Requires profile fields from the "Expand User Profile Fields" feature:
- `currentRunway` (for financial score)
- `sleepTarget` (for health score)
- `deepWorkHours` (for time score)
