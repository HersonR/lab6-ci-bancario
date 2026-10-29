'use strict';

const { randomUUID } = require('node:crypto');
const cuentas = require('../data/cuentas');
const auditoria = require('../utils/auditoria');
const { ErrorNegocio } = require('../errores');
const { enmascararCuenta } = require('../utils/enmascarar');

// Comprobantes ya emitidos por clave de idempotencia: si el cliente reintenta
// la misma solicitud, no se debita dos veces.
const procesadas = new Map();

function rechazar(codigo, mensaje, estadoHttp, solicitud) {
  auditoria.registrar('TRANSFERENCIA_RECHAZADA', {
    codigo,
    cuentaOrigen: enmascararCuenta(solicitud.cuentaOrigen),
    cuentaDestino: enmascararCuenta(solicitud.cuentaDestino),
    montoCentavos: solicitud.montoCentavos,
  });
  throw new ErrorNegocio(codigo, mensaje, estadoHttp);
}

function transferir(solicitud, claveIdempotencia) {
  if (procesadas.has(claveIdempotencia)) {
    return { comprobante: procesadas.get(claveIdempotencia), repetida: true };
  }

  const { cuentaOrigen, cuentaDestino, montoCentavos, concepto = '' } = solicitud;
  const origen = cuentas.buscar(cuentaOrigen);
  const destino = cuentas.buscar(cuentaDestino);

  if (!origen || !destino) {
    rechazar('CUENTA_NO_ENCONTRADA', 'La cuenta de origen o destino no existe', 404, solicitud);
  }
  if (origen.moneda !== destino.moneda) {
    rechazar('MONEDA_DISTINTA', 'Las cuentas deben manejar la misma moneda', 422, solicitud);
  }
  if (origen.saldoCentavos < montoCentavos) {
    rechazar('FONDOS_INSUFICIENTES', 'Fondos insuficientes', 422, solicitud);
  }

  cuentas.aplicarMovimiento(cuentaOrigen, cuentaDestino, montoCentavos);

  const comprobante = {
    id: randomUUID(),
    fecha: new Date().toISOString(),
    cuentaOrigen: enmascararCuenta(cuentaOrigen),
    cuentaDestino: enmascararCuenta(cuentaDestino),
    montoCentavos,
    moneda: origen.moneda,
    concepto,
  };
  procesadas.set(claveIdempotencia, comprobante);

  auditoria.registrar('TRANSFERENCIA_APLICADA', {
    id: comprobante.id,
    cuentaOrigen: comprobante.cuentaOrigen,
    cuentaDestino: comprobante.cuentaDestino,
    montoCentavos,
    moneda: comprobante.moneda,
  });

  return { comprobante, repetida: false };
}

// Solo para pruebas: vuelve al estado inicial.
function reiniciar() {
  procesadas.clear();
  cuentas.reiniciar();
}

module.exports = { transferir, reiniciar };
