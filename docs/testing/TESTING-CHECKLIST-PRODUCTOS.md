# Testing Checklist — Módulo de Productos

## Fase A: Implementación base

### Dashboard de Productos
- [ ] Abrir dashboard de productos
- [ ] Cards activas (Familias, Productos, Recetas) son clickeables y abren tabs
- [ ] Cards deshabilitadas se ven con opacidad reducida y tooltip "En desarrollo"
- [ ] Click en card deshabilitada no hace nada
- [ ] Card "Recetas" abre correctamente ListRecetasComponent

### ProductoComboComponent (placeholder)
- [ ] Crear producto tipo COMBO → no crashea
- [ ] Editar producto tipo COMBO → tab "Combo" visible con mensaje "Funcionalidad en desarrollo"

### Observaciones — Backend
- [ ] `getObservaciones` retorna lista de observaciones activas
- [ ] `getObservacion` retorna observación por ID
- [ ] `createObservacion` crea con descripción en UPPERCASE
- [ ] `updateObservacion` actualiza correctamente
- [ ] `deleteObservacion` hace soft delete (activo = false)
- [ ] `get-observaciones-by-producto` retorna observaciones vinculadas
- [ ] `create-producto-observacion` vincula observación a producto
- [ ] `delete-producto-observacion` desvincula (soft delete)

### Observaciones — Frontend (tab en GestionarProducto)
- [ ] Editar cualquier producto → tab "Observaciones" visible
- [ ] Tab muestra "No hay observaciones vinculadas" cuando vacío
- [ ] Click "Crear Nueva" → aparece formulario inline
- [ ] Escribir descripción → "Crear y Vincular" → aparece en tabla
- [ ] Dropdown muestra observaciones disponibles (filtra ya vinculadas)
- [ ] Seleccionar y "Vincular" → aparece en tabla
- [ ] Click desvincular → confirmar → desaparece de tabla

### Tabs existentes sin regresión
- [ ] Producto RETAIL: tabs Info General, Presentaciones, Precios Costo, Stock, Observaciones
- [ ] Producto ELABORADO_SIN_VARIACION: tabs Info General, Receta, Precios Venta, Precios Costo, Stock, Observaciones
- [ ] Producto ELABORADO_CON_VARIACION: tabs Info General, Presentaciones, Sabores, Precios Costo, Stock, Observaciones

---

## Fase B: Fix tabs COMBO + Precios Venta

### Visibilidad de tabs para COMBO
- [ ] Producto COMBO: tabs visibles son SOLO Info General, Combo, Precios Venta, Observaciones
- [ ] Tab "Precios Costo" NO visible para COMBO
- [ ] Tab "Stock" NO visible para COMBO

### Precios de Venta para COMBO
- [ ] Producto COMBO → tab Precios Venta NO muestra "Receta Requerida"
- [ ] Muestra formulario de precios directamente
- [ ] NO muestra cards de Receta/Costo Calculado/Precio Sugerido
- [ ] Puede crear precio con moneda, tipo, valor, principal
- [ ] Tabla muestra precios sin columna CMV
- [ ] Puede editar, activar/desactivar, eliminar precios
- [ ] Puede marcar precio como principal

### Sin regresión en otros tipos
- [ ] ELABORADO_SIN_VARIACION: Precios Venta sigue requiriendo receta
- [ ] ELABORADO_SIN_VARIACION: Cards de receta/costo/sugerido siguen visibles
- [ ] RETAIL: Precios de venta se manejan desde Presentaciones (sin cambios)
