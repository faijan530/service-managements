import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import requestRoutes from './routes/requestRoutes';
import aiRoutes from './routes/aiRoutes';
import { securityHeaders, sanitizeInput, sanitizeOutput } from './middleware/security';
import { errorHandler, notFound } from './middleware/errorHandler';

const envFiles = [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), 'server/.env')];
envFiles.forEach((file) => {
  dotenv.config({ path: file });
});

const app = express();
const PORT = Number(process.env.PORT || 5000);
app.disable('x-powered-by');

if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map((value) => value.trim().replace(/\/$/, ''))
  .filter(Boolean);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.includes(normalizedOrigin) || /^http:\/\/localhost:\d+$/.test(normalizedOrigin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(normalizedOrigin);

    if (isAllowed) {
      callback(null, true);
      return;
    }

    callback(new Error('CORS policy denied'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(securityHeaders);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(sanitizeInput);
app.use(sanitizeOutput);

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Service is healthy' });
});

app.get('/api/health/ai', (req, res) => {
  res.status(200).json({ status: 'OK', provider: process.env.AI_PROVIDER || 'mock' });
});

app.use(notFound);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export default app;
