import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/Users.js';
import dotenv from 'dotenv';

// Cargar las variables de entorno desde el archivo .env
dotenv.config();

const router = express.Router();

// Middleware para verificar el token
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
      if (err) {
        console.error("Token verification failed:", err);
        return res.sendStatus(403); // Token no válido o expirado
      }
      req.user = user;
      next();
    });
  } else {
    console.error("No token provided");
    res.sendStatus(401); // No token provided
  }
};

// Middleware para verificar rol de admin
export const verifyTokenAndAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === 'admin') {
      next();
    } else {
      res.sendStatus(403);
    }
  });
};

// Registro de usuarios
router.post('/register', async (req, res) => {
  const { username, password, role = 'user' } = req.body;
  const userExists = await UserModel.findOne({ username });
  if (userExists) {
    return res.status(400).json({ message: 'El usuario ya existe' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new UserModel({ username, password: hashedPassword, role });
  try {
    await newUser.save();
    res.status(201).json({ message: 'Usuario registrado satisfactoriamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login de usuarios
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await UserModel.findOne({ username });
  if (!user) {
    return res.status(400).json({ message: 'No existe el usuario' });
  }
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).json({ message: 'Password incorrecta' });
  }
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.SECRET_KEY, {
    expiresIn: '24h'
  });
  res.json({ token, user: { username: user.username, id: user._id, role: user.role } });
});

// Actualizar contraseña del usuario
router.put('/update-password', verifyToken, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);  // Genera salt para el hash
    const hashedPassword = await bcrypt.hash(newPassword, salt);  // Cifra la nueva contraseña

    const updatedUser = await UserModel.findByIdAndUpdate(req.user.id, {
      password: hashedPassword
    }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando contraseña: ' + error.message });
  }
});

// Actualizar perfil de usuario
router.put('/update-profile', verifyToken, async (req, res) => {
  const { firstName, lastName1, lastName2, email, biography, course, favoriteTechnologies, linkedin } = req.body;
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(req.user.id, {
      firstName,
      lastName1,
      lastName2,
      email,
      biography,
      course,
      favoriteTechnologies,
      linkedin // Incluir linkedin en la actualización del perfil
    }, { new: true });
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Guardar trabajo en perfil de usuario
router.post('/save-job', verifyToken, async (req, res) => {
  const { jobId } = req.body;
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(req.user.id, {
      $addToSet: { savedJobs: jobId }
    }, { new: true });
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/save-job/:jobId', verifyToken, async (req, res) => {
  const jobId = req.params.jobId;
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(req.user.id, {
      $pull: { savedJobs: jobId } // Utiliza $pull para eliminar el jobId del array savedJobs
    }, { new: true });
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener perfil de usuario
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).populate('savedJobs');
    console.log(user); // Esto imprimirá los datos del usuario incluyendo favoriteTechnologies
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener todos los usuarios (Solo accesible para admins)
router.get('/all-users', async (req, res) => {
  try {
    const users = await UserModel.find({}).populate('savedJobs');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Eliminar un usuario (Solo accesible para admins)
router.delete('/user/:id', async (req, res) => {
  try {
    const result = await UserModel.findByIdAndDelete(req.params.id);
    if (result) {
      res.status(200).json({ message: 'Usuario eliminado correctamente' });
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

export { router as userRouter };
