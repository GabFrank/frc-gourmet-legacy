# TAREAS DE DESARROLLO — FRC Gourmet

> Tracking de progreso del desarrollo. Actualizado: 2026-03-15

---

## 🔴 ACCIONES INMEDIATAS (Prioridad Crítica)

- [ ] **AI-1** — Commitear cambios actuales (~200+ archivos modificados sin commitear, riesgo de pérdida)
- [ ] **AI-2** — Finalizar testing Gestión de Sabores (Fase 7 del manual)
  - Probar crear/editar/eliminar sabores
  - Validar auto-generación de variaciones (RecetaPresentacion)
  - Verificar cálculo de costos en variaciones
- [ ] **AI-3** — Limpiar archivos `.js`/`.js.map` del repo (agregar a `.gitignore`)
- [ ] **AI-4** — Eliminar entidad `RecetaAdicional` legacy (reemplazada por `RecetaAdicionalVinculacion`)

---

## Fase A — Completar Módulo de Productos

> **Dependencias:** Acciones Inmediatas completadas
> **Archivos clave:** `src/app/pages/productos/gestionar-producto/`, `electron/handlers/productos.handler.ts`

- [ ] **A-1** — Gestión de Observaciones: UI para CRUD de `Observacion` y `ProductoObservacion`
  - Archivos: `observacion.entity.ts`, `producto-observacion.entity.ts`
- [ ] **A-2** — Gestión de Códigos de Barra: verificar CRUD completo de `CodigoBarra` en `GestionarProducto`
  - Archivos: `codigo-barra.entity.ts`
- [ ] **A-3** — Imágenes de producto: reactivar funcionalidad (handler comentado, `ProductoImage` eliminada)
  - Archivos: `electron/handlers/images.handler.ts`
- [ ] **A-4** — Gestión de Stock completa: UI para `StockMovimiento` (componentes de movimientos eliminados)
  - Archivos: `stock-movimiento.entity.ts`, `src/app/pages/productos/gestionar-producto/`

---

## Fase B — Combos y Promociones

> **Dependencias:** Fase A (productos base funcionales)
> **Archivos clave:** `combo.entity.ts`, `combo-producto.entity.ts`, `promocion.entity.ts`, `promocion-presentacion.entity.ts`

- [ ] **B-1** — UI de Gestión de Combos (`ProductoTipo.COMBO`)
  - Crear/editar combo con selección de productos (`ComboProducto`)
  - Integrar en `GestionarProductoComponent` o como sección dedicada
- [ ] **B-2** — UI de Gestión de Promociones
  - CRUD `Promocion` (tipos: DESCUENTO_PORCENTAJE, DESCUENTO_MONTO, PRODUCTO_GRATIS, COMBO_ESPECIAL)
  - Vincular presentaciones vía `PromocionPresentacion`
- [ ] **B-3** — Ensamblado de Pizza: UI para `EnsambladoPizza` y `EnsambladoPizzaSabor`
  - Archivos: `ensamblado-pizza.entity.ts`, `ensamblado-pizza-sabor.entity.ts`, `tamanho-pizza.entity.ts`, `sabor-pizza.entity.ts`

---

## Fase C — Módulo de Compras

> **Dependencias:** Fase A (productos y stock)
> **Archivos clave:** `electron/handlers/compras.handler.ts`, `src/app/pages/compras/`

- [ ] **C-1** — Reconstruir UI de Compras (componentes `ListCompras` y `CreateEditCompra` fueron eliminados)
  - `ListComprasComponent`: lista paginada con filtros por estado/proveedor/fecha
  - `CreateEditCompraComponent`: formulario con detalle de ítems, totales, estado
- [ ] **C-2** — Vincular `CompraDetalle` con Producto/Presentacion (actualmente incompleto, solo tiene cantidad y valor)
  - Archivos: `compra-detalle.entity.ts`
- [ ] **C-3** — Vincular `ProveedorProducto` con Producto (actualmente solo referencia Proveedor y Compra)
  - Archivos: `proveedor-producto.entity.ts`
- [ ] **C-4** — Integrar actualización automática de `PrecioCosto` al confirmar compra
- [ ] **C-5** — Integrar generación automática de `StockMovimiento` (tipo COMPRA) al confirmar compra

---

## Fase D — Módulo Financiero

> **Dependencias:** Ninguna (independiente)
> **Archivos clave:** `electron/handlers/financiero.handler.ts`, `src/app/pages/financiero/`

- [ ] **D-1** — Reconstruir UI de TipoPrecio (componentes eliminados)
  - CRUD con autorización por usuario
  - Archivos: `tipo-precio.entity.ts`
- [ ] **D-2** — Verificar funcionalidad completa de Cajas (apertura, cierre, conteo, revisión)
- [ ] **D-3** — Verificar conversión de moneda y configuración monetaria
  - Archivos: `conversion-moneda.entity.ts`, `configuracion-monetaria.entity.ts`

---

## Fase E — Módulo de Ventas / PDV

> **Dependencias:** Fases A, B, D (productos, combos, precios, cajas)
> **Archivos clave:** `electron/handlers/ventas.handler.ts`, `src/app/pages/ventas/`

- [ ] **E-1** — Gestión de Delivery: UI dedicada (actualmente parcial en PdvComponent)
  - Archivos: `delivery.entity.ts`, `precio-delivery.entity.ts`
- [ ] **E-2** — Reservas y Comandas: UI (entidades existen sin UI visible)
  - Archivos: `reserva.entity.ts`, `comanda.entity.ts`
- [ ] **E-3** — Verificar flujo completo PDV: selección producto → variaciones/sabores → pago → cierre
- [ ] **E-4** — Integrar Promociones en PDV (aplicar descuentos automáticos)
- [ ] **E-5** — Integrar Combos en PDV
- [ ] **E-6** — Producción: UI para registrar producción y descontar ingredientes
  - Archivos: `produccion.entity.ts`, `produccion-ingrediente.entity.ts`

---

## Fase F — Mejoras Técnicas

> **Dependencias:** Puede hacerse en paralelo con otras fases
> **Archivos clave:** `src/app/app.module.ts`, varios módulos

- [ ] **F-1** — Migrar `MonedasModule` a standalone components
- [ ] **F-2** — Migrar `GestionRecetasModule` a standalone components
- [ ] **F-3** — Migrar `GestionarProductoComponent` y sub-componentes de AppModule a standalone
- [ ] **F-4** — Unificar estrategia de delete (soft delete vs hard delete — definir criterio claro)
- [ ] **F-5** — Agregar `.gitignore` para archivos compilados (`*.js`, `*.js.map` en `electron/` y `src/`)

---

## Fase G — Testing y Estabilización

> **Dependencias:** Todas las fases funcionales completadas

- [ ] **G-1** — Testing end-to-end del flujo completo: Producto → Receta → Variaciones → PDV → Venta → Stock
- [ ] **G-2** — Testing de integridad de datos: cascadas de eliminación, referencias circulares
- [ ] **G-3** — Testing multi-moneda: precios, costos, conversiones, pagos
- [ ] **G-4** — Testing de impresión: tickets, comandas
- [ ] **G-5** — Performance: paginación en todas las listas, carga lazy de relaciones
- [ ] **G-6** — Revisión de seguridad: autenticación, roles, permisos por pantalla

---

## Resumen de Progreso

| Fase | Total | Completadas | Estado |
|------|-------|-------------|--------|
| Acciones Inmediatas | 4 | 0 | Pendiente |
| A — Productos | 4 | 0 | Pendiente |
| B — Combos/Promociones | 3 | 0 | Pendiente |
| C — Compras | 5 | 0 | Pendiente |
| D — Financiero | 3 | 0 | Pendiente |
| E — Ventas/PDV | 6 | 0 | Pendiente |
| F — Mejoras Técnicas | 5 | 0 | Pendiente |
| G — Testing | 6 | 0 | Pendiente |
| **TOTAL** | **36** | **0** | — |

---

## Dependencias entre Fases

```
Acciones Inmediatas
  └─► Fase A (Productos)
       ├─► Fase B (Combos/Promociones)
       │    └─► Fase E (Ventas/PDV)
       └─► Fase C (Compras)

Fase D (Financiero) ──► Fase E (Ventas/PDV)

Fase F (Mejoras Técnicas) — en paralelo

Fases A-F ──► Fase G (Testing)
```
