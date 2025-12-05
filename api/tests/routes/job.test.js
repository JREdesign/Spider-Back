import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jobsRouter } from '../../src/routes/job'; // Asegúrate de que esta es la ruta correcta
import Job from '../../src/models/Job'; // Asegúrate de que esta es la ruta correcta

const app = express();
app.use(express.json());
app.use('/jobs', jobsRouter);

describe('API Jobs', () => {
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
    await Job.deleteMany({});
  });


  test('GET /jobs should retrieve empty array initially', async () => {
    const res = await request(app).get('/jobs');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('POST /jobs should create a new job', async () => {
    const newJob = {
      title: 'Developer',
      company: 'Tech Company',
      location: 'Remote',
      description: 'A great position',
      publicationDate: new Date(),
      thumbnail: 'http://example.com/image.jpg',
      salary: '100000',
      technologies: ['JavaScript', 'React'],
      url: 'http://example.com',
      site: 'Indeed',
      verifyHuman: true,
      junior: true,
      english: true,
    };
    const res = await request(app).post('/jobs').send(newJob);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
  });

  test('GET /jobs/:jobId should retrieve a job by ID', async () => {
    const job = new Job({
      title: 'Developer',
      company: 'Tech Company',
      location: 'Remote'
    });
    await job.save();

    const res = await request(app).get(`/jobs/${job._id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe(job.title);
  });

  test('PATCH /jobs/:jobId should update a job', async () => {
    const job = new Job({
      title: 'Developer',
      company: 'Tech Company',
      location: 'Remote'
    });
    await job.save();

    const updatedData = { location: 'On-site' };
    const res = await request(app).patch(`/jobs/${job._id}`).send(updatedData);
    expect(res.status).toBe(200);
    expect(res.body.location).toBe('On-site');
  });

  test('DELETE /jobs/:jobId should delete a job', async () => {
    const job = new Job({
      title: 'Developer',
      company: 'Tech Company',
      location: 'Remote'
    });
    await job.save();

    const res = await request(app).delete(`/jobs/${job._id}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Job deleted successfully');
  });
});

