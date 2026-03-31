# Plan de Implementacion - Punto de Venta (PdV)

Documento de implementacion del sistema de Punto de Venta para FRC Gourmet, dividido en 3 etapas progresivas. Cada etapa entrega valor funcional completo y puede operarse en produccion al finalizar.

---

## ESTADO ACTUAL DEL SISTEMA

### Ya implementado (backend completo, 75 handlers IPC):
- Entidades: Venta, VentaItem, PdvMesa, Sector, Reserva, Comanda, Delivery, PrecioDelivery, PdvConfig, PdvGrupoCategoria, PdvCategoria, PdvCategoriaItem, PdvItemProducto
- CRUD completo en handler + preload + repository para todas las entidades
- PdV component con: seleccion de mesas, busqueda de productos, agregar/cancelar/eliminar items, totales multi-moneda, nombre de cliente, validacion de caja abierta
- ABM de categorias del PdV (dialog con 4 pestanas)
- ABM de mesas y sectores
- Dashboard de ventas (layout con mock data)

### Bugs conocidos:
- `createBatchPdvMesas`: se llama desde el frontend pero el handler no existe en el backend
- `findPrecioCosto()`: retorna 0 hardcodeado, deberia buscar el precio de costo real
- `editItem()`: metodo vacio, no hace nada
- Botones placeholder en PdV sin funcionalidad (6 botones "Button")
- Filtro de sectores en mesas del PdV no conectado a los botones del template
- Categorias del PdV se muestran pero no permiten agregar productos al hacer click

---

## ETAPA 1: PdV OPERATIVO BASICO

**Objetivo:** Que el punto de venta pueda operar un ciclo completo de venta: abrir caja → seleccionar mesa → agregar productos → cobrar → cerrar venta → cerrar caja.

**Prioridad:** CRITICA - Sin esto el PdV no sirve para operar.

### 1.1 Corregir bugs existentes

- [x] **BUG: createBatchPdvMesas** — Implementar handler en `ventas.handler.ts` y exponer en `preload.ts`. El frontend ya lo llama desde `pdv-mesa-dialog.component.ts:270`.
- [x] **BUG: findPrecioCosto()** — Buscar el precio de costo real del producto desde `PrecioCosto` entity en vez de retornar 0.
- [x] **BUG: Botones placeholder** — Asignar funciones reales a los 6 botones del template del PdV (ver seccion 1.5).
- [x] **BUG: Filtro sectores** — Conectar los botones de sector en el panel de mesas a `loadMesasBySector()`.

### 1.2 Dialogo de cobro / cierre de venta

Componente: `cobrar-venta-dialog.component.ts`

Funcionalidad:
- [x] Mostrar resumen de la venta: cantidad de items, subtotal, descuentos, total
- [x] Mostrar total en cada moneda configurada (usando tipos de cambio)
- [x] Selector de forma de pago (efectivo, tarjeta, transferencia, mixto)
- [x] Para efectivo: campo de monto recibido por moneda, calculo automatico de vuelto
- [x] Para mixto: permitir ingresar montos parciales en diferentes formas de pago
- [x] Boton "Cobrar" que:
  - Crea el registro de `Pago`
  - Actualiza `Venta.estado` a `CONCLUIDA`
  - Actualiza `Venta.formaPago`
  - Actualiza `PdvMesa.estado` a `DISPONIBLE`
  - Limpia la mesa seleccionada en el PdV
  - Limpia la tabla de items
  - Recalcula totales a 0
- [x] Validacion: no permitir cobrar si el total es 0 o no hay items activos

### 1.3 Cancelar venta completa

- [x] Boton "Cancelar Venta" en el PdV (con confirmacion via `confirmation-dialog`)
- [x] Campo obligatorio: motivo de cancelacion
- [x] Al confirmar:
  - Actualiza `Venta.estado` a `CANCELADA`
  - Cancela todos los items activos (estado → CANCELADO)
  - Libera la mesa (estado → DISPONIBLE)
  - Limpia la UI

### 1.4 Editar item de venta

Componente: `editar-venta-item-dialog.component.ts`

- [x] Dialogo para modificar: cantidad, descuento unitario
- [x] Al guardar:
  - Marca item original como `MODIFICADO`
  - Crea nuevo `VentaItem` con los datos actualizados
  - Vincula via `nuevaVersionVentaItem`
  - Registra `modificadoPor` y `horaModificacion`
- [x] Recalcular totales despues de la edicion

### 1.5 Definir botones de accion del PdV

Panel izquierdo (bajo la tabla de items):
- [x] **Cobrar** — Abre `cobrar-venta-dialog` (seccion 1.2)
- [x] **Descuento** — Abre dialogo para aplicar descuento global a la venta (% o monto fijo)
- [x] **Cancelar Venta** — Ejecuta cancelacion completa (seccion 1.3)

Panel derecho (bajo las mesas):
- [x] **Transferir Mesa** — Mueve una venta abierta de una mesa a otra
- [x] **Venta Rapida** — Crea venta sin mesa (para llevar / mostrador)
- [x] **Reimprimir** — Reimprime el ultimo ticket (placeholder hasta impresion de tickets)

### 1.6 Cierre de caja

Componente: `cerrar-caja-dialog.component.ts`

- [x] Verificar que no haya ventas abiertas en la caja (obligar a cerrar/cancelar primero)
- [x] Formulario de conteo final por moneda (campo para cada denominacion)
- [x] Mostrar resumen:
  - Monto de apertura por moneda
  - Total de ventas por moneda
  - Total esperado (apertura + ventas)
  - Total contado (ingresado por usuario)
  - Diferencia (sobrante/faltante)
- [x] Al confirmar: actualizar estado de caja a CERRADO, registrar fecha de cierre
- [x] Accesible desde: boton en el PdV y desde el dashboard de ventas

### 1.7 Venta rapida (sin mesa)

- [x] Permitir crear una venta sin seleccionar mesa (venta de mostrador / para llevar)
- [x] Boton "Venta Rapida" que crea una `Venta` con `mesa = null`
- [x] Flujo: click → se habilita la busqueda de productos → agregar items → cobrar
- [x] Indicador visual en el PdV de que es una venta sin mesa

### 1.8 Navegacion de categorias en el PdV

- [x] Cargar `PdvGrupoCategorias` con sus categorias al iniciar el PdV
- [x] Click en grupo → muestra categorias del grupo
- [x] Click en categoria → muestra items de la categoria (con imagen)
- [x] Click en item → agrega el producto vinculado al carrito (usando cantidad del campo de busqueda)
- [x] Boton "Volver" para navegar hacia atras en la jerarquia
- [x] Breadcrumb visual: Grupo > Categoria > Items

---

## ETAPA 2: OPERACIONES AVANZADAS

**Objetivo:** Funcionalidades que mejoran la operacion diaria: comandas para cocina, impresion de tickets, delivery, descuentos avanzados.

**Prioridad:** ALTA — Necesario para operacion eficiente en un restaurante real.

### 2.1 Sistema de comandas

Entidad `Comanda` ya existe. Crear entidad `ComandaItem`:

- [x] **ComandaItem entity**: venta_item, comanda, estado (PENDIENTE, EN_PREPARACION, LISTO, ENTREGADO), observacion
- [x] Al agregar items al carrito, generar automaticamente una comanda con los items nuevos
- [x] Comanda incluye: numero secuencial, mesa, hora, items con cantidad y observaciones
- [x] Estado de comanda: PENDIENTE → EN_PREPARACION → LISTA → ENTREGADA
- [x] Permitir agregar observaciones por item (ej: "sin cebolla", "bien cocido")

### 2.2 Pantalla de cocina (Kitchen Display)

Componente: `kitchen-display.component.ts`

- [ ] Vista de comandas pendientes en formato de cards/tickets
- [ ] Agrupadas por mesa
- [ ] Cada comanda muestra: numero de mesa, hora del pedido, items con observaciones
- [ ] Botones para cambiar estado: Preparando → Lista
- [ ] Indicador de tiempo transcurrido desde que se creo la comanda
- [ ] Auto-refresh cada N segundos
- [ ] Sonido/alerta al recibir nueva comanda (opcional)

### 2.3 Impresion de tickets

- [ ] **Ticket de venta**: datos del negocio, fecha/hora, mesa, items con precio, subtotal, descuento, total, forma de pago, vuelto
- [ ] **Comanda de cocina**: numero mesa, hora, items con cantidad y observaciones (formato compacto)
- [ ] **Resumen de cierre de caja**: apertura, ventas, conteo, diferencia
- [ ] **Pre-cuenta**: igual que ticket pero sin "pagado" (para que el cliente revise antes de pagar)
- [ ] Usar ESC/POS commands para impresora termica (ya existe base en `thermal-printer-implementation.md`)
- [ ] Configuracion de impresora desde PdvConfig

### 2.4 Descuentos avanzados

- [x] **Descuento por item**: porcentaje o monto fijo aplicado a un item individual
- [x] **Descuento global**: porcentaje o monto fijo sobre el total de la venta
- [x] **Motivo de descuento**: campo obligatorio (ej: cortesia, empleado, promocion)
- [ ] **Autorizacion**: descuentos mayores a X% requieren autorizacion de supervisor (pendiente: config de umbral)
- [x] Registro de quien aplico el descuento y cuando
- [x] Mostrar descuentos aplicados en el resumen de la venta

### 2.5 Sistema de delivery

Componente: `list-deliveries.component.ts`, `create-delivery-dialog.component.ts`

- [ ] Listado de deliveries con filtro por estado (tabs o chips)
- [ ] Crear delivery: cliente (existente o nuevo), direccion, telefono, precio de delivery
- [ ] Al crear delivery: crea automaticamente una `Venta` asociada
- [ ] Flujo de estados: ABIERTO → PARA_ENTREGA → EN_CAMINO → ENTREGADO
- [ ] Asignar repartidor (usuario)
- [ ] Registro de timestamps en cada cambio de estado
- [ ] Panel de deliveries en curso visible desde el dashboard
- [ ] Cancelar delivery con motivo

### 2.6 Precios de delivery (UI)

Componente: `list-precios-delivery.component.ts`

- [x] ABM de precios de delivery (ya tiene backend completo)
- [x] Tabla: descripcion, valor, activo
- [x] Accesible desde el dashboard de ventas

### 2.7 Transferir mesa

- [x] Dialogo que muestra mesas disponibles
- [x] Al seleccionar destino: mueve la `Venta` a la nueva mesa
- [x] Actualiza estados: mesa origen → DISPONIBLE, mesa destino → OCUPADO
- [ ] Registrar en log quien transfirio (pendiente: sistema de auditoria 3.9)

### 2.8 Division de cuenta

- [x] Dividir en partes iguales (2, 3, 4... personas)
- [x] Dividir por items (seleccionar que items paga cada persona)
- [ ] Cada parte genera su propio proceso de cobro (pendiente: integracion backend)
- [ ] Venta original se marca como CONCLUIDA solo cuando todas las partes estan pagadas (pendiente: integracion backend)

### 2.9 Asociar cliente registrado

- [x] Boton en info de mesa para buscar cliente existente
- [x] Dialogo de busqueda por nombre, telefono o documento
- [x] Al seleccionar: vincular `Venta.cliente` con el cliente del sistema
- [ ] Mostrar datos del cliente en la card de mesa (nombre, telefono, historial breve) (pendiente: ampliar card)

### 2.10 Historial de ventas

Componente: `list-ventas.component.ts`

- [x] Tabla con todas las ventas: fecha, mesa, cajero, total, estado, forma de pago
- [x] Filtros: rango de fechas, estado, cajero, forma de pago
- [x] Detalle de venta: items, pagos, descuentos, comanda
- [ ] Accion: reimprimir ticket (pendiente: impresion de tickets 2.3)
- [x] Accesible desde dashboard de ventas

**Mejoras pendientes:**

Entidad:
- [ ] Agregar campo `fechaCierre` (datetime, nullable) a Venta — se setea al finalizar cobro, permite calcular tiempo de permanencia del cliente

Paginacion:
- [ ] Implementar paginacion en handler `getVentasByDateRange` (limit/offset) y en frontend con mat-paginator

Columnas de la tabla:
- [ ] Remover columna forma de pago (puede ser multi-pago)
- [ ] Chip de estado: rojo=CANCELADA, verde=CONCLUIDA, naranja=ABIERTA
- [ ] Agregar columna duracion (fechaCierre - createdAt) cuando exista fechaCierre
- [ ] Acciones: ver detalle, cancelar/rehabilitar venta (requiere admin, funciona con caja cerrada)

Filtros basicos (header visible):
- [ ] Rango de fechas (HOY, SEMANA, MES, TRIMESTRE + datepickers)
- [ ] Estado (select)
- [ ] Caja: select con ultimas 20 cajas (#ID - DISPOSITIVO - FECHA - CAJERO), al seleccionar deshabilita filtros de fecha

Filtros avanzados (seccion expandible "FILTROS AVANZADOS"):
- [ ] Mozo/vendedor: select de usuarios, filtra ventas donde el usuario creo al menos un venta_item
- [ ] Forma de pago: seleccion multiple (una venta puede tener varias formas de pago)
- [ ] Moneda: seleccion multiple
- [ ] Rango de valores: min/max, habilitado al seleccionar una moneda especifica
- [ ] Mesa: select de mesas
- [ ] Descuento/aumento: select (CON DESCUENTO, CON AUMENTO, SIN DESCUENTO)

Detalle de venta (dialogo):
- [ ] Seccion detalle de cobro: moneda, forma de pago, valor por linea de pago, descuento general, aumento
- [ ] Mozo que adiciono cada item (ventaItem.createdBy)
- [ ] Items cancelados: mostrar motivo de cancelacion
- [ ] Tiempo de permanencia: createdAt → fechaCierre

---

## ETAPA 3: REPORTES, RESERVAS Y OPTIMIZACIONES

**Objetivo:** Herramientas de analisis, gestion de reservas, y optimizaciones de UX para operacion a largo plazo.

**Prioridad:** MEDIA — Mejora la gestion pero no bloquea la operacion diaria.

### 3.1 Reportes de ventas

Componente: `reportes-ventas.component.ts`

- [ ] **Ventas por periodo**: grafico de lineas/barras, total vendido por dia/semana/mes
- [ ] **Productos mas vendidos**: ranking con cantidad y monto, filtrable por periodo
- [ ] **Ventas por cajero/usuario**: comparativa de rendimiento
- [ ] **Ventas por forma de pago**: distribucion efectivo vs tarjeta vs transferencia
- [ ] **Ventas por mesa/sector**: identificar zonas mas productivas
- [ ] **Ticket promedio**: evolucion del ticket promedio por periodo
- [ ] **Horarios pico**: ventas agrupadas por hora del dia
- [ ] Exportar a PDF/Excel
- [ ] Chips de rango predefinido: Hoy, Esta semana, Este mes, Ultimo trimestre

### 3.2 Dashboard de ventas con datos reales

- [ ] Conectar stats del dashboard a queries reales:
  - Ventas del dia (cantidad y monto)
  - Ticket promedio del dia
  - Mesas ocupadas / total
  - Cajas abiertas con datos reales
  - Top productos vendidos del dia
  - Grafico de ventas con datos reales
- [ ] Handlers necesarios: `getVentasResumenDia`, `getTopProductosVendidos`, `getVentasPorPeriodo`

### 3.3 Sistema de reservas

Componente: `list-reservas.component.ts`, `create-reserva-dialog.component.ts`

- [ ] ABM de reservas: cliente, fecha/hora, cantidad personas, mesa asignada, motivo, observacion
- [ ] Calendario visual de reservas (vista dia/semana)
- [ ] Al crear reserva: marca mesa como `reservado = true`
- [ ] Al llegar la hora: notificacion visual en el PdV
- [ ] Al confirmar llegada: cambia mesa a OCUPADO y crea la venta
- [ ] Cancelar reserva: libera la mesa
- [ ] Listado de reservas del dia visible en el dashboard

### 3.4 Observaciones por item

- [x] Vincular sistema de observaciones existente (entity `Observacion`) con items de venta
- [x] Al agregar producto, mostrar observaciones predefinidas del producto (ej: "sin sal", "termino medio")
- [x] Permitir observacion libre (texto)
- [ ] Observaciones visibles en comanda de cocina (pendiente: kitchen display 2.2)

### 3.5 Promociones y combos en PdV

- [ ] Aplicar promociones activas automaticamente al agregar productos
- [ ] Agregar combos desde el PdV (entity `Combo` ya existe)
- [ ] Mostrar precio original vs precio con promocion
- [ ] Indicador visual de promocion aplicada en la tabla de items

### 3.6 Atajos de teclado

- [x] `F1` — Cobrar venta
- [x] `F2` — Venta rapida
- [x] `F3` — Buscar producto
- [x] `F4` — Cancelar venta
- [x] `F5` — Reimprimir
- [x] `Esc` — Deseleccionar mesa
- [ ] `1-9` + `Enter` — Seleccionar mesa por numero (pendiente)
- [x] Tooltips con atajos en los botones

### 3.7 Notificaciones y alertas

- [ ] Mesa con venta abierta por mas de X minutos (configurable)
- [ ] Comanda pendiente por mas de X minutos
- [ ] Reserva proxima a llegar (15 min antes)
- [ ] Stock bajo en producto vendido (integracion futura con inventario)
- [ ] Indicadores visuales en el PdV (badges, colores, iconos)

### 3.8 Configuracion avanzada del PdV

Ampliar entidad `PdvConfig`:
- [ ] Tiempo maximo de venta abierta antes de alerta
- [ ] Descuento maximo permitido sin autorizacion (%)
- [ ] Impresora predeterminada para tickets
- [ ] Impresora predeterminada para comandas
- [ ] Habilitar/deshabilitar venta rapida
- [ ] Habilitar/deshabilitar delivery
- [ ] Moneda principal para display
- [ ] UI para editar toda la configuracion

### 3.9 Auditoria y seguridad

- [ ] Log de acciones del PdV: quien hizo que y cuando
  - Cancelaciones de items/ventas
  - Descuentos aplicados
  - Transferencias de mesa
  - Modificaciones de items
- [ ] Reporte de auditoria accesible por administradores
- [ ] Restriccion por roles: quien puede cancelar, quien puede dar descuento, etc.

---

## RESUMEN POR ETAPAS

| Etapa | Estado | Bloques completados | Pendientes |
|-------|--------|---------------------|------------|
| **1 - PdV Operativo** | ✅ COMPLETA | 8/8 | - |
| **2 - Operaciones Avanzadas** | 🟡 PARCIAL | 7/10 | 2.2 Kitchen Display, 2.3 Impresion, 2.5 Delivery |
| **3 - Reportes y Optimizacion** | 🟡 PARCIAL | 2/9 | 3.1 Reportes, 3.2 Dashboard real, 3.3 Reservas, 3.5 Promociones, 3.7 Alertas, 3.8 Config, 3.9 Auditoria |

### Entidades creadas:
- `ComandaItem` — vincula items de venta con comandas
- `VentaItemObservacion` — vincula observaciones con items de venta
- Columnas nuevas en `Venta`: descuentoPorcentaje, descuentoMonto, descuentoMotivo, descuentoAutorizadoPor, ventaPadre
- Columnas nuevas en `Comanda`: venta, numero, estado, items

### Componentes creados:
- `cobrar-venta-dialog` — cobro de venta con multi-moneda
- `cancelar-venta-dialog` — cancelacion con motivo obligatorio
- `edit-venta-item-dialog` — edicion de item con observaciones
- `cierre-caja-dialog` — cierre de caja con conteo
- `transferir-mesa-dialog` — transferir venta entre mesas
- `buscar-cliente-dialog` — busqueda y asociacion de cliente
- `descuento-dialog` — descuento global (% o fijo)
- `dividir-cuenta-dialog` — division de cuenta (iguales o por items)
- `detalle-venta-dialog` — vista detalle de venta
- `list-precios-delivery` — ABM de precios de delivery
- `list-ventas` — historial de ventas con filtros

---

## PROXIMOS PASOS

### Mejoras PdV pendientes
- **Division de cuenta por items** — En el dialogo de cobro, permitir asignar items especificos a cada persona/cuenta para que el valor por persona sea exacto segun lo que consumio. Complementa la division en partes iguales ya implementada.
- **Accesos directos a productos** — Reemplazar la navegacion por categorias actual con un modulo de accesos directos configurables. El usuario podra crear grupos (ej: "BEBIDAS", "HAMBURGUESAS") y seleccionar los productos que quiere mostrar en cada grupo. En el PdV se mostraran como botones rapidos agrupados por categoria, permitiendo agregar productos con un solo click sin pasar por el dialogo de busqueda.

### Fase futura — Experiencia del cliente
- **Propina digital** — Al cobrar, ofrecer opciones de propina (10%, 15%, 20%) que se registra como linea de pago tipo PROPINA
- **Fidelizacion/Loyalty** — Puntos por compra, recompensas, historial de cliente frecuente
- **Autoatendimiento (QR)** — QR en mesa que abre menu web donde el cliente puede ver productos y hacer pedidos directamente a cocina
- **Cupones de descuento y promo tickets** — Generar cupones con codigo unico, validar al cobrar, vincular a campanas de marketing
- **Totem de autoatendimiento** — Pantalla tactil donde el cliente realiza su pedido sin intervencion del mozo, similar a McDonalds

### Fase futura — Operaciones avanzadas
- **Agendamiento de pedidos** — Agendar pedido de un cliente con hora programada para lanzar en cocina. Util para eventos, pedidos anticipados y delivery programado
- **Tracking completo de delivery** — El pedido se toma via sistema y el entregador accede a una app web para recibir datos del pedido (direccion, telefono, items, monto). Seguimiento en tiempo real del estado de entrega
- **Integracion con balanza** — Conectar balanza digital al PdV para productos pesables (carnes, quesos, etc). Al pesar, el peso se carga automaticamente como cantidad del item. Prioridad media-alta por uso frecuente en restaurantes

### Fase 3 — Infraestructura
- **2.3 Impresion de Tickets y Comandas** — Sistema completo de impresion automatica:
  - **Ya implementado:** Entidad Printer (CRUD), utilidad ESC/POS con node-thermal-printer, soporte network/USB/Bluetooth/CUPS
  - **Pendiente:**
    - Agregar relacion `Producto → Printer` (ManyToOne, nullable): cada producto se configura individualmente con su impresora destino (ej: hamburguesa → impresora cocina, mojito → impresora barra, helado → impresora barra). Si no tiene impresora, no imprime comanda
    - Templates ESC/POS para: comanda de cocina (mesa, items, hora, observaciones), ticket de venta, pre-cuenta, cierre de caja
    - Auto-impresion al agregar item en PdV: si el producto tiene impresora configurada, imprimir comanda automaticamente
    - Opcion "Reimprimir" en mat-menu del item de venta para reenviar comanda
    - ABM de impresoras en UI (ya existe handler, falta componente Angular)
    - Configuracion de impresora por producto en el formulario de edicion de producto
- **2.5 Sistema de Delivery** — Lista kanban por estado, crear delivery con cliente/direccion, flujo ABIERTO→EN_CAMINO→ENTREGADO

### Fase 4 — Cocina (depende de 2.1 Comandas, ya implementado)
- **2.2 Kitchen Display** — Pantalla de cocina con cards de comandas pendientes, auto-refresh, colores por tiempo

### Fase 5 — Reportes e inteligencia
- **3.1 Reportes de Ventas** — Graficos por periodo/producto/cajero/forma de pago, exportar PDF/Excel
- **3.2 Dashboard con Datos Reales** — Reemplazar datos mock con queries reales
- **3.3 Sistema de Reservas** — Calendario, CRUD de reservas, marcar mesa reservada
- **3.5 Promociones y Combos en PdV** — Auto-aplicar promociones, agregar combos

### Fase 6 — Configuracion y seguridad
- **3.7 Notificaciones y Alertas** — Alertas por tiempo en ventas/comandas
- **3.8 Configuracion Avanzada del PdV** — UI completa para PdvConfig
- **3.9 Auditoria y Seguridad** — Entity AuditLog, log de acciones criticas, restricciones por rol
