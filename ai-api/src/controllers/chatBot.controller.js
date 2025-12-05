// controllers/chatBot.controller.js
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const api_key = process.env.API_KEY;

async function chatBot(messages) {
    try {
        const url = 'https://api.openai.com/v1/chat/completions';
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${api_key}`
        };
        const data = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {
                    "role": "system",
                    "content": "Comportate como una persona de recursos humanos que busca contratar a un programador.\
                    Intenta no enviar mucho texto o peticiones al usuario a la vez, dado que va a ser una conversacion y no un solo mensaje.\
                    Inventate datos diferentes cada vez que hables con un usuario, por ejemplo, tu nombre y tu empresa\
                   Saluda al user por su nombre, preguntale como está. \
                    Proporciona feedback constructivo y preguntas técnicas específicas.\
                    En algun momento avanzado de la conversación podrias hacerle una kata, una prueba técnica de código\
                    ",
                },
                ...messages
            ]
        };

        const response = await axios.post(url, data, { headers });
        return response.data.choices[0].message.content;
    } catch (error) {
        throw new Error('Error en la solicitud a la API');
    }
}

export { chatBot };
