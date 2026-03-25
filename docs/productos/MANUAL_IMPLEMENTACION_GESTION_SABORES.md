# Manual de Implementación Detallado: Módulo de Gestión de Sabores

## 1. Visión General y Objetivos

### 1.1. Problema a Resolver
La gestión de productos con múltiples variaciones (ej: una pizza con tamaños Pequeño, Mediano, Grande) es actualmente ineficiente. Requiere abrir y editar múltiples recetas individuales en diferentes pestañas, lo que aumenta la carga de trabajo, la probabilidad de errores y la inconsistencia en los datos.

### 1.2. Solución Propuesta
Se creará un nuevo módulo de **Gestión de Sabores**. Este módulo introducirá una capa de abstracción que permitirá al usuario gestionar un "Sabor" (un concepto, como "Pizza Calabresa") y todas sus variaciones asociadas desde una única pantalla centralizada.

Esta interfaz unificada se encargará de crear, actualizar y eliminar las entidades `Receta` subyacentes de forma atómica y consistente.

### 1.3. Conceptos Clave
- **Sabor:** Un concepto de producto que agrupa varias recetas. No es una entidad de base de datos, sino una agrupación lógica representada por el campo `categoria` en la entidad `Receta`. _Ejemplo: "CALABRESA"_.
- **Variación:** Una instancia específica y vendible de un Sabor. Corresponde a una única entidad `Receta`. Se identifica por el campo `subcategoria`. _Ejemplo: "GRANDE"_.
- **Ingredientes Base:** La lista de ingredientes que son comunes a todas las Variaciones de un Sabor. La cantidad puede variar según un multiplicador.
- **Ingredientes Específicos:** Ingredientes que se aplican únicamente a una Variación específica (ej: un tipo de borde especial solo para la pizza grande).
- **Multiplicador de Cantidad:** Un factor numérico que se aplica a las cantidades de los **Ingredientes Base** para calcular la cantidad real en una **Variación** específica. _Ejemplo: GRANDE (1.0x), MEDIANA (0.75x), PEQUEÑA (0.5x)_.

---

## 2. Modificaciones a la Base de Datos

Para soportar esta nueva lógica, se realizarán las siguientes modificaciones en las entidades existentes.

### 2.1. Entidad `Receta` (`receta.entity.ts`)
Se añadirán dos campos para permitir la agrupación y la identificación de variaciones:
- `categoria: string | null` (Ej: "CALABRESA", "PEPPERONI"). Será `nullable` e indexado.
- `subcategoria: string | null` (Ej: "GRANDE", "MEDIANA", "PORCIÓN"). Será `nullable`.

### 2.2. Entidad `RecetaIngrediente` (`receta-ingrediente.entity.ts`)
Se añadirá un campo booleano para distinguir entre ingredientes que pertenecen a la base del sabor y aquellos que son específicos de una variación.
- `esIngredienteBase: boolean` (default: `false`).

---

## 3. Arquitectura del Frontend

### 3.1. Nuevos Componentes
- **`list-sabores.component.ts`**:
    - Muestra una lista de todos los "Sabores" disponibles (agrupando recetas por `categoria`).
    - Permite la creación de nuevos sabores y la navegación para editar sabores existentes.
- **`gestion-sabor.component.ts`**:
    - El componente principal para crear/editar un Sabor.
    - Contendrá el formulario para el nombre del Sabor (`categoria`), una tabla para los "Ingredientes Base" y una tabla para las "Variaciones".
- **`ingrediente-sabor-dialog.component.ts`**:
    - Un diálogo reutilizable para añadir/editar tanto "Ingredientes Base" como "Ingredientes Específicos".
    - Deberá recibir un parámetro para saber qué tipo de ingrediente está gestionando.

### 3.2. Nuevos Servicios
- **`sabores.service.ts`**:
    - Contendrá la lógica de negocio para comunicarse con los nuevos handlers del backend.
    - Métodos: `getSabores()`, `getSaborDetails(categoria)`, `createOrUpdateSabor(saborData)`.

### 3.3. Modificaciones de Navegación
- Se añadirá una nueva entrada "Gestión de Sabores" en el menú principal de navegación (`app.component.html` o similar) que abrirá el `ListSaboresComponent`.

---

## 4. Arquitectura del Backend (Electron Handlers)

Se crearán los siguientes handlers en `recetas.handler.ts`.

- **`get-sabores`**:
    - **Input**: `void`.
    - **Lógica**: Realiza una consulta a la base de datos para obtener una lista de `categoria` únicas y no nulas de la tabla `Receta`.
    - **Output**: `Promise<string[]>`.
- **`get-sabor-details`**:
    - **Input**: `categoria: string`.
    - **Lógica**:
        1. Busca todas las recetas (`Receta`) que coincidan con la `categoria`.
        2. Para cada receta, carga sus ingredientes (`RecetaIngrediente`) y su precio de venta principal (`PrecioVenta`).
        3. Procesa estos datos para construir y devolver un objeto `Sabor` que el frontend pueda interpretar fácilmente (separando ingredientes base de específicos, etc.).
    - **Output**: `Promise<SaborDetallado>`.
- **`create-or-update-sabor`**:
    - **Input**: `saborData: any` (un objeto complejo que representa el estado completo del Sabor desde el frontend).
    - **Lógica**: **Esta es la operación más crítica y debe ser transaccional.**
        1. Iniciar una transacción de base de datos.
        2. Obtener todas las recetas existentes para la `categoria` dada.
        3. **Iterar sobre las `variaciones` recibidas del frontend:**
            - Buscar si ya existe una `Receta` para la `subcategoria` actual.
            - **Si existe (Actualizar):**
                - Actualizar sus propiedades (nombre, etc.).
                - Eliminar TODOS sus `RecetaIngrediente` existentes.
                - Re-crear los `RecetaIngrediente` a partir de los `ingredientesBase` (aplicando el multiplicador) y los `ingredientesEspecificos` de la variación. Marcar `esIngredienteBase` correspondientemente.
                - Actualizar/crear su `PrecioVenta` principal.
            - **Si no existe (Crear):**
                - Crear una nueva `Receta` con la `categoria` y `subcategoria`.
                - Crear todos sus `RecetaIngrediente` como en el caso de la actualización.
                - Crear su `PrecioVenta` principal.
        4. **Sincronizar eliminaciones:** Comparar la lista de recetas preexistentes con las variaciones recibidas. Si una receta preexistente no está en los datos del frontend, significa que fue eliminada por el usuario. Eliminarla de la base de datos.
        5. **Confirmar la transacción.**
        6. **Post-transacción:** Disparar el recálculo de costos (`calculateRecipeCost`) para todas las recetas que fueron creadas o actualizadas.
    - **Output**: `Promise<{ success: boolean; message: string; }>`

---

## 5. Flujo de Implementación Detallado (Fases)

### Fase 1: Estructura de Datos y Handlers Básicos
- **T1.1:** Modificar `receta.entity.ts` para añadir `categoria` y `subcategoria`.
- **T1.2:** Modificar `receta-ingrediente.entity.ts` para añadir `esIngredienteBase`.
- **T1.3:** Crear y registrar el handler `get-sabores`.

### Fase 2: Listado de Sabores y Navegación
- **T2.1:** Crear `list-sabores.component.ts|html|scss`.
- **T2.2:** Implementar la llamada a `get-sabores` y mostrar la lista.
- **T2.3:** Añadir la ruta y el enlace en el menú de navegación principal.
- **T2.4:** Crear los esqueletos de `gestion-sabor.component.ts` y `sabores.service.ts`.
- **T2.5:** Configurar la navegación desde `list-sabores` a `gestion-sabor`, pasando la `categoria` como parámetro en modo edición.

### Fase 3: UI de `gestion-sabor`
- **T3.1:** Diseñar el layout de `gestion-sabor.component.html` con las secciones de "Ingredientes Base" y "Variaciones".
- **T3.2:** Implementar los `FormGroup` y `FormArray` para gestionar el estado del Sabor.
- **T3.3:** Crear el `ingrediente-sabor-dialog.component.ts`.
- **T3.4:** Implementar la lógica para añadir/editar/eliminar ingredientes base del `FormArray`.

### Fase 4: Lógica de Variaciones en UI
- **T4.1:** Implementar la tabla de variaciones en `gestion-sabor.component.html`.
- **T4.2:** Implementar la lógica para añadir/editar/eliminar variaciones del `FormArray`.
- **T4.3:** Conectar el botón "Gestionar Ingredientes Específicos" para que abra el `ingrediente-sabor-dialog.component` y modifique los datos de la variación correcta.

### Fase 5: Lógica de Backend y Conexión
- **T5.1:** Implementar el handler transaccional `create-or-update-sabor`.
- **T5.2:** Implementar el método `createOrUpdateSabor` en `sabores.service.ts`.
- **T5.3:** Conectar el botón "Guardar" de `gestion-sabor.component.ts` para que llame al servicio, enviando los datos del formulario.

### Fase 6: Carga de Datos (Modo Edición)
- **T6.1:** Implementar el handler `get-sabor-details`.
- **T6.2:** Implementar el método `getSaborDetails` en `sabores.service.ts`.
- **T6.3:** En `gestion-sabor.component.ts`, en `ngOnInit`, verificar si se está en modo edición. Si es así, llamar al servicio y poblar los formularios con los datos recibidos.

### Fase 7: Pruebas y Refinamiento
- **T7.1:** Probar el flujo completo: crear, editar (añadiendo/eliminando ingredientes y variaciones) y verificar los resultados en la base de datos y en el `list-recetas.component.ts`.
- **T7.2:** Añadir feedback al usuario (loading spinners, snackbars, confirmaciones).
- **T7.3:** Verificar que los costos se recalculan y se muestran correctamente después de cada operación.

---

## 6. Registro de Progreso (TODO List)

Esta sección será actualizada a medida que se completen las tareas.

### Fase 1: Estructura de Datos y Handlers Básicos
- [x] **T1.1:** Modificar `receta.entity.ts` para añadir `categoria` y `subcategoria`.
- [x] **T1.2:** Modificar `receta-ingrediente.entity.ts` para añadir `esIngredienteBase`.
- [x] **T1.3:** Crear y registrar el handler `get-sabores`.

### Fase 2: Listado de Sabores y Navegación
- [x] **T2.1:** Crear `list-sabores.component.ts|html|scss`.
- [x] **T2.2:** Implementar la llamada a `get-sabores` y mostrar la lista.
- [x] **T2.3:** Añadir la ruta y el enlace en el menú de navegación principal.
- [x] **T2.4:** Crear los esqueletos de `gestion-sabor.component.ts` y `sabores.service.ts`.
- [x] **T2.5:** Configurar la navegación desde `list-sabores` a `gestion-sabor`, pasando la `categoria` como parámetro en modo edición.

### Fase 3: UI de `gestion-sabor`
- [x] **T3.1:** Diseñar el layout de `gestion-sabor.component.html` con las secciones de "Ingredientes Base" y "Variaciones".
- [x] **T3.2:** Implementar los `FormGroup` y `FormArray` para gestionar el estado del Sabor.
- [x] **T3.3:** Crear el `ingrediente-sabor-dialog.component.ts`.
- [x] **T3.4:** Implementar la lógica para añadir/editar/eliminar ingredientes base del `FormArray`.

### Fase 4: Lógica de Variaciones en UI
- [x] **T4.1:** Implementar la tabla de variaciones en `gestion-sabor.component.html`.
- [x] **T4.2:** Implementar la lógica para añadir/editar/eliminar variaciones del `FormArray`.
- [x] **T4.3:** Conectar el botón "Gestionar Ingredientes Específicos" para que abra el `ingrediente-sabor-dialog.component` y modifique los datos de la variación correcta.

### Fase 5: Lógica de Backend y Conexión
- [x] **T5.1:** Implementar el handler transaccional `create-or-update-sabor`.
- [x] **T5.2:** Implementar el método `createOrUpdateSabor` en `sabores.service.ts`.
- [x] **T5.3:** Conectar el botón "Guardar" de `gestion-sabor.component.ts` para que llame al servicio, enviando los datos del formulario.

### Fase 6: Carga de Datos (Modo Edición)
- [x] **T6.1:** Implementar el handler `get-sabor-details`.
- [x] **T6.2:** Implementar el método `getSaborDetails` en `sabores.service.ts`.
- [x] **T6.3:** En `gestion-sabor.component.ts`, en `ngOnInit`, verificar si se está en modo edición. Si es así, llamar al servicio y poblar los formularios con los datos recibidos.

### Fase 7: Pruebas y Refinamiento
- [ ] **T7.1:** Probar el flujo completo: crear, editar (añadiendo/eliminando ingredientes y variaciones) y verificar los resultados en la base de datos y en el `list-recetas.component.ts`.
- [ ] **T7.2:** Añadir feedback al usuario (loading spinners, snackbars, confirmaciones).
- [ ] **T7.3:** Verificar que los costos se recalculan y se muestran correctamente después de cada operación.
