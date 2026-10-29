'use strict';

const request = require('supertest');
const { crearApp } = require('../src/app');
const auditoria = require('../src/utils/auditoria');
const servicioCuentas = require('../src/services/cuentas');
const { reiniciar } = require('../src/services/transferencias');

const app = crearApp();
let bitacora;
let secuencia = 0;

// Cada prueba usa una clave de idempotencia distinta.
function nuevaClave() {
  secuencia += 1;
  return `prueba-${String(secuencia).padStart(12, '0')}`;
}

function transferir(cuerpo, clave = nuevaClave()) {
  return request(app).post('/api/v1/transferencias').set('Idempotency-Key', clave).send(cuerpo);
}

beforeEach(() => {
  reiniciar();
  bitacora = [];
  auditoria.configurarDestino((linea) => bitacora.push(JSON.parse(linea)));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('GET /health', () => {
  test('responde ok e incluye cabeceras de seguridad', async () => {
    const respuesta = await request(app).get('/health');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ estado: 'ok' });
    expect(respuesta.headers['x-powered-by']).toBeUndefined();
    expect(respuesta.headers['strict-transport-security']).toBeDefined();
    expect(respuesta.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('GET /api/v1/cuentas/:numero/saldo', () => {
  test('devuelve el saldo con la cuenta enmascarada', async () => {
    const respuesta = await request(app).get('/api/v1/cuentas/1001000001/saldo');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ cuenta: '******0001', moneda: 'GTQ', saldoCentavos: 1500000 });
  });

  test('rechaza números de cuenta con formato inválido', async () => {
    const respuesta = await request(app).get('/api/v1/cuentas/1%27%20OR%201=1/saldo');

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error).toBe('NUMERO_CUENTA_INVALIDO');
  });

  test('responde 404 si la cuenta no existe', async () => {
    const respuesta = await request(app).get('/api/v1/cuentas/9999999999/saldo');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error).toBe('CUENTA_NO_ENCONTRADA');
  });
});

describe('POST /api/v1/transferencias', () => {
  const solicitud = { cuentaOrigen: '1001000001', cuentaDestino: '1001000002', montoCentavos: 50000, concepto: 'Pago' };

  test('aplica la transferencia, emite comprobante y deja rastro de auditoría', async () => {
    const respuesta = await transferir(solicitud);

    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toMatchObject({
      cuentaOrigen: '******0001',
      cuentaDestino: '******0002',
      montoCentavos: 50000,
      moneda: 'GTQ',
      concepto: 'Pago',
    });
    expect(respuesta.body.id).toMatch(/^[0-9a-f-]{36}$/);

    const origen = await request(app).get('/api/v1/cuentas/1001000001/saldo');
    const destino = await request(app).get('/api/v1/cuentas/1001000002/saldo');
    expect(origen.body.saldoCentavos).toBe(1450000);
    expect(destino.body.saldoCentavos).toBe(300000);

    expect(bitacora).toHaveLength(1);
    expect(bitacora[0]).toMatchObject({ evento: 'TRANSFERENCIA_APLICADA', id: respuesta.body.id });
  });

  test('la bitácora nunca contiene números de cuenta completos', async () => {
    await transferir(solicitud);
    await transferir({ ...solicitud, montoCentavos: 4000000 });

    const texto = JSON.stringify(bitacora);
    expect(texto).not.toContain('1001000001');
    expect(texto).not.toContain('1001000002');
  });

  test('concepto es opcional', async () => {
    const { concepto, ...sinConcepto } = solicitud;
    const respuesta = await transferir(sinConcepto);

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.concepto).toBe('');
  });

  test('un reintento con la misma clave no debita dos veces', async () => {
    const clave = nuevaClave();
    const primera = await transferir(solicitud, clave);
    const segunda = await transferir(solicitud, clave);

    expect(primera.status).toBe(201);
    expect(segunda.status).toBe(200);
    expect(segunda.body.id).toBe(primera.body.id);

    const origen = await request(app).get('/api/v1/cuentas/1001000001/saldo');
    expect(origen.body.saldoCentavos).toBe(1450000);
  });

  test('exige el encabezado Idempotency-Key', async () => {
    const respuesta = await request(app).post('/api/v1/transferencias').send(solicitud);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error).toBe('IDEMPOTENCY_KEY_INVALIDA');
  });

  test('rechaza solicitudes con datos inválidos', async () => {
    const respuesta = await transferir({ ...solicitud, montoCentavos: -1 });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toEqual({
      error: 'SOLICITUD_INVALIDA',
      detalles: ['montoCentavos debe ser un entero positivo'],
    });
  });

  test('rechaza por fondos insuficientes y lo audita', async () => {
    const respuesta = await transferir({ ...solicitud, cuentaOrigen: '1001000002', cuentaDestino: '1001000001', montoCentavos: 250001 });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error).toBe('FONDOS_INSUFICIENTES');
    expect(bitacora[0]).toMatchObject({ evento: 'TRANSFERENCIA_RECHAZADA', codigo: 'FONDOS_INSUFICIENTES' });
  });

  test('rechaza cuentas con monedas distintas', async () => {
    const respuesta = await transferir({ ...solicitud, cuentaDestino: '2001000001' });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error).toBe('MONEDA_DISTINTA');
  });

  test('responde 404 si alguna cuenta no existe', async () => {
    const respuesta = await transferir({ ...solicitud, cuentaDestino: '9999999999' });

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error).toBe('CUENTA_NO_ENCONTRADA');
  });

  test('responde 400 ante JSON mal formado', async () => {
    const respuesta = await request(app)
      .post('/api/v1/transferencias')
      .set('Idempotency-Key', nuevaClave())
      .set('Content-Type', 'application/json')
      .send('{"cuentaOrigen": ');

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error).toBe('SOLICITUD_INVALIDA');
  });

  test('responde 413 ante cuerpos demasiado grandes', async () => {
    const respuesta = await transferir({ ...solicitud, concepto: 'x'.repeat(20000) });

    expect(respuesta.status).toBe(413);
  });
});

describe('manejo de errores', () => {
  test('rutas desconocidas responden 404', async () => {
    const respuesta = await request(app).get('/api/v1/desconocido');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error).toBe('RECURSO_NO_ENCONTRADO');
  });

  test('un error inesperado responde 500 sin exponer detalles internos', async () => {
    jest.spyOn(servicioCuentas, 'consultarSaldo').mockImplementation(() => {
      throw new Error('conexión a base de datos perdida en 10.0.0.5');
    });

    const respuesta = await request(app).get('/api/v1/cuentas/1001000001/saldo');

    expect(respuesta.status).toBe(500);
    expect(respuesta.body).toEqual({ error: 'ERROR_INTERNO' });
    expect(bitacora[0]).toMatchObject({ evento: 'ERROR_INTERNO' });
  });
});
