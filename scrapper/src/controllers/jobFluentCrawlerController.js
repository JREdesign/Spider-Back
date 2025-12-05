import Job from "../models/crawler.models.js";
import puppeteer from "puppeteer";
import { setTimeout } from "node:timers/promises";
import checkDuplicateJob from "../middlewares/checkDuplicateJob.js";
import axios from "axios"; // Importa Axios
import dotenv from 'dotenv';
import { getToken } from '../../tokenStore.js'; // Importar getToken

// Cargar variables de entorno desde .env
dotenv.config();

const searchAndSaveJobs = async (page) => {
  try {
    await page.waitForSelector(".published-date.text-muted");

    const locationText = await page.evaluate(() => {
      const locationElement = document.querySelector(".pg-title");
      return locationElement
        ? locationElement.textContent.trim()
        : "No se encontró la ubicación";
    });

    const locations =
      locationText.match(/Barcelona|Madrid|Valencia|Remoto/gi) || [];
    const location =
      locations.length > 0 ? locations[0] : "No se encontró la ubicación";

    const links = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll(".offer-title.font-lighter.m-0 a")
      ).map((element) => element.href);
    });

    const publicationDates = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll(".published-date.text-muted")
      ).map((element) => element.textContent.trim());
    });

    const jobDetails = [];
    const today = new Date().toISOString().split("T")[0];

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const publicationDateText = publicationDates[i];

      let formattedPublicationDate = null;

      if (publicationDateText) {
        if (publicationDateText.toLowerCase() === "yesterday") {
          const publicationDate = new Date();
          publicationDate.setDate(publicationDate.getDate() - 1); // Resta un día para "yesterday"
          formattedPublicationDate = publicationDate
            .toISOString()
            .split("T")[0];
        } else if (publicationDateText.toLowerCase() === "today") {
          formattedPublicationDate = today;
        } else {
          const daysRegex = /\d+/;
          const daysMatch = publicationDateText.match(daysRegex);
          const days = daysMatch ? parseInt(daysMatch[0]) : 0;
          const publicationDate = new Date();
          publicationDate.setDate(publicationDate.getDate() - days); // Resta los días especificados
          formattedPublicationDate = publicationDate
            .toISOString()
            .split("T")[0];
        }
      }

      if (formattedPublicationDate !== today) {
        // Si la fecha de publicación no es hoy, saltamos esta oferta
        continue;
      }

      try {
        await page.goto(link, { waitUntil: "networkidle2" });
        await page.waitForSelector(
          "[itemprop='hiringOrganization'] [itemprop='name']",
          { timeout: 60000 }
        );

        const title = await page.evaluate(() => {
          const titleElement = document.querySelector("[itemprop='title']");
          return titleElement
            ? titleElement.textContent.trim()
            : "No se encontró el título";
        });

        const company = await page.evaluate(() => {
          const companyElement = document.querySelector(
            "[itemprop='hiringOrganization'] [itemprop='name']"
          );
          return companyElement
            ? companyElement.textContent.trim()
            : "No se encontró la compañía";
        });

        const descriptionElement = await page.$(
          ".offer-description-content [itemprop='description']"
        );
        let fullDescription = "No se encontró la descripción";
        let truncatedDescription = "No se encontró la descripción";

        if (descriptionElement) {
          // Obtener la descripción completa
          fullDescription = await page.evaluate(
            (element) => element.innerText.trim(),
            descriptionElement
          );

          truncatedDescription =
            fullDescription.length > 100
              ? fullDescription.substring(0, 100) + "..."
              : fullDescription;
        }

        const logoUrl = await page.evaluate(() => {
          const logoElement = document.querySelector(".offer-logo img");
          return logoElement ? logoElement.getAttribute("src") : null;
        });

        const salaryElement = await page.$(
          "[itemprop='baseSalary'] [itemprop='value']"
        );
        const salary = salaryElement
          ? await page.evaluate((element) => {
              const minValueElement = element.querySelector(
                "[itemprop='minValue']"
              );
              const maxValueElement = element.querySelector(
                "[itemprop='maxValue']"
              );
              const minValue = minValueElement
                ? minValueElement.textContent.trim().replace(".", "").trim()
                : "No se encontró el salario mínimo";
              const maxValue = maxValueElement
                ? maxValueElement.textContent.trim().replace(".", "").trim()
                : "No se encontró el salario máximo";
              const currencySymbol = element.textContent.trim().includes("€")
                ? "€"
                : "";
              return `${currencySymbol}${minValue} - ${currencySymbol}${maxValue}`;
            }, salaryElement)
          : "No se encontró el salario";

        const skillsElement = await page.$("[itemprop='skills']");
        const skillsContent = skillsElement
          ? await page.evaluate(
              (element) => element.getAttribute("content"),
              skillsElement
            )
          : "";
        const technologies = skillsContent
          .split(", ")
          .map((skill) => skill.trim());

        const jobData = {
          title,
          company,
          location,
          truncatedDescription,
          fullDescription,
          publicationDate: formattedPublicationDate,
          thumbnail: logoUrl,
          salary,
          technologies,
          url: link,
        };

        // Verifica si la oferta es duplicada y si la fecha de publicación es hoy
        const req = {
          body: { url: jobData.url, publicationDate: jobData.publicationDate },
        };
        const res = {
          status: (statusCode) => ({
            json: (json) => {
              if (statusCode === 409 || statusCode === 400) {
                // Oferta duplicada o no publicada hoy
                console.log(
                  `Oferta duplicada o no publicada hoy: ${jobData.title}`
                );
              }
            },
          }),
        };

        const next = async () => {
          // Llama a la API externa para obtener los valores de 'junior' y 'english'
          let junior = null;
          let english = null;
          try {
            const currentToken = getToken(); // Obtener el token actualizado
            const response = await axios.get(
              `${process.env.NODE_ENV === 'production'
                ? process.env.AI_API_URL_PROD
                : process.env.AI_API_URL_DEV}/juniorChecker?question=${encodeURIComponent(fullDescription)}`,
              {
                headers: {
                  Authorization: `Bearer ${currentToken}`
                }
              }
            );
        
            console.log("Respuesta de la API:", fullDescription);
            console.log("Respuesta de la API:", response.data);
        
            if (response.data) {
              junior = response.data.junior;
              english = response.data.english;
            }
          } catch (apiError) {
            console.error(
              "Error al obtener datos de la API externa:",
              apiError
            );
          }
        
          jobData.junior = junior;
          jobData.english = english;
        
          jobDetails.push(jobData);
        };
        await checkDuplicateJob(req, res, next);
      } catch (error) {
        console.error(`Error navegando a la URL ${link}:`, error);
        jobDetails.push({
          title: "No se encontró el título",
          company: "No se encontró la compañía",
          location: "No se encontró la ubicación",
          truncatedDescription: "No se encontró la descripción",
          fullDescription:"No se encontró la descripción",
          publicationDate: null,
          thumbnail: null,
          salary: "No se encontró el salario",
          technologies: [],
          url: link,
          junior: null,
          english: null,
        });
      }
    }

    const promises = jobDetails.map((job) => {
      const newQuery = new Job({
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.truncatedDescription,
        publicationDate: job.publicationDate,
        thumbnail: job.thumbnail,
        fullDescription: job.fullDescription,
        salary: job.salary,
        technologies: job.technologies,
        url: job.url,
        site: "JobFluent",
        junior: job.junior, // Guarda el resultado de 'junior'
        english: job.english, // Guarda el resultado de 'english'
      });
      return newQuery.save();
    });

    await Promise.all(promises);

    return jobDetails;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
};

export const jobFluentCrawler = async (req, res, next) => {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const searchData = [];

    const urls = [
      "/es/empleos-barcelona",
      "/es/empleos-madrid",
      "/es/empleos-valencia",
      "/es/empleos-remoto",
    ];

    for (const url of urls) {
      console.log(`Buscando ofertas de trabajo en ${url}`);
      await page.goto(`https://www.jobfluent.com${url}`);
      const locationData = await searchAndSaveJobs(page);
      searchData.push({ [url.split("/").pop() + "Data"]: locationData });
    }

    await browser.close();

    // Almacenar los resultados en req para el siguiente middleware
    req.jobFluentData = searchData;
    next(); // Llamar a next() cuando termines
  } catch (error) {
    console.log("Error", error);

    if (browser) {
      await browser.close();
    }

    next(error); // Llamar a next(error) en caso de error
  }
};
