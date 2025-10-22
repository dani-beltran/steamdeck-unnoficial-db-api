# API Endpoints

## Get Game by ID
```
GET /games/:id
```

Fetches a game by its ID from the database. If the game is not found, it will be queued for scraping.

**Parameters:**
- `id` - Game ID (numeric string)
  - Must be a valid numeric game ID

**Validation:**
- Returns `400 Bad Request` if ID format is invalid
- Returns `500 Internal Server Error` on server error

**Response:**
- `200 OK` - Returns the game status and object

**Success Response (Game Found):**
```json
{
  "status": "ready",
  "game": {
    "game_id": 123,
    "game_name": "Example Game",
    "game_performance_summary": "Runs well on Steam Deck",
    "steamdeck_rating": "gold",
    "steamdeck_verified": true,
    "settings": [],
    "updated_at": "2025-10-20T00:00:00.000Z",
    "created_at": "2025-10-20T00:00:00.000Z"
  }
}
```

**Success Response (Game Queued):**
```json
{
  "status": "queued",
  "game": null
}
```

**Example:**
```bash
curl http://localhost:3000/games/123
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

## Search Steam Games
```
GET /steam/games?term={searchTerm}&limit={limit}
```

Searches for games on Steam using the Steam API.

**Query Parameters:**
- `term` (required) - Search term for finding games
  - Must be a non-empty string
- `limit` (optional) - Maximum number of results to return
  - Must be an integer between 1 and 100
  - Default: 10

**Validation:**
- Returns `400 Bad Request` if search term is missing or invalid
- Returns `500 Internal Server Error` on server error

**Response:**
- `200 OK` - Returns array of matching Steam games

**Success Response Example:**
```json
[
  {
    "appid": 123,
    "name": "Example Game",
    "icon": "https://...",
    "logo": "https://..."
  }
]
```

**Example:**
```bash
curl "http://localhost:3000/steam/games?term=portal&limit=5"
```

**Error Response Example:**
```json
{
  "error": "Invalid request parameters",
  "details": [
    {
      "field": "term",
      "message": "Search term is required"
    }
  ]
}
```

## Get Steam Game Details
```
GET /steam/games/:id
```

Fetches detailed information about a specific game from the Steam API.

**Parameters:**
- `id` - Steam App ID (numeric string)
  - Must be a valid numeric game ID

**Validation:**
- Returns `400 Bad Request` if ID format is invalid
- Returns `500 Internal Server Error` on server error

**Response:**
- `200 OK` - Returns detailed game information from Steam

**Success Response Example:**
```json
{
  "steam_appid": 123,
  "name": "Example Game",
  "type": "game",
  "required_age": 0,
  "is_free": false,
  "short_description": "A great game...",
  "header_image": "https://...",
  "developers": ["Developer Name"],
  "publishers": ["Publisher Name"],
  "platforms": {
    "windows": true,
    "mac": false,
    "linux": true
  },
  "categories": [],
  "genres": [],
  "release_date": {
    "coming_soon": false,
    "date": "Jan 1, 2020"
  }
}
```

**Example:**
```bash
curl http://localhost:3000/steam/games/123
```

**Error Response Example:**
```json
{
  "error": "Internal server error"
}
```

## Health Check
```
GET /health
```

Returns the API status.

**Response:**
```json
{
  "status": "OK",
  "message": "API is running"
}
```
`