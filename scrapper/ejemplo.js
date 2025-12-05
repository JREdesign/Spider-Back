const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
require('dotenv').config();

// Configuración de la conexión a MongoDB
const { MONGODB_URI } = process.env;
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // estamos conectados!
  console.log('Connected to MongoDB');
});

// Esquema de la página web para Mongoose
const webPageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  name: { type: String, required: true },
  total: { type: Number, required: true }
});

const WebPage = mongoose.model('WebPage', webPageSchema);

// Funcionalidad de web scraping y guardado en MongoDB
const queries = ['JavaScript Madrid', 'PHP Madrid', 'Python Madrid', 'Java Madrid'];

queries.forEach((query) => {
  (async () => {
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto('https://ticjob.es/');
      await page.waitForSelector('#keywords-input');
      await page.evaluate((q) => {
        document.querySelector('#keywords-input').value = q;
      }, query);
      const searchButton = '#main-search-button';
      await page.waitForSelector(searchButton);
      await page.click(searchButton);

      await page.waitForFunction(() => {
        const element = document.querySelector('#numberOfferFound');
        return element && element.textContent.trim().length > 0;
      });

      let date = new Date();
      let year = date.getFullYear();
      let month = ('0' + (date.getMonth() + 1)).slice(-2); // Los meses empiezan en 0
      let day = ('0' + date.getDate()).slice(-2);
      let hour = ('0' + date.getHours()).slice(-2);
      let formattedDate = `${year}-${month}-${day}_${hour}`;
  
      await page.screenshot({path: 'img/'+formattedDate+'_'+query.replace(/\s+/g, '').toLowerCase()+'.png'});
      
      const number = await page.evaluate(() => document.querySelector('#numberOfferFound').textContent);

      // Crea un nuevo documento de WebPage y lo guarda en MongoDB
      const newWebPage = new WebPage({
        url: 'https://ticjob.es/',
        name: query,
        total: parseInt(number, 10) // Asegúrate de convertir a número
      });

      newWebPage.save()
        .then(doc => {
          console.log('Resultado guardado con éxito:', doc);
        })
        .catch(err => {
          console.error('Error al guardar en MongoDB:', err);
        });

      await browser.close();
    } catch (error) {
      console.error('Error durante el web scraping:', error);
    }
  })();
});

