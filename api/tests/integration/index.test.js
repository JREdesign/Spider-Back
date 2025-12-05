import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { userRouter } from '../../src/routes/user.js';
import { jobsRouter } from '../../src/routes/job.js';
import { technologyRouter } from '../../src/routes/technology.js';
import request from 'supertest';

dotenv.config();

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  app = express();
  app.use(express.json());
  app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
  }));
  app.use("/auth", userRouter);
  app.use("/jobs", jobsRouter);
  app.use("/technologies", technologyRouter);
  app.get("/health", (req, res) => {
    res.status(200).send("Server is healthy!");
  });
});

afterAll(async () => {
  if (mongoose.connection) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Definir una prueba para verificar que el endpoint de salud está funcionando
describe('Endpoint de salud del servidor', () => {
  it('debería responder con Server is healthy!', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Server is healthy!');
  });
});

// Puedes agregar más pruebas aquí para otros endpoints
