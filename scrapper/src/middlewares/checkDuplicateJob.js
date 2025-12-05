import Job from "../models/crawler.models.js";

const checkDuplicateJob = async (req, res, next) => {
  const { url, publicationDate } = req.body;
  const today = new Date().toISOString().split("T")[0]; // Formato 'YYYY-MM-DD'

  try {
    const existingJob = await Job.findOne({ url });
    if (existingJob) {
      return res.status(409).json({ message: "Job already exists in the database" });
    }

    // Verificar si la fecha de publicación es del mismo día
    if (publicationDate !== today) {
      return res.status(400).json({ message: "Job publication date is not today" });
    }

    next();
  } catch (error) {
    console.error("Error checking for duplicate job:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default checkDuplicateJob;
