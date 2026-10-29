'use strict';

// Error de regla de negocio: se traduce a una respuesta HTTP controlada.
class ErrorNegocio extends Error {
  constructor(codigo, mensaje, estadoHttp) {
    super(mensaje);
    this.name = 'ErrorNegocio';
    this.codigo = codigo;
    this.estadoHttp = estadoHttp;
  }
}

module.exports = { ErrorNegocio };
