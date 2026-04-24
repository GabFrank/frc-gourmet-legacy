# Plan — Análisis ventas + Specs RRHH y Comisiones para frc-gourmet-legacy

## Contexto

Restaurante Don Franco tiene 15 PDFs (enero-2025 → marzo-2026) de reportes de ventas por producto/mes generados por un sistema legacy externo que será reemplazado. El usuario quiere:

1. Analizar esos PDFs para obtener datos reales (productos, medias, rankings) y usarlos como baseline para diseñar el nuevo módulo.
2. Especificar un módulo de **RRHH** (funcionarios, cargos, turnos/asistencia, salarios/liquidación, vales, préstamos recurrentes, créditos a clientes con movimientos, penalizaciones).
3. Especificar un módulo de **Comisiones** con reglas configurables (meta unidades, % sobre venta, meta venta total, extras y penalizaciones manuales, requisitos todo-o-nada o proporcionales) para entregar al equipo dev que trabaja en [frc-gourmet-legacy](https://github.com/GabFrank/frc-gourmet-legacy).

La idea: el PDF aporta datos reales para que decisiones de diseño (categorías, roles, metas) estén ancladas a la operación real; los specs entregables son implementables directos en el repo existente (Angular 15 + Electron + TypeORM + SQLite).

**Orden confirmado**: Spec RRHH → Análisis ventas → Spec Comisiones. Las comisiones dependen de funcionarios (RRHH) y del catálogo/categorización real (análisis).

**Origen PDF**: one-shot. No se necesita importador recurrente en el spec. POS futuro alimenta ventas.

---

## Supuestos y decisiones confirmadas con el usuario

- Integración: módulo integrado al repo frc-gourmet-legacy, reutilizando `Persona`, `Usuario`, `Producto`, `Familia`/`Subfamilia`, `Venta`, `VentaItem`, `Caja`, `FormasPago`, `Cliente`.
- Penalizaciones: registro manual por supervisor.
- Liquidación comisión: mensual, cálculo automático + aprobación supervisor.
- Validación de requisitos: configurable por regla (todo-o-nada o proporcional).
- Asignación productos ↔ funcionario: categoría como helper de carga masiva, lista final editable por producto.
- Tipos de comisión soportados: meta unidades + % sobre venta + meta venta local + extras manuales (únicos o recurrentes definidos/indefinidos) + penalizaciones.
- Vales: pueden salir de caja operativa hoy o de caja mayor en el futuro (cajaOrigen flexible, extensible a FK Caja).
- Préstamos recurrentes: cuotas se precargan al mes y supervisor puede editar/saltar.
- Columna de margen del PDF es errónea → se ignora. Costo vendrá de `PrecioCosto` del POS.
- Roles/cargos aún no definidos → se proponen tras análisis PDF.

---

## Repo target — hallazgos clave

Stack: Angular 15 standalone + Electron 24 + TypeORM 0.3 + SQLite. `synchronize: true` (no migraciones). Convenciones: strings UPPERCASE en DB, entidades extienden `BaseModel` (id/createdAt/updatedAt/createdBy/updatedBy→Usuario), tablas snake_case plural, componentes standalone + TabsService.

**Ya existe y se reutiliza**:
- `Persona` ([persona.entity.ts](../../../workspace/frc-gourmet-legacy/src/app/database/entities/personas/persona.entity.ts)) — base para `Funcionario`.
- `Usuario` — login, FK persona_id. `VentaItem.createdBy` identifica al mozo.
- `Role` + `UsuarioRole` — permisos sistema (NO cargo laboral).
- `Cliente` con `credito`/`limite_credito` (sin historial de movimientos).
- `Producto`, `Familia→Subfamilia→Producto`, `Presentacion`, `PrecioVenta`, `PrecioCosto`.
- `Venta` (estado, caja, pago, descuentos), `VentaItem` (producto, cantidad, precios, estado, created_by).
- `Caja` (sesión con apertura/cierre), `Moneda`, `FormasPago`, `Pago`/`PagoDetalle`.
- Dashboard ventas con `TopProducto` interface (datos mock).
- `rrhhDash` — placeholder visual sin lógica.

**NO existe**: Funcionario, Cargo, Turno, Asistencia, LiquidacionSueldo, Vales, PréstamoFuncionario + cuotas, MovimientoCreditoCliente, Penalización, ReglaComision, LiquidacionComision, libs PDF para exports.

**Gotchas críticos para el equipo dev**:
- Todos los enums/strings UPPERCASE.
- Extender `BaseModel`; nunca duplicar campos de Persona.
- Patrón de módulo nuevo: entity → registrar en `database.config.ts` → `electron/handlers/X.handler.ts` → `preload.ts` (interfaz + contextBridge) → `repository.service.ts` (métodos Observable) → componente standalone → `app.component.ts` `openXxxTab()` + entrada sidenav.
- No hay migraciones: reinicio crea tablas. Backup DB antes de reiniciar en prod.
- `VentaItem.createdBy` = atribución al funcionario. Confirmar con cliente si es correcto o si hay que agregar `mozo_id` explícito en `Venta`.

---

## Estructura de salidas del proyecto `don-franco-gestion/`

```
don-franco-gestion/
  meses/                        (15 PDFs existentes)
  scripts/
    extract_pdfs.py             (Fase 0 — extracción PDF → texto/JSON crudo)
    analyze.py                  (Fase 1 — produce 4 entregables)
  output/
    monthly/{mes}-{año}.json    (15 archivos, estructura por mes)
    consolidated.csv            (1 fila por producto-mes)
    report.md                   (rankings, medias, tendencias)
    categories.json             (agrupación sugerida por categoría)
  specs/
    rrhh.md                     (Entregable RRHH — entregable al equipo dev)
    comisiones.md               (Entregable Comisiones — entregable al equipo dev)
```

---

## Fase 0 — Setup extracción PDF

1. Verificar PDFs tienen texto seleccionable (no imágenes): `pdftotext enero-2025.pdf -`. Si son imágenes → requiere OCR (`tesseract`), ampliar alcance.
2. Instalar dependencias: `brew install poppler` (para `pdftotext`) + `pip install pdfplumber` (tablas multi-columna).
3. Inspeccionar 3 PDFs representativos (enero-2025, julio-2025, enero-2026) para identificar delimitadores y cambios de formato.

## Fase 1 — Análisis de ventas (4 entregables simultáneos)

Orden interno:
1. `extract_pdfs.py` sobre los 15 PDFs → texto crudo por mes.
2. Diseñar parser en `analyze.py`, probar con 1 PDF, ajustar por variaciones.
3. Correr sobre 15, producir entregables.

**Formato `output/monthly/{mes}-{año}.json`**:
```
{ "mes": "enero-2025", "totalVentaMes": number,
  "productos": [ { "nombre": "UPPERCASE", "cantidad": number, "ventaTotal": number } ] }
```
Se omite margen/costo (dato erróneo del PDF).

**`output/consolidated.csv`**: columnas `mes, producto, cantidad, venta_total`.

**`output/report.md`**: top 10 global, ranking mes a mes, peores performers, media mensual, varianza estacional, productos detectados solo esporádicamente.

**`output/categories.json`**: categorías inferidas por nombre (PARRILLA, PIZZA, PASTAS, EMPANADAS, BEBIDAS, POSTRES, MINUTAS, GUARNICIONES, QUESADILLAS). Input directo para reglas de comisión. Mínimo 5 categorías con ≥3 productos cada una.

**Validación Fase 1**: checksum `sum(ventaTotal) == total PDF` tolerancia 0% en 3 meses manualmente; detección de duplicados por normalización UPPERCASE; cobertura 100% de productos.

---

## Fase 2 — Spec RRHH (`specs/rrhh.md`)

Secciones obligatorias: contexto/objetivo, glosario, RF numerados (RF-RH-001…), modelo de datos (por subdominio), diagrama de relaciones textual, flujos clave, UI/UX por pantalla, integraciones con entidades existentes, criterios de aceptación por RF, fuera de alcance, riesgos/supuestos, puntos de extensión, tabla de trazabilidad RF→entidad→pantalla.

**Entidades nuevas por subdominio**:

*Funcionarios*
- `Cargo` (id, nombre UPPERCASE, descripcion, activo). Distinto a `Role`.
- `Funcionario` (persona_id FK, cargo_id FK, fechaIngreso, fechaEgreso nullable, salarioBase, usuario_id nullable FK, activo).

*Turnos y asistencia*
- `Turno` (nombre enum MAÑANA/TARDE/NOCHE/CORRIDO, horaEntrada, horaSalida).
- `FuncionarioTurno` (funcionario_id, turno_id, fechaDesde, fechaHasta nullable) — historial de cambios.
- `Asistencia` (funcionario_id, fecha, horaEntrada nullable, horaSalida nullable, estado PRESENTE/AUSENTE/TARDANZA/MEDIA_FALTA/JUSTIFICADO, observacion, registradoPor_id FK Usuario).

*Salarios / liquidación*
- `LiquidacionSueldo` (funcionario_id, periodo YYYY-MM, salarioBase, totalHaberes, totalDescuentos, totalNeto, estado BORRADOR/APROBADO/PAGADO, aprobadoPor_id, fechaAprobacion, fechaPago).
- `LiquidacionItem` (liquidacion_id, tipo SALARIO_BASE/COMISION/VALE/PRESTAMO_CUOTA/PENALIZACION/EXTRA_MANUAL, descripcion, monto ± , referencia_id nullable).

*Créditos funcionarios (vales + préstamos)*
- `CreditoFuncionario` (funcionario_id, tipo VALE/PRESTAMO, monto, descripcion, fechaOtorgamiento, cajaOrigen OPERATIVA/MAYOR, caja_id nullable FK (extensión), estado ACTIVO/CANCELADO/COMPLETADO, totalCuotas nullable (null = indefinido), creadoPor_id).
- `CuotaCreditoFuncionario` (credito_id, numeroCuota, montoOriginal, montoPagado, fechaProgramada, fechaPago nullable, estado PENDIENTE/PAGADA/SALTEADA/EDITADA, editadaPor_id, observacion).

*Créditos clientes*
- `MovimientoCreditoCliente` (cliente_id FK, tipo CARGO/PAGO, monto, venta_id nullable FK, fecha, creadoPor_id). Saldo = sum(CARGO) − sum(PAGO). Se respeta `Cliente.limite_credito`.

*Penalizaciones*
- `Penalizacion` (funcionario_id, tipo TARDANZA/QUEJA/AMBIENTE/OTRO, descripcion, monto negativo, fecha, registradaPor_id, asistencia_id nullable).

**Flujos clave a documentar**:
1. Alta funcionario: Persona existente o nueva → Funcionario → Cargo → Turno.
2. Fichaje diario → eventual tardanza → penalización opcional.
3. Vale: crear `CreditoFuncionario` tipo VALE → cuota única → se descuenta próxima liquidación.
4. Préstamo recurrente: crear `CreditoFuncionario` tipo PRESTAMO → N cuotas precargadas → cada mes auto-insert en liquidación, supervisor puede editar/saltar (estado EDITADA/SALTEADA).
5. Cierre de mes: generar `LiquidacionSueldo` en BORRADOR → auto-agrega salario + cuotas pendientes + penalizaciones + (posteriormente) comisión aprobada → supervisor aprueba → PAGADO.
6. Crédito cliente: venta con forma pago CREDITO → `MovimientoCreditoCliente` CARGO → cobros posteriores como PAGO.

**Puntos de extensión**:
- `CreditoFuncionario.cajaOrigen` hoy enum, FK `caja_id` opcional desde ya (para cuando exista caja mayor real).
- `LiquidacionItem.referencia_id` genérico = nuevos tipos sin migración.

**Roles sugeridos (refinar post-Fase 1)**: MOZO, PARRILLERO, PIZZERO, CAJERO, COCINERO, LAVACOPAS, ENCARGADO, DELIVERY, ADMINISTRADOR. Correlacionar con `categories.json`.

---

## Fase 3 — Spec Comisiones (`specs/comisiones.md`)

Mismas secciones estructurales que RRHH.

**Entidades nuevas**:
- `ReglaComision` (nombre, descripcion, tipo META_UNIDADES/PORCENTAJE_VENTA/META_VENTA_LOCAL/EXTRA_MANUAL/PENALIZACION_MANUAL, montoBase nullable, porcentaje nullable, metaUnidades nullable, metaMontoLocal nullable, modoValidacion TODO_O_NADA/PROPORCIONAL, recurrencia UNICA/DEFINIDA/INDEFINIDA, mesesRecurrencia nullable, activo).
- `ReglaComisionProducto` (regla_id, producto_id) — lista editable; `subfamilia_id` es helper de carga masiva inicial, no binding.
- `ReglaComisionRequisito` (regla_id, descripcion, tipo TARDANZA_MAX/QUEJA_MAX/CUSTOM, umbral, peso decimal) — los pesos suman 1 en modo PROPORCIONAL.
- `FuncionarioReglaComision` (funcionario_id, regla_id, fechaDesde, fechaHasta nullable, parametroExtra JSON nullable).
- `LiquidacionComision` (funcionario_id, periodo, estado BORRADOR/APROBADO, totalCalculado, totalFinal, aprobadoPor_id, fechaAprobacion).
- `LiquidacionComisionItem` (liquidacion_id, regla_id nullable, descripcion, montoCalculado, montoFinal editable, tipo CALCULADO/MANUAL_EXTRA/MANUAL_PENALIZACION, observacion).

**Motor de evaluación (por `FuncionarioReglaComision` activa en periodo)**:
1. Query `VentaItem` del periodo, `producto_id` IN reglas productos, `venta.estado=CONCLUIDA`, `venta_item.created_by=funcionario.usuario_id`.
2. Métricas: unidades, monto productos, monto venta local total.
3. Evaluar requisitos (`ReglaComisionRequisito`) contra datos del mes (`Penalizacion`, etc.).
4. Aplicar `modoValidacion`: TODO_O_NADA (todos cumplen → total; alguno falla → 0); PROPORCIONAL (monto × Σ pesos_cumplidos).
5. Calcular monto base según tipo (fijo o % de ventas).
6. Restar penalizaciones mensuales del funcionario (tipo PENALIZACION_MANUAL o aplicar `Penalizacion` del mes).
7. Generar `LiquidacionComisionItem` por regla.

**Pipeline cierre de mes**:
```
Fin de mes → query VentaItem → evaluar reglas por funcionario
  → LiquidacionComision BORRADOR con items
  → supervisor edita montoFinal / agrega extras manuales / penalizaciones
  → supervisor aprueba → APROBADO
  → sistema inserta LiquidacionItem tipo COMISION en LiquidacionSueldo del mes
  → LiquidacionSueldo flujo normal hasta PAGADO
```

**Ejemplos con datos reales**: completar post-Fase 1 usando `report.md` y `categories.json` (ej: "PARRILLERO sobre PARRILLA: meta X unidades/mes = Y bono fijo; valores X/Y calibrados a media mensual de la categoría").

---

## Archivos críticos del repo target (para referencia del spec)

- [database.config.ts](../../../workspace/frc-gourmet-legacy/src/app/database/database.config.ts) — registrar 15+ entidades nuevas.
- [preload.ts](../../../workspace/frc-gourmet-legacy/preload.ts) — interfaz `ElectronAPI` + contextBridge para channels de RRHH/Comisiones.
- [repository.service.ts](../../../workspace/frc-gourmet-legacy/src/app/database/repository.service.ts) — métodos Observable por operación.
- [main.ts](../../../workspace/frc-gourmet-legacy/main.ts) — invocar `registerRrhhHandlers(dataSource, getCurrentUser)` y `registerComisionesHandlers(...)`.
- [app.component.ts](../../../workspace/frc-gourmet-legacy/src/app/app.component.ts) — métodos `openFuncionariosTab()`, `openAsistenciasTab()`, `openLiquidacionesTab()`, `openReglasComisionTab()`, `openLiquidacionComisionTab()`; entradas sidenav en `app.component.html`.
- Nuevos: `electron/handlers/rrhh.handler.ts`, `electron/handlers/comisiones.handler.ts`.
- Nuevos: `src/app/database/entities/rrhh/*.entity.ts`, `src/app/database/entities/comisiones/*.entity.ts`.
- Nuevos: `src/app/pages/rrhh/...`, `src/app/pages/comisiones/...`.

---

## Convenciones a respetar en los specs (para que sea implementable directo)

- Enums UPPERCASE (`'BORRADOR'`, `'APROBADO'`, `'TODO_O_NADA'`).
- `extends BaseModel`.
- `@Entity('tabla_snake_case_plural')`, columnas `@Column({ name: 'snake_case' })`.
- FK con `@JoinColumn({ name: 'xxx_id' })`.
- Registro obligatorio en `database.config.ts`.
- Patrón IPC completo (handler + preload + repository + componente + tab + sidenav).

---

## Riesgos y supuestos

| Riesgo | Mitigación |
|---|---|
| PDFs son imágenes escaneadas | Verificar con `pdftotext` antes de Fase 1. Si sí → OCR con `tesseract`. |
| Formato PDF varía entre meses | Inspeccionar 3 PDFs (enero-2025, julio-2025, enero-2026) antes de generalizar parser. |
| Margen PDF mal calculado | Ignorado por decisión del usuario; costo real del POS. |
| `VentaItem.createdBy` no identifica al mozo comisionable | Confirmar con usuario; alternativa: agregar `mozo_id` FK explícito en `Venta`. |
| Roles no definidos | Se proponen sugeridos, usuario confirma tras análisis. |
| `synchronize: true` puede dañar DB en prod | Backup SQLite antes de reiniciar con entidades nuevas. |
| Comisión doble por cargo | Reglas son por-funcionario, no por-cargo. |
| Vale desde caja mayor inexistente | `cajaOrigen` enum por ahora + `caja_id` nullable desde ya. |

---

## Verificación end-to-end

**Fase 1 (análisis)**:
- `python scripts/extract_pdfs.py && python scripts/analyze.py`.
- Validar `output/monthly/enero-2025.json`: `sum(ventaTotal) == total PDF` ±0%.
- Validar 3 meses (enero-2025, julio-2025, marzo-2026) manualmente.
- `output/categories.json` tiene ≥5 categorías con ≥3 productos.
- `output/consolidated.csv` tiene #productos × 15 filas (aprox).
- `output/report.md` incluye top 10, bottom 10, media mensual.

**Specs (fase 2 y 3)**:
- Checklist: cada RF numerado único.
- Cada entidad tiene: tabla, todos los campos con tipo, FKs, enums declarados.
- Cada pantalla: nombre tab, componente, CRUD, filtros.
- Tabla de trazabilidad RF→entidad→pantalla completa al final del doc.
- Review cruzado: RRHH no refiere a comisiones, Comisiones refiere a LiquidacionSueldo de RRHH.
- Dev legible: un dev que no vio este proyecto puede abrir `rrhh.md`, leer 20 min, empezar a codear.
