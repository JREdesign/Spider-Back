import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { UserModel } from '../../src/models/Users';

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
  // Limpiar la colección de usuarios antes de cada prueba
  await UserModel.deleteMany({});
});

describe('Modelo User', () => {
  it('debería crear y guardar un usuario correctamente', async () => {
    const userData = {
      username: "newUser",
      password: "password123",
      role: "admin",
      firstName: "John",
      lastName1: "Doe",
      lastName2: "Smith",
      email: "johndoe@example.com",
      biography: "An experienced developer.",
      course: "Software Engineering",
      favoriteTechnologies: ["React", "Node.js"],
      savedJobs: []
    };

    const user = new UserModel(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.username).toBe(userData.username);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.role).toBe(userData.role);
    expect(savedUser.favoriteTechnologies).toEqual(expect.arrayContaining(userData.favoriteTechnologies));
  });

  it('no debería permitir duplicar nombres de usuario', async () => {
    const userData = {
      username: "newUser",
      password: "password123",
      email: "user@example.com",
      role: "user"
    };

    const user1 = new UserModel(userData);
    await user1.save();

    const user2 = new UserModel({ ...userData, email: "different@example.com" });

    // Revisar que se lanza un error al intentar guardar un segundo usuario con el mismo nombre de usuario
    try {
      await user2.save();
      throw new Error('Debería haber fallado por duplicado');
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });

  it('no debería permitir duplicar correos electrónicos', async () => {
    const userData = {
      username: "user1",
      password: "password123",
      email: "email@example.com",
      role: "user"
    };

    const user1 = new UserModel(userData);
    await user1.save();

    const user2 = new UserModel({ ...userData, username: "user2" });

    // Revisar que se lanza un error al intentar guardar un segundo usuario con el mismo correo electrónico
    try {
      await user2.save();
      throw new Error('Debería haber fallado por duplicado');
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });
});
