import Job from "../models/crawler.models.js";
import puppeteer from "puppeteer";
import axios from "axios";
import checkDuplicateJob from "../middlewares/checkDuplicateJob.js";
import dotenv from 'dotenv';
import { getToken } from '../../tokenStore.js'; // Importar getToken

// Cargar variables de entorno desde .env
dotenv.config();

const baseUrl = "https://www.tecnoempleo.com";

const searchAndSaveJobs = async (page, keyword) => {
  try {
    await page.goto("https://www.tecnoempleo.com/");
    await page.type("#te", keyword);
    await page.click(".btn.btn-warning.btn-block.mb-3.font-weight-medium");
    await page.waitForSelector(".font-weight-bold[title]");

    const jobData = await page.evaluate(() => {
      const jobElements = document.querySelectorAll(
        ".p-3.border.rounded.mb-3.bg-white"
      );

      return Array.from(jobElements).map((jobElement) => {
        const href = jobElement.getAttribute("onclick");
        const url = href ? href.split("'")[1] : null;

        const titleElement = jobElement.querySelector(
          "a.font-weight-bold[title]"
        );
        const title = titleElement ? titleElement.textContent.trim() : null;

        const companyElement = jobElement.querySelector(
          "a.text-primary.link-muted[title]"
        );
        const company = companyElement
          ? companyElement.textContent.trim()
          : null;

        const locationElement = jobElement.querySelector(".d-block.d-lg-none.text-gray-800 b");
        let location = locationElement ? locationElement.textContent.trim() : null;

        if (location && location.toLowerCase() === "100% remoto") {
          location = "Remoto";
        }

        const descriptionElement = jobElement.querySelector(
          ".hidden-md-down.text-gray-800"
        );
        let description = "";
        if (descriptionElement) {
          const textParts = descriptionElement.innerHTML.split("<br>");
          description = textParts.length >= 2 ? textParts[1].trim() : "";
        }

        const publicationDateElement = jobElement.querySelector(
          ".col-12.col-lg-3.text-gray-700.pt-2.text-right.hidden-md-down"
        );
        const dateRegex = /\b\d{2}\/\d{2}\/\d{4}\b/;
        let publicationDate = null;
        if (publicationDateElement) {
          const text = publicationDateElement.innerText.trim();
          const dateMatch = text.match(dateRegex);
          if (dateMatch) {
            const dateString = dateMatch[0];
            const [day, month, year] = dateString.split("/");
            publicationDate = `${year}-${month}-${day}`;
          }
        }

        const salaryElement = jobElement.querySelector(
          ".col-12.col-lg-3.text-gray-700.pt-2.text-right.hidden-md-down"
        );
        const salaryRegex = /\d+\.?\d*€ - \d+\.?\d*€/;
        const salary =
          salaryElement && salaryRegex.test(salaryElement.textContent.trim())
            ? salaryElement.textContent.trim().match(salaryRegex)[0]
            : "No se encontró salario";

        const technologyContainer = jobElement.querySelector(
          ".hidden-md-down.text-gray-800"
        );
        const technologies = Array.from(
          technologyContainer.querySelectorAll("span.badge")
        ).map((span) => span.textContent.trim());

        return {
          url,
          title,
          company,
          location,
          description,
          publicationDate,
          salary,
          technologies,
        };
      });
    });

    const filteredJobData = [];
    const today = new Date().toISOString().split("T")[0];

    for (const job of jobData) {
      const duplicateReq = {
        body: { url: job.url, publicationDate: job.publicationDate },
      };
      const duplicateRes = {
        status: (statusCode) => ({
          json: (json) => {
            if (statusCode === 409) {
              console.log("Oferta duplicada encontrada:", job.title);
            } else if (statusCode === 400) {
              console.log(
                "La fecha de publicación no es de hoy para la oferta:",
                job.title
              );
            }
          },
        }),
      };
      const next = () => filteredJobData.push(job);

      await checkDuplicateJob(duplicateReq, duplicateRes, next);
    }
    // await setTimeout(200);

    const isJuniors = await Promise.all(
      filteredJobData.map(async (job, index) => {
        try {
          // Abrir una nueva pestaña para cada trabajo
          const jobPage = await page.browser().newPage();
          await jobPage.goto(job.url);
          await jobPage.waitForSelector(".fs--16.text-gray-800");
    
          const experience = await jobPage.evaluate(() => {
            const experienceElement = Array.from(document.querySelectorAll('.list-item'))
              .find(el => el.textContent.includes('Experiencia'));
            return experienceElement ? experienceElement.querySelector('span.float-end').textContent.trim() : null;
          });
    
          console.log(`Job ${index} experience:`, experience); // Log para verificar el contenido de experience
    
          const allText = await jobPage.evaluate(() => {
            const descriptionElements = document.querySelectorAll(".fs--16.text-gray-800");
            return Array.from(descriptionElements)
              .map((element) => element.textContent.trim())
              .join("\n");
          });
    
          console.log(`Job ${index} allText:`, allText); // Log para verificar el contenido de allText
    
          // Obtener la miniatura
          const thumbnail = await jobPage.evaluate(() => {
            const thumbnailElement = document.querySelector(
              ".p-2.px-2.m-0.text-center.bg-light-radial.rounded img"
            );
            return thumbnailElement ? thumbnailElement.getAttribute("src") : null;
          });
    
          const combinedText = `Description: ${allText}\nExperience: ${experience}`;
    
          // Procesar la descripción con IA
          const aiApiUrl = process.env.NODE_ENV === 'production'
            ? process.env.AI_API_URL_PROD
            : process.env.AI_API_URL_DEV;
    
          const urlWithDescriptions = `${aiApiUrl}/juniorChecker?question=${encodeURIComponent(combinedText)}`;
    
          try {
            const currentToken = getToken(); // Obtener el token actualizado
            const response = await axios.get(urlWithDescriptions, {
              headers: {
                Authorization: `Bearer ${currentToken}` // Incluir el token en el encabezado de autorización
              }
            });
            console.log("Response from axios.get:", response.data); // Agrega este console.log
    
            await jobPage.close(); // Cerrar la pestaña del trabajo
    
            return {
              ...response.data,
              thumbnail: thumbnail ? `${baseUrl}${thumbnail}` : null,
              fullDescription: allText,
            };
          } catch (error) {
            console.error("Error en la solicitud al 3005:", error.response ? error.response.data : error.message);
            await jobPage.close(); // Asegurarse de cerrar la pestaña del trabajo en caso de error
            return null; // O cualquier valor predeterminado que tenga sentido para tu lógica
          }
        } catch (error) {
          console.error(`Error processing job at ${job.url}:`, error);
          return null; // O cualquier valor predeterminado que tenga sentido para tu lógica
        }
      })
    );
    
    // Guardar los trabajos con los datos obtenidos
    const promises = filteredJobData.map(async (job, index) => {
      const jobData = isJuniors[index];
      if (jobData) {
        const newQuery = new Job({
          ...job,
          site: "Tecnoempleo",
          junior: isJuniors[index].junior,
          english: isJuniors[index].english,
          thumbnail: isJuniors[index].thumbnail,
          fullDescription: isJuniors[index].fullDescription,
          verifyHuman: false,
        });

        await newQuery.save();
      }
    });

    await Promise.all(promises);

    const jobList = filteredJobData.map((job, index) => ({
      ...job,
      site: "Tecnoempleo",
      junior: isJuniors[index].junior,
      english: isJuniors[index].english,
      thumbnail: isJuniors[index].thumbnail,
      fullDescription: isJuniors[index].fullDescription,
      verifyHuman: false,
    }));

    return jobList;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
};

export const tecnoempleoCrawler = async (req, res, next) => {
  let browser;
  try {
    const apiUrl = process.env.NODE_ENV === 'production'
      ? process.env.API_URL_PROD
      : process.env.API_URL_DEV;

    const technologiesResponse = await axios.get(
      `${apiUrl}/technologies`
    );
    const technologies = technologiesResponse.data;

    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const searchData = [];

    for (const tech of technologies) {
      console.log(`Buscando ofertas de trabajo para ${tech.technology}`);
      const techData = await searchAndSaveJobs(page, tech.technology);
      searchData.push({ [tech.technology + "Data"]: techData });
    }

    await browser.close();

    // Almacenar los resultados en req para el siguiente middleware
    req.tecnoempleoData = searchData;
    next(); // Asegúrate de llamar a next() cuando termines
  } catch (error) {
    console.log("Error", error);

    if (browser) {
      await browser.close();
    }

    next(error); // Llama a next(error) en caso de error
  }
};
