import express from 'express';
import { juniorChecker } from '../controllers/juniorChecker.controller.js';

const router = express.Router();

router.get('/juniorchecker', async (req, res) => {
    try {
        const userQuestion = req.query.question;
        if (!userQuestion) {
            throw new Error('No se proporcionó una pregunta válida.');
        }

        const chatResponse = await juniorChecker(userQuestion);
        res.send(chatResponse); // Aquí se devuelve solo el contenido
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
