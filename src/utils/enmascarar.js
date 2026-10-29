'use strict';

// Solo se exponen los últimos 4 dígitos (criterio de PCI-DSS 3.4.1).
function enmascararCuenta(numero) {
  const texto = String(numero ?? '');
  if (texto.length <= 4) {
    return '****';
  }
  return '*'.repeat(texto.length - 4) + texto.slice(-4);
}

module.exports = { enmascararCuenta };
