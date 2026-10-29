# Demostración de interrupción del pipeline

Dos ramas con fallas **intencionales** para la evidencia 4.b del reporte.
Ninguna se fusiona: el PR queda bloqueado por el Quality Gate y luego se cierra.

## Rama `demo/falla-sast`: inyección de comandos

Agregar `src/routes/diagnostico.js`:

```js
'use strict';

const { Router } = require('express');
const { exec } = require('node:child_process');

const router = Router();

// VULNERABLE A PROPÓSITO: la entrada del usuario llega sin validar a la shell.
router.get('/ping', (req, res) => {
  exec('ping -c 1 ' + req.query.host, (error, salida) => {
    res.type('text').send(salida);
  });
});

module.exports = router;
```

Y montarla en `src/app.js`:

```js
app.use('/api/v1/diagnostico', require('./routes/diagnostico'));
```

Resultado esperado:

- **SAST (CodeQL)** en rojo: `js/command-line-injection` (security-severity 9.8).
- **Build, lint y pruebas** en rojo: `security/detect-child-process`.
- **SAST (Semgrep)** también puede reportar la misma línea, según la severidad de sus reglas.
- **Quality Gate** en rojo y el botón *Merge* bloqueado.

## Rama `demo/falla-sca`: dependencia vulnerable

```bash
npm install lodash@4.17.15
```

Resultado esperado:

- **SCA** en rojo: `npm audit` clasifica `lodash` como High (prototype pollution e inyección de comandos, CVE-2021-23337).
- El paso *Revisión de dependencias del PR* (dentro de SCA) también lo detecta.
- **Quality Gate** en rojo y el merge bloqueado.

## Capturas a tomar en cada PR

1. La pestaña *Checks* del PR con los jobs en rojo.
2. El log del paso *Quality Gate* del job que falló, con el mensaje `::error::`.
3. El resumen de la ejecución (*Summary*) con la tabla del Quality Gate.
4. La pestaña *Security → Code scanning* con la alerta (solo SAST).
5. La caja de merge del PR indicando *Required statuses must pass*.
