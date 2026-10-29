'use strict';

const { Router } = require('express');
const { exec } = require('node:child_process');

const router = Router();

// VULNERABLE A PROPÓSITO (demo del laboratorio): la entrada del usuario
// llega sin validar a la shell. El pipeline debe bloquear este cambio.
router.get('/ping', (req, res) => {
  exec('ping -c 1 ' + req.query.host, (error, salida) => {
    res.type('text').send(salida);
  });
});

module.exports = router;
