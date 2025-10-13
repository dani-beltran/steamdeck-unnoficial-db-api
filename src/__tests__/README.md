# Test Suite for getGameById Endpoint

This directory contains comprehensive tests for the `getGameById` API endpoint using **Vitest**.

## Test Files

### 1. `endpoints/games.test.ts`
Integration tests using an in-memory MongoDB and Supertest.

**Test Coverage:**
- ✅ Successful game retrieval
- ✅ Game not found scenarios (404)
- ✅ Error handling (500)
- ✅ ID parameter conversion and validation
- ✅ Response data integrity
- ✅ Edge cases (large IDs, minimal data)

**What it tests:**
- Controller properly calls the model with correct parameters
- Correct HTTP status codes are returned
- Error responses are properly formatted
- ID string-to-number conversion works correctly

**Test Coverage:**
- ✅ Full request/response cycle
- ✅ Database integration
- ✅ Input validation with Zod
- ✅ Complex data structures
- ✅ Database error scenarios
- ✅ Edge cases with real data

**What it tests:**
- Complete API endpoint behavior
- Database queries and responses
- Request validation
- Error handling with real database
- Complex game data retrieval

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (for development)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- gameController.unit.test
```

## Test Database Setup

The integration tests use `mongodb-memory-server` to create an in-memory MongoDB instance. This means:
- No need for a running MongoDB server
- Tests are isolated and repeatable
- Database is created fresh for each test run
- Automatic cleanup after tests complete

## Test Structure

Each test follows the AAA pattern:
- **Arrange**: Set up test data and mocks
- **Act**: Execute the code being tested
- **Assert**: Verify the results

## Coverage Goals

- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

## Mocking Strategy

- **Integration Tests**: Use real in-memory database with MongoDB Memory Server
- **Mocks**: Use Vitest's `vi.mock()` for database configuration
- **HTTP Requests**: Use Supertest for request simulation

## Why Vitest?

- ⚡ **Faster**: Vite-powered test runner with instant HMR
- 🔧 **Better TypeScript Support**: Native ESM support
- 📦 **Smaller Bundle**: No need for babel/ts-jest
- 🔍 **Better Errors**: More readable error messages

## Example Test Cases

### Integration Test Example
```typescript
it('should return a game when valid ID is provided', async () => {
  // Arrange
  await db.collection('games').insertOne({ id: 1, name: 'Elden Ring' });

  // Act
  const response = await request(app)
    .get('/v1/game/1')
    .expect(200);

  // Assert
  expect(response.body.name).toBe('Elden Ring');
});
```

## Continuous Integration

These tests are designed to run in CI/CD pipelines:
- No external dependencies required
- Fast execution (in-memory database)
- Deterministic results
- Clear error messages

## Adding New Tests

When adding new test cases:
1. Follow the existing test structure
2. Use descriptive test names
3. Test both success and error scenarios
4. Include edge cases
5. Update this README if adding new test files
