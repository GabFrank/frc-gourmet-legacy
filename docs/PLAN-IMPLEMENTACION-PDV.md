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

- [ ] **BUG: createBatchPdvMesas** — Implementar handler en `ventas.handler.ts` y exponer en `preload.ts`. El frontend ya lo llama desde `pdv-mesa-dialog.component.ts:270`.
- [ ] **BUG: findPrecioCosto()** — Buscar el precio de costo real del producto desde `PrecioCosto` entity en vez de retornar 0.
- [ ] **BUG: Botones placeholder** — Asignar funciones reales a los 6 botones del template del PdV (ver seccion 1.5).
- [ ] **BUG: Filtro sectores** — Conectar los botones de sector en el panel de mesas a `loadMesasBySector()`.

### 1.2 Dialogo de cobro / cierre de venta

Componente: `cobrar-venta-dialog.component.ts`

Funcionalidad:
- [ ] Mostrar resumen de la venta: cantidad de items, subtotal, descuentos, total
- [ ] Mostrar total en cada moneda configurada (usando tipos de cambio)
- [ ] Selector de forma de pago (efectivo, tarjeta, transferencia, mixto)
- [ ] Para efectivo: campo de monto recibido por moneda, calculo automatico de vuelto
- [ ] Para mixto: permitir ingresar montos parciales en diferentes formas de pago
- [ ] Boton "Cobrar" que:
  - Crea el registro de `Pago`
  - Actualiza `Venta.estado` a `CONCLUIDA`
  - Actualiza `Venta.formaPago`
  - Actualiza `PdvMesa.estado` a `DISPONIBLE`
  - Limpia la mesa seleccionada en el PdV
  - Limpia la tabla de items
  - Recalcula totales a 0
- [ ] Validacion: no permitir cobrar si el total es 0 o no hay items activos

### 1.3 Cancelar venta completa

- [ ] Boton "Cancelar Venta" en el PdV (con confirmacion via `confirmation-dialog`)
- [ ] Campo obligatorio: motivo de cancelacion
- [ ] Al confirmar:
  - Actualiza `Venta.estado` a `CANCELADA`
  - Cancela todos los items activos (estado → CANCELADO)
  - Libera la mesa (estado → DISPONIBLE)
  - Limpia la UI

### 1.4 Editar item de venta

Componente: `editar-venta-item-dialog.component.ts`

- [ ] Dialogo para modificar: cantidad, descuento unitario
- [ ] Al guardar:
  - Marca item original como `MODIFICADO`
  - Crea nuevo `VentaItem` con los datos actualizados
  - Vincula via `nuevaVersionVentaItem`
  - Registra `modificadoPor` y `horaModificacion`
- [ ] Recalcular totales despues de la edicion

### 1.5 Definir botones de accion del PdV

Panel izquierdo (bajo la tabla de items):
- [ ] **Cobrar** — Abre `cobrar-venta-dialog` (seccion 1.2)
- [ ] **Descuento** — Abre dialogo para aplicar descuento global a la venta (% o monto fijo)
- [ ] **Cancelar Venta** — Ejecuta cancelacion completa (seccion 1.3)

Panel derecho (bajo las mesas):
- [ ] **Transferir Mesa** — Mueve una venta abierta de una mesa a otra
- [ ] **Venta Rapida** — Crea venta sin mesa (para llevar / mostrador)
- [ ] **Reimprimir** — Reimprime el ultimo ticket (placeholder hasta Etapa 2)

### 1.6 Cierre de caja

Componente: `cerrar-caja-dialog.component.ts`

- [ ] Verificar que no haya ventas abiertas en la caja (obligar a cerrar/cancelar primero)
- [ ] Formulario de conteo final por moneda (campo para cada denominacion)
- [ ] Mostrar resumen:
  - Monto de apertura por moneda
  - Total de ventas por moneda
  - Total esperado (apertura + ventas)
  - Total contado (ingresado por usuario)
  - Diferencia (sobrante/faltante)
- [ ] Al confirmar: actualizar estado de caja a CERRADO, registrar fecha de cierre
- [ ] Accesible desde: boton en el PdV y desde el dashboard de ventas

### 1.7 Venta rapida (sin mesa)

- [ ] Permitir crear una venta sin seleccionar mesa (venta de mostrador / para llevar)
- [ ] Boton "Venta Rapida" que crea una `Venta` con `mesa = null`
- [ ] Flujo: click → se habilita la busqueda de productos → agregar items → cobrar
- [ ] Indicador visual en el PdV de que es una venta sin mesa

### 1.8 Navegacion de categorias en el PdV

- [ ] Cargar `PdvGrupoCategorias` con sus categorias al iniciar el PdV
- [ ] Click en grupo → muestra categorias del grupo
- [ ] Click en categoria → muestra items de la categoria (con imagen)
- [ ] Click en item → agrega el producto vinculado al carrito (usando cantidad del campo de busqueda)
- [ ] Boton "Volver" para navegar hacia atras en la jerarquia
- [ ] Breadcrumb visual: Grupo > Categoria > Items

---

## ETAPA 2: OPERACIONES AVANZADAS

**Objetivo:** Funcionalidades que mejoran la operacion diaria: comandas para cocina, impresion de tickets, delivery, descuentos avanzados.

**Prioridad:** ALTA — Necesario para operacion eficiente en un restaurante real.

### 2.1 Sistema de comandas

Entidad `Comanda` ya existe. Crear entidad `ComandaItem`:

- [ ] **ComandaItem entity**: venta_item, comanda, estado (PENDIENTE, EN_PREPARACION, LISTO, ENTREGADO), observacion
- [ ] Al agregar items al carrito, generar automaticamente una comanda con los items nuevos
- [ ] Comanda incluye: numero secuencial, mesa, hora, items con cantidad y observaciones
- [ ] Estado de comanda: PENDIENTE → EN_PREPARACION → LISTA → ENTREGADA
- [ ] Permitir agregar observaciones por item (ej: "sin cebolla", "bien cocido")

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

- [ ] **Descuento por item**: porcentaje o monto fijo aplicado a un item individual
- [ ] **Descuento global**: porcentaje o monto fijo sobre el total de la venta
- [ ] **Motivo de descuento**: campo obligatorio (ej: cortesia, empleado, promocion)
- [ ] **Autorizacion**: descuentos mayores a X% requieren autorizacion de supervisor
- [ ] Registro de quien aplico el descuento y cuando
- [ ] Mostrar descuentos aplicados en el resumen de la venta

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

- [ ] ABM de precios de delivery (ya tiene backend completo)
- [ ] Tabla: descripcion, valor, activo
- [ ] Accesible desde el dashboard de ventas

### 2.7 Transferir mesa

- [ ] Dialogo que muestra mesas disponibles
- [ ] Al seleccionar destino: mueve la `Venta` a la nueva mesa
- [ ] Actualiza estados: mesa origen → DISPONIBLE, mesa destino → OCUPADO
- [ ] Registrar en log quien transfirio

### 2.8 Division de cuenta

- [ ] Dividir en partes iguales (2, 3, 4... personas)
- [ ] Dividir por items (seleccionar que items paga cada persona)
- [ ] Cada parte genera su propio proceso de cobro
- [ ] Venta original se marca como CONCLUIDA solo cuando todas las partes estan pagadas

### 2.9 Asociar cliente registrado

- [ ] Boton en info de mesa para buscar cliente existente
- [ ] Dialogo de busqueda por nombre, telefono o documento
- [ ] Al seleccionar: vincular `Venta.cliente` con el cliente del sistema
- [ ] Mostrar datos del cliente en la card de mesa (nombre, telefono, historial breve)

### 2.10 Historial de ventas

Componente: `list-ventas.component.ts`

- [ ] Tabla con todas las ventas: fecha, mesa, cajero, total, estado, forma de pago
- [ ] Filtros: rango de fechas, estado, cajero, forma de pago
- [ ] Detalle de venta: items, pagos, descuentos, comanda
- [ ] Accion: reimprimir ticket
- [ ] Accesible desde dashboard de ventas

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

- [ ] Vincular sistema de observaciones existente (entity `Observacion`) con items de venta
- [ ] Al agregar producto, mostrar observaciones predefinidas del producto (ej: "sin sal", "termino medio")
- [ ] Permitir observacion libre (texto)
- [ ] Observaciones visibles en comanda de cocina

### 3.5 Promociones y combos en PdV

- [ ] Aplicar promociones activas automaticamente al agregar productos
- [ ] Agregar combos desde el PdV (entity `Combo` ya existe)
- [ ] Mostrar precio original vs precio con promocion
- [ ] Indicador visual de promocion aplicada en la tabla de items

### 3.6 Atajos de teclado

- [ ] `F1` — Cobrar venta
- [ ] `F2` — Buscar producto (focus en campo de busqueda)
- [ ] `F3` — Nueva venta rapida
- [ ] `F4` — Cancelar venta
- [ ] `F5` — Imprimir pre-cuenta
- [ ] `Esc` — Deseleccionar mesa / cerrar dialogo
- [ ] `1-9` + `Enter` — Seleccionar mesa por numero
- [ ] Panel de ayuda con atajos disponibles

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

| Etapa | Tareas | Objetivo | Resultado |
|-------|--------|----------|-----------|
| **1 - PdV Operativo** | 8 bloques, ~25 tareas | Ciclo completo de venta | El PdV puede operar en un restaurante real |
| **2 - Operaciones Avanzadas** | 10 bloques, ~40 tareas | Comandas, delivery, impresion, historial | Operacion eficiente con cocina y delivery |
| **3 - Reportes y Optimizacion** | 9 bloques, ~35 tareas | Reportes, reservas, atajos, auditoria | Gestion inteligente y analisis del negocio |

### Dependencias entre etapas:
- Etapa 2 depende de Etapa 1 (necesita cobro funcional para comandas, delivery, etc.)
- Etapa 3 es mayormente independiente (reportes y reservas no dependen de comandas)
- Dentro de cada etapa, las tareas pueden implementarse en paralelo salvo dependencias explicitas

### Entidades nuevas necesarias:
- **Etapa 1**: Ninguna (todo existe)
- **Etapa 2**: `ComandaItem` (para vincular items de venta con comandas)
- **Etapa 3**: Posible `AuditoriaLog` para registro de acciones
