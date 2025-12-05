import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { technologyRouter } from '../../src/routes/technology'; // Ajusta la ruta según sea necesario
import Technology from '../../src/models/Technology'; // Ajusta la ruta según sea necesario

const app = express();
app.use(express.json());
app.use('/technologies', technologyRouter);

describe('API Technologies', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Technology.deleteMany({});
  });

  test('POST /technologies should create a new technology', async () => {
    const technologyData = { technology: 'Node.js' };
    const res = await request(app).post('/technologies').send(technologyData);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.technology).toEqual(technologyData.technology);
  });

  test('GET /technologies should retrieve all technologies', async () => {
    const technologyData = [{ technology: 'Node.js' }, { technology: 'React' }];
    await Technology.insertMany(technologyData);
    const res = await request(app).get('/technologies');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test('GET /technologies/:techId should retrieve a specific technology by ID', async () => {
    const technology = new Technology({ technology: 'Node.js' });
    await technology.save();
    const res = await request(app).get(`/technologies/${technology._id}`);
    expect(res.status).toBe(200);
    expect(res.body.technology).toBe('Node.js');
  });

  test('PUT /technologies/:techId should update a technology', async () => {
    const technology = new Technology({ technology: 'Node.js' });
    await technology.save();
    const updatedData = { technology: 'Node.js Updated' };
    const res = await request(app).put(`/technologies/${technology._id}`).send(updatedData);
    expect(res.status).toBe(200);
    expect(res.body.technology).toBe(updatedData.technology);
  });

  test('DELETE /technologies/:techId should delete a technology', async () => {
    const technology = new Technology({ technology: 'Node.js' });
    await technology.save();
    const res = await request(app).delete(`/technologies/${technology._id}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Technology deleted successfully');
  });
});

