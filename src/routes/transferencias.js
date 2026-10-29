'use strict';

const { Router } = require('express');
const { transferir } = require('../services/transferencias');
const { validarClaveIdempotencia, validarTransferencia } = require('../utils/validacion');

const router = Router();

router.post('/', (req, res) => {
  const clave = req.get('Idempotency-Key');
  if (!validarClaveIdempotencia(clave)) {
    return res.status(400).json({
      error: 'IDEMPOTENCY_KEY_INVALIDA',
      mensaje: 'El encabezado Idempotency-Key es obligatorio (16 a 64 caracteres alfanuméricos o guiones)',
    });
  }

  const errores = validarTransferencia(req.body);
  if (errores.length > 0) {
    return res.status(400).json({ error: 'SOLICITUD_INVALIDA', detalles: errores });
  }

  const { comprobante, repetida } = transferir(req.body, clave);
  return res.status(repetida ? 200 : 201).json(comprobante);
});

module.exports = router;
