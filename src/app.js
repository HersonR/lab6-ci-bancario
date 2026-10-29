'use strict';

const express = require('express');
const helmet = require('helmet');
const rutasCuentas = require('./routes/cuentas');
const rutasTransferencias = require('./routes/transferencias');
const auditoria = require('./utils/auditoria');
const { ErrorNegocio } = require('./errores');

function crearApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));

  app.get('/health', (req, res) => res.json({ estado: 'ok' }));
  app.use('/api/v1/cuentas', rutasCuentas);
  app.use('/api/v1/transferencias', rutasTransferencias);

  app.use((req, res) => res.status(404).json({ error: 'RECURSO_NO_ENCONTRADO' }));

  // Manejador final: nunca devuelve trazas internas al cliente.
  app.use((err, req, res, _next) => {
    if (err instanceof ErrorNegocio) {
      return res.status(err.estadoHttp).json({ error: err.codigo, mensaje: err.message });
    }
    // Errores del parser de JSON (cuerpo mal formado o demasiado grande).
    if (err.expose && err.status >= 400 && err.status < 500) {
      return res.status(err.status).json({ error: 'SOLICITUD_INVALIDA' });
    }
    auditoria.registrar('ERROR_INTERNO', { mensaje: err.message });
    return res.status(500).json({ error: 'ERROR_INTERNO' });
  });

  return app;
}

module.exports = { crearApp };
