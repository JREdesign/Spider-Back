import jwt from "jsonwebtoken";
import { setToken } from "../../tokenStore.js";

import dotenv from "dotenv";

// Cargar las variables de entorno desde el archivo .env
dotenv.config();

// Obtener la clave secreta del archivo .env
const secretKey = process.env.SECRET_KEY;
export const middlewareInfo = (req, res, next) => {
  console.log("🚀 Method: ", req.method);
  console.log("🤖 Path: ", req.path);
  console.log("🐵 Body: ", req.body);
  console.log("🧐 Query: ", req.query);
  console.log("🦾 Params: ", req.params);
  console.log("-----");

  next();
};

export const middlewareToken = (req, res, next) => {
  const auth = req.headers["authorization"];
  const parts = auth.split(" ");
  const token = parts[1];

  if (token) {
    console.log("🔑 Token: ", token);

    try {
      // Verifica el token con la clave secreta
      const decoded = jwt.verify(token, secretKey, { algorithms: ["HS256"] });
      console.log("JWT verificado:", decoded);

      // Guardar el token en tokenStore.js
      setToken(token);

      // Verifica el rol
      if (decoded.role === "admin") {
        console.log("Usuario es administrador");
        next(); // Continuar con la siguiente middleware o ruta
      } else {
        console.log("Usuario no es administrador");
        res.status(403).json({ message: "Forbidden" }); // Devuelve un error de acceso prohibido
      }
    } catch (error) {
      console.error("La verificación del JWT falló:", error.message);
      res.status(401).json({ message: "Unauthorized" });
    }
  } else {
    console.log("🔑 Token: ", "No");
    res.status(401).json({ message: "Unauthorized" });
  }
};