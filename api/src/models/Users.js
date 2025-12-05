import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, default: 'user' },
  firstName: { type: String, default: '' },  // Nombre
  lastName1: { type: String, default: '' },  // Apellido 1
  lastName2: { type: String, default: '' },  // Apellido 2
  email: { type: String, default: ''},  // E-mail
  linkedin: { type: String, default: '' },  // LinkedIn
  biography: { type: String, default: '' },  // Biografía
  course: { type: String, default: '' },  // Curso
  favoriteTechnologies: { type: [String], default: [] },  // Tecnologías destacadas
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }]  // Asegúrate de que 'Job' es el nombre del modelo correcto
});

export const UserModel = mongoose.model("users", UserSchema);
