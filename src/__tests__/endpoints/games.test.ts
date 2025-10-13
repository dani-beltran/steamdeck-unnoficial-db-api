import { describe, it, expect, beforeAll, afterAll, afterEach, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Db } from 'mongodb';
import app from '../../app';
import { connectTestDB, closeTestDB, clearTestDB, getTestDB } from '../setup/test-db';
import * as gameModel from '../../models/game-model';
import { Game } from '../../schemas/game-schemas';

// Mock the database module
vi.mock('../../config/database', () => ({
  getDB: vi.fn(),
  connectDB: vi.fn(),
}));

describe('GET /v1/games/:id', () => {

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    // Mock getDB to return our test database before each test
    const { getDB } = await import('../../config/database');
    vi.mocked(getDB).mockReturnValue(getTestDB());
  });

  afterAll(async () => {
    await closeTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  describe('Successful scenarios', () => {
    it('should return a game when valid ID is provided', async () => {
      // Arrange
      const testGame: Game = {
        game_id: 1,
        game_name: 'Elden Ring',
        game_performance_summary: 'Runs smoothly on Steam Deck',
        steamdeck_rating: 'gold',
        steamdeck_verified: true,
        settings: [
          {
            game_settings: { graphics: 'High', resolution: '1920x1080' },
            steamdeck_settings: { tdp: '15W' },
            steamdeck_hardware: 'lcd',
            posted_at: new Date(),
          }
        ],
        created_at: new Date(),
        updated_at: new Date(),
      };
      const db: Db = getTestDB();
      await db.collection('games').insertOne(testGame);

      // Act
      const response = await request(app)
        .get('/v1/games/1')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.status).toBe('ready');
      expect(response.body.game).toMatchObject({
        game_id: 1,
        game_name: 'Elden Ring',
        game_performance_summary: 'Runs smoothly on Steam Deck',
        steamdeck_rating: 'gold',
        steamdeck_verified: true,
      });
      expect(response.body.game).toHaveProperty('_id');
      expect(response.body.game.settings).toBeInstanceOf(Array);
    });

    it('should return a game with minimal data', async () => {
      // Arrange
      const testGame: Game = {
        game_id: 2,
        game_name: 'Cyberpunk 2077',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const db: Db = getTestDB();
      await db.collection('games').insertOne(testGame);

      // Act
      const response = await request(app)
        .get('/v1/games/2')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.status).toBe('ready');
      expect(response.body.game).toMatchObject({
        game_id: 2,
        game_name: 'Cyberpunk 2077',
      });
    });

    it('should return a game with complex settings', async () => {
      // Arrange
      const testGame: Game = {
        game_id: 3,
        game_name: 'Red Dead Redemption 2',
        settings: [
          {
            game_settings: {
              quality: 'Ultra',
              antiAliasing: 'TAA',
              vsync: true,
            },
            steamdeck_settings: {
              fps: 60,
              resolution: '2560x1440',
            },
            steamdeck_hardware: 'oled',
          }
        ],
        created_at: new Date(),
        updated_at: new Date(),
      };

      const db: Db = getTestDB();
      await db.collection('games').insertOne(testGame);

      // Act
      const response = await request(app)
        .get('/v1/games/3')
        .expect(200);

      // Assert
      expect(response.body.status).toBe('ready');
      expect(response.body.game.settings).toHaveLength(1);
      expect(response.body.game.settings[0]).toMatchObject({
        game_settings: testGame.settings![0].game_settings,
        steamdeck_settings: testGame.settings![0].steamdeck_settings,
        steamdeck_hardware: testGame.settings![0].steamdeck_hardware,
      });
    });

    it('should return the correct game when multiple games exist', async () => {
      // Arrange
      const games = [
        { game_id: 1, game_name: 'Game 1', created_at: new Date(), updated_at: new Date() },
        { game_id: 2, game_name: 'Game 2', created_at: new Date(), updated_at: new Date() },
        { game_id: 3, game_name: 'Game 3', created_at: new Date(), updated_at: new Date() },
      ];

      const db: Db = getTestDB();
      await db.collection('games').insertMany(games);

      // Act
      const response = await request(app)
        .get('/v1/games/2')
        .expect(200);

      // Assert
      expect(response.body.status).toBe('ready');
      expect(response.body.game).toMatchObject({
        game_id: 2,
        game_name: 'Game 2',
      });
    });
  });

  describe('Error scenarios', () => {
    it('should return 200 with queued status when game is not found', async () => {
      // Act
      const response = await request(app)
        .get('/v1/games/999')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        status: 'queued',
        game: null,
      });
    });

    it('should return 400 for invalid ID format (non-numeric)', async () => {
      // Act
      const response = await request(app)
        .get('/v1/games/abc')
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid request parameters');
    });

    it('should return 400 for negative ID', async () => {
      // Act
      const response = await request(app)
        .get('/v1/games/-1')
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid request parameters');
    });

    it('should return 400 for zero ID', async () => {
      // Act
      const response = await request(app)
        .get('/v1/games/0')
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid request parameters');
    });

    it('should return 400 for decimal ID', async () => {
      // Act
      const response = await request(app)
        .get('/v1/games/1.5')
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid request parameters');
    });

    it('should return 500 when database query fails', async () => {
      // Arrange - Mock the fetchGameById to throw an error
      const mockError = new Error('Database connection failed');
      vi.spyOn(gameModel, 'fetchGameById').mockRejectedValueOnce(mockError);

      // Act
      const response = await request(app)
        .get('/v1/games/1')
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
        game_id: largeId,
        game_name: 'Test Game',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const db: Db = getTestDB();
      await db.collection('games').insertOne(testGame);

      // Act
      const response = await request(app)
        .get(`/v1/games/${largeId}`)
        .expect(200);

      // Assert
      expect(response.body.status).toBe('ready');
      expect(response.body.game.game_id).toBe(largeId);
    });

    it('should handle games with null settings', async () => {
      // Arrange
      const testGame: Game = {
        game_id: 4,
        game_name: 'Game with null settings',
        settings: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const db: Db = getTestDB();
      await db.collection('games').insertOne(testGame);

      // Act
      const response = await request(app)
        .get('/v1/games/4')
        .expect(200);

      // Assert
      expect(response.body.status).toBe('ready');
      expect(response.body.game.settings).toBeNull();
    });
  });

});
