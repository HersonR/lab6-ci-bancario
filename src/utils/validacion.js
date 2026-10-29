'use strict';

const PATRON_CUENTA = /^\d{10}$/;
const PATRON_IDEMPOTENCIA = /^[A-Za-z0-9-]{16,64}$/;
const MONTO_MAXIMO_CENTAVOS = 5000000; // Límite por operación: 50,000.00
const LARGO_MAXIMO_CONCEPTO = 140;

function validarNumeroCuenta(valor) {
  return typeof valor === 'string' && PATRON_CUENTA.test(valor);
}

function validarClaveIdempotencia(valor) {
  return typeof valor === 'string' && PATRON_IDEMPOTENCIA.test(valor);
}

// Devuelve la lista de errores; una lista vacía significa solicitud válida.
function validarTransferencia(cuerpo) {
  if (!cuerpo || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) {
    return ['El cuerpo de la solicitud debe ser un objeto JSON'];
  }

  const { cuentaOrigen, cuentaDestino, montoCentavos, concepto } = cuerpo;
  const errores = [];

  if (!validarNumeroCuenta(cuentaOrigen)) {
    errores.push('cuentaOrigen debe tener 10 dígitos');
  }
  if (!validarNumeroCuenta(cuentaDestino)) {
    errores.push('cuentaDestino debe tener 10 dígitos');
  }
  if (cuentaOrigen === cuentaDestino) {
    errores.push('cuentaOrigen y cuentaDestino deben ser distintas');
  }
  if (!Number.isSafeInteger(montoCentavos) || montoCentavos <= 0) {
    errores.push('montoCentavos debe ser un entero positivo');
  } else if (montoCentavos > MONTO_MAXIMO_CENTAVOS) {
    errores.push(`montoCentavos no puede superar ${MONTO_MAXIMO_CENTAVOS}`);
  }
  if (concepto !== undefined && (typeof concepto !== 'string' || concepto.length > LARGO_MAXIMO_CONCEPTO)) {
    errores.push(`concepto debe ser texto de hasta ${LARGO_MAXIMO_CONCEPTO} caracteres`);
  }

  return errores;
}

module.exports = {
  MONTO_MAXIMO_CENTAVOS,
  validarNumeroCuenta,
  validarClaveIdempotencia,
  validarTransferencia,
};
