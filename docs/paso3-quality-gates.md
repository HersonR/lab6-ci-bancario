# Paso 3: Quality Gates

Un Quality Gate es un umbral objetivo: si el resultado lo supera, el pipeline termina en rojo
y la protección de rama impide el merge. Así **un artefacto vulnerable nunca se promueve**.

| # | Gate | Umbral | Dónde se aplica |
|---|---|---|---|
| 1 | Secretos | 0 secretos en todo el historial | `secretos` → Gitleaks termina con código 1 |
| 2 | Lint de seguridad | 0 errores y 0 advertencias | `npm run lint` (`--max-warnings 0`) |
| 3 | Pruebas | 100 % de pruebas aprobadas | `npm test` |
| 4 | Cobertura | ≥ 80 % en líneas, sentencias, funciones y ramas | `coverageThreshold` en `package.json` |
| 5 | SAST Semgrep | 0 hallazgos de severidad ERROR | Paso *Quality Gate* del job `sast-semgrep` |
| 6 | SAST CodeQL | 0 hallazgos con security-severity ≥ 7.0 (High/Critical) | Paso *Quality Gate* del job `sast-codeql` |
| 7 | SCA | 0 vulnerabilidades High o Critical en dependencias | Paso *Quality Gate* del job `sca` |
| 8 | Integridad | Firmas del registro npm válidas | `npm audit signatures` |
| 9 | Dependencias nuevas (PR) | 0 dependencias nuevas High o Critical | `revision-dependencias` |
| 10 | Gate final | Todos los controles en *success* | Job `quality-gate` (check obligatorio en `main`) |

## Criterio de riesgo

- **Bloquean**: High y Critical, porque son explotables y en banca afectan la confidencialidad e
  integridad de los fondos y datos de clientes.
- **Se registran pero no bloquean**: Moderate y Low. Quedan en los reportes y en Dependabot para
  remediarse según el plan de gestión de vulnerabilidades (PCI-DSS 6.3.1: clasificar por riesgo).
  Ejemplo real: hoy `npm audit` reporta 5 hallazgos **Low** en `jest`, una herramienta de pruebas
  que no va al artefacto. Se documentan y no detienen el pipeline.

## Validación local antes del push

```bash
npm ci
npm run lint
npm test
npm audit --audit-level=high
```
