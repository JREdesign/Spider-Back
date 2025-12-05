import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cron from 'node-cron';
import axios from 'axios';
import routes from './routes/routes.js'; // Asegúrate de importar correctamente tus rutas
import { middlewareInfo } from './middlewares/middleware.js';
import { setToken, getToken } from '../tokenStore.js'; // Importar setToken y getToken

// Carga las variables de entorno desde .env
dotenv.config();

export const app = express();

app.use(cors({
  origin: true, 
  credentials: true
}));

app.use(middlewareInfo); // Middleware para registrar información de las solicitudes

app.use(express.json());
app.use('/', routes); // Rutas registradas en la raíz ('/')

// Usa las variables de entorno para la URI de MongoDB Atlas y el puerto
const mongoAtlasUri = process.env.MONGODB_URI;

// Conectar a MongoDB Atlas sin las opciones obsoletas
mongoose.connect(mongoAtlasUri)
  .then(() => console.log('Connected to MongoDB!'))
  .catch(err => console.error('Error connecting to MongoDB Atlas', err));

const PORT = process.env.PORT || 3003; // Usa el puerto del .env o, si no está definido, usa el puerto 3003
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Determinar la URL del scrapper según el entorno
const scrapperUrl = process.env.NODE_ENV === 'production'
  ? process.env.SCRAPPER_URL_PROD
  : process.env.SCRAPPER_URL_DEV;

// Determinar la URL de la AI-API según el entorno
const aiApiUrl = process.env.NODE_ENV === 'production'
  ? process.env.AI_API_URL_PROD
  : process.env.AI_API_URL_DEV;

// Determinar la URL de la API normal según el entorno
const apiUrl = process.env.NODE_ENV === 'production'
  ? process.env.API_URL_PROD
  : process.env.API_URL_DEV;

const user = process.env.USERAPI;
const pass = process.env.PASSAPI;

const fetchToken = async () => {
  try {
    const response = await axios.post(`${apiUrl}/auth/login`, { username: user, password: pass });

    console.log('Response from auth:', response.data); // Añade esto para ver la respuesta completa
    if (response.data && response.data.token) {
      setToken(response.data.token); // Almacenar el token usando setToken
      console.log('Token actualizado:', getToken());
    } else {
      console.error('Token no recibido');
    }
  } catch (error) {
    console.error('Error fetching token:', error.response ? error.response.data : error.message); // Añade más información de error
  }
};

// Configurar el cron job para que se ejecute cada hora
// cron.schedule('*/2 * * * *', async () => {
cron.schedule('0 */1 * * *', async () => {
  try {
    console.log('Ejecutando tarea programada: Scrapper');
    await fetchToken(); // Obtener el token antes de hacer la solicitud
    const currentToken = getToken(); // Obtener el token actualizado
    if (!currentToken) {
      console.error('No se pudo obtener el token, omitiendo la ejecución del scrapper.');
      return;
    }
    const response = await axios.post(scrapperUrl, {}, {
      headers: {
        Authorization: `Bearer ${currentToken}`
      }
    });
    console.log('Respuesta de scrapper:', response.data);
  } catch (error) {
    console.error('Error al ejecutar scrapper:', error.response ? error.response.data : error.message);
  }
});
