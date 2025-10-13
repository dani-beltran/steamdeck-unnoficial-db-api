import express, { Express } from 'express';
import cors from 'cors';
import gameRoutes from './routes/game-routes';

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/v1', gameRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

export default app;
