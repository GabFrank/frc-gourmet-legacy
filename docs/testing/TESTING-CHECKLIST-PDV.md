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
- [x] Auto-refresh cada 1 segundo actualiza estado de mesas

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
- [x] Items con descuento muestran icono de flecha + precio con descuento
- [x] Items cancelados se muestran tachados y con opacidad reducida
- [x] Items con observaciones muestran icono de comentario

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
- [x] Botón "COBRAR" deshabilitado sin venta activa (gris)
- [x] Botón "COBRAR" deshabilitado con venta sin items activos (gris)
- [x] Tooltip muestra "Cobrar (F1)"

### 6.2 Diálogo de cobro — Layout
- [x] Click en COBRAR → abre diálogo "COBRAR VENTA" (80vw x 80vh)
- [x] Barra superior muestra totales por moneda con banderas y cotizaciones
- [x] Info de items, subtotal y descuentos visible en header
- [x] Panel izquierdo (55%): tabla de líneas de pago (vacía al inicio)
- [x] Panel derecho (45%): botones de monedas y formas de pago
- [x] Moneda principal pre-seleccionada (botón resaltado)
- [x] Forma de pago principal pre-seleccionada (botón resaltado)
- [x] Formulario: select moneda + select forma pago + input valor + indicador PAGO/VUELTO

### 6.3 Selección de moneda y forma de pago
- [x] Click en botón de moneda → se resalta, valor se auto-llena con saldo
- [x] Click en botón de forma de pago → se resalta
- [x] Selects en formulario sincronizan con botones
- [x] Atajos F1/F2/F3 seleccionan moneda por orden
- [x] Atajos F4/F5/F6/F7 seleccionan forma de pago por orden

### 6.4 Agregar líneas de pago (multi-pago)
- [x] Ingresar valor y click ✓ (o Enter) → línea aparece en tabla
- [x] Tabla muestra: #, Moneda, Forma Pago, Valor (formateado por decimales de moneda), Tipo
- [x] Saldo se actualiza por moneda (barra inferior)
- [x] Agregar segunda línea con otra moneda → saldo se ajusta
- [x] Mat-menu por línea: Observación, Duplicar, Editar valor, Eliminar
- [x] Saldo en verde cuando = 0, en naranja cuando pendiente
- [x] Indicador PAGO/VUELTO al lado del input cambia según saldo
- [x] Observación por línea (nombre de quien paga)
- [x] Líneas se persisten inmediatamente en DB

### 6.5 Vuelto
- [x] Si pago > total → indicador cambia a VUELTO y pre-carga el monto
- [x] Usuario puede cambiar moneda/forma del vuelto antes de confirmar
- [x] Línea VUELTO aparece en azul en la tabla
- [x] Saldo neto correcto: deuda - pagos + vueltos

### 6.6 Finalizar cobro
- [x] Botón "Finalizar (F10)" habilitado cuando saldo = 0 y vuelto resuelto
- [x] Click Finalizar → venta pasa a CONCLUIDA, pago pasa a PAGADO
- [x] Mesa pasa a estado DISPONIBLE
- [x] UI se limpia: mesa deseleccionada, items vacíos, totales en 0
- [x] Atajo F10 ejecuta finalizar

### 6.7 Cobro parcial
- [x] Botón "Cobro Parcial" habilitado cuando hay líneas pero saldo > 0
- [x] Click → cierra diálogo, líneas quedan guardadas
- [x] Al reabrir cobro → líneas existentes se cargan

### 6.8 Descuento/Aumento en cobro
- [x] Botón cambia entre "Descuento (F9)" y "Aumento (F9)" según saldo
- [x] Abre diálogo dedicado con %, monto fijo, redondeo
- [x] Descuento y aumento se registran en moneda principal
- [x] Alerta si descuento cae por debajo del costo
- [x] Pre-carga tipo y valor según saldo actual

### 6.9 División de cuenta
- [x] Sección "División de cuenta" visible en panel derecho
- [x] Campo personas (1-20)
- [x] Muestra valor por persona en moneda principal
- [x] Auto-llena input con valor por persona

### 6.10 Ver costo
- [x] Botón "Ver Costo" en header
- [x] Pide credenciales (usuario + contraseña)
- [x] Al validar muestra: Costo total | Margen
- [x] Click nuevamente para ocultar

### 6.11 Cobro rápido
- [x] Botón "COBRO RÁPIDO (F2)" en panel izquierdo
- [x] Cobra total en moneda principal + forma principal con un click
- [x] Venta pasa a CONCLUIDA, mesa se libera

---

## 7. Cancelar Venta

### 7.1 Validaciones
- [x] Botón "CANCELAR" deshabilitado sin venta activa
- [x] Tooltip muestra "Cancelar (F4)"

### 7.2 Diálogo de cancelación
- [x] Click en CANCELAR → abre diálogo con warning
- [x] Mensaje explica que la acción no se puede deshacer
- [x] Campo de motivo obligatorio (textarea)
- [x] Botón "CANCELAR VENTA" deshabilitado sin motivo
- [x] Escribir motivo → botón se habilita

### 7.3 Confirmar cancelación
- [x] Click "CANCELAR VENTA" → venta pasa a CANCELADA
- [x] Todos los items activos pasan a CANCELADO
- [x] Mesa pasa a DISPONIBLE
- [x] UI se limpia completamente
- [x] Botón "VOLVER" cierra el diálogo sin cancelar la venta

---

## 8. Transferir Mesa

- [x] Botón "TRANSFERIR" deshabilitado sin venta activa
- [x] Click TRANSFERIR → abre diálogo con TODAS las mesas (no solo disponibles)
- [x] Mesa actual NO aparece en la lista
- [x] Seleccionar mesa destino → se resalta
- [x] Transferir a mesa libre → venta se mueve completa (items, pago, cliente)
- [x] Transferir a mesa ocupada → items se fusionan, pago y nombre se transfieren
- [x] Mesa origen vuelve a DISPONIBLE
- [x] Mesa destino pasa/permanece OCUPADO

---

## 9. Mover Items

- [x] Botón "MOVER ITEMS" deshabilitado sin venta activa
- [x] Click → entra en modo selección (checkboxes aparecen en tabla)
- [x] Checkbox en header selecciona/deselecciona todos
- [x] Seleccionar items individuales con checkbox
- [x] Botón cambia a "CONFIRMAR MOVER (N)" con cantidad seleccionada
- [x] Botón CANCELAR aparece, demás botones se ocultan
- [x] Si todos seleccionados → pregunta "¿Transferir mesa completa?"
  - [x] "Transferir mesa" → ejecuta transferencia completa (única opción disponible)
- [x] Si parcial → abre selector de mesa y mueve items seleccionados
- [x] Mesa destino ocupada → items se agregan a venta existente
- [x] Mesa destino libre → se crea nueva venta
- [x] Si mesa origen queda sin items → se desocupa

---

## 10. Pre-Cuenta / Imprimir

- [x] Botón "PRE-CUENTA" / "IMPRIMIR (F5)" deshabilitado sin venta activa
- [x] Click → muestra diálogo con resumen de cuenta
- [x] Muestra: mesa, fecha, items con precios, total
- [ ] Futuro: enviará a impresora configurada

---

## 11. Asociar Cliente

### 11.1 Nombre de cliente en mesa
- [x] Campo de nombre de cliente visible en card de mesa
- [x] Ingresar nombre → se guarda automáticamente con capitalize
- [x] Mesa sin venta + agregar nombre → crea venta y mesa pasa a OCUPADO
- [x] Al transferir mesa → nombre del cliente se transfiere
- [x] Al cancelar venta → nombre se limpia
- [x] Al cobrar → nombre se limpia
- [x] Al cobro rápido → nombre se limpia

### 11.2 Búsqueda de cliente (futuro)
- [ ] Icono de buscar cliente (persona con lupa) visible
- [ ] Click → abre diálogo "BUSCAR CLIENTE"
- [ ] Campo de búsqueda por nombre, RUC o teléfono
- [ ] Click en fila → selecciona y cierra diálogo

---

## 12. Cierre de Caja

### 12.1 Botón visible
- [x] Botón "CERRAR CAJA" visible en la card de caja

### 12.2 Validación de ventas abiertas
- [x] Con ventas abiertas → diálogo muestra alerta con lista de ventas
- [x] Sin ventas abiertas → abre diálogo de conteo de cierre

### 12.3 Diálogo de cierre (conteo de billetes)
- [x] Dispositivo se muestra en el header (auto-detectado)
- [x] Salta directo al step de Conteo Cierre
- [x] Conteo de billetes por moneda (tabs por moneda)
- [x] Total por moneda se calcula en vivo
- [x] Step Resumen muestra: ventas por forma de pago, retiros (placeholder), gastos (placeholder), conteo apertura, conteo cierre
- [x] Diferencia NO se muestra antes del cierre (seguridad)

### 12.4 Confirmar cierre
- [x] Click "GUARDAR CONTEO" → caja pasa a CERRADO
- [x] Muestra resumen post-cierre con diferencias (esperado vs contado)
- [x] Sobrante en verde, faltante en rojo
- [x] Click "CERRAR" → tab del PdV se cierra automáticamente

### 12.5 Apertura de caja desde PdV
- [x] Sin caja abierta → pregunta si abrir nueva
- [x] Dispositivo en header (auto-detectado)
- [x] Steps: Conteo Apertura → Resumen (2 steps)
- [x] Al abrir caja → PdV carga datos correctamente

---

## 13. Atajos de Teclado

- [x] F1 → ejecuta cobrar (si hay venta activa con items)
- [x] F2 → cobro rápido
- [x] F3 → abre búsqueda de productos
- [x] F4 → ejecuta cancelar venta (si hay venta activa)
- [x] F5 → imprimir pre-cuenta
- [x] Esc → deselecciona mesa y limpia items
- [x] Atajos NO se disparan cuando hay un diálogo abierto
- [x] Tooltips visibles en botones con el atajo correspondiente

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

## Notas de Testing

- **Prerequisitos**: Tener al menos 1 usuario, 1 moneda principal, mesas creadas, productos con precios de venta
- **Orden sugerido**: Seguir el orden numérico (1→14) ya que algunos tests dependen de estado previo
- **Registrar errores**: Todo error encontrado registrar en `docs/testing/ERRORES-PDV.md`
- **Sección 8 (Descuento Global) eliminada**: descuentos se manejan ahora en el diálogo de cobro y en edición de items
- **Sección 9 (Venta Rápida) eliminada**: reemplazada por "Cobro Rápido" en sección 6.11
- **Sección 16 (División de Cuenta) movida**: ahora es parte del diálogo de cobro (sección 6.9)
