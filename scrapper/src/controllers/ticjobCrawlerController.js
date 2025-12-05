import Job from "../models/crawler.models.js";
import puppeteer from "puppeteer";
import axios from "axios";
import checkDuplicateJob from "../middlewares/checkDuplicateJob.js";
import dotenv from 'dotenv';
import { getToken } from '../../tokenStore.js'; // Importar getToken

// Cargar variables de entorno desde .env
dotenv.config();

const getJobData = async (page) => {
  return page.evaluate(() => {
    const extractText = (selector, index = 0) =>
      Array.from(document.querySelectorAll(selector))[
        index
      ]?.textContent?.trim() || null;

    const extractData = (selector) =>
      Array.from(document.querySelectorAll(selector)).map((el) =>
        el.textContent.trim()
      );

    const extractNestedData = (parentSelector, childSelector) =>
      Array.from(document.querySelectorAll(parentSelector)).map((container) =>
        Array.from(container.querySelectorAll(childSelector)).map((span) =>
          span.textContent.trim()
        )
      );

    const extractThumbnails = (selector) =>
      Array.from(document.querySelectorAll(selector)).map((img) => {
        const src = img.getAttribute("src");
        return src ? `https://ticjob.es${src}` : null;
      });

    const cleanLocation = (location) => {
      const cleanedLocation = location.replace(/\s+/g, " ").trim();
      return cleanedLocation.length > 30 ? "Remoto" : cleanedLocation; // Cambiar a "Remoto" si la longitud es mayor a 30
    };

    return {
      titles: extractData(".job-title"),
      companies: extractData(".job-card-info h3"),
      locations: extractData(".job-card-label.location-field").map(
        cleanLocation
      ), // Limpiar y ajustar datos de ubicación
      descriptions: extractData(".job-description p").map((description) => {
        const truncated = description.substr(0, 200);
        return { truncated, full: description };
      }),
      publicationDates: extractData(".job-card-label.date-field p").map(
        (text) => {
          const dateRegex = /\b\d{2}\/\d{2}\/\d{4}\b/;
          const [day, month, year] =
            text.match(dateRegex)?.[0].split("/") || [];
          return year ? `${year}-${month}-${day}` : null;
        }
      ),
      thumbnails: extractThumbnails(".job-card-company-logo img"),
      salaries: extractData(".job-card-label.salary-field p").map((text) => {
        const salaryRegex = /\d+\.?\d* - \d+\.?\d*/;
        return text.match(salaryRegex)?.[0] || "No se encontró salario";
      }),
      technologiesData: extractNestedData(".tags-container", "span"),
      urls: Array.from(document.querySelectorAll(".job-card")).map((el) =>
        el.getAttribute("data-url")
      ),
    };
  });
};

const filterAndCheckDuplicates = async (
  jobs,
  titles,
  companies,
  locations,
  descriptions,
  fullDescription,
  publicationDates,
  thumbnails,
  salaries,
  technologiesData,
  urls
) => {
  const today = new Date().toISOString().split("T")[0];
  const filteredJobData = [];

  for (const [index, date] of publicationDates.entries()) {
    if (date === today) {
      const duplicateReq = {
        body: { url: urls[index], publicationDate: date },
      };
      const duplicateRes = {
        status: (statusCode) => ({
          json: () => {
            if (statusCode === 409) {
              console.log("Oferta duplicada encontrada:", titles[index]);
            }
          },
        }),
      };

      const next = () => {
        filteredJobData.push({
          title: titles[index],
          company: companies[index],
          location: locations[index],
          description: descriptions[index].truncated,
          fullDescription: descriptions[index].full,
          publicationDate: date,
          thumbnail: thumbnails[index],
          salary: salaries[index],
          technologies: technologiesData[index],
          url: urls[index],
        });
      };
      await checkDuplicateJob(duplicateReq, duplicateRes, next);
    }
  }
  return filteredJobData;
};

const analyzeJobDescriptions = async (filteredJobData) => {
  return Promise.all(
    filteredJobData.map(async (job) => {
      try {
        const fullDescription = job.fullDescription;
        const encodedContents = encodeURIComponent(fullDescription);
      
        const aiApiUrl = process.env.NODE_ENV === 'production'
          ? process.env.AI_API_URL_PROD
          : process.env.AI_API_URL_DEV;
      
        const currentToken = getToken(); // Obtener el token actualizado
console.log("Current token:", currentToken); // Agregar console.log para verificar el token

        const response = await axios.get(
          `${aiApiUrl}/juniorChecker?question=${encodedContents}`,
          {
            headers: {
              Authorization: `Bearer ${currentToken}` // Incluir el token en el encabezado de autorización
            }
          }
        );
      
        console.log(encodedContents);
        console.log(response.data);
      
        return response.data;
      } catch (error) {
        console.error(`Error processing job at ${job.url}:`, error);
        return { junior: false, english: false }; // Valores predeterminados
      }
    })
  );
};

const saveJobs = async (filteredJobData, analysisResults) => {
  const promises = filteredJobData.map((job, index) => {
    const newQuery = new Job({
      ...job,
      site: "Ticjob",
      junior: analysisResults[index].junior,
      english: analysisResults[index].english,
      verifyHuman: false,
    });
    return newQuery.save();
  });
  await Promise.all(promises);
};

const searchAndSaveJobs = async (page, keyword) => {
  try {
    await page.goto("https://ticjob.es/");
    await page.type("#keywords-input", keyword);
    await page.keyboard.press("Enter");
    await page.waitForSelector(".job-title");

    const jobData = await getJobData(page);
    const {
      titles,
      companies,
      locations,
      descriptions,
      fullDescription,
      publicationDates,
      thumbnails,
      salaries,
      technologiesData,
      urls,
    } = jobData;

    const filteredJobData = await filterAndCheckDuplicates(
      jobData,
      titles,
      companies,
      locations,
      descriptions,
      fullDescription,
      publicationDates,
      thumbnails,
      salaries,
      technologiesData,
      urls
    );

    const analysisResults = await analyzeJobDescriptions(filteredJobData);

    await saveJobs(filteredJobData, analysisResults);

    return filteredJobData.map((job, index) => ({
      ...job,
      site: "Ticjob",
      junior: analysisResults[index].junior,
      english: analysisResults[index].english,
      verifyHuman: false,
    }));
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
};

export const ticjobCrawler = async (req, res, next) => {
  let browser;
  try {
    const apiUrl = process.env.NODE_ENV === 'production'
      ? process.env.API_URL_PROD
      : process.env.API_URL_DEV;

    const { data: technologies } = await axios.get(
      `${apiUrl}/technologies`
    );

    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const searchData = [];
    for (const { technology } of technologies) {
      console.log(`Buscando ofertas de trabajo para ${technology}`);
      const techData = await searchAndSaveJobs(page, technology);
      searchData.push({ [`${technology}Data`]: techData });
    }

    await browser.close();

    // Almacenar los resultados en req para el siguiente middleware
    req.ticjobData = searchData;
    next(); // Llamar a next() cuando termines
  } catch (error) {
    console.error("Error:", error);

    if (browser) {
      await browser.close();
    }

    next(error); // Llamar a next(error) en caso de error
  }
};
