# Manual de Implementación Detallado: ELABORADO_CON_VARIACION

## 1. Resumen del Objetivo

**Tipo de Producto:** `ELABORADO_CON_VARIACION`
**Estado Actual:** ❌ PENDIENTE (Próximo objetivo crítico)  
**Prioridad:** 🔥 ALTA
**Complejidad:** ALTA
**Impacto en Negocio:** CRÍTICO

### 1.1. ¿Qué es ELABORADO_CON_VARIACION?

Productos complejos que actúan como una "plantilla" y se ofrecen en múltiples variaciones. Cada variación es una receta diferente con sus propios ingredientes, precios y adicionales.

**Ejemplos típicos:**
- **Pizza:** Grande/Mediana/Chica con diferentes sabores
- **Hamburguesa:** Clásica/Doble/Triple con diferentes ingredientes  
- **Empanada:** Diferentes sabores y tamaños
- **Pasta:** Diferentes tipos de pasta con diferentes salsas

### 1.2. Configuración por Defecto
```typescript
ProductoTipo.ELABORADO_CON_VARIACION {
  esVendible: true,     // Se vende al público
  esComprable: false,   // No se compra, se elabora
  controlaStock: false, // Stock se controla por ingredientes
  esIngrediente: false  // No se usa como ingrediente
}
```

## 2. Arquitectura de Datos

### 2.1. Estructura de Entidades

```
Producto (Plantilla)
├── tipo: 'ELABORADO_CON_VARIACION'
├── nombre: "Pizza"
└── recetas: [                    // Una receta por variación
    ├── Receta {
    │   ├── nombre: "Pizza Grande Mozzarella"
    │   ├── producto_id: [ID del producto Pizza]
    │   ├── ingredientes: [...]
    │   ├── precios_venta: [...]
    │   └── adicionales_disponibles: [...]
    │   },
    ├── Receta {
    │   ├── nombre: "Pizza Mediana Mozzarella"  
    │   ├── producto_id: [ID del producto Pizza]
    │   ├── ingredientes: [...]
    │   ├── precios_venta: [...]
    │   └── adicionales_disponibles: [...]
    │   },
    └── ...más variaciones
]
```

### 2.2. Diferencias con ELABORADO_SIN_VARIACION

| Aspecto | SIN_VARIACION | CON_VARIACION |
|---------|---------------|---------------|
| **Relación Producto-Receta** | OneToOne | OneToMany |
| **Número de recetas** | 1 fija | N variaciones |
| **Control de stock** | Por producto | Por ingredientes |
| **Gestión de precios** | Una lista global | Por variación |
| **UI principal** | Pestaña "Receta" | Pestaña "Recetas" |

## 3. Diseño de Interfaz de Usuario

### 3.1. Pestaña "Recetas" (Principal)

La pestaña "Recetas" será el corazón de este tipo de producto. Debe mostrar una **lista de variaciones** donde cada fila representa una `Receta`.

#### **3.1.1. Layout Propuesto**

```
┌─ PESTAÑA: RECETAS ──────────────────────────────────────────┐
│                                                             │
│  [+ Agregar Nueva Variación]                    [Filtros ▼] │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ LISTA DE VARIACIONES                                    │ │  
│  │                                                         │ │
│  │ ┌───────────────────────────────────────────────────┐   │ │
│  │ │ 🍕 Pizza Grande Mozzarella             [ACTIVA] │   │ │
│  │ │ Costo: $8.50 | Precio: $15.00 | Margen: 43%    │   │ │
│  │ │ ┌─────────────────────────────────────────────┐   │   │ │
│  │ │ │ [📝 Ingredientes] [💰 Precios] [🧩 Adicionales] [⚙️ Más ▼] │   │ │
│  │ │ └─────────────────────────────────────────────┘   │   │ │
│  │ └───────────────────────────────────────────────────┘   │ │
│  │                                                         │ │
│  │ ┌───────────────────────────────────────────────────┐   │ │
│  │ │ 🍕 Pizza Mediana Mozzarella           [ACTIVA] │   │ │
│  │ │ Costo: $6.20 | Precio: $12.00 | Margen: 48%    │   │ │
│  │ │ ┌─────────────────────────────────────────────┐   │   │ │
│  │ │ │ [📝 Ingredientes] [💰 Precios] [🧩 Adicionales] [⚙️ Más ▼] │   │ │
│  │ │ └─────────────────────────────────────────────┘   │   │ │
│  │ └───────────────────────────────────────────────────┘   │ │
│  │                                                         │ │
│  │ ┌───────────────────────────────────────────────────┐   │ │
│  │ │ 🍕 Pizza Grande Pepperoni             [INACTIVA] │   │ │
│  │ │ Costo: $9.80 | Precio: $18.00 | Margen: 46%    │   │ │
│  │ │ ┌─────────────────────────────────────────────┐   │   │ │
│  │ │ │ [📝 Ingredientes] [💰 Precios] [🧩 Adicionales] [⚙️ Más ▼] │   │ │
│  │ │ └─────────────────────────────────────────────┘   │   │ │
│  │ └───────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  💡 Consejo: Cada variación es una receta independiente     │
│      con sus propios ingredientes, precios y adicionales.   │
└─────────────────────────────────────────────────────────────┘
```

#### **3.1.2. Componentes de cada Variación**

Cada tarjeta de variación debe mostrar:
1. **Header:** Nombre de la variación, estado (Activa/Inactiva)
2. **Métricas:** Costo calculado, precio principal, margen
3. **Acciones rápidas:** Ingredientes, Precios, Adicionales, Más opciones

### 3.2. Modales/Subcomponentes

#### **3.2.1. Modal "Crear/Editar Variación"**
- Formulario simple: Nombre de la variación
- Selector de estado (Activa/Inactiva)
- Botón "Guardar y Gestionar Ingredientes"

#### **3.2.2. Modal "Gestionar Ingredientes"**
- Reutilizar componente existente `receta-ingredientes`
- Mostrar claramente qué variación se está editando
- Cálculo automático de costos

#### **3.2.3. Modal "Gestionar Precios de Venta"**
- Lista de precios para la variación específica
- Opción de marcar un precio como "principal"
- Cálculo automático de margen

#### **3.2.4. Modal "Gestionar Adicionales"**
- Reutilizar componente existente de vinculación de adicionales
- Mostrar adicionales disponibles para esta variación

## 4. Lista TODO Detallada

### 🔥 FASE 1: Estructura Base (Crítico)

#### **Backend/Datos**
- [ ] **T1.1** Verificar que entidad `Receta` soporte relación OneToMany con `Producto`
- [ ] **T1.2** Crear handler `get-recetas-by-producto` para obtener todas las variaciones
- [ ] **T1.3** Crear handler `create-receta-variacion` para crear nueva variación
- [ ] **T1.4** Actualizar handler `delete-receta` para manejar variaciones

#### **Frontend/Componente Principal**  
- [ ] **T1.5** Crear componente `producto-recetas-variaciones.component.ts`
- [ ] **T1.6** Implementar servicio `recetas-variaciones.service.ts`
- [ ] **T1.7** Crear template `producto-recetas-variaciones.component.html`
- [ ] **T1.8** Añadir estilos `producto-recetas-variaciones.component.scss`

#### **Integración con Gestión de Productos**
- [ ] **T1.9** Modificar `gestionar-producto.component.ts` para mostrar pestaña "Recetas"
- [ ] **T1.10** Ocultar pestaña "Receta" (singular) para tipo CON_VARIACION
- [ ] **T1.11** Implementar lógica de navegación entre pestañas

### 🚀 FASE 2: Lista de Variaciones (Alto)

#### **UI de Lista**
- [ ] **T2.1** Implementar componente lista de variaciones
- [ ] **T2.2** Crear tarjetas de variación con métricas (costo, precio, margen)
- [ ] **T2.3** Implementar botón "Agregar Nueva Variación"
- [ ] **T2.4** Añadir filtros (Activa/Inactiva, por nombre)
- [ ] **T2.5** Implementar paginación si es necesario

#### **Estados y Validaciones**
- [ ] **T2.6** Mostrar estado de cada variación (Activa/Inactiva)
- [ ] **T2.7** Validar que al menos una variación esté activa
- [ ] **T2.8** Mostrar indicadores visuales (iconos, colores)
- [ ] **T2.9** Implementar mensajes de estado vacío

### 🎯 FASE 3: Gestión de Variaciones Individuales (Alto)

#### **CRUD de Variaciones**
- [ ] **T3.1** Modal crear/editar variación básica
- [ ] **T3.2** Implementar eliminación de variación con confirmación
- [ ] **T3.3** Función de duplicar variación (copiar ingredientes)
- [ ] **T3.4** Activar/desactivar variación individual

#### **Gestión de Ingredientes por Variación**
- [ ] **T3.5** Integrar componente existente de gestión de ingredientes  
- [ ] **T3.6** Adaptar para trabajar con variaciones específicas
- [ ] **T3.7** Mostrar contexto de qué variación se está editando
- [ ] **T3.8** Cálculo automático de costos por variación

### 💰 FASE 4: Precios por Variación (Alto)

#### **Gestión de Precios Individuales**
- [ ] **T4.1** Modal de gestión de precios por variación
- [ ] **T4.2** Lista de precios específica para cada variación
- [ ] **T4.3** Lógica de precio "principal" por variación
- [ ] **T4.4** Cálculo automático de margen por variación

#### **Integración con Sistema de Precios**
- [ ] **T4.5** Actualizar handlers de precios para soportar variaciones
- [ ] **T4.6** Validaciones de precios por variación
- [ ] **T4.7** Mostrar precios en vista de lista de variaciones

### 🧩 FASE 5: Adicionales por Variación (Medio)

#### **Vinculación de Adicionales**
- [ ] **T5.1** Reutilizar componente de vinculación de adicionales
- [ ] **T5.2** Adaptar para trabajar por variación específica  
- [ ] **T5.3** Gestionar adicionales disponibles por variación
- [ ] **T5.4** Mostrar cuenta de adicionales en lista de variaciones

### ⚙️ FASE 6: Funcionalidades Avanzadas (Medio)

#### **Bulk Operations**
- [ ] **T6.1** Selección múltiple de variaciones
- [ ] **T6.2** Activar/desactivar múltiples variaciones
- [ ] **T6.3** Aplicar precio base a múltiples variaciones
- [ ] **T6.4** Duplicar variación como base para nuevas

#### **Reportes y Analytics**
- [ ] **T6.5** Resumen de costos por variación
- [ ] **T6.6** Análisis de márgenes comparativo  
- [ ] **T6.7** Reporte de variaciones más/menos rentables

### 🔧 FASE 7: Optimización y UX (Bajo)

#### **Performance**
- [ ] **T7.1** Lazy loading de ingredientes/precios/adicionales
- [ ] **T7.2** Caching de cálculos de costos
- [ ] **T7.3** Optimización de queries de base de datos
- [ ] **T7.4** Implementar virtual scrolling si hay muchas variaciones

#### **UX Mejoradas**  
- [ ] **T7.5** Drag & drop para reordenar variaciones
- [ ] **T7.6** Búsqueda en tiempo real de variaciones
- [ ] **T7.7** Atajos de teclado para acciones comunes
- [ ] **T7.8** Tooltips explicativos
- [ ] **T7.9** Confirmaciones inteligentes antes de eliminar

### 🧪 FASE 8: Testing y Validación (Crítico antes de release)

#### **Testing Funcional**
- [ ] **T8.1** Unit tests para servicio de variaciones
- [ ] **T8.2** Integration tests para componente principal  
- [ ] **T8.3** E2E tests para flujo completo de creación
- [ ] **T8.4** Tests de validaciones y reglas de negocio

#### **Testing de Usuario**
- [ ] **T8.5** UAT con usuarios reales (casos de Pizza/Hamburguesa)
- [ ] **T8.6** Pruebas de performance con productos complejos (20+ variaciones)
- [ ] **T8.7** Validación de flujos de trabajo completos
- [ ] **T8.8** Tests de regresión con otros tipos de productos

## 5. Casos de Uso de Ejemplo

### 5.1. Caso: Pizzería

**Producto Plantilla:** "Pizza"
**Variaciones:**
1. "Pizza Personal Mozzarella" - $8.00
2. "Pizza Mediana Mozzarella" - $12.00  
3. "Pizza Grande Mozzarella" - $15.00
4. "Pizza Personal Pepperoni" - $9.00
5. "Pizza Mediana Pepperoni" - $14.00
6. "Pizza Grande Pepperoni" - $18.00

### 5.2. Caso: Hamburguesería

**Producto Plantilla:** "Hamburguesa Clásica"
**Variaciones:**
1. "Hamburguesa Simple" - $8.00
2. "Hamburguesa Doble Carne" - $12.00
3. "Hamburguesa Triple Carne" - $16.00  
4. "Hamburguesa Simple con Bacon" - $10.00

### 5.3. Flujo de Trabajo Típico

1. **Crear Producto Plantilla:** Tipo `ELABORADO_CON_VARIACION`, nombre "Pizza"
2. **Agregar Primera Variación:** "Pizza Grande Mozzarella"  
3. **Configurar Ingredientes:** Masa, salsa, mozzarella, etc.
4. **Definir Precios:** Precio principal $15.00
5. **Agregar Adicionales:** Extra queso, pepperoni, etc.
6. **Duplicar para Variaciones:** Crear "Pizza Mediana" copiando ingredientes
7. **Ajustar Cantidades:** Reducir cantidades para tamaño mediano
8. **Ajustar Precios:** Precio mediana $12.00
9. **Continuar con más variaciones...**

## 6. Definición de Terminado (Definition of Done)

### ✅ Funcionalidad Base Completa
- [ ] Usuario puede crear producto tipo ELABORADO_CON_VARIACION
- [ ] Usuario puede agregar/editar/eliminar variaciones
- [ ] Usuario puede gestionar ingredientes por variación  
- [ ] Usuario puede gestionar precios por variación
- [ ] Usuario puede vincular adicionales por variación

### ✅ UX y UI Aceptable  
- [ ] Interfaz intuitiva y clara
- [ ] Diferenciación visual clara entre plantilla y variaciones
- [ ] Feedback apropiado para todas las acciones
- [ ] Manejo de errores y validaciones
- [ ] Performance aceptable con 20+ variaciones

### ✅ Integración Completa
- [ ] Integración con sistema de costos existente
- [ ] Integración con sistema de precios existente  
- [ ] Integración con sistema de adicionales existente
- [ ] Navegación fluida entre pestañas
- [ ] Consistencia con patrones UI existentes

### ✅ Calidad y Confiabilidad
- [ ] Code coverage > 80%
- [ ] Tests E2E para casos críticos
- [ ] Validación con usuarios reales
- [ ] Performance benchmarks aprobados
- [ ] Documentación actualizada

## 7. Riesgos y Mitigaciones

### 7.1. Riesgos Técnicos

**RIESGO:** Complejidad de UI excesiva
**PROBABILIDAD:** Alta | **IMPACTO:** Alto
**MITIGACIÓN:** Implementación por fases, prototipado temprano

**RIESGO:** Performance con muchas variaciones  
**PROBABILIDAD:** Media | **IMPACTO:** Alto
**MITIGACIÓN:** Lazy loading, virtual scrolling, caching

**RIESGO:** Inconsistencias con otros tipos de producto
**PROBABILIDAD:** Media | **IMPACTO:** Medio  
**MITIGACIÓN:** Reutilizar componentes existentes, testing exhaustivo

### 7.2. Riesgos de Negocio

**RIESGO:** UX confusa para usuarios  
**PROBABILIDAD:** Alta | **IMPACTO:** Alto
**MITIGACIÓN:** UAT temprano, iteración rápida de UI

**RIESGO:** Adopción lenta por parte de usuarios
**PROBABILIDAD:** Media | **IMPACTO:** Medio
**MITIGACIÓN:** Documentación clara, training, migración asistida

## 8. Conclusión

La implementación de `ELABORADO_CON_VARIACION` es la funcionalidad más compleja y crítica pendiente. Su éxito desbloqueará casos de uso fundamentales como pizzerías y hamburgueserías. La clave está en una implementación por fases que permita validación temprana y iteración rápida, manteniendo la coherencia con el sistema existente.

**Próximo paso recomendado:** Comenzar con FASE 1 (Estructura Base) para establecer los cimientos técnicos sólidos antes de abordar la complejidad de UI.
