import express from "express";
import mongoose from "mongoose";
import Job from "../models/Job.js"; 

const router = express.Router();

// Obtener todos los empleos con filtros y orden descendente por _id
router.get("/", async (req, res) => {
  try {
    const { date, location, technologies, junior, english, otherZones, search, verifyHuman } = req.query;
    let query = {};

    // Filtro por término de búsqueda
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { company: searchRegex },
        { technologies: searchRegex }
      ];
    }

    // Filtro por ubicación
    if (location && otherZones !== 'true') {
      let locations = location.split(",").map(loc => new RegExp(loc.trim(), 'i'));
      query.location = { $in: locations };
    }

    // Filtro por "Otras zonas"
    if (otherZones === 'true') {
      query.location = { $nin: ['Madrid', 'Barcelona', 'Asturias', 'Valencia', 'Remoto'].map(loc => new RegExp(loc, 'i')) };
    }

    // Filtro por tecnologías
    if (technologies) {
      let techArray = technologies.split(",").map(tech => new RegExp(tech.trim(), 'i'));
      query.technologies = { $all: techArray };
    }

    // Filtro por ofertas Junior
    if (junior) {
      query.junior = junior === 'true';
    }

    // Filtro por verificación humana
    if (verifyHuman) {
      query.verifyHuman = verifyHuman === 'true';
    }

    // Filtro por ofertas en inglés
    if (english) {
      query.english = english === 'true';
    }

    // Filtro por fecha de publicación
    if (date) {
      let today = new Date();
      let dateFilter = new Date();
      switch (date) {
        case '24h':
          dateFilter.setDate(today.getDate() - 1);
          break;
        case '7d':
          dateFilter.setDate(today.getDate() - 7);
          break;
        case '15d':
          dateFilter.setDate(today.getDate() - 15);
          break;
        default:
          dateFilter = null;
      }
      if (dateFilter) {
        query.publicationDate = { $gte: dateFilter };
      }
    }

    // Ordena los resultados por _id en orden descendente que trae de MongoDB
    const jobs = await Job.find(query).sort({ _id: -1 });
    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear un nuevo empleo
router.post("/", async (req, res) => {
  const job = new Job({
    title: req.body.title,
    company: req.body.company,
    location: req.body.location,
    description: req.body.description,
    publicationDate: req.body.publicationDate,
    thumbnail: req.body.thumbnail,
    salary: req.body.salary,
    technologies: req.body.technologies,
    url: req.body.url,
    site: req.body.site,
    verifyHuman: req.body.verifyHuman,
    junior: req.body.junior,
    english: req.body.english,
  });

  try {
    const result = await job.save();
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Obtener un empleo por ID
router.get("/:jobId", async (req, res) => {
  try {
    const result = await Job.findById(req.params.jobId);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Actualizar un empleo por ID
router.patch("/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const updatedJob = await Job.findByIdAndUpdate(jobId, req.body, { new: true });

    if (!updatedJob) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json(updatedJob);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar un empleo por ID
router.delete("/:jobId", async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.jobId);
    res.status(200).json({ message: "Job deleted successfully" });
  } catch (err) {
    console.error("Error deleting job:", err);
    res.status(500).json({ error: err.message });
  }
});

export { router as jobsRouter };
