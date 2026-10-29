'use strict';

// Bitácora de auditoría estructurada (una línea JSON por evento).
// Quien llama debe enviar los números de cuenta ya enmascarados.
let destino = (linea) => process.stdout.write(`${linea}\n`);

function registrar(evento, detalle = {}) {
  destino(JSON.stringify({ fecha: new Date().toISOString(), evento, ...detalle }));
}

// Permite redirigir la bitácora, por ejemplo a un arreglo en las pruebas.
function configurarDestino(nuevoDestino) {
  destino = nuevoDestino;
}

module.exports = { registrar, configurarDestino };
