'use strict';

const { crearApp } = require('./app');

const PUERTO = Number(process.env.PORT) || 3000;

crearApp().listen(PUERTO, () => {
  console.log(`Microservicio de transferencias escuchando en el puerto ${PUERTO}`);
});
