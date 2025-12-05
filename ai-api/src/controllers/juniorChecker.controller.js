import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
const api_key = process.env.API_KEY;

export async function juniorChecker(userQuestion) {
  try {
    const url = "https://api.openai.com/v1/chat/completions";
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${api_key}`,
    };
    const data = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You will evaluate job offers based on two criteria. Respond with 'true' or 'false' for each criterion in a JSON format. \
                Criterion 1: Does the job offer require a high level of English? Return 'true' if: \
                - The job description is mostly in English. \
                - English proficiency levels (B1, B2, C1, C2) are mentioned (note: 'CSS' and 'BI' is not related to English proficiency and should be ignored). \
                - It specifically asks for a 'high level of English'. \
                - The word 'English' is mentioned as a requirement. \
                Otherwise, return 'false', even if there are technical terms in English. \
                Criterion 2: Is the job suitable for a junior position (less than 3 years of experience)? Return 'true' if: \
                - The required experience is 3 years or less. \
                - The word 'junior' is mentioned. \
                - The required experience is a minimum of 1 or 2 years. \
                - The description states '2-3 years of experience'. \
                - The description states 'at least two years of experience'. \
                - The description/experience states '3 years of experience', unless it mentions more than 3 years of experience elsewhere. \
                Return 'false' if: \
                - The word 'senior' is mentioned for the position. \
                - More than 3 years of experience is required. \
                Response should be a JSON object with the keys 'english' and 'junior'. \
                For example: {\"english\": true, \"junior\": false}.",
        },
        { role: "user", content: userQuestion },
      ],
    };
    const response = await axios.post(url, data, { headers });
    const responseData = response.data;

    if (!responseData.choices || responseData.choices.length === 0) {
      throw new Error("Error en la solicitud a la API");
    }

    // Obtener el contenido del mensaje
    const messageContent = responseData.choices[0].message.content;

    // Verificar si el contenido es un JSON válido
    let parsedContent;
    try {
      parsedContent = JSON.parse(messageContent);
    } catch (e) {
      throw new Error(
        "La respuesta de la API no es un JSON válido: " + messageContent
      );
    }

    // Retornar solo los valores del JSON parseado
    return parsedContent;
  } catch (error) {
    throw new Error("Error en la solicitud a la API: " + error.message);
  }
}
