'use strict';

const cuentas = require('../data/cuentas');
const { ErrorNegocio } = require('../errores');
const { enmascararCuenta } = require('../utils/enmascarar');

function consultarSaldo(numero) {
  const cuenta = cuentas.buscar(numero);
  if (!cuenta) {
    throw new ErrorNegocio('CUENTA_NO_ENCONTRADA', 'La cuenta no existe', 404);
  }
  return {
    cuenta: enmascararCuenta(cuenta.numero),
    moneda: cuenta.moneda,
    saldoCentavos: cuenta.saldoCentavos,
  };
}

module.exports = { consultarSaldo };
