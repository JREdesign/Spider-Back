import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Cargar las variables de entorno desde el archivo .env
dotenv.config();

// Obtener la clave secreta del archivo .env
const secretKey = process.env.SECRET_KEY;

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  console.log("🔑 Token: ", token);

  try {
    // Verifica el token con la clave secreta
    const decoded = jwt.verify(token, secretKey, { algorithms: ["HS256"] });
    console.log("JWT verificado:", decoded);

    // Si el token es válido, continúa con la siguiente middleware o ruta
    next();
  } catch (error) {
    console.error("La verificación del JWT falló:", error.message);
    res.status(401).json({ message: "Unauthorized" });
  }
};

export default authenticateToken;
