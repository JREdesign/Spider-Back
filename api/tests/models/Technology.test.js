import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Technology from '../../src/models/Technology';  // Asegúrate de ajustar la ruta si es necesario

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
  // Limpiar la base de datos antes de cada prueba
  await Technology.deleteMany({});
});

describe('Modelo Technology', () => {
  beforeEach(async () => {
    // Limpiar la base de datos antes de cada prueba para evitar conflictos con la clave 'unique'
    await Technology.deleteMany({});
  });

  it('debería guardar una tecnología con sus atributos correctamente', async () => {
    const technologyData = {
      technology: "React"
    };

    const technology = new Technology(technologyData);
    const savedTechnology = await technology.save();

    expect(savedTechnology._id).toBeDefined();
    expect(savedTechnology.technology).toBe(technologyData.technology);
  });

  it('no debería permitir duplicar tecnologías', async () => {
    const technologyData = {
      technology: "React"
    };

    const technology1 = new Technology(technologyData);
    await technology1.save();

    const technology2 = new Technology({ technology: "React" });

    // Revisar la expectativa de error para asegurarse de que es capturada correctamente
    try {
      await technology2.save();
      throw new Error('Debería haber fallado por duplicado');
    } catch (error) {
      expect(error.name).toBe('MongoServerError');
      expect(error.code).toBe(11000); // Código de error estándar de MongoDB para violaciones de índices únicos
    }
  });
});

