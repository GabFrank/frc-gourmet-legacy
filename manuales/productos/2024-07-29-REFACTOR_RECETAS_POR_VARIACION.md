# Manual de Refactorización: Recetas Individuales por Variación de Producto

**Fecha:** 2024-07-29

**Autor:** Gemini AI

**Objetivo:** Modificar la arquitectura del módulo de productos para que cada variación de producto (combinación de sabor y presentación) tenga su propia receta independiente, eliminando el concepto de "receta base" por sabor y el uso de un multiplicador de cantidad.

**Motivación:** El modelo actual asume que las variaciones (ej. Pizza Mediana vs. Grande) son siempre un múltiplo directo de una receta base. La realidad del negocio requiere que diferentes tamaños puedan tener ingredientes distintos o proporciones no lineales, lo que exige una receta única por variación.

---

## 1. Cambios en Base de Datos y Entidades (TypeORM) `[4/4]`

Esta es la parte más crítica de la refactorización. Los cambios aquí afectarán a toda la lógica de negocio.

### 1.1. Entidad `Sabor` (`sabor.entity.ts`) `[1/1]`

-   [x] **ELIMINAR:** La relación `recetas`. Un sabor ya no es dueño de una "receta base".
    ```typescript
    // ELIMINAR ESTA PROPIEDAD
    @OneToMany('Receta', 'sabor')
    recetas?: Receta[];
    ```

### 1.2. Entidad `Receta` (`receta.entity.ts`) `[2/2]`

La Receta se vuelve una entidad genérica, no ligada directamente a un Sabor.

-   [x] **ELIMINAR:** La relación `sabor`.
    ```typescript
    // ELIMINAR ESTA PROPIEDAD Y SU @JoinColumn
    @ManyToOne(() => Sabor, sabor => sabor.recetas, { nullable: true })
    @JoinColumn({ name: 'sabor_id' })
    sabor?: Sabor;
    ```
-   [x] **ELIMINAR:** La relación `productoVariacion`. La conexión con el producto ahora será a través de la variación (`RecetaPresentacion`).
    ```typescript
    // ELIMINAR ESTA PROPIEDAD Y SU @JoinColumn
    @ManyToOne(() => Producto, producto => producto.recetas, { nullable: true })
    @JoinColumn({ name: 'producto_id_variacion' })
    productoVariacion?: Producto;
    ```

### 1.3. Entidad `RecetaPresentacion` (`receta-presentacion.entity.ts`) `[4/4]`

Esta entidad se convierte en el **corazón del nuevo modelo**. Podría considerarse renombrarla a `Variacion` en el futuro.

-   [x] **ELIMINAR:** La propiedad `multiplicador_cantidad`. Su lógica se moverá a una herramienta de UI opcional.
    ```typescript
    // ELIMINAR ESTA PROPIEDAD
    @Column({ type: 'decimal', precision: 5, scale: 4, default: 1.0 })
    multiplicador_cantidad!: number;
    ```
-   [x] **MODIFICAR:** La relación con `Receta`. Pasa de ser `ManyToOne` (apuntando a la receta base compartida) a `OneToOne` (apuntando a su propia receta única).
    ```typescript
    // REEMPLAZAR LA RELACIÓN @ManyToOne CON ESTA
    @OneToOne(() => Receta, { nullable: false, cascade: true, eager: true }) // cascade y eager son recomendables
    @JoinColumn({ name: 'receta_id' })
    receta!: Receta;
    ```
-   [x] **AÑADIR:** Una relación `ManyToOne` con `Sabor` para saber a qué sabor pertenece esta variación.
    ```typescript
    // AÑADIR ESTA NUEVA RELACIÓN
    @ManyToOne(() => Sabor, { nullable: false })
    @JoinColumn({ name: 'sabor_id' })
    sabor!: Sabor;
    ```
-   [x] **ACTUALIZAR ÍNDICE:** El índice de unicidad debe cambiar para reflejar la nueva estructura. La combinación de `presentacion` y `sabor` debe ser única.
    ```typescript
    // ACTUALIZAR EL DECORADOR @Index DE LA CLASE
    @Index(['presentacion', 'sabor'], { unique: true })
    ```

### 1.4. Plan de Migración de Datos (Script de TypeORM) `[0/3]`

Se debe crear una nueva migración que realice los siguientes pasos:

1.  [ ] **Añadir Columnas:** Añadir `sabor_id` (FK a `sabor`) y `receta_id` (FK a `receta`, inicialmente `NULLABLE`) a la tabla `receta_presentacion`.
2.  [ ] **Iterar y Crear Nuevas Recetas:**
    -   Leer todas las `receta_presentacion` existentes.
    -   Para cada una, encontrar su receta base a través del `sabor` (`variacion -> receta_base -> sabor`).
    -   Crear una **nueva `Receta`** en la base de datos, copiando los datos de la receta base.
    -   Copiar todos los `RecetaIngrediente` de la receta base a la nueva receta, ajustando `cantidad` con el `multiplicador_cantidad` de la `receta_presentacion` original.
    -   Actualizar la `receta_presentacion` actual, asignando el ID de la nueva receta a `receta_id` y el ID del sabor a `sabor_id`.
3.  [ ] **Modificar Constraints:**
    -   Una vez poblados todos los datos, modificar la columna `receta_presentacion.receta_id` a `NOT NULL` y hacerla `UNIQUE`.
    -   Eliminar la columna `receta_presentacion.multiplicador_cantidad`.
    -   Eliminar la columna `receta.sabor_id`.
    -   Eliminar la columna `receta.producto_id_variacion`.
    -   Actualizar los índices y foreign keys según los cambios en las entidades.

---

## 2. Cambios en Backend (Handlers de Electron / Servicios) `[4/4]` ✅

El servicio `SaboresVariacionesService` y su handler correspondiente necesitarán adaptaciones significativas.

### 2.1. `SaboresVariacionesService`

-   [x] **`cargarSaboresConVariaciones(productoId)`:**
    -   La lógica de agrupación cambia. Ya no se obtienen variaciones a través de la receta del sabor.
    -   **Nuevo Flujo:**
        1.  Obtener todos los `Sabor` para el `productoId`.
        2.  Obtener todas las `RecetaPresentacion` (variaciones) cuyo `presentacion` pertenezca al `productoId`.
        3.  En el código, agrupar las variaciones obtenidas bajo su `Sabor` correspondiente usando el `sabor_id` de la variación.
-   [x] **`generarVariacionesFaltantes(productoId)`:**
    -   **Nuevo Flujo:**
        1.  Obtener todas las `Presentacion` y `Sabor` del producto.
        2.  Por cada par `(presentacion, sabor)`, verificar si ya existe una `RecetaPresentacion`.
        3.  Si no existe:
            a. Crear una nueva `Receta` (inicialmente vacía).
            b. Crear una nueva `RecetaPresentacion` vinculándola a la `presentacion`, al `sabor` y a la `receta` recién creada.
-   [x] **`eliminarSabor(saborId)`:**
    -   La lógica de borrado en cascada debe ser más explícita. Al eliminar un sabor, se deben eliminar:
        1.  Todas las `RecetaPresentacion` asociadas a ese `saborId`.
        2.  Por cada `RecetaPresentacion` eliminada, también eliminar la `Receta` asociada a ella (y sus ingredientes). Esto se puede lograr con `onDelete: 'CASCADE'` en la relación o explícitamente en el servicio.
-   [x] **`eliminarVariacion(variacionId)`:**
    -   Al eliminar una `RecetaPresentacion`, también se debe eliminar la `Receta` que le pertenece.

### 2.2. **Handlers de Electron** ✅

-   [x] **`receta-presentacion.handler.ts`:**
    -   Eliminadas todas las referencias a `multiplicador_cantidad`.
    -   Actualizada la lógica de creación para incluir `saborId`.
    -   Actualizadas las funciones helper para calcular costos sin multiplicador.
-   [x] **`sabores.handler.ts`:**
    -   Actualizada la lógica de eliminación de sabores para trabajar con la nueva arquitectura.
    -   Eliminadas referencias a `sabor.recetas`.
    -   Actualizada la función de estadísticas para usar la nueva estructura.
-   [x] **`recetas.handler.ts`:**
    -   Eliminadas todas las referencias a `multiplicador_cantidad`.
    -   Actualizada la lógica de eliminación de sabores.
    -   Actualizada la función de estadísticas.
    -   ✅ **Corrección de Errores TypeScript:**
        -   Actualizada función `generarVariacionesParaReceta` → `generarVariacionesParaProducto`
        -   Eliminadas referencias a `receta.sabor` y `receta.productoVariacion`
        -   Actualizadas consultas para usar `rp.sabor` en lugar de `receta.sabor`
        -   Corregidas todas las relaciones en las consultas de base de datos

---

## 3. Cambios en Frontend (`producto-sabores.component.ts` y `.html`) `[3/3]`

Basado en el componente existente, estos son los ajustes requeridos.

### 3.1. Template (`producto-sabores.component.html`) `[2/2]`

-   **Tabla de Variaciones (Sub-tabla):**
    -   [x] **ELIMINAR:** La columna "Multiplicador" (`multiplicador_cantidad`).
    -   [x] **AÑADIR:** Una nueva columna "Acciones" para cada fila de variación. Dentro de esta columna, añadir un botón de "Gestionar Receta".
        ```html
        <!-- En la sección de acciones de la variación -->
        <button mat-icon-button color="primary" (click)="gestionarRecetaDeVariacion(variacion)" matTooltip="Gestionar Receta de esta Variación">
          <mat-icon>receipt_long</mat-icon>
        </button>
        ```
-   **Tabla de Sabores (Tabla Principal):**
    -   [x] El botón "Gestionar Receta" (`gestionarReceta(sabor)`) en la fila principal del sabor ya no tiene sentido. Debería **eliminarse**.

### 3.2. Lógica del Componente (`producto-sabores.component.ts`) `[4/4]`

-   [x] **Tipos de Datos:**
    -   Actualizar las interfaces `Sabor` y `RecetaPresentacion` para que coincidan con el nuevo modelo de la base de datos (quitar `sabor.recetas` y `variacion.multiplicador_cantidad`).
-   [x] **`calcularDatosSabores()` (Línea 286):**
    -   Eliminar el cálculo de `multiplicadorFormateado` (Línea 298). La propiedad ya no existe.
-   [x] **`gestionarReceta(sabor: Sabor)` (Línea 438):**
    -   **ELIMINAR:** Este método completo. La navegación a la receta ahora se hace por variación.
-   [x] **AÑADIR:** El nuevo método para gestionar la receta de una variación específica.
    ```typescript
    gestionarRecetaDeVariacion(variacion: RecetaPresentacion): void {
      // Asumimos que la 'receta' se carga junto con la variación desde el backend
      if (variacion.receta && variacion.receta.id) {
        const recetaId = variacion.receta.id;
        const titulo = `Receta - ${variacion.nombre_generado}`;
        this.tabsService.openTab(titulo, GestionRecetasComponent, { recetaId });
      } else {
        this.snackBar.open('Esta variación no tiene una receta asociada.', 'Cerrar', {
          duration: 4000
        });
      }
    }
    ```
-   **Diálogos:**
    -   [x] **`VariacionDialogComponent`:** Su template y lógica deben ser actualizados para eliminar cualquier campo de formulario o visualización relacionado con el `multiplicador_cantidad`.
    -   [ ] **`SaborDialogComponent`:** Asegurarse de que ya no intente crear una "receta base" al crear un nuevo sabor.

### 3.3. (Opcional) Funcionalidad de "Crear desde Plantilla" `[0/3]`

Para replicar la conveniencia del multiplicador, se puede implementar una nueva función en la UI.

-   [ ] **Botón:** Añadir un botón "Nueva Variación desde Plantilla" en la interfaz.
-   [ ] **Flujo:**
    1.  El usuario hace clic en el botón.
    2.  Se abre un diálogo que le pide seleccionar un `Sabor` y una `Presentacion` para la nueva variación.
    3.  El diálogo también muestra un selector para elegir una **variación existente como plantilla**.
    4.  Un campo opcional permite introducir un **factor de multiplicación** (ej. 0.75).
    5.  Al confirmar, se llama a un nuevo método en el backend.
-   [ ] **Endpoint de Backend (Nuevo):** `crearVariacionDesdePlantilla(datos)`
    1.  Recibe el `saborId`, `presentacionId`, `plantillaVariacionId` y `multiplicador`.
    2.  Crea una nueva `Receta` copiando la receta de `plantillaVariacionId`.
    3.  Aplica el `multiplicador` a los ingredientes de la nueva receta.
    4.  Crea la nueva `RecetaPresentacion` y la asocia con la nueva receta.
    5.  Devuelve la nueva variación creada.

### 3.3. **Sincronización de Estado y UI** ✅

-   [x] **Actualización Automática después de Crear Variaciones:**
    -   Implementado método `recargarDespuesDeCrearVariaciones()` para recarga eficiente
    -   La tabla se actualiza automáticamente sin necesidad de recargar/reiniciar
    -   Notificaciones de éxito/error con `snackBar`
    -   Filtros y paginación se mantienen después de la actualización

-   [x] **Mejoras en la Experiencia de Usuario:**
    -   Feedback inmediato al usuario sobre el estado de las operaciones
    -   Recarga inteligente que solo actualiza los datos necesarios
    -   Preservación del estado de la interfaz (filtros, paginación, etc.)

### 3.4. **Sistema de Cálculo de Costos en Tiempo Real** ✅

-   [x] **Cálculo Automático de Costos:**
    -   Implementado método `calcularCostoTotalReceta()` en el servicio
    -   Los costos se recuperan desde `precio_costo.entity.ts` vinculado a cada receta
    -   Cálculo en tiempo real sin necesidad de recargar desde la base de datos

-   [x] **Backend Optimizado:**
    -   Handler `get-variaciones-by-producto` ahora carga `receta.preciosCosto`
    -   Relaciones optimizadas para cálculo eficiente de costos
    -   Soporte para múltiples fuentes de costo (compra, manual, ajuste receta)

-   [x] **UI Mejorada para Gestión de Costos:**
    -   Columna de costo visible y actualizada en tiempo real
    -   Costos se muestran automáticamente en la tabla de variaciones
    -   Integración con el sistema de márgenes existente
    -   Cálculo automático de márgenes basado en costos reales
