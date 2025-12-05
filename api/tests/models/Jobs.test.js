import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Job from '../../src/models/Job';  // Asegúrate de que la ruta al archivo Job es correcta

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

describe('Modelo Job', () => {
  it('debería guardar un trabajo con sus atributos', async () => {
    const jobData = {
      title: "Desarrollador de Software",
      company: "Tech Innovations",
      location: "Remote",
      description: "Desarrollador full stack para trabajar en proyectos innovadores.",
      publicationDate: new Date(),
      thumbnail: "http://example.com/thumbnail.jpg",
      salary: "Competitivo",
      technologies: ["JavaScript", "React"],
      url: "http://example.com/job-detail",
      site: "Indeed",
      verifyHuman: true,
      junior: false,
      english: true
    };

    const job = new Job(jobData);
    const savedJob = await job.save();

    expect(savedJob._id).toBeDefined();
    expect(savedJob.title).toBe(jobData.title);
    expect(savedJob.company).toBe(jobData.company);
    expect(savedJob.location).toBe(jobData.location);
    expect(savedJob.description).toBe(jobData.description);
    expect(savedJob.publicationDate).toEqual(jobData.publicationDate);
    expect(savedJob.thumbnail).toBe(jobData.thumbnail);
    expect(savedJob.salary).toBe(jobData.salary);
    expect(savedJob.technologies).toEqual(expect.arrayContaining(jobData.technologies));
    expect(savedJob.url).toBe(jobData.url);
    expect(savedJob.site).toBe(jobData.site);
    expect(savedJob.verifyHuman).toBe(jobData.verifyHuman);
    expect(savedJob.junior).toBe(jobData.junior);
    expect(savedJob.english).toBe(jobData.english);
  });
});
