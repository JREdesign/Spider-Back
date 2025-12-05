// routes/chatRoutes.js
import express from 'express';
import { chatBot } from '../controllers/chatBot.controller.js';

const router = express.Router();

router.get('/chatbot', async (req, res) => {
    try {
        const userQuestion = req.query.question;
        if (!userQuestion) {
            throw new Error('No se proporcionó una pregunta válida.');
        }

        const messages = [{ role: 'user', content: userQuestion }];
        const chatResponse = await chatBot(messages);
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');

        res.send(chatResponse);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/chatbot', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            throw new Error('No se proporcionó un historial de mensajes válido.');
        }

        const chatResponse = await chatBot(messages);
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');

        res.send(chatResponse);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
