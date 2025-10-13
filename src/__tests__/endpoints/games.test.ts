import { describe, it, expect, beforeAll, afterAll, afterEach, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Db } from 'mongodb';
import app from '../../app';
import { connect, closeDatabase, clearDatabase, getTestDB } from '../setup/testDb';
import * as gameModel from '../../models/gameModel';
import { Game } from '../../schemas/gameSchemas';

// Mock the database module
vi.mock('../../config/database', () => ({
  getDB: vi.fn(),
  connectDB: vi.fn(),
}));

describe('GET /v1/game/:id', () => {
  let db: Db;

  beforeAll(async () => {
    db = await connect();
  });

  beforeEach(async () => {
    // Mock getDB to return our test database before each test
    const { getDB } = await import('../../config/database');
    vi.mocked(getDB).mockReturnValue(db);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe('Successful scenarios', () => {
    it('should return a game when valid ID is provided', async () => {
      // Arrange
      const testGame: Game = {
        id: 1,
        name: 'Elden Ring',
        settings: {
          graphics: 'High',
          resolution: '1920x1080',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection('games').insertOne(testGame);

      // Act
      const response = await request(app)
        .get('/v1/game/1')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        id: 1,
        name: 'Elden Ring',
        settings: {
          graphics: 'High',
          resolution: '1920x1080',
        },
      });
      expect(response.body).toHaveProperty('_id');
    });

    it('should return a game with minimal data', async () => {
      // Arrange
      const testGame: Game = {
        id: 2,
        name: 'Cyberpunk 2077',
      };

      await db.collection('games').insertOne(testGame);

      // Act
      const response = await request(app)
        .get('/v1/game/2')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        id: 2,
        name: 'Cyberpunk 2077',
      });
    });

    it('should return a game with complex settings', async () => {
      // Arrange
      const testGame: Game = {
        id: 3,
        name: 'Red Dead Redemption 2',
        settings: {
          graphics: {
            quality: 'Ultra',
            antiAliasing: 'TAA',
            vsync: true,
          },
          performance: {
            fps: 60,
            resolution: '2560x1440',
          },
        },
      };

      await db.collection('games').insertOne(testGame);

      // Act
      const response = await request(app)
        .get('/v1/game/3')
        .expect(200);

      // Assert
      expect(response.body.settings).toEqual(testGame.settings);
    });

    it('should return the correct game when multiple games exist', async () => {
      // Arrange
      const games = [
        { id: 1, name: 'Game 1' },
        { id: 2, name: 'Game 2' },
        { id: 3, name: 'Game 3' },
      ];

      await db.collection('games').insertMany(games);

      // Act
      const response = await request(app)
        .get('/v1/game/2')
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        id: 2,
        name: 'Game 2',
      });
    });
  });

  describe('Error scenarios', () => {
    it('should return 404 when game is not found', async () => {
      // Act
      const response = await request(app)
        .get('/v1/game/999')
        .expect('Content-Type', /json/)
        .expect(404);

      // Assert
      expect(response.body).toEqual({
        error: 'Game not found',
      });
    });

    it('should return 400 for invalid ID format (non-numeric)', async () => {
      // Act
      const response = await request(app)
        .get('/v1/game/abc')
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for negative ID', async () => {
      // Act
      const response = await request(app)
        .get('/v1/game/-1')
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for zero ID', async () => {
      // Act
      const response = await request(app)
        .get('/v1/game/0')
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for decimal ID', async () => {
      // Act
      const response = await request(app)
        .get('/v1/game/1.5')
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error');
    });

    it('should return 500 when database query fails', async () => {
      // Arrange - Mock the fetchGameById to throw an error
      const mockError = new Error('Database connection failed');
      vi.spyOn(gameModel, 'fetchGameById').mockRejectedValueOnce(mockError);

      // Act
      const response = await request(app)
        .get('/v1/game/1')
        .expect('Content-Type', /json/)
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        error: 'Internal server error',
      });

      // Cleanup
      vi.restoreAllMocks();
    });
  });

  describe('Edge cases', () => {
    it('should handle very large game IDs', async () => {
      // Arrange
      const largeId = 2147483647; // Max 32-bit integer
      const testGame: Game = {
        id: largeId,
        name: 'Test Game',
      };

      await db.collection('games').insertOne(testGame);

      // Act
      const response = await request(app)
        .get(`/v1/game/${largeId}`)
        .expect(200);

      // Assert
      expect(response.body.id).toBe(largeId);
    });

    it('should handle games with null settings', async () => {
      // Arrange
      const testGame: Game = {
        id: 4,
        name: 'Game with null settings',
        settings: null,
      };

      await db.collection('games').insertOne(testGame);

      // Act
      const response = await request(app)
        .get('/v1/game/4')
        .expect(200);

      // Assert
      expect(response.body.settings).toBeNull();
    });
  });

});
