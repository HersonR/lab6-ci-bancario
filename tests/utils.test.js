'use strict';

const { enmascararCuenta } = require('../src/utils/enmascarar');
const auditoria = require('../src/utils/auditoria');
const {
  MONTO_MAXIMO_CENTAVOS,
  validarClaveIdempotencia,
  validarNumeroCuenta,
  validarTransferencia,
} = require('../src/utils/validacion');

describe('enmascararCuenta', () => {
  test('deja visibles solo los últimos 4 dígitos', () => {
    expect(enmascararCuenta('1001000001')).toBe('******0001');
  });

  test('oculta por completo valores cortos o ausentes', () => {
    expect(enmascararCuenta('123')).toBe('****');
    expect(enmascararCuenta(undefined)).toBe('****');
  });
});

describe('validarNumeroCuenta', () => {
  test.each([
    ['1001000001', true],
    ['100100000', false],
    ['10010000011', false],
    ['10010000a1', false],
    ["1001000001' OR '1'='1", false],
    [1001000001, false],
  ])('%p -> %p', (valor, esperado) => {
    expect(validarNumeroCuenta(valor)).toBe(esperado);
  });
});

describe('validarClaveIdempotencia', () => {
  test('acepta claves de 16 a 64 caracteres seguros', () => {
    expect(validarClaveIdempotencia('a1b2c3d4-e5f6-7890')).toBe(true);
  });

  test('rechaza claves cortas, ausentes o con caracteres no permitidos', () => {
    expect(validarClaveIdempotencia('corta')).toBe(false);
    expect(validarClaveIdempotencia(undefined)).toBe(false);
    expect(validarClaveIdempotencia('clave-con-espacios y <script>')).toBe(false);
  });
});

describe('validarTransferencia', () => {
  const valida = { cuentaOrigen: '1001000001', cuentaDestino: '1001000002', montoCentavos: 1000 };

  test('una solicitud correcta no tiene errores', () => {
    expect(validarTransferencia(valida)).toEqual([]);
    expect(validarTransferencia({ ...valida, concepto: 'Pago de renta' })).toEqual([]);
  });

  test.each([null, 'texto', [valida]])('rechaza cuerpos que no son objeto: %p', (cuerpo) => {
    expect(validarTransferencia(cuerpo)).toEqual(['El cuerpo de la solicitud debe ser un objeto JSON']);
  });

  test('reporta cuentas inválidas o iguales', () => {
    const errores = validarTransferencia({ ...valida, cuentaOrigen: 'abc', cuentaDestino: 'abc' });
    expect(errores).toEqual(
      expect.arrayContaining([
        'cuentaOrigen debe tener 10 dígitos',
        'cuentaDestino debe tener 10 dígitos',
        'cuentaOrigen y cuentaDestino deben ser distintas',
      ]),
    );
  });

  test.each([0, -5, 10.5, '1000', Number.MAX_SAFE_INTEGER + 1])('rechaza montos no válidos: %p', (monto) => {
    expect(validarTransferencia({ ...valida, montoCentavos: monto })).toEqual([
      'montoCentavos debe ser un entero positivo',
    ]);
  });

  test('rechaza montos por encima del límite por operación', () => {
    expect(validarTransferencia({ ...valida, montoCentavos: MONTO_MAXIMO_CENTAVOS + 1 })).toEqual([
      `montoCentavos no puede superar ${MONTO_MAXIMO_CENTAVOS}`,
    ]);
  });

  test('rechaza conceptos demasiado largos o que no son texto', () => {
    expect(validarTransferencia({ ...valida, concepto: 'x'.repeat(141) })).toHaveLength(1);
    expect(validarTransferencia({ ...valida, concepto: 42 })).toHaveLength(1);
  });
});

describe('auditoria', () => {
  test('escribe eventos como JSON con fecha y detalle', () => {
    const lineas = [];
    auditoria.configurarDestino((linea) => lineas.push(linea));

    auditoria.registrar('EVENTO_PRUEBA', { dato: 1 });
    auditoria.registrar('SIN_DETALLE');

    const [primero, segundo] = lineas.map((linea) => JSON.parse(linea));
    expect(primero).toMatchObject({ evento: 'EVENTO_PRUEBA', dato: 1 });
    expect(Date.parse(primero.fecha)).not.toBeNaN();
    expect(segundo.evento).toBe('SIN_DETALLE');
  });
});
