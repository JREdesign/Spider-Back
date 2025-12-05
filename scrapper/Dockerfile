# syntax=docker/dockerfile:1

ARG NODE_VERSION=21.5.0

FROM node:${NODE_VERSION}-alpine

ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copia los archivos package.json y package-lock.json al directorio de trabajo
COPY package*.json ./

# Instala las dependencias y nodemon globalmente
RUN npm install && npm install -g nodemon

# Añadir nodemon al PATH si no está ya
ENV PATH /usr/local/bin:$PATH

# Verificar que nodemon está instalado y en el PATH
RUN echo "Checking nodemon installation" && which nodemon && nodemon --version

# Copia el resto de los archivos de la aplicación al directorio de trabajo
COPY . .

# Cambia el usuario a 'node' para ejecutar la aplicación como un usuario no-root
USER node

# Expone el puerto que utiliza la aplicación
EXPOSE 3003

# Comando para ejecutar la aplicación con nodemon
CMD ["nodemon", "src/app.js"]
