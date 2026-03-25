# Guía de Implementación: Gestión de Sabores y Variaciones

## 1. Introducción y Arquitectura

Este documento detalla el funcionamiento y la implementación del componente `producto-sabores.component.ts`, que es el núcleo para la gestión de **Sabores** y sus **Variaciones** dentro de un producto.

### 1.1. Propósito Principal

El objetivo de este componente es ofrecer una interfaz unificada, intuitiva y eficiente para manejar la relación jerárquica entre un producto, sus sabores y las diferentes presentaciones o variaciones de cada sabor. Se abandonó el enfoque de pestañas separadas en favor de una **tabla jerárquica con filas expandibles**, que representa de manera más fiel el modelo de datos.

### 1.2. Modelo de Datos y Entidades

La lógica se basa en la siguiente jerarquía:

- **Producto**: La entidad principal (ej. "Pizza", "Hamburguesa").
- **Sabor**: Una versión específica del producto (ej. "Margarita", "Americana"). Cada sabor tiene su propia receta base.
- **Variación (`RecetaPresentacion`)**: Una combinación de un **Sabor** y una **Presentación** del producto (ej. "Pizza Margarita - Familiar", "Pizza Margarita - Mediana"). Cada variación tiene su propio costo, precio de venta y SKU.

```mermaid
graph TD;
    A[Producto] --> B[Sabor 1];
    A --> C[Sabor 2];
    B --> D[Variación 1.1 (Sabor 1 + Presentación A)];
    B --> E[Variación 1.2 (Sabor 1 + Presentación B)];
    C --> F[Variación 2.1 (Sabor 2 + Presentación A)];
```

## 2. Interfaz de Usuario (UI)

La interfaz se centra en una tabla principal de `Angular Material` que lista los sabores, con la capacidad de expandir cada fila para mostrar una sub-tabla con sus variaciones asociadas.

### 2.1. Vista Principal (Tabla de Sabores)

![Vista Principal de Sabores y Variaciones](URL_A_LA_IMAGEN_DE_LA_UI)

La tabla principal muestra la siguiente información para cada sabor:

| Columna | Descripción |
| :--- | :--- |
| **(Expandir)** | Un icono (`>` o `v`) que permite mostrar u ocultar las variaciones del sabor. |
| **Nombre** | El nombre del sabor (ej. "Calabresa"). Incluye una breve descripción si existe. |
| **Categoría** | La categoría culinaria del sabor (ej. "PIZZA"), representada por un chip de color. |
| **Nº Variaciones** | Muestra el número total de variaciones activas sobre el total de variaciones generadas para ese sabor (ej. "3 / 4"). |
| **Estado** | Un `mat-slide-toggle` que permite activar o desactivar el sabor rápidamente. |
| **Acciones** | Un `mat-menu` (icono `more_vert`) con las siguientes opciones: `Editar Sabor` y `Eliminar Sabor`. |

### 2.2. Vista Expandida (Sub-tabla de Variaciones)

Al hacer clic en una fila de sabor, se despliega una sub-tabla con todas sus variaciones:

| Columna | Descripción |
| :--- | :--- |
| **Nombre de Variación** | El nombre autogenerado de la variación (ej. "Pizza Calabresa - Grande"). Incluye el SKU si está definido. |
| **Presentación** | El nombre de la presentación asociada (ej. "Grande"). |
| **Costo** | El costo total calculado de la receta de la variación. |
| **Precio Principal** | El precio de venta principal y activo para esa variación. |
| **CMV** | El **Costo de Mercadería Vendida** (Cost of Goods Sold), calculado como `(Costo / Precio Principal) * 100`. |
| **Estado** | Un `mat-slide-toggle` para activar o desactivar la variación individualmente. |
| **Acciones** | Un `mat-menu` con opciones específicas para la variación: `Editar`, `Gestionar Receta`, `Gestionar Precios` y `Eliminar`. |

### 2.3. Filtros y Búsqueda

Encima de la tabla, el usuario dispone de las siguientes herramientas para filtrar los datos:

- **Búsqueda por texto**: Un campo de búsqueda que filtra en tiempo real por nombre de sabor, descripción, nombre de variación o SKU.
- **Filtro por Categoría**: Un desplegable para mostrar sabores de una categoría específica.
- **Filtro por Estado**: Un desplegable para mostrar sabores "Activos", "Inactivos" o "Todos".

### 2.4. Acciones Globales

- **Nuevo Sabor**: Abre el diálogo `SaborDialogComponent` para crear un nuevo sabor desde cero.
- **Generar Variaciones**: Una acción masiva que crea automáticamente todas las combinaciones faltantes de `Sabor` + `Presentación` para el producto actual.

## 3. Flujo de Interacción del Usuario

### 3.1. Creación de un Sabor

1.  El usuario hace clic en el botón **"Nuevo Sabor"**.
2.  Se abre un diálogo donde debe proporcionar:
    -   Nombre del sabor.
    -   Descripción (opcional).
    -   Categoría.
    -   Receta base inicial (se puede gestionar en detalle más adelante).
3.  Al guardar, el nuevo sabor aparece en la tabla principal. Inicialmente, no tendrá variaciones.

### 3.2. Gestión de Variaciones

1.  **Visualización**: El usuario expande la fila de un sabor para ver sus variaciones. Si no hay ninguna, se muestra un mensaje invitando a generarlas.
2.  **Generación Automática**:
    -   El usuario hace clic en **"Generar Variaciones"**.
    -   El sistema analiza todos los sabores y todas las presentaciones del producto.
    -   Crea las `RecetaPresentacion` (variaciones) que aún no existen.
    -   La tabla se actualiza mostrando las nuevas variaciones debajo de cada sabor.
3.  **Gestión Individual**: Desde el menú de acciones de una variación, el usuario puede:
    -   **Gestionar Receta**: Abre la pestaña de gestión de recetas, cargando la receta específica de esa variación para ajustar sus ingredientes.
    -   **Gestionar Precios**: Abre un diálogo para definir múltiples precios de venta (ej. "Salón", "Delivery"), establecer cuál es el principal y activarlos/desactivarlos.
    -   **Editar**: Permite ajustar detalles de la variación como el SKU o el multiplicador de la receta base.
    -   **Eliminar**: Borra la variación permanentemente.

### 3.4. Asistente de Ingredientes para Variaciones (Nueva Feature)

Para acelerar la creación de recetas consistentes entre variaciones de un mismo sabor, se ha implementado un asistente inteligente.

1.  **Detección de Contexto**: Cuando un usuario está editando la receta de una variación (ej. "Pizza Pepperoni - Familiar") y agrega un nuevo ingrediente (ej. "Queso Extra"), el sistema lo detecta.
2.  **Consulta Proactiva**: Inmediatamente después de agregar el ingrediente, se muestra un diálogo preguntando: **"¿Deseas agregar este ingrediente a otras variaciones de este sabor?"**.
3.  **Gestión Múltiple**:
    -   Si el usuario acepta, se abre un segundo diálogo.
    -   Este diálogo lista todas las demás variaciones del mismo sabor (ej. "Pizza Pepperoni - Mediana", "Pizza Pepperoni - Individual").
    -   El usuario puede introducir la cantidad del nuevo ingrediente para cada variación de forma independiente.
    -   Al guardar, el sistema añade el ingrediente a las recetas de todas las variaciones seleccionadas con las cantidades especificadas.

Este flujo evita que el usuario tenga que abrir cada receta de cada variación una por una para agregar el mismo ingrediente, reduciendo la repetición y posibles errores.

### 3.3. Lógica de Precios y Costos

-   El **Costo** de una variación se calcula automáticamente sumando los costos de los ingredientes de su receta asociada.
-   El **Precio Principal** es el `PrecioVenta` marcado como `principal: true` y `activo: true` en el diálogo de gestión de precios.
-   El **CMV** es un indicador clave de rentabilidad y se actualiza en tiempo real a medida que cambian el costo de la receta o el precio de venta principal.

## 4. Aspectos Técnicos Relevantes

### 4.1. Optimización de Rendimiento

-   **Valores Pre-calculados**: Para cumplir con la regla de "No llamadas a funciones en el template", el componente utiliza una propiedad `saboresConDatosCalculados`. Antes de renderizar la tabla, un método `calcularDatosSabores()` itera sobre los datos y pre-calcula todos los valores complejos (conteos de variaciones, colores, márgenes, etc.), almacenándolos en propiedades simples que el template puede bindear directamente.
-   **TrackBy**: Se utilizan funciones `trackBy` en los `*ngFor` de las tablas para que Angular pueda realizar actualizaciones del DOM de manera más eficiente.
-   **Debounce en Búsqueda**: La entrada de búsqueda tiene un `debounceTime` de 300ms para evitar recálculos excesivos mientras el usuario escribe.

### 4.2. Theming y Estilos

-   El componente utiliza **variables CSS** para todos los colores, bordes y fondos.
-   Incluye un bloque `@media (prefers-color-scheme: dark)` y selectores `.mat-app-background` para garantizar que la interfaz sea completamente funcional y legible tanto en temas claros como oscuros.
