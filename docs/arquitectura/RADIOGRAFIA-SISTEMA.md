# Radiografía Completa del Sistema FRC Gourmet

## 1. Visión General

FRC Gourmet es un software de gestión gastronómica de escritorio construido con **Angular 15 + Electron 24 + SQLite + TypeORM**. Cubre productos, recetas, punto de venta, inventario, compras, finanzas y gestión de personas.

**Navegación**: Sistema de pestañas dinámicas (no routing tradicional). Cada sección se abre como tab via `TabsService`.

**Comunicación Frontend ↔ Backend**: IPC de Electron en 4 capas:
```
Entity (.entity.ts) → Handler (.handler.ts) → Preload (preload.ts) → RepositoryService (repository.service.ts)
```

**Base de datos**: SQLite con `synchronize: true` (auto-crea tablas, sin migraciones en dev).

---

## 2. Mapa de Entidades (69 entidades totales)

Todas extienden `BaseModel` que provee: `id`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`.

### 2.1 PRODUCTOS (30 entidades) — Dominio principal

```
Familia (familia)
  └─ Subfamilia (subfamilia)
       └─ Producto (producto)
            ├─ Presentacion (presentacion)
            │    ├─ CodigoBarra (codigo_barra)
            │    └─ PrecioVenta (precio_venta) → Moneda, TipoPrecio
            ├─ PrecioCosto (precio_costo) → Moneda
            ├─ Sabor (sabor) — solo para ELABORADO_CON_VARIACION
            ├─ Receta (receta)
            │    ├─ RecetaIngrediente (receta_ingrediente) → Producto (como ingrediente)
            │    │    └─ RecetaIngredienteIntercambiable (receta_ingrediente_intercambiable)
            │    ├─ RecetaAdicionalVinculacion (receta_adicional_vinculacion) → Adicional
            │    ├─ PrecioVenta (precio_venta)
            │    └─ PrecioCosto (precio_costo)
            ├─ RecetaPresentacion (receta_presentacion) → Receta + Presentacion + Sabor
            │    └─ PrecioVenta (precio_venta)
            ├─ Combo (combo)
            │    └─ ComboProducto (combo_producto) → Producto
            ├─ Observacion (observacion) ← ProductoObservacion (producto_observacion)
            └─ StockMovimiento (stock_movimiento)
```

**Entidades adicionales de productos:**
- `Adicional` (adicional) — extras que se pueden agregar a recetas, con receta propia opcional
- `Produccion` (produccion) → Receta, Usuario + `ProduccionIngrediente` → Producto
- `Promocion` (promocion) + `PromocionPresentacion` (promocion_presentacion)
- `ConfiguracionMonetaria` (configuracion_monetaria) → Moneda
- `ConversionMoneda` (conversion_moneda) → Moneda origen/destino
- `TamanhoPizza` (tamanho_pizza), `SaborPizza` (sabor_pizza)
- `EnsambladoPizza` (ensamblado_pizza) + `EnsambladoPizzaSabor` (ensamblado_pizza_sabor)

#### Enums de Productos

| Enum | Valores |
|------|---------|
| **ProductoTipo** | RETAIL, RETAIL_INGREDIENTE, ELABORADO_SIN_VARIACION, ELABORADO_CON_VARIACION, COMBO |
| **RecetaTipo** | BASE, VARIACION |
| **FuenteCosto** | COMPRA, MANUAL, AJUSTE_RECETA |
| **StockMovimientoTipo** | COMPRA, VENTA, TRANSFERENCIA, AJUSTE_POSITIVO, AJUSTE_NEGATIVO, DESCARTE, PRODUCCION_ENTRADA, PRODUCCION_SALIDA |
| **TipoPromocion** | DESCUENTO_PORCENTAJE, DESCUENTO_MONTO, PRODUCTO_GRATIS, COMBO_ESPECIAL |

#### Detalle de entidades clave

**Producto** — Columnas principales:
- `nombre` (varchar 255), `tipo` (ProductoTipo), `unidadBase` (varchar 100, nullable)
- Flags: `activo`, `esVendible`, `esComprable`, `controlaStock`, `esIngrediente`
- Stock: `stockMinimo`, `stockMaximo` (decimal 10,3)

**Presentacion** — Columnas principales:
- `nombre`, `cantidad` (decimal 10,3), `principal` (boolean), `activo`
- Virtual: `precioPrincipal`, `codigoPrincipal`

**Receta** — Columnas principales:
- `categoria`, `subcategoria`, `nombre`, `descripcion`
- `costoCalculado` (decimal 10,2), `rendimiento` (decimal 10,4), `unidadRendimiento`
- Virtual: `precioPrincipal`

**RecetaIngrediente** — Columnas principales:
- `cantidad`, `unidad`, `unidadOriginal`, `costoUnitario`, `costoTotal`
- Flags: `esExtra`, `esOpcional`, `esCambiable`, `esIngredienteBase`
- `porcentajeAprovechamiento` (decimal 5,2, default: 100)

**RecetaPresentacion** — Variación específica (Presentación × Sabor):
- `nombre_generado` ("Pizza Grande Calabresa"), `sku` ("PIZ-CAL-G")
- `precio_ajuste`, `costo_calculado`
- Unique constraint: (presentacion_id, sabor_id)

**PrecioVenta** — Puede estar vinculado a:
- Presentacion (producto simple) O
- Receta (elaborado sin variación) O
- RecetaPresentacion (elaborado con variación)

---

### 2.2 FINANCIERO (9 entidades)

```
Moneda (monedas)
  ├─ MonedaBillete (monedas_billetes)
  ├─ MonedaCambio (monedas_cambio) — origen/destino
  └─ CajaMoneda (cajas_monedas)

TipoPrecio (tipo_precio) → Usuario (autorizadoPor)

Dispositivo (dispositivos)
  └─ Caja (cajas) — estado: ABIERTO/CERRADO/CANCELADO
       ├─ Conteo apertura (conteos)
       │    └─ ConteoDetalle (conteos_detalles) → MonedaBillete
       └─ Conteo cierre (conteos)
```

**Moneda**: `denominacion`, `simbolo`, `flagIcon`, `countryCode`, `principal`
**Caja**: `fechaApertura`, `fechaCierre`, `estado` (CajaEstado), `revisado`
**Dispositivo**: `nombre`, `mac`, flags: `isVenta`, `isCaja`, `isTouch`, `isMobile`

---

### 2.3 COMPRAS (7 entidades)

```
Proveedor (proveedores) → Persona
  ├─ ProveedorProducto (proveedores_productos)
  └─ Compra (compras) — estado: ABIERTO/ACTIVO/FINALIZADO/CANCELADO
       ├─ CompraDetalle (compras_detalles)
       └─ Pago (pagos) — estado: ABIERTO/PAGO_PARCIAL/PAGADO/CANCELADO
            └─ PagoDetalle (pagos_detalles) — tipo: PAGO/VUELTO/DESCUENTO/AUMENTO

FormasPago (formas_pago) — nombre, movimentaCaja, principal, orden
```

**Compra**: `estado`, `numeroNota`, `tipoBoleta` (LEGAL/COMUN/OTRO), `fechaCompra`, `credito`, `plazoDias`

---

### 2.4 VENTAS (15 entidades)

```
Sector (sectores)
  └─ PdvMesa (pdv_mesas) — estado: DISPONIBLE/OCUPADO
       ├─ Reserva (reservas) → Cliente
       ├─ Comanda (comandas)
       └─ Venta (ventas) — estado: ABIERTA/CONCLUIDA/CANCELADA
            ├─ VentaItem (venta_items) — estado: ACTIVO/MODIFICADO/CANCELADO
            ├─ → Cliente, FormasPago, Caja, Pago
            └─ → Delivery (deliveries) — estado: ABIERTO/PARA_ENTREGA/EN_CAMINO/ENTREGADO/CANCELADO
                 └─ → PrecioDelivery (precios_delivery), Cliente, Usuario

PDV Config:
  PdvGrupoCategoria (pdv_grupo_categoria)
    └─ PdvCategoria (pdv_categoria)
         └─ PdvCategoriaItem (pdv_categoria_item)
              └─ PdvItemProducto (pdv_item_producto)
  PdvConfig (pdv_config)
```

**VentaItem**: `precioCostoUnitario`, `precioVentaUnitario`, `cantidad`, `descuentoUnitario`, tracking de cancelación/modificación

---

### 2.5 PERSONAS (8 entidades)

```
Persona (personas) — nombre, telefono, direccion, tipoDocumento (CI/RUC/CPF/PASAPORTE), tipoPersona (FISICA/JURIDICA)
  ├─ Usuario (usuarios) — nickname, password
  │    ├─ UsuarioRole (usuario_roles) → Role (roles)
  │    └─ LoginSession (login_sessions)
  └─ Cliente (clientes) → TipoCliente (tipo_clientes)
       — ruc, razon_social, tributa, credito, limite_credito
```

---

## 3. Handlers IPC (12 archivos, ~400+ canales)

| Handler | Entidades | Canales | Notas |
|---------|-----------|---------|-------|
| **auth.handler.ts** | Usuario, LoginSession | 6 | JWT, sesiones, device tracking |
| **personas.handler.ts** | Persona, Usuario, Role, UsuarioRole, TipoCliente, Cliente | ~50 | Soft delete, paginación |
| **financiero.handler.ts** | Moneda, TipoPrecio, MonedaBillete, Conteo, ConteoDetalle, Dispositivo, Caja, CajaMoneda, MonedaCambio | ~60 | Conversión moneda, operaciones bulk |
| **compras.handler.ts** | Proveedor, Compra, CompraDetalle, Pago, PagoDetalle, ProveedorProducto, FormasPago | ~50 | Checks de dependencia |
| **ventas.handler.ts** | Venta, VentaItem, Delivery, PrecioDelivery, PdvGrupo/Categoria/Item/Producto, PdvConfig, Mesa, Sector, Reserva, Comanda | ~70 | Estado management |
| **productos.handler.ts** | Familia, Subfamilia, Producto, Presentacion, CodigoBarra, PrecioVenta, PrecioCosto, Receta, RecetaIngrediente, Adicional, RecetaAdicionalVinculacion, RecetaIngredienteIntercambiable, Observacion | ~80 | Filtros avanzados, búsqueda |
| **recetas.handler.ts** | Receta, RecetaIngrediente, variaciones | ~20 | Cálculo de costos, transacciones |
| **sabores.handler.ts** | Sabor, Receta, RecetaPresentacion | 5 | Auto-genera variaciones al crear sabor |
| **receta-presentacion.handler.ts** | RecetaPresentacion, PrecioVenta | 7 | Generación SKU, bulk updates, cálculo costo |
| **images.handler.ts** | Filesystem | 2 | Profile images (producto images desactivado) |
| **printers.handler.ts** | Printer | 5 | Soporte epson/star/thermal |
| **system.handler.ts** | OS | 1 | MAC address para multi-dispositivo |

**Estrategias de delete**:
- **Soft delete** (activo=false): Personas, Usuarios, Roles, TipoPrecio, FormasPago
- **Hard delete** (con checks): Moneda, Dispositivo, Compra, Venta

---

## 4. Componentes de Página (Frontend)

### 4.1 Productos — FOCO PRINCIPAL

| Componente | Tipo | Estado | Función |
|------------|------|--------|---------|
| `ProductosDashboardComponent` | Standalone | ✅ Activo | Hub de navegación con cards |
| `ListProductosComponent` | Standalone | ✅ Activo | Lista paginada con filtros avanzados |
| `ListFamiliasComponent` | Standalone | ✅ Activo | CRUD familias + subfamilias en dialog |
| `CreateEditFamiliaComponent` | Standalone | ✅ Activo | Editor familia con tabla subfamilias |
| `GestionarProductoComponent` | Declarado AppModule | ✅ Activo | Editor principal de producto con tabs internos |

**Sub-componentes de GestionarProducto** (todos declarados en AppModule):

| Sub-componente | Función |
|----------------|---------|
| `ProductoInformacionGeneralComponent` | Info básica: nombre, tipo, familia, subfamilia, flags |
| `ProductoPresentacionesPreciosComponent` | CRUD presentaciones |
| `ProductoPreciosVentaComponent` | Gestión precios de venta por presentación |
| `ProductoPreciosCostoComponent` | Gestión precios de costo |
| `ProductoRecetaComponent` | Asociación/creación de receta |
| `ProductoSaboresComponent` | Gestión de sabores (ELABORADO_CON_VARIACION) |
| `ProductoStockComponent` | Control de stock y movimientos |
| `ProductoResumenComponent` | Vista resumen del producto |

**Dialogs de producto:**
- `CodigoBarraDialogComponent`, `PrecioVentaDialogComponent`, `SaborDialogComponent`, `VariacionDialogComponent`

### 4.2 Gestión de Recetas (NgModule: GestionRecetasModule)

| Componente | Función |
|------------|---------|
| `ListRecetasComponent` | Lista con paginación, costos, búsqueda |
| `GestionRecetasComponent` | Editor completo: ingredientes, adicionales, cálculo costos, multi-variación |
| `ListAdicionalesComponent` | Lista adicionales con filtros |
| `RecetaDetalleComponent` | Vista detalle de receta |

**Dialogs de recetas:**
- `IngredienteDialogComponent` — agregar/editar ingredientes con filtros
- `CreateEditAdicionalDialogComponent` — CRUD adicionales
- `VincularRecetaAdicionalDialogComponent` — vincular adicionales a recetas
- `RecetaDialogComponent` — selección de receta
- `ConfirmarAgregarIngredienteDialogComponent` — asistente de ingredientes
- `GestionarIngredienteMultiVariacionDialogComponent` — ingredientes multi-variación

### 4.3 Gestión de Sabores (Standalone)

| Componente | Función |
|------------|---------|
| `ListSaboresComponent` | Lista sabores |
| `GestionSaborComponent` | Editor de sabor |
| `CreateEditSaborDialogComponent` | Dialog crear/editar sabor |
| `IngredienteSaborDialogComponent` | Gestión ingredientes por sabor |

### 4.4 Financiero

| Componente | Tipo | Función |
|------------|------|---------|
| `FinancieroDashboardComponent` | Standalone | Hub financiero |
| `ListCajasComponent` | Standalone | Cajas registradoras |
| `CreateCajaDialogComponent` | Standalone | Crear caja |
| `ExistingCajaDialogComponent` | Standalone | Seleccionar caja existente |
| `ListMonedasComponent` | Module (MonedasModule) | CRUD monedas |
| `CreateEditMonedaComponent` | Module | Editor moneda |
| `ListaBilletesDialogComponent` | Module | Denominaciones |
| `CreateEditMonedaCambioDialogComponent` | Module | Tipos de cambio |
| `ListDispositivosComponent` | Standalone | Dispositivos POS |
| `CreateEditFormaPagoComponent` | Standalone | Formas de pago |

### 4.5 Compras

| Componente | Función |
|------------|---------|
| `ComprasDashboardComponent` | Hub de compras |
| `ListProveedoresComponent` | Lista proveedores |
| `CreateEditProveedorComponent` | Editor proveedor |

**Componentes eliminados** (en refactoring actual):
- ~~`ListComprasComponent`~~ — eliminado
- ~~`CreateEditCompraComponent`~~ — eliminado

### 4.6 Ventas / PDV

| Componente | Función |
|------------|---------|
| `VentasDashboardComponent` | Hub de ventas |
| `PdvComponent` | Punto de Venta completo: ítems, monedas, facturas |

### 4.7 Personas

| Componente | Función |
|------------|---------|
| `RrhhDashComponent` | Dashboard RRHH |
| `ListPersonasComponent` + `CreateEditPersonaComponent` | CRUD personas |
| `ListUsuariosComponent` + `CreateEditUsuarioComponent` | CRUD usuarios |
| `ListClientesComponent` | Lista clientes |

### 4.8 Componentes Compartidos (`src/app/shared/components/`)

| Componente | Función |
|------------|---------|
| `ConfirmationDialogComponent` | Confirmación genérica Sí/No |
| `PaymentOptionsDialogComponent` | Opciones de pago (PAY_NOW/PAY_LATER/CANCEL) |
| `RecetaDependenciesDialogComponent` | Advertencia de dependencias al eliminar receta |
| `EliminarIngredienteDialogComponent` | Eliminar ingrediente (variación actual o todas) |
| `CurrencyInputComponent` | Input monetario con máscara, redondeo PYG |
| `PagoDialogComponent` | Dialog completo de pagos multi-moneda |
| `PdvMesaDialogComponent` | Gestión de mesas POS |
| `MesaSelectionDialogComponent` | Selección de mesa en grid |
| `ProductoSearchDialogComponent` | Búsqueda productos con paginación |
| `GenericSearchDialogComponent` | Búsqueda genérica reutilizable |
| `PaginatedDropdownComponent` | Dropdown con paginación y búsqueda |
| `CreateEditPdvCategoriasComponent` | CRUD categorías PDV multinivel |
| `ListPdvCategoriasComponent` | Vista árbol categorías PDV |
| `PdvConfigDialogComponent` | Configuración PDV |

---

## 5. Servicios Angular

| Servicio | Función |
|----------|---------|
| `RepositoryService` | ~400+ métodos, wraps IPC calls en Observables |
| `TabsService` | Gestión tabs dinámicos |
| `AuthService` | Login/logout, sesiones, JWT |
| `ThemeService` | Dark/light theme |
| `DatabaseService` | Proxy impresoras |
| `PrinterService` | Gestión impresoras |
| `UnitConversionService` | Conversiones peso/volumen/longitud |
| `RecetasService` | CRUD recetas, cálculo costos |
| `SaboresService` | CRUD sabores via IPC |
| `SaboresVariacionesService` | Estado complejo sabores/variaciones con BehaviorSubjects |
| `EliminarIngredienteService` | Orquesta eliminación ingredientes multi-variación |
| `GestionarProductoService` | Estado del producto en edición |
| `ComprasService` | Órdenes de compra |
| `PagosService` | Procesamiento pagos |

---

## 6. Estado Actual del Refactoring

### Cambios completados (en working tree, no commiteados):

**Entidades eliminadas** (renombradas/reemplazadas):
- `Categoria` → `Familia`
- `Subcategoria` → `Subfamilia`
- `Codigo` → `CodigoBarra`
- `Ingrediente` → `RecetaIngrediente` (ingrediente es ahora un Producto con flag `esIngrediente`)
- `CostoPorProducto` → `PrecioCosto`
- `ComboItem` → `ComboProducto`
- `RecetaItem` → `RecetaIngrediente`
- `RecetaVariacion` + `RecetaVariacionItem` → `RecetaPresentacion`
- `PresentacionSabor` → eliminado
- `ObservacionProducto` + `ObservacionProductoVentaItem` → `ProductoObservacion`
- `ProductoAdicional` + `ProductoAdicionalVentaItem` → `RecetaAdicionalVinculacion`
- `IntercambioIngrediente` → `RecetaIngredienteIntercambiable`
- `ProductoImage` → eliminado (imágenes vía protocolo app://)
- `MovimientoStock` → `StockMovimiento`

**Entidades nuevas:**
- `Familia`, `Subfamilia`, `CodigoBarra`, `PrecioCosto`, `ComboProducto`
- `RecetaPresentacion`, `RecetaAdicionalVinculacion`, `RecetaIngredienteIntercambiable`
- `ProductoObservacion`, `StockMovimiento`, `SaborPizza`, `TamanhoPizza`
- `EnsambladoPizza`, `EnsambladoPizzaSabor`, `Produccion`, `ProduccionIngrediente`
- `Promocion`, `PromocionPresentacion`, `ConfiguracionMonetaria`, `ConversionMoneda`
- `Sabor`, `RecetaAdicional` (legacy)

**Componentes eliminados** (UI vieja):
- Todos los componentes de `productos/categorias/` y `productos/subcategorias/`
- Todos los componentes de `productos/productos/` (reemplazados por `gestionar-producto/` y `list-productos/`)
- Todos los componentes de `productos/ingredientes/`
- Todos los componentes de `productos/movimientos/`
- Todos los componentes de `productos/recetas/` (movidos a `gestion-recetas/`)
- Todos los componentes de `productos/adicionales/`
- `productos/simple-presencation-section/`
- `compras/compras/` (CRUD compras)
- `financiero/tipo-precio/`

**Fase actual**: Implementación de Gestión de Sabores (Fase 7 — testing/refinamiento según `MANUAL_IMPLEMENTACION_GESTION_SABORES.md`)

---

## 7. Arquitectura de Variaciones de Producto

Este es el sistema más complejo del proyecto. Un producto `ELABORADO_CON_VARIACION` funciona así:

```
Producto (ej: "Pizza")
  ├─ Presentaciones: [Grande, Mediana, Chica]
  ├─ Sabores: [Calabresa, Pepperoni, Napolitana]
  │    └─ Cada sabor tiene su propia Receta con ingredientes
  └─ RecetaPresentacion: Matriz Presentación × Sabor
       ├─ Pizza Grande Calabresa (SKU: PIZ-CAL-G)
       ├─ Pizza Grande Pepperoni (SKU: PIZ-PEP-G)
       ├─ Pizza Mediana Calabresa (SKU: PIZ-CAL-M)
       └─ ... (auto-generadas)
            └─ Cada una puede tener PrecioVenta específico
```

**Flujo al crear sabor**:
1. Se crea el `Sabor` vinculado al producto
2. Se crea una `Receta` para ese sabor
3. Se auto-generan `RecetaPresentacion` para cada presentación existente del producto
4. Cada `RecetaPresentacion` puede tener precios y costos específicos

**Servicios involucrados**: `SaboresVariacionesService` (estado), `SaboresService` (IPC), `RecetasService` (costos)

---

## 8. Siguientes Pasos Identificados

### 8.1 Prioridad Alta — Completar refactoring en curso

| # | Tarea | Estado | Detalle |
|---|-------|--------|---------|
| 1 | **Finalizar testing Gestión Sabores** | En progreso (Fase 7) | Probar crear/editar/eliminar sabores, validar auto-generación de variaciones |
| 2 | **Commitear cambios actuales** | Pendiente | Hay ~200+ archivos modificados sin commitear, riesgo de pérdida de trabajo |
| 3 | **Limpiar archivos `.js`/`.js.map` del repo** | Pendiente | Los archivos JS compilados están trackeados en git; deberían estar en .gitignore |
| 4 | **Eliminar entidad `RecetaAdicional` legacy** | Pendiente | Marcada como deprecated, reemplazada por `RecetaAdicionalVinculacion` |

### 8.2 Prioridad Media — Funcionalidad faltante

| # | Tarea | Detalle |
|---|-------|---------|
| 5 | **UI de Compras** | Componentes `ListComprasComponent` y `CreateEditCompraComponent` fueron eliminados. No hay UI para crear/editar compras |
| 6 | **UI de TipoPrecio** | Componentes eliminados. No hay forma de gestionar tipos de precio desde la UI |
| 7 | **Gestión de Stock completa** | Los componentes de movimientos de stock fueron eliminados. `StockMovimiento` entity existe pero no tiene UI |
| 8 | **Gestión de Combos** | Entidades `Combo` y `ComboProducto` existen, ProductoTipo.COMBO existe, pero no hay UI dedicada |
| 9 | **Gestión de Promociones** | Entidades `Promocion` y `PromocionPresentacion` existen pero no hay UI |
| 10 | **Producción** | Entidades `Produccion` y `ProduccionIngrediente` existen pero no hay UI |
| 11 | **Gestión de Observaciones** | Entity `Observacion` y `ProductoObservacion` existen, no hay UI dedicada visible |
| 12 | **Imágenes de producto** | Handler comentado, `ProductoImage` eliminada. Funcionalidad de imágenes de producto parcialmente desactivada |
| 13 | **Gestión de Delivery** | Entidades existen, handler existe, pero no se ve UI dedicada (solo parcial en PdvComponent) |
| 14 | **Reservas y Comandas** | Entidades existen pero sin UI visible |
| 15 | **Ensamblado Pizza** | Entidades `EnsambladoPizza`/`EnsambladoPizzaSabor` existen pero sin UI |

### 8.3 Prioridad Baja — Mejoras técnicas

| # | Tarea | Detalle |
|---|-------|---------|
| 16 | **Migrar MonedasModule a standalone** | Ya marcado como "no longer needed as standalone" |
| 17 | **Migrar GestionRecetasModule a standalone** | Usar mismo patrón que los componentes nuevos |
| 18 | **Migrar GestionarProducto y sub-componentes a standalone** | Actualmente declarados en AppModule |
| 19 | **Unificar patrón de delete** | Mixto entre soft delete y hard delete sin criterio claro |
| 20 | **ProveedorProducto incompleto** | No tiene referencia a Producto, solo a Proveedor y Compra |
| 21 | **CompraDetalle incompleto** | No tiene referencia a Producto/Presentacion, solo cantidad y valor |

---

## 9. Resumen Cuantitativo

| Métrica | Cantidad |
|---------|----------|
| Entidades TypeORM | 69 |
| Handlers IPC | 12 archivos |
| Canales IPC | ~400+ |
| Métodos RepositoryService | ~400+ |
| Componentes de página | ~60+ |
| Componentes compartidos | 14 |
| Servicios Angular | 14 |
| Enums | ~20 |
| Archivos modificados (sin commit) | ~200+ |
| Archivos nuevos (sin commit) | ~50+ |
| Archivos eliminados (sin commit) | ~80+ |
