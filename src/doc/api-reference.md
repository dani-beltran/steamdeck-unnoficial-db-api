# API Endpoints

## Get Game by ID
```
GET /api/game/:id
```

Fetches a game by its ID from the MongoDB `games` collection.

**Parameters:**
- `id` - Game ID (can be MongoDB ObjectId or custom id field)
  - Must be a non-empty string
  - Validates as MongoDB ObjectId (24 hex chars) or numeric string

**Validation:**
- Returns `400 Bad Request` if ID format is invalid
- Returns `404 Not Found` if game doesn't exist
- Returns `500 Internal Server Error` on server error

**Response:**
- `200 OK` - Returns the game object

**Example:**
```bash
curl http://localhost:3000/api/game/123
```

**Error Response Example:**
```json
{
  "error": "Invalid request parameters",
  "details": [
    {
      "field": "id",
      "message": "Game ID is required"
    }
  ]
}
```

## Health Check
```
GET /health
```

Returns the API status.
`