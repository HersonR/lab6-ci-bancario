# ms-transferencias

Microservicio bancario de consulta de saldos y transferencias entre cuentas, con un pipeline de
Integración Continua que aplica controles **Shift-Left** (SAST, SCA, secretos) y **Quality Gates**
alineados con **PCI-DSS v4.0 (req. 6.3)** y **NIST SP 800-218 SSDF (PW.4, PW.5)**.

Laboratorio 6, curso 606: Administración de Website y Sistemas de Información (MIBC 2026, UMG).

## API

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Estado del servicio |
| `GET` | `/api/v1/cuentas/:numero/saldo` | Saldo de una cuenta (número enmascarado en la respuesta) |
| `POST` | `/api/v1/transferencias` | Transferencia entre cuentas de la misma moneda |

Ejemplo de transferencia (requiere el encabezado `Idempotency-Key` para que un reintento no debite dos veces):

```bash
curl -X POST http://localhost:3000/api/v1/transferencias -H "Content-Type: application/json" -H "Idempotency-Key: demo-0000000000000001" -d '{"cuentaOrigen":"1001000001","cuentaDestino":"1001000002","montoCentavos":50000,"concepto":"Pago"}'
```

Controles del servicio: validación estricta de entradas, montos en centavos enteros, límite por
operación, cuentas enmascaradas en respuestas y bitácora, bitácora de auditoría en JSON,
cabeceras de seguridad (Helmet), límite de 10 KB por solicitud y errores sin trazas internas.

La autenticación (OAuth2 / mTLS) y la persistencia real quedan fuera del alcance del laboratorio.

## Desarrollo local

Requiere Node.js 24.

```bash
npm ci
npm test
npm start
```

## Pipeline de CI

Definido en [.github/workflows/ci.yml](.github/workflows/ci.yml).

- [Arquitectura y controles](docs/arquitectura.md)
- [Paso 1: protección de ramas y secretos](docs/paso1-proteccion-ramas-secretos.md)
- [Paso 3: Quality Gates](docs/paso3-quality-gates.md)
- [Demostración de fallas](docs/demo-fallas.md)
