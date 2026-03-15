# Guía de Estructura del Módulo de Productos

## 1. Introducción

Esta guía proporciona una visión general de la arquitectura del módulo de productos para sistemas de gestión de restaurantes. Se enfoca en la estructura de entidades, relaciones y configuración por tipo de producto.

## 2. Arquitectura de Entidades

### 2.1. Entidad Central: `Producto`

```typescript
@Entity('producto')
export class Producto extends BaseModel {
  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'varchar', length: 50 })
  tipo!: ProductoTipo;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  // --- Campos de Configuración ---
  @Column({ type: 'boolean', default: true, comment: 'Indica si el producto se muestra en el punto de venta.' })
  esVendible!: boolean;

  @Column({ type: 'boolean', default: false, comment: 'Indica si el producto puede ser comprado a proveedores.' })
  esComprable!: boolean;

  @Column({ type: 'boolean', default: true, comment: 'Indica si se controla el stock del producto.' })
  controlaStock!: boolean;

  @Column({ type: 'boolean', default: false, comment: 'Indica si el producto puede ser usado como ingrediente en recetas.' })
  esIngrediente!: boolean;

  // ... relaciones ...
}
```

### 2.2. Clasificación: `ProductoTipo`

```typescript
export enum ProductoTipo {
  RETAIL = 'RETAIL', // Se compra y se vende tal cual. Ej: Gaseosa.
  RETAIL_INGREDIENTE = 'RETAIL_INGREDIENTE', // Se compra, no se vende, se usa en recetas. Ej: Harina.
  ELABORADO_SIN_VARIACION = 'ELABORADO_SIN_VARIACION', // Se produce con receta única. Ej: Lasaña.
  ELABORADO_CON_VARIACION = 'ELABORADO_CON_VARIACION', // Se produce, tiene variaciones. Ej: Pizza.
  COMBO = 'COMBO', // Agrupación de productos vendibles. Ej: Hamburguesa + Papas + Gaseosa.
}
```

### 2.3. Vinculación Adicional ↔ Receta

Sistema bidireccional que permite que cada adicional tenga su propia receta con ingredientes para control de stock y costos precisos.

**Entidad Adicional:**
```typescript
@Entity('adicional')
export class Adicional extends BaseModel {
  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  precioBase!: number;

  // Relación: Cada adicional puede tener su propia receta
  @OneToOne(() => Receta, { nullable: true })
  @JoinColumn({ name: 'receta_id' })
  receta?: Receta;
}
```

### 2.4. Campo `principal` 

Campo booleano que designa registros como opciones por defecto en:
- `PrecioVenta`: Un precio principal por presentación/receta
- `Presentacion`: Una presentación principal por producto  
- `CodigoBarra`: Un código principal por presentación

## 3. Configuración por Tipo de Producto

### 3.1. Tabla Resumen

| `ProductoTipo`             | `esVendible` | `esComprable` | `controlaStock` | `esIngrediente` | Pestañas UI Relevantes                                |
| -------------------------- | :----------: | :-----------: | :-------------: | :-------------: | ----------------------------------------------------- |
| `RETAIL`                   |     `true`     |     `true`      |      `true`       |     `false`     | Info General, **Presentaciones**, **Costos**, Stock   |
| `RETAIL_INGREDIENTE`       |    `false`     |     `true`      |      `true`       |     `true`      | Info General, **Presentaciones**, **Costos**, Stock   |
| `ELABORADO_SIN_VARIACION`  |     `true`     |    `false`      |      `true`       |     `false`     | Info General, **Receta (Única)**, **Precios**, Stock  |
| `ELABORADO_CON_VARIACION`  |     `true`     |    `false`      |     `false`¹      |     `false`     | Info General, **Recetas (Variaciones)**, Observaciones |
| `COMBO`                    |     `true`     |    `false`      |     `false`¹      |     `false`     | Info General, **Armado de Combo**, **Precios**        |

¹ *El stock no se controla a nivel del producto padre, sino a nivel de sus componentes.*

### 3.2. RETAIL
- **Definición:** Productos que se compran y venden sin modificación
- **Ejemplo:** Gaseosas, Cervezas
- **Pestaña clave:** Presentaciones y Precios
- **Stock:** Por presentación, incrementa con compras, descuenta con ventas

### 3.3. RETAIL_INGREDIENTE
- **Definición:** Materias primas para elaboración, no se venden al público
- **Ejemplo:** Harina, Queso Mozzarella
- **Campo especial:** `esVendible` siempre `false`
- **Stock:** Incrementa con compras, descuenta con producción

### 3.4. ELABORADO_SIN_VARIACION
- **Definición:** Producto con receta única y fija
- **Ejemplo:** Lasaña específica, Tiramisú
- **Pestaña clave:** Receta (única)
- **Stock:** Incrementa con producción, descuenta con ventas

### 3.5. ELABORADO_CON_VARIACION
- **Definición:** Producto plantilla con múltiples variaciones
- **Ejemplo:** Pizza (Grande/Mediana, diferentes sabores)
- **Pestaña clave:** Recetas (variaciones)
- **Stock:** No se controla a nivel producto, sino por ingredientes

### 3.6. COMBO
- **Definición:** Agrupación promocional de productos vendibles
- **Ejemplo:** Combo Ejecutivo (Lasaña + Gaseosa + Postre)
- **Pestaña clave:** Armado de Combo
- **Stock:** Descuenta de productos componentes

## 4. Precios de Venta por Tipo

- **RETAIL:** Dentro de "Presentaciones y Precios"
- **RETAIL_INGREDIENTE:** No tiene precios (no se vende)
- **ELABORADO_SIN_VARIACION:** Pestaña exclusiva "Precios de Venta"
- **ELABORADO_CON_VARIACION:** Por variación dentro de "Recetas"
- **COMBO:** Pestaña exclusiva "Precios de Venta"

## 5. Ocultación Inteligente de Pestañas

La UI oculta pestañas no relevantes según el tipo de producto seleccionado:

**Beneficios:**
- ✅ Interfaz más limpia
- ✅ Menor confusión  
- ✅ Mejor flujo de trabajo
- ✅ Menos clics innecesarios

## 6. Conclusión

Esta arquitectura proporciona máxima flexibilidad para gestionar todos los tipos de productos en un restaurante, desde simples productos de venta hasta complejas recetas con variaciones y combos promocionales. La configuración automática y la ocultación inteligente de pestañas guían al usuario hacia el flujo de trabajo correcto para cada tipo de producto.
