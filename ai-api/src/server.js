import express from "express";
import chatRoutes from "./routes/chatBot.routes.js";
import juniorCheckerRoutes from "./routes/juniorChecker.routes.js";
import cors from "cors";
import dotenv from "dotenv"; // Importa dotenv
import authenticateToken from "./middleware/authenticateToken.js"; // Importa el middleware


dotenv.config(); // Carga las variables de entorno desde el archivo .env

const app = express();
const port = process.env.PORT || 3005; // Usa el puerto definido en las variables de entorno o 3005 por defecto

app.use(express.json());

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// Determinar las URLs según el entorno
const scrapperUrl =
  process.env.NODE_ENV === "production"
    ? process.env.SCRAPPER_URL_PROD
    : process.env.SCRAPPER_URL_DEV;

const aiApiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.AI_API_URL_PROD
    : process.env.AI_API_URL_DEV;

const apiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.API_URL_PROD
    : process.env.API_URL_DEV;

// Usar las rutas
app.use("/", authenticateToken, chatRoutes);
app.use("/", authenticateToken, juniorCheckerRoutes);
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
