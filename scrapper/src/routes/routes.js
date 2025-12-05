// routes.js
import express from 'express';
import { tecnoempleoCrawler } from '../controllers/TecnoempleoCrawlerController.js';
import { ticjobCrawler } from '../controllers/ticjobCrawlerController.js';
import { jobFluentCrawler } from '../controllers/jobFluentCrawlerController.js';
import { executeMiddlewaresSequentially } from '../middlewares/middlewareUtils.js';
import { middlewareToken } from '../middlewares/middleware.js'; // Importa el middleware de token
const router = express.Router();


router.post('/scrapper/user', middlewareToken, executeMiddlewaresSequentially([
  jobFluentCrawler,
  ticjobCrawler,
  tecnoempleoCrawler
]), (req, res) => {
  res.status(200).json({
    message: 'All scrappers executed successfully',
    jobFluentData: req.jobFluentData,
    ticjobData: req.ticjobData,
    tecnoempleoData: req.tecnoempleoData
  });
});

router.post('/scrapper',middlewareToken, executeMiddlewaresSequentially([
  jobFluentCrawler,
  ticjobCrawler,
  tecnoempleoCrawler
]), (req, res) => {
  res.status(200).json({
    message: 'All scrappers executed successfully',
    jobFluentData: req.jobFluentData,
    ticjobData: req.ticjobData,
    tecnoempleoData: req.tecnoempleoData
  });
});

export default router;
