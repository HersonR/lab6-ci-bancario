# Paso 1: Protección de ramas y secretos

Configuración en GitHub para que **ningún cambio llegue a `main` sin pasar el pipeline**.
Haz cada sección y toma una captura de la pantalla final para el reporte.

> El repositorio debe ser **público**. En repositorios privados del plan gratuito,
> las reglas de rama, Code Scanning y las atestaciones no están disponibles.

## 1. Regla de protección de `main` (Ruleset)

*Settings → Rules → Rulesets → New ruleset → New branch ruleset*

| Campo | Valor |
|---|---|
| Ruleset name | `proteccion-main` |
| Enforcement status | **Active** |
| Bypass list | Vacía (ni el administrador puede saltarse la regla) |
| Target branches | *Add target → Include default branch* |

Reglas a marcar:

- [x] **Restrict deletions**: nadie puede borrar `main`.
- [x] **Require linear history**: historial limpio y auditable.
- [x] **Require a pull request before merging**
  - Required approvals: **0**. Eres el único colaborador y GitHub no permite aprobar tu propio PR.
    En un banco serían **1 o 2** revisores (segregación de funciones, PCI-DSS 6.2.3).
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require conversation resolution before merging
- [x] **Require status checks to pass**
  - [x] Require branches to be up to date before merging
  - *Add checks* → buscar **`Quality Gate`** (aparece después de la primera ejecución del pipeline).
- [x] **Block force pushes**: nadie puede reescribir el historial.
- [x] (Opcional) **Require code scanning results** → herramienta *CodeQL*, umbral *High or higher*.

Guardar con **Create**.

## 2. Seguridad del repositorio

*Settings → Advanced Security* (en algunas cuentas aparece como *Code security*)

- [x] **Dependency graph**: lo necesita la revisión de dependencias de los PR.
- [x] **Dependabot alerts** y **Dependabot security updates**
- [x] **Secret Protection → Secret scanning** y **Push protection**: GitHub rechaza un `git push` que contenga un token conocido.
- [ ] **Code scanning → CodeQL analysis: NO activar "Default setup"**. El pipeline ya ejecuta CodeQL
  (configuración avanzada) y las dos opciones chocan.

## 3. Permisos de GitHub Actions

*Settings → Actions → General*

- **Actions permissions**: *Allow enterprise, and select non-enterprise, actions and reusable workflows*
  → marcar solo **Allow actions created by GitHub**. El pipeline solo usa actions de GitHub
  (`actions/*`, `github/codeql-action`); Gitleaks y Semgrep se instalan y verifican dentro del job.
- [x] **Require actions to be pinned to a full-length commit SHA**, si tu cuenta muestra la opción.
- **Workflow permissions**: **Read repository contents and packages permissions**.
  El `GITHUB_TOKEN` es de solo lectura por defecto; cada job pide solo lo que necesita.
- [ ] *Allow GitHub Actions to create and approve pull requests*: **desmarcado**.

## 4. Manejo de secretos

- El pipeline **no necesita ningún secreto propio**. El único token es `GITHUB_TOKEN`: lo emite GitHub
  en cada ejecución, vence al terminar el job y tiene permisos mínimos (`permissions:` en `ci.yml`).
- La firma de procedencia usa **OIDC** (`id-token: write`) con Sigstore, sin llaves privadas guardadas.
- Si en el futuro se necesitara un secreto (por ejemplo, para desplegar), iría en
  *Settings → Secrets and variables → Actions*, preferiblemente en un **Environment** (`produccion`)
  con revisores obligatorios. Nunca en el código ni en `.env` versionados.
- `.gitignore` excluye `.env` y `.env.*`. Gitleaks revisa **todo el historial** en cada ejecución.
