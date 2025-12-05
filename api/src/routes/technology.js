import express from "express";
import mongoose from "mongoose";
import Technology from '../models/Technology.js';

const router = express.Router();

// Agregar una nueva tecnología
router.post("/", async (req, res) => {
    try {
        const { technology } = req.body;
        const newTechnology = new Technology({ technology });
        await newTechnology.save();
        res.status(201).json(newTechnology);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Listar todas las tecnologías
router.get("/", async (req, res) => {
    try {
        const technologies = await Technology.find({});
        res.status(200).json(technologies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener una tecnología por ID
router.get("/:techId", async (req, res) => {
    try {
        const technology = await Technology.findById(req.params.techId);
        if (!technology) {
            return res.status(404).json({ message: "Technology not found" });
        }
        res.status(200).json(technology);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Actualizar una tecnología por ID
router.put("/:techId", async (req, res) => {
    try {
        const { technology } = req.body;
        const updatedTechnology = await Technology.findByIdAndUpdate(req.params.techId, { technology }, { new: true });
        if (!updatedTechnology) {
            return res.status(404).json({ message: "Technology not found" });
        }
        res.status(200).json(updatedTechnology);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminar una tecnología por ID
router.delete("/:techId", async (req, res) => {
    try {
        const deletedTechnology = await Technology.findByIdAndDelete(req.params.techId);
        if (!deletedTechnology) {
            return res.status(404).json({ message: "Technology not found" });
        }
        res.status(200).json({ message: "Technology deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export { router as technologyRouter };
