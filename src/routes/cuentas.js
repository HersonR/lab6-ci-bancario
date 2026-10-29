'use strict';

const { Router } = require('express');
const servicioCuentas = require('../services/cuentas');
const { validarNumeroCuenta } = require('../utils/validacion');

const router = Router();

router.get('/:numero/saldo', (req, res) => {
  if (!validarNumeroCuenta(req.params.numero)) {
    return res.status(400).json({ error: 'NUMERO_CUENTA_INVALIDO' });
  }
  return res.json(servicioCuentas.consultarSaldo(req.params.numero));
});

module.exports = router;
