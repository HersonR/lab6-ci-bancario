'use strict';

// Repositorio en memoria (el laboratorio no requiere base de datos).
// Los saldos se guardan en centavos para evitar errores de punto flotante.
const CUENTAS_INICIALES = Object.freeze([
  { numero: '1001000001', titular: 'Ana López', moneda: 'GTQ', saldoCentavos: 1500000 },
  { numero: '1001000002', titular: 'Carlos Pérez', moneda: 'GTQ', saldoCentavos: 250000 },
  { numero: '2001000001', titular: 'Ana López', moneda: 'USD', saldoCentavos: 80000 },
]);

let cuentas = new Map();

function reiniciar() {
  cuentas = new Map(CUENTAS_INICIALES.map((cuenta) => [cuenta.numero, { ...cuenta }]));
}

// Devuelve una copia para que nadie modifique el saldo fuera de aplicarMovimiento.
function buscar(numero) {
  const cuenta = cuentas.get(numero);
  return cuenta ? { ...cuenta } : null;
}

// Equivale a una transacción: débito y crédito se aplican juntos.
function aplicarMovimiento(numeroOrigen, numeroDestino, montoCentavos) {
  cuentas.get(numeroOrigen).saldoCentavos -= montoCentavos;
  cuentas.get(numeroDestino).saldoCentavos += montoCentavos;
}

reiniciar();

module.exports = { buscar, aplicarMovimiento, reiniciar };
