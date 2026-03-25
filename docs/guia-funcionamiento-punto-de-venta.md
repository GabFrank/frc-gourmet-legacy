# Guia de Funcionamiento - Punto de Venta (PdV)

Este documento describe todas las funciones del Punto de Venta y el estado actual de implementacion de cada una.

---

## 1. GESTION DE CAJA

### 1.1 Apertura de Caja
- **Descripcion:** Al abrir el PdV se verifica si el usuario actual tiene una caja abierta. Si no hay caja abierta se muestra un dialogo preguntando si desea abrir una nueva.
- **Estado:** IMPLEMENTADO
- **Ubicacion:** `pdv.component.ts` - `ngOnInit()`
- **Notas:** Si el usuario rechaza abrir una caja, se cierra la tab del PdV automaticamente.

### 1.2 Informacion de Caja Activa
- **Descripcion:** Se muestra en el panel derecho la informacion de la caja abierta: ID, fecha de apertura, tiempo abierto y estado.
- **Estado:** IMPLEMENTADO
- **Ubicacion:** `pdv.component.html` - seccion `caja-data-card`
- **Notas:** El tiempo abierto se actualiza automaticamente cada 60 segundos.

### 1.3 Cierre de Caja
- **Descripcion:** Permite cerrar la caja actual, realizando un conteo final y generando un resumen.
- **Estado:** NO IMPLEMENTADO
- **Pendiente:**
  - Boton de cierre de caja en el PdV
  - Dialogo de cierre con conteo de monedas
  - Resumen de ventas del turno

---

## 2. GESTION DE MESAS

### 2.1 Visualizacion de Mesas
- **Descripcion:** Grid de botones numerados representando las mesas del local. Se muestra estado con colores (disponible, ocupada, reservada).
- **Estado:** IMPLEMENTADO
- **Ubicacion:** `pdv.component.html` - seccion `tables-grid`
- **Entidad:** `PdvMesa` (numero, cantidad_personas, activo, reservado, estado, sector, reserva, venta)
- **Estados posibles:** DISPONIBLE, OCUPADO

### 2.2 Seleccion de Mesa
- **Descripcion:** Al hacer click en una mesa, se selecciona y se cargan sus datos (venta activa, items, nombre cliente).
- **Estado:** IMPLEMENTADO
- **Ubicacion:** `pdv.component.ts` - `selectMesa()`, `loadVentaItems()`

### 2.3 Filtro por Sector
- **Descripcion:** Las mesas pueden filtrarse por sector (zonas del local).
- **Estado:** IMPLEMENTADO
- **Ubicacion:** `pdv.component.ts` - `loadMesasBySector()`, `resetMesasFilter()`
- **Entidad:** `Sector` (nombre, activo, mesas[])
- **Notas:** Los botones de filtro por sector en el template estan como "Button" placeholder sin funcionalidad conectada.

### 2.4 Administracion de Mesas (ABM)
- **Descripcion:** Dialogo para crear, editar y eliminar mesas desde el dashboard de ventas.
- **Estado:** IMPLEMENTADO
- **Ubicacion:** `pdv-mesa-dialog.component.ts`, se abre desde `ventas-dashboard.component.ts` - `openPdvMesasDialog()`

### 2.5 Reserva de Mesas
- **Descripcion:** Sistema de reservas asociado a mesas con datos de cliente, fecha/hora, cantidad de personas y observaciones.
- **Estado:** PARCIALMENTE IMPLEMENTADO
- **Entidad:** `Reserva` (cliente, nombre_cliente, numero_cliente, fecha_hora_reserva, cantidad_personas, motivo, observacion, activo)
- **Pendiente:**
  - UI para crear/gestionar reservas
  - Visualizacion de reservas en el calendario
  - Notificaciones de reservas proximas

---

## 3. GESTION DE VENTAS

### 3.1 Crear Venta
- **Descripcion:** Al agregar el primer producto a una mesa sin venta activa, se crea automaticamente una nueva venta asociada a la mesa y la caja actual.
- **Estado:** IMPLEMENTADO
- **Ubicacion:** `pdv.component.ts` - `getVenta()`
- **Entidad:** `Venta` (cliente, estado, nombreCliente, formaPago, caja, pago, delivery, mesa, items[])
- **Estados de venta:** ABIERTA, CONCLUIDA, CANCELADA

### 3.2 Nombre de Cliente
- **Descripcion:** Permite agregar/editar un nombre de cliente a la venta sin necesidad de crear un cliente en el sistema.
- **Estado:** IMPLEMENTADO
- **Ubicacion:** `pdv.component.ts` - `startEditingClienteName()`, `saveClienteName()`, `cancelEditingClienteName()`

### 3.3 Asociar Cliente Registrado
- **Descripcion:** Vincular la venta a un cliente existente en el sistema.
- **Estado:** NO IMPLEMENTADO
- **Pendiente:**
  - Busqueda/seleccion de cliente existente
  - Mostrar datos del cliente en la venta

### 3.4 Concluir/Cerrar Venta
- **Descripcion:** Proceso de cierre de venta: seleccionar forma de pago, registrar pago, cambiar estado a CONCLUIDA y liberar mesa.
- **Estado:** NO IMPLEMENTADO
- **Pendiente:**
  - Dialogo de cierre de venta
  - Seleccion de forma de pago
  - Registro de pago (monto recibido, vuelto)
  - Soporte multi-moneda en pago
  - Liberacion automatica de mesa al cerrar venta

### 3.5 Cancelar Venta
- **Descripcion:** Cancelar toda la venta, marcandola como CANCELADA y liberando la mesa.
- **Estado:** NO IMPLEMENTADO
- **Pendiente:**
  - Boton de cancelar venta
  - Confirmacion de cancelacion
  - Registro de motivo de cancelacion
  - Liberacion de mesa

---

## 4. GESTION DE ITEMS DE VENTA

### 4.1 Buscar y Agregar Productos
- **Descripcion:** Busqueda de productos mediante dialogo. Soporta cantidad con atajo de teclado (ej: `3*` para cantidad 3) y Enter para buscar.
- **Estado:** IMPLEMENTADO
- **Ubicacion:** `pdv.component.ts` - `openProductSearchDialog()`, `onSearchKeyDown()`, `addProduct()`
- **Componente:** `ProductoSearchDialogComponent`
- **Notas:** Si no hay mesa seleccionada al agregar, se muestra dialogo de seleccion de mesa.

### 4.2 Tabla de Items
- **Descripcion:** Tabla expandible que muestra los items de la venta: producto, presentacion/cantidad, precio unitario (con descuento aplicado) y total.
- **Estado:** IMPLEMENTADO
- **Ubicacion:** `pdv.component.html` - seccion `sale-table`
- **Entidad:** `VentaItem` (venta, precioCostoUnitario, precioVentaUnitario, cantidad, descuentoUnitario, estado, canceladoPor, horaCancelado, modificado, modificadoPor, horaModificacion, nuevaVersionVentaItem)
- **Estados de item:** ACTIVO, MODIFICADO, CANCELADO

### 4.3 Detalle Expandido de Item
- **Descripcion:** Al hacer click en un item se expande mostrando: creado por, estado, fecha de creacion, y datos de cancelacion/modificacion si aplica.
- **Estado:** IMPLEMENTADO
- **Ubicacion:** `pdv.component.html` - seccion `expandedDetail`

### 4.4 Cancelar Item
- **Descripcion:** Cambia el estado del item a CANCELADO, registrando quien lo cancelo y la hora. El item cancelado no se suma al total.
- **Estado:** IMPLEMENTADO
- **Ubicacion:** `pdv.component.ts` - `cancelItem()`

### 4.5 Eliminar Item
- **Descripcion:** Elimina completamente el item de la venta y de la base de datos.
- **Estado:** IMPLEMENTADO
- **Ubicacion:** `pdv.component.ts` - `removeItem()`

### 4.6 Editar Item
- **Descripcion:** Permite modificar cantidad, precio u otros datos del item.
- **Estado:** NO IMPLEMENTADO (metodo vacio)
- **Ubicacion:** `pdv.component.ts` - `editItem()` (placeholder)
- **Pendiente:**
  - Dialogo de edicion de item
  - Versionado del item (campo `nuevaVersionVentaItem` ya existe en la entidad)
  - Registro de quien modifico y cuando

### 4.7 Descuentos por Item
- **Descripcion:** Cada item tiene campo `descuentoUnitario` que se resta del precio unitario al calcular totales.
- **Estado:** PARCIALMENTE IMPLEMENTADO
- **Notas:** El calculo de totales ya contempla el descuento, pero no hay UI para aplicar descuentos.
- **Pendiente:**
  - UI para aplicar descuento a un item individual
  - Validaciones de descuento maximo

---

## 5. GESTION DE MONEDAS Y TOTALES

### 5.1 Totales Multi-Moneda
- **Descripcion:** Se muestran los totales de la venta convertidos a cada moneda configurada en la caja, usando los tipos de cambio vigentes.
- **Estado:** IMPLEMENTADO
- **Ubicacion:** `pdv.component.ts` - `calculateTotals()`, `loadCajaMonedasConfig()`, `loadExchangeRates()`
- **Notas:** Se usa la moneda principal como base y se convierte a las demas usando `MonedaCambio.compraLocal`.

### 5.2 Saldos por Moneda
- **Descripcion:** Se muestra el saldo pendiente en cada moneda (actualmente igual al total ya que no hay pagos parciales).
- **Estado:** PARCIALMENTE IMPLEMENTADO
- **Notas:** La estructura de saldos existe pero no se actualiza con pagos parciales.
- **Pendiente:**
  - Logica de pago parcial multi-moneda
  - Actualizacion de saldos al registrar pagos

### 5.3 Banderas de Moneda
- **Descripcion:** Se muestran las banderas de cada moneda junto al total, con fallback a base64, URL de bandera, o placeholder.
- **Estado:** IMPLEMENTADO
- **Ubicacion:** `pdv.component.html` - seccion `currency-totals`

---

## 6. CATEGORIAS DEL PdV (MENU RAPIDO)

### 6.1 Estructura de Categorias
- **Descripcion:** Sistema jerarquico de 4 niveles para organizar el menu rapido del PdV:
  - **PdvGrupoCategoria** → agrupa categorias (ej: "Comidas", "Bebidas")
  - **PdvCategoria** → categoria dentro del grupo (ej: "Pizzas", "Pastas")
  - **PdvCategoriaItem** → item visual con imagen (ej: "Pizza Margarita")
  - **PdvItemProducto** → vinculo al producto real del sistema (con nombre alternativo opcional)
- **Estado:** IMPLEMENTADO (estructura y ABM)
- **Entidades:** `PdvGrupoCategoria`, `PdvCategoria`, `PdvCategoriaItem`, `PdvItemProducto`

### 6.2 Administracion de Categorias (ABM)
- **Descripcion:** Dialogo con pestanas para gestionar los 4 niveles de la jerarquia. Incluye carga de imagenes para items.
- **Estado:** IMPLEMENTADO
- **Ubicacion:** `pdv-config-dialog.component.ts`, se abre desde `ventas-dashboard.component.ts` - `openPdvConfigDialog()`

### 6.3 Visualizacion de Categorias en el PdV
- **Descripcion:** Panel derecho muestra las categorias como botones y los items como grid con imagenes.
- **Estado:** PARCIALMENTE IMPLEMENTADO
- **Ubicacion:** `pdv.component.html` - seccion `categories-card`
- **Pendiente:**
  - Los botones de categoria no navegan entre niveles
  - No se puede agregar productos al carrito haciendo click en un item de categoria
  - Falta logica de seleccion de grupo → categoria → item → producto

---

## 7. CONFIGURACION DEL PdV

### 7.1 Configuracion General
- **Descripcion:** Configuracion basica del PdV: cantidad de mesas, grupo de categorias activo.
- **Estado:** PARCIALMENTE IMPLEMENTADO
- **Entidad:** `PdvConfig` (cantidad_mesas, pdvGrupoCategoria)
- **Pendiente:**
  - UI para editar configuracion general del PdV
  - Aplicar configuracion al cargar el PdV

---

## 8. DELIVERY

### 8.1 Gestion de Deliveries
- **Descripcion:** Sistema de delivery con estados de seguimiento, cliente asociado, direccion, telefono y precio de delivery configurable.
- **Estado:** PARCIALMENTE IMPLEMENTADO (entidades y handlers backend)
- **Entidad:** `Delivery` (precioDelivery, telefono, direccion, cliente, estado, fechaAbierto, fechaParaEntrega, fechaEnCamino, fechaEntregado, entregadoPor)
- **Estados:** ABIERTO, PARA_ENTREGA, EN_CAMINO, ENTREGADO, CANCELADO
- **Entidad de precio:** `PrecioDelivery` (descripcion, valor, activo)
- **Pendiente:**
  - UI de gestion de deliveries (listado, crear, editar)
  - Integracion de delivery con la venta en el PdV
  - Dashboard de deliveries en curso

### 8.2 Precios de Delivery
- **Descripcion:** ABM de precios de delivery configurables.
- **Estado:** IMPLEMENTADO (backend handlers)
- **Ubicacion:** `ventas.handler.ts` - handlers de PrecioDelivery
- **Pendiente:**
  - UI para gestionar precios de delivery

---

## 9. COMANDAS

### 9.1 Gestion de Comandas
- **Descripcion:** Sistema de comandas para enviar pedidos a cocina, vinculado a una mesa.
- **Estado:** PARCIALMENTE IMPLEMENTADO (solo entidad)
- **Entidad:** `Comanda` (codigo, pdv_mesa, activo)
- **Pendiente:**
  - Generacion automatica de comandas al agregar items
  - Impresion de comandas
  - Estados de comanda (pendiente, en preparacion, lista)
  - Items de comanda vinculados a items de venta
  - Pantalla de cocina para ver comandas pendientes

---

## 10. DASHBOARD DE VENTAS

### 10.1 Panel Principal
- **Descripcion:** Dashboard de acceso al PdV y funciones relacionadas.
- **Estado:** PARCIALMENTE IMPLEMENTADO
- **Ubicacion:** `ventas-dashboard.component.ts`
- **Funciones disponibles:**
  - Abrir PdV (IMPLEMENTADO)
  - Abrir configuracion de categorias PdV (IMPLEMENTADO)
  - Abrir gestion de mesas (IMPLEMENTADO)
  - Estadisticas (TODO - datos placeholder)
  - Listado de ventas (TODO)
  - Listado de deliveries (TODO)

---

## 11. FUNCIONES PENDIENTES GENERALES

### 11.1 Impresion
- **Pendiente:**
  - Impresion de ticket/factura de venta
  - Impresion de comandas para cocina
  - Impresion de resumen de cierre de caja

### 11.2 Descuentos Globales
- **Pendiente:**
  - Descuento porcentual o fijo sobre el total de la venta
  - Promociones aplicables desde el PdV

### 11.3 Division de Cuenta
- **Pendiente:**
  - Dividir una venta en multiples pagos
  - Mover items de una mesa a otra

### 11.4 Historial y Reportes
- **Pendiente:**
  - Listado de ventas con filtros
  - Reporte de ventas por periodo
  - Reporte de productos mas vendidos
  - Reporte de ventas por mesero/usuario

### 11.5 Botones de Accion del PdV
- **Notas:** Existen 6 botones placeholder en el template (3 en la parte inferior del panel izquierdo, 3 en la parte inferior del panel derecho) sin funcionalidad asignada.
- **Pendiente:**
  - Definir funciones para cada boton (ej: Cobrar, Imprimir, Cancelar Venta, etc.)

---

## RESUMEN DE ESTADO

| Modulo | Implementado | Parcial | Pendiente |
|--------|-------------|---------|-----------|
| Gestion de Caja | 2 | 0 | 1 |
| Gestion de Mesas | 4 | 0 | 1 |
| Gestion de Ventas | 2 | 0 | 3 |
| Items de Venta | 5 | 1 | 1 |
| Monedas y Totales | 2 | 1 | 0 |
| Categorias PdV | 2 | 1 | 0 |
| Configuracion PdV | 0 | 1 | 0 |
| Delivery | 0 | 2 | 0 |
| Comandas | 0 | 1 | 0 |
| Dashboard | 0 | 1 | 0 |
| Funciones Generales | 0 | 0 | 5 |
| **TOTAL** | **17** | **8** | **11** |

---

## BUGS CONOCIDOS

1. **createBatchPdvMesas**: El frontend llama a este handler pero no existe en `ventas.handler.ts` ni en `preload.ts`
2. **findPrecioCosto()**: Retorna 0 hardcodeado en vez de buscar el precio de costo real
3. **editItem()**: Metodo vacio en `pdv.component.ts`, no hace nada
4. **Botones placeholder**: 6 botones "Button" sin funcionalidad en el template del PdV
5. **Filtro de sectores**: Botones de sector en panel de mesas no conectados a `loadMesasBySector()`
6. **Categorias click**: Los items de categoria se muestran pero no agregan productos al carrito

---

> Para el plan de implementacion detallado dividido en 3 etapas, ver [PLAN-IMPLEMENTACION-PDV.md](PLAN-IMPLEMENTACION-PDV.md)
