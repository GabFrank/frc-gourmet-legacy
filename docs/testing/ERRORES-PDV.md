# Registro de Errores — PdV

Registro de errores encontrados durante el testeo manual del Punto de Venta, con tracking de resolución.

---

## Formato

```
### ERR-XXX: [Título breve]
- **Sección del checklist**: X.X
- **Fecha**: YYYY-MM-DD
- **Severidad**: CRITICO / ALTO / MEDIO / BAJO
- **Descripción**: Qué ocurre
- **Pasos para reproducir**: 1. ... 2. ... 3. ...
- **Resultado esperado**: ...
- **Resultado actual**: ...
- **Estado**: 🔴 ABIERTO / 🟡 EN PROGRESO / 🟢 RESUELTO
- **Solución**: (cuando se resuelva)
- **Fecha resolución**: YYYY-MM-DD
```

---

## Errores Encontrados

### ERR-001: Nombre de producto no se muestra en tabla de items
- **Sección del checklist**: 3.3
- **Fecha**: 2026-03-25
- **Severidad**: ALTO
- **Descripción**: La columna "Producto" en la tabla de items aparece vacía al agregar un producto
- **Pasos para reproducir**: 1. Seleccionar mesa 2. Buscar y agregar producto 3. Ver tabla de items
- **Resultado esperado**: Nombre del producto visible en la columna
- **Resultado actual**: Columna vacía, error `Cannot read properties of null (reading 'nombre')`
- **Estado**: 🟢 RESUELTO
- **Solución**: Dos fixes aplicados: (1) Agregar operador `?.` en template `item.producto?.nombre` y `item.presentacion?.cantidad`, (2) Preservar relaciones `producto` y `presentacion` en el objeto retornado por `createVentaItem` en el frontend ya que el backend no retorna relaciones al crear
- **Fecha resolución**: 2026-03-25

---

*(Agregar nuevos errores debajo de esta línea)*
