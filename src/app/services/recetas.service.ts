import { Injectable } from '@angular/core';

export interface Receta {
  id?: number;
  nombre: string;
  descripcion?: string;
  costoCalculado: number;
  activo: boolean;
  precioPrincipal?: number;
  producto?: any;
  ingredientes?: any[];
  preciosVenta?: any[];
  preciosCosto?: any[];
  adicionales?: any[];
}

export interface RecetaIngrediente {
  id?: number;
  cantidad: number;
  unidad: string;
  unidadOriginal?: string;
  costoUnitario: number;
  costoTotal: number;
  esExtra: boolean;
  esOpcional: boolean;
  esCambiable: boolean;
  costoExtra?: number;
  activo: boolean;
  receta?: Receta;
  ingrediente?: any;
  reemplazoDefault?: any;
}

export interface PrecioCosto {
  id?: number;
  fuente: string;
  valor: number;
  fecha: Date;
  activo: boolean;
  producto?: any;
  receta?: any;
  moneda: any;
}

@Injectable({
  providedIn: 'root'
})
export class RecetasService {

  // Obtener todas las recetas
  async getRecetas(): Promise<Receta[]> {
    return await (window as any).api.getRecetas();
  }

  // Obtener una receta específica
  async getReceta(recetaId: number): Promise<Receta> {
    return await (window as any).api.getReceta(recetaId);
  }

  // Crear una nueva receta
  async createReceta(recetaData: Partial<Receta>): Promise<Receta> {
    return await (window as any).api.createReceta(recetaData);
  }

  // Actualizar una receta existente
  async updateReceta(recetaId: number, recetaData: Partial<Receta>): Promise<Receta> {
    return await (window as any).api.updateReceta(recetaId, recetaData);
  }

  // Eliminar una receta (soft delete)
  async deleteReceta(recetaId: number): Promise<void> {
    return await (window as any).api.deleteReceta(recetaId);
  }

  // Crear un ingrediente de receta
  async createRecetaIngrediente(recetaIngredienteData: Partial<RecetaIngrediente>): Promise<RecetaIngrediente> {
    return await (window as any).api.createRecetaIngrediente(recetaIngredienteData);
  }

  // Actualizar un ingrediente de receta
  async updateRecetaIngrediente(recetaIngredienteId: number, recetaIngredienteData: Partial<RecetaIngrediente>): Promise<RecetaIngrediente> {
    return await (window as any).api.updateRecetaIngrediente(recetaIngredienteId, recetaIngredienteData);
  }

  // Eliminar un ingrediente de receta
  async deleteRecetaIngrediente(recetaIngredienteId: number): Promise<void> {
    return await (window as any).api.deleteRecetaIngrediente(recetaIngredienteId);
  }

  // ✅ NUEVO: Recalcular el costo de una receta específica
  async recalcularCostoReceta(recetaId: number): Promise<{ success: boolean; costoCalculado: number }> {
    return await (window as any).api.recalculateRecipeCost(recetaId);
  }

  // ✅ NUEVO: Recalcular el costo de todas las recetas
  async recalcularTodosLosCostos(): Promise<any[]> {
    return await (window as any).api.recalculateAllRecipeCosts();
  }

  // ✅ NUEVO: Obtener el historial de precios de costo de una receta
  async getHistorialPreciosCosto(recetaId: number): Promise<PrecioCosto[]> {
    return await (window as any).api.getPreciosCostoReceta(recetaId);
  }

  // ✅ NUEVO: Verificar si una receta necesita recalculo de costo
  async verificarNecesidadRecalculo(recetaId: number): Promise<{ necesitaRecalculo: boolean; motivo?: string }> {
    try {
      const receta = await this.getReceta(recetaId);
      const ingredientes = receta.ingredientes || [];

      // Verificar si algún ingrediente no tiene costo calculado
      const ingredientesSinCosto = ingredientes.filter(ing => ing.costoUnitario === 0);

      if (ingredientesSinCosto.length > 0) {
        return {
          necesitaRecalculo: true,
          motivo: `${ingredientesSinCosto.length} ingredientes sin costo calculado`
        };
      }

      // Verificar si el costo total es 0 pero hay ingredientes
      if (receta.costoCalculado === 0 && ingredientes.length > 0) {
        return {
          necesitaRecalculo: true,
          motivo: 'Costo total es 0 pero hay ingredientes'
        };
      }

      return { necesitaRecalculo: false };
    } catch (error) {
      console.error('Error verificando necesidad de recálculo:', error);
      return { necesitaRecalculo: true, motivo: 'Error al verificar' };
    }
  }

  // ✅ NUEVO: Obtener estadísticas de costos de recetas
  async getEstadisticasCostos(): Promise<{
    totalRecetas: number;
    recetasConCosto: number;
    recetasSinCosto: number;
    costoPromedio: number;
    recetasNecesitanRecalculo: number;
  }> {
    try {
      const recetas = await this.getRecetas();
      const recetasConCosto = recetas.filter(r => r.costoCalculado > 0);
      const recetasSinCosto = recetas.filter(r => r.costoCalculado === 0);

      const costoPromedio = recetasConCosto.length > 0
        ? recetasConCosto.reduce((sum, r) => sum + r.costoCalculado, 0) / recetasConCosto.length
        : 0;

      // Contar recetas que necesitan recálculo
      let recetasNecesitanRecalculo = 0;
      for (const receta of recetas) {
        const verificacion = await this.verificarNecesidadRecalculo(receta.id!);
        if (verificacion.necesitaRecalculo) {
          recetasNecesitanRecalculo++;
        }
      }

      return {
        totalRecetas: recetas.length,
        recetasConCosto: recetasConCosto.length,
        recetasSinCosto: recetasSinCosto.length,
        costoPromedio,
        recetasNecesitanRecalculo
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de costos:', error);
      throw error;
    }
  }
}
