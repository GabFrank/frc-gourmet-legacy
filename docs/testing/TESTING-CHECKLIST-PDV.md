# Testing Checklist — Punto de Venta (PdV)

Checklist de testeo manual de UI para todas las funcionalidades implementadas del PdV.
Marcar `[x]` cuando el test pase, `[!]` si falla (registrar en `ERRORES-PDV.md`).

---

## 1. Apertura del PdV

### 1.1 Navegación al PdV
- [x] Abrir sidebar → Ventas → Dashboard
- [x] Dashboard carga correctamente con quick actions visibles
- [x] Click en "Abrir PdV" → se abre tab "Punto de Venta (PDV)"

### 1.2 Validación de caja
- [ ] Sin caja abierta → muestra diálogo "Caja abierta no encontrada"
- [ ] Click "Sí" → abre diálogo de crear caja
- [ ] Crear caja exitosamente → PdV carga con datos
- [ ] Click "No" → cierra el tab del PdV
- [x] Con caja ya abierta → PdV carga directamente sin diálogo

### 1.3 Carga de datos iniciales
- [x] Card de caja muestra: ID, fecha apertura, tiempo abierto, estado ABIERTO
- [x] Mesas se cargan en el panel derecho
- [x] Monedas y tipos de cambio se cargan (totales multi-moneda visibles)
- [x] Categorías del PdV se cargan (si hay grupos configurados)
- [x] Sectores se cargan en los botones de filtro

---

## 2. Panel de Mesas

### 2.1 Visualización de mesas
- [x] Mesas se muestran como botones numerados
- [x] Mesas disponibles se ven en color verde
- [x] Mesas ocupadas se ven en color diferente
- [x] Mesas reservadas muestran icono de reserva
- [x] Tooltip muestra estado al hacer hover

### 2.2 Filtro por sectores
- [x] Botón "TODOS" visible y seleccionado por defecto
- [x] Botones de cada sector activo visibles
- [x] Click en un sector → solo se muestran mesas de ese sector
- [x] Click en "TODOS" → vuelven a mostrarse todas las mesas
- [x] El botón seleccionado cambia de color (accent)

### 2.3 Selección de mesa
- [x] Click en mesa disponible → card de mesa aparece con datos
- [x] Card muestra: número, capacidad, sector, estado, nombre cliente
- [x] Mesa seleccionada se resalta visualmente
- [x] Click en otra mesa → cambia la selección
- [x] Si la mesa tiene venta abierta → se cargan los items existentes

---

## 3. Agregar Productos

### 3.1 Búsqueda de productos
- [x] Campo "BUSCAR PRODUCTOS" visible con campo de cantidad
- [x] Escribir texto y presionar Enter → abre diálogo de búsqueda
- [x] Click en icono de lupa → abre diálogo de búsqueda
- [x] Seleccionar producto en el diálogo → se agrega a la tabla de items
- [x] Cantidad por defecto es 1
- [x] Cambiar cantidad antes de buscar → se agrega con esa cantidad

### 3.2 Accesos directos / Navegación por categorías
> **PENDIENTE** — Se rediseñará esta sección con un módulo de accesos directos a productos favoritos agrupados por categoría configurable por el usuario. Ver plan de implementación.

### 3.3 Tabla de items
- [x] Items agregados aparecen en la tabla
- [x] Columnas visibles: Producto, Presentación/Cant., Precio, Total
- [x] Nombre del producto se muestra correctamente (no vacío)
- [x] Presentación/cantidad se muestra correctamente (no "0 / 1")
- [x] Precio y total se calculan correctamente
- [x] Menú de acciones (3 puntos) disponible por cada item

### 3.4 Totales
- [x] Total se actualiza al agregar items
- [x] Total se muestra en cada moneda configurada
- [x] Saldo se calcula correctamente

---

## 4. Editar Item

### 4.1 Abrir edición
- [x] Click en menú de acciones del item → opción "Editar"
- [x] Se abre diálogo "EDITAR ITEM"
- [x] Muestra nombre del producto y precio unitario

### 4.2 Modificar valores
- [x] Campo cantidad pre-cargado con valor actual
- [x] Descuento por monto fijo o porcentaje (radio buttons)
- [x] Chips de porcentaje rápido (5%, 10%, 15%, 20%, 25%, 50%)
- [x] Cambiar cantidad → total se recalcula en vivo
- [x] Cambiar descuento → total se recalcula en vivo
- [x] Redondeo a múltiplos de 500 Gs (arriba/abajo/exacto)
- [x] Validación: cantidad mínima 0.01

### 4.3 Observaciones en edición
- [x] Sección "OBSERVACIONES" visible si hay observaciones vinculadas al producto
- [x] Chips de observaciones predefinidas clickeables
- [x] Click en chip → se selecciona/deselecciona
- [x] Campo "OBSERVACIÓN LIBRE" disponible para texto custom
- [x] Al guardar → observaciones se persisten

### 4.4 Guardar edición
- [x] Click "GUARDAR" → item se actualiza in-place (edición directa)
- [x] Historial de cambios se guarda en JSON (auditoría)
- [x] Totales se recalculan
- [x] Icono de comentario visible si el item tiene observaciones
- [x] Detalle expandido muestra descuento e info de observaciones

---

## 5. Cancelar Item

- [x] Click en menú de acciones → "Cancelar"
- [x] Se pide confirmación
- [x] Al confirmar → item marcado como CANCELADO
- [x] Item se muestra tachado y con opacidad reducida en la tabla
- [x] Totales se recalculan

---

## 6. Cobrar Venta

### 6.1 Validaciones
- [ ] Botón "COBRAR" deshabilitado sin venta activa (gris)
- [ ] Botón "COBRAR" deshabilitado con venta sin items activos (gris)
- [ ] Tooltip muestra "Cobrar (F1)"

### 6.2 Diálogo de cobro — Layout
- [ ] Click en COBRAR → abre diálogo "COBRAR VENTA" (80vw x 80vh)
- [ ] Barra superior muestra totales por moneda con banderas
- [ ] Info de items, subtotal y descuentos visible
- [ ] Panel izquierdo: tabla de líneas de pago (vacía al inicio)
- [ ] Panel derecho: botones de monedas y formas de pago
- [ ] Moneda principal pre-seleccionada (botón resaltado)
- [ ] Forma de pago principal pre-seleccionada (botón resaltado)

### 6.3 Selección de moneda y forma de pago
- [ ] Click en botón de moneda → se resalta, valor se auto-llena con saldo
- [ ] Click en botón de forma de pago → se resalta
- [ ] Chips debajo muestran selección actual (ej: "EFECTIVO" "GS")
- [ ] Atajos F1/F2/F3 seleccionan moneda por orden
- [ ] Atajos F4/F5/F6 seleccionan forma de pago por orden

### 6.4 Agregar líneas de pago (multi-pago)
- [ ] Ingresar valor y click ✓ (o Enter) → línea aparece en tabla
- [ ] Tabla muestra: #, Moneda, Forma Pago, Valor, Tipo
- [ ] Saldo se actualiza por moneda (barra inferior)
- [ ] Agregar segunda línea con otra moneda → saldo se ajusta
- [ ] Botón eliminar en cada línea → elimina y recalcula saldo
- [ ] Saldo en verde cuando = 0, en naranja cuando pendiente

### 6.5 Finalizar cobro
- [ ] Botón "Finalizar (F10)" habilitado cuando saldo = 0
- [ ] Click Finalizar → venta pasa a CONCLUIDA
- [ ] Mesa pasa a estado DISPONIBLE
- [ ] UI se limpia: mesa deseleccionada, items vacíos, totales en 0
- [ ] Mesa cambia de color en el panel (vuelve a verde)
- [ ] Atajo F10 ejecuta finalizar

### 6.6 Cobro parcial
- [ ] Botón "Cobro Parcial" habilitado cuando hay líneas pero saldo > 0
- [ ] Click → pago se registra, venta queda ABIERTA

### 6.7 Descuento en cobro
- [ ] Botón "Descuento (F9)" agrega línea tipo DESCUENTO
- [ ] Línea DESCUENTO se muestra en rojo en tabla
- [ ] Saldo se reduce al aplicar descuento
- [ ] Atajo F9 ejecuta descuento

---

## 7. Cancelar Venta

### 7.1 Validaciones
- [ ] Botón "CANCELAR" deshabilitado sin venta activa
- [ ] Tooltip muestra "Cancelar (F4)"

### 7.2 Diálogo de cancelación
- [ ] Click en CANCELAR → abre diálogo con warning
- [ ] Mensaje explica que la acción no se puede deshacer
- [ ] Campo de motivo obligatorio (textarea)
- [ ] Botón "CANCELAR VENTA" deshabilitado sin motivo
- [ ] Escribir motivo → botón se habilita

### 7.3 Confirmar cancelación
- [ ] Click "CANCELAR VENTA" → venta pasa a CANCELADA
- [ ] Todos los items activos pasan a CANCELADO
- [ ] Mesa pasa a DISPONIBLE
- [ ] UI se limpia completamente
- [ ] Botón "VOLVER" cierra el diálogo sin cancelar la venta

---

## 8. Descuento Global

### 8.1 Diálogo de descuento
- [ ] Click en "DESCUENTO" → abre diálogo
- [ ] Muestra subtotal actual
- [ ] Dos modos: PORCENTAJE y MONTO FIJO
- [ ] Campo motivo obligatorio

### 8.2 Descuento por porcentaje
- [ ] Seleccionar "PORCENTAJE" → campo de %
- [ ] Ingresar 10% → muestra monto de descuento y total con descuento
- [ ] Cálculo correcto: descuento = subtotal * 10%

### 8.3 Descuento por monto fijo
- [ ] Seleccionar "MONTO FIJO" → campo de monto
- [ ] Ingresar monto → muestra total con descuento
- [ ] Cálculo correcto: total = subtotal - monto

### 8.4 Aplicar y quitar
- [ ] Botón "APLICAR" deshabilitado sin motivo o con descuento 0
- [ ] Click APLICAR → descuento se guarda en la venta
- [ ] Reabrir diálogo → muestra descuento existente
- [ ] Botón "QUITAR DESCUENTO" visible cuando hay descuento
- [ ] Click QUITAR → descuento se elimina

---

## 9. Venta Rápida

### 9.1 Crear venta rápida
- [ ] Click "V. RÁPIDA" → indicador visual "VENTA RÁPIDA" aparece
- [ ] Muestra ID de la venta
- [ ] No se necesita seleccionar mesa
- [ ] Card de mesa normal NO se muestra

### 9.2 Operaciones en venta rápida
- [ ] Se pueden agregar productos normalmente
- [ ] Botón "V. RÁPIDA" se deshabilita (ya hay una activa)
- [ ] Botones COBRAR, DESCUENTO, CANCELAR se habilitan
- [ ] Se puede cobrar normalmente
- [ ] Se puede cancelar normalmente
- [ ] Al cobrar/cancelar → indicador desaparece, UI se limpia

---

## 10. Transferir Mesa

- [ ] Botón "TRANSFERIR" deshabilitado sin venta activa
- [ ] Click TRANSFERIR → abre diálogo con mesas disponibles
- [ ] Mesa actual NO aparece en la lista
- [ ] Seleccionar mesa destino → se resalta
- [ ] Click "TRANSFERIR A MESA X" → venta se mueve
- [ ] Mesa origen vuelve a DISPONIBLE
- [ ] Mesa destino pasa a OCUPADO
- [ ] PdV ahora muestra la nueva mesa seleccionada

---

## 11. Asociar Cliente

### 11.1 Desde card de mesa
- [ ] Icono de buscar cliente (persona con lupa) visible
- [ ] Click → abre diálogo "BUSCAR CLIENTE"

### 11.2 Búsqueda
- [ ] Campo de búsqueda por nombre, RUC o teléfono
- [ ] Click "buscar" → filtra resultados
- [ ] Tabla muestra: nombre, RUC, teléfono
- [ ] Click en fila → selecciona y cierra diálogo
- [ ] Nombre del cliente se actualiza en la card de mesa

---

## 12. Cierre de Caja

### 12.1 Botón visible
- [ ] Botón "CERRAR CAJA" visible en la card de caja

### 12.2 Validación de ventas abiertas
- [ ] Con ventas abiertas → diálogo muestra warning con lista
- [ ] Botón "CERRAR CAJA" deshabilitado
- [ ] Sin ventas abiertas → muestra formulario de cierre

### 12.3 Formulario de cierre
- [ ] Resumen: cantidad de ventas concluidas
- [ ] Campo "TOTAL CONTADO" por moneda
- [ ] Diferencia se calcula (contado - esperado)
- [ ] Sobrante en verde, faltante en rojo
- [ ] Campo de observaciones

### 12.4 Confirmar cierre
- [ ] Click "CERRAR CAJA" → caja pasa a CERRADO
- [ ] Tab del PdV se cierra automáticamente

---

## 13. Atajos de Teclado

- [ ] F1 → ejecuta cobrar (si hay venta activa con items)
- [ ] F2 → crea venta rápida
- [ ] F3 → abre búsqueda de productos
- [ ] F4 → ejecuta cancelar venta (si hay venta activa)
- [ ] F5 → reimprimir (stub por ahora)
- [ ] Esc → deselecciona mesa y limpia items
- [ ] Atajos NO se disparan cuando hay un diálogo abierto
- [ ] Tooltips visibles en botones con el atajo correspondiente

---

## 14. Historial de Ventas

### 14.1 Acceso
- [ ] Dashboard → click "Listado Ventas" → abre tab historial

### 14.2 Filtros
- [ ] Rangos rápidos: HOY, ESTA SEMANA, ESTE MES, ÚLTIMO TRIMESTRE
- [ ] Click en rango → recarga datos
- [ ] Selector de fecha DESDE y HASTA con datepicker
- [ ] Filtro por estado (ABIERTA, CONCLUIDA, CANCELADA)
- [ ] Botón FILTRAR → aplica filtros

### 14.3 Tabla de ventas
- [ ] Columnas: fecha, mesa, cajero, estado, forma pago, total
- [ ] Estado con chip de color (verde=CONCLUIDA, rojo=CANCELADA)
- [ ] Menú acciones → "VER DETALLE"

### 14.4 Detalle de venta
- [ ] Diálogo muestra: fecha, estado, mesa, cliente, forma pago
- [ ] Si tiene descuento → muestra info de descuento
- [ ] Tabla de items con producto, cantidad, precio, total, estado
- [ ] Total general calculado correctamente

---

## 15. Precios de Delivery

### 15.1 Acceso
- [ ] Dashboard → click "Precios Delivery" → abre tab

### 15.2 ABM
- [ ] Tabla muestra precios existentes: descripción, valor, estado
- [ ] Botón "NUEVO PRECIO" → abre diálogo de crear
- [ ] Formulario: descripción, valor, activo (toggle)
- [ ] Guardar → precio aparece en tabla
- [ ] Menú acciones → Editar → carga datos existentes
- [ ] Menú acciones → Eliminar → confirmación → elimina

---

## 16. División de Cuenta

### 16.1 Diálogo
- [ ] Accesible desde método dividirCuenta() (pendiente botón en UI)
- [ ] Muestra total de la venta
- [ ] Dos modos: PARTES IGUALES y POR ITEMS

### 16.2 Partes iguales
- [ ] Campo cantidad de partes (mín 2)
- [ ] Muestra monto por cada cuenta
- [ ] Cálculo correcto: total / partes

### 16.3 Por items
- [ ] Lista de items activos con selector de cuenta
- [ ] Asignar items a diferentes cuentas
- [ ] Resumen por cuenta con total

---

## Notas de Testing

- **Prerequisitos**: Tener al menos 1 usuario, 1 moneda principal, mesas creadas, productos con precios de venta
- **Orden sugerido**: Seguir el orden numérico (1→16) ya que algunos tests dependen de estado previo
- **Registrar errores**: Todo error encontrado registrar en `docs/testing/ERRORES-PDV.md`
