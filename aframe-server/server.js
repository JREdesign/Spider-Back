// Load required modules
const http = require("http");
const path = require("path");
const express = require("express");
const socketIo = require("socket.io");
const easyrtc = require("open-easyrtc");
const cors = require("cors");

process.title = "networked-aframe-server";

const port = process.env.PORT || 3006;

const app = express();

app.use(express.static("public"));
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  })
);

const webServer = http.createServer(app);
const socketServer = socketIo.listen(webServer, { "log level": 1 });

socketServer.use((socket, next) => {
  console.log("Middleware de Socket.IO para la conexión:", socket.id);
  next();
});

socketServer.on("connection", (socket) => {
  console.log("Un cliente se ha conectado y ha mandado un mensaje de chat");

  socket.on("chat message", (msg) => {
    console.log("Mensaje de chat recibido:", msg, socket.id);

    // Opcional: retransmitir el mensaje a todos los clientes conectados
    socketServer.emit("chat message", msg);
  });

  socket.on("color", (data) => {
    console.log("Color cambiado:", data, socket.id);

    // Opcional: retransmitir el mensaje a todos los clientes conectados
    socket.broadcast.emit("color", data);
    socketServer.emit("color", data);
  });

  socket.on("colision", (data) => {
    if (!data.procesado) {
      console.log("Position:", data.position, socket.id);
      console.log("Position:", data.es, socket.id);
      data.procesado = true;
      // a todos menos al emisor
      socket.broadcast.emit("colision", data);
    }
  });
});

const myIceServers = [
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];
easyrtc.setOption("appIceServers", myIceServers);
easyrtc.setOption("logLevel", "debug");
easyrtc.setOption("demosEnable", false);

easyrtc.events.on(
  "easyrtcAuth",
  (socket, easyrtcid, msg, socketCallback, callback) => {
    easyrtc.events.defaultListeners.easyrtcAuth(
      socket,
      easyrtcid,
      msg,
      socketCallback,
      (err, connectionObj) => {
        if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
          callback(err, connectionObj);
          return;
        }

        connectionObj.setField("credential", msg.msgData.credential, {
          isShared: false,
        });

        console.log(
          "[" + easyrtcid + "] Credential saved!",
          connectionObj.getFieldValueSync("credential")
        );

        callback(err, connectionObj);
      }
    );
  }
);

easyrtc.events.on(
  "roomJoin",
  (connectionObj, roomName, roomParameter, callback) => {
    console.log(
      "[" + connectionObj.getEasyrtcid() + "] Credential retrieved!",
      connectionObj.getFieldValueSync("credential")
    );
    easyrtc.events.defaultListeners.roomJoin(
      connectionObj,
      roomName,
      roomParameter,
      callback
    );
  }
);

easyrtc.listen(app, socketServer, null, (err, rtcRef) => {
  console.log("Initiated");

  rtcRef.events.on(
    "roomCreate",
    (appObj, creatorConnectionObj, roomName, roomOptions, callback) => {
      console.log("roomCreate fired! Trying to create: " + roomName);

      appObj.events.defaultListeners.roomCreate(
        appObj,
        creatorConnectionObj,
        roomName,
        roomOptions,
        callback
      );
    }
  );
});

webServer.listen(port, () => {
  console.log("listening on http://localhost:" + port);
});