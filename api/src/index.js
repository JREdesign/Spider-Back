import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { userRouter } from "./routes/user.js";
import { jobsRouter } from "./routes/job.js";
import { technologyRouter } from "./routes/technology.js"; 

// Cargar variables de entorno
dotenv.config();

const app = express();

app.use(express.json());

// Configuración CORS
app.use(cors({
  origin: '*',
  credentials: true
}));

// Endpoint de salud para comprobar que el servidor está funcionando
app.get("/health", (req, res) => {
  res.status(200).send("Server is healthy!");
});

// Uso de routers para diferentes rutas
app.use("/auth", userRouter);
app.use("/jobs", jobsRouter);
app.use("/technologies", technologyRouter); 

// Conexión a la base de datos utilizando una variable de entorno
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true, 
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB!'))
.catch(err => console.error('Error connecting to MongoDB Atlas', err));

const PORT = process.env.PORT || 3004; // Usa el puerto del .env o, si no está definido, usa el puerto 3004
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Determinar las URLs según el entorno
const scrapperUrl = process.env.NODE_ENV === 'production'
  ? process.env.SCRAPPER_URL_PROD
  : process.env.SCRAPPER_URL_DEV;

const aiApiUrl = process.env.NODE_ENV === 'production'
  ? process.env.AI_API_URL_PROD
  : process.env.AI_API_URL_DEV;

const apiUrl = process.env.NODE_ENV === 'production'
  ? process.env.API_URL_PROD
  : process.env.API_URL_DEV;
