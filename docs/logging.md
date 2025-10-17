# Logging

This project uses [Winston](https://github.com/winstonjs/winston) for logging.

## Configuration

The logger is configured in `src/config/logger.ts` with the following features:

- **Multiple log levels**: error, warn, info, http, debug
- **Color-coded console output** for better readability
- **File transports**: 
  - `logs/error.log` - Contains only error logs
  - `logs/combined.log` - Contains all logs
- **Timestamp** on all log entries
- **Environment-based log level**: 
  - Development: `debug` (all logs)
  - Production: `info` (info and above)

## Usage

Import the logger in any file:

```typescript
import logger from './config/logger';
```

Use the appropriate log level:

```typescript
// Information messages
logger.info('Server started on port 3000');

// Warning messages
logger.warn('Database connection slow');

// Error messages
logger.error('Failed to process request', error);

// Debug messages (only in development)
logger.debug('Processing request payload:', data);

// HTTP request logs
logger.http('GET /api/games/123');
```

## Log Levels

From highest to lowest priority:

1. **error** (0) - Error messages that need immediate attention
2. **warn** (1) - Warning messages for potentially harmful situations
3. **info** (2) - Informational messages about application flow
4. **http** (3) - HTTP request/response logging
5. **debug** (4) - Detailed debug information (development only)

## File Structure

```
logs/
├── .gitkeep          # Ensures directory is tracked in git
├── error.log         # Error logs only
└── combined.log      # All logs
```

Note: Log files are excluded from git via `.gitignore`.

## Customization

To modify log behavior, edit `src/config/logger.ts`:

- Change log levels
- Add/remove transports
- Modify log format
- Add filters or metadata
