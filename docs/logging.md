# Logging

This project uses [Winston](https://github.com/winstonjs/winston) for logging.

## Configuration

The logger is configured in `src/config/logger.ts` with the following features:

- **Multiple log levels**: error, warn, info, http, debug
- **Color-coded console output** for better readability
- **File transports with automatic rotation**: 
  - `logs/error-YYYY-MM-DD.log` - Contains only error logs
  - `logs/combined-YYYY-MM-DD.log` - Contains all logs
- **Automatic log rotation**:
  - Daily rotation (new file each day)
  - Max size per file: 20MB
  - Retention: 14 days
  - Automatic compression of old logs (gzip)
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


## Log Rotation Details

The log rotation system automatically manages log files to prevent disk space issues:

### Daily Rotation
- A new log file is created each day
- Files are named with the date pattern: `combined-YYYY-MM-DD.log`

### Size-Based Rotation
- If a log file exceeds 20MB in a single day, it will rotate to a new file
- Example: `combined-2025-10-17.1.log`, `combined-2025-10-17.2.log`, etc.

### Automatic Cleanup
- Logs older than 14 days are automatically deleted
- Old logs are compressed with gzip to save space
- Compressed files have a `.gz` extension

### Disk Space Management
With current settings:
- Maximum combined logs: ~280MB (14 days × 20MB)
- Maximum error logs: ~280MB (14 days × 20MB)
- Total maximum: ~560MB (compressed files take less space)

## Customization

To modify log behavior, edit `src/config/logger.ts`:

### Adjust Rotation Settings

```typescript
new DailyRotateFile({
  filename: "logs/combined-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",      // Change max file size (e.g., "50m", "100m")
  maxFiles: "14d",     // Change retention period (e.g., "30d", "90d")
  zippedArchive: true, // Set to false to disable compression
})
```

### Common Adjustments

- **Increase retention**: Change `maxFiles: "30d"` to keep logs for 30 days
- **Larger files**: Change `maxSize: "50m"` for 50MB files
- **Monthly rotation**: Change `datePattern: "YYYY-MM"` for monthly files
- **Disable compression**: Set `zippedArchive: false`
- **Change log levels**: Modify the `levels` object
- **Add custom formats**: Modify the format configurations
