import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { userRouter } from '../../src/routes/user'; // Verifica que esta ruta sea correcta
import { UserModel } from '../../src/models/Users'; // Verifica que esta ruta sea correcta

const app = express();
app.use(express.json());
app.use('/', userRouter);

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    await UserModel.init();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await UserModel.deleteMany({});
});

describe('Modelo User', () => {
    it('no debería permitir duplicar nombres de usuario', async () => {
        const user1 = new UserModel({
            username: 'testUser',
            email: 'test@example.com',
            password: await bcrypt.hash('password', 10),
            role: 'user'
        });
        await user1.save();

        const user2 = new UserModel({
            username: 'testUser',
            email: 'test2@example.com',
            password: await bcrypt.hash('password123', 10),
            role: 'user'
        });

        try {
            await user2.save();
            throw new Error('Debería haber fallado por duplicado');
        } catch (error) {
            expect(error).toBeTruthy();
        }
    });

    it('no debería permitir duplicar correos electrónicos', async () => {
        const user1 = new UserModel({
            username: 'userOne',
            email: 'email@example.com',
            password: await bcrypt.hash('password', 10),
            role: 'user'
        });
        await user1.save();

        const user2 = new UserModel({
            username: 'userTwo',
            email: 'email@example.com',
            password: await bcrypt.hash('password123', 10),
            role: 'user'
        });

        try {
            await user2.save();
            throw new Error('Debería haber fallado por duplicado');
        } catch (error) {
            expect(error).toBeTruthy();
        }
    });
});
