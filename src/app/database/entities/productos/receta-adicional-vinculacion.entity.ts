import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseModel } from '../base.entity';
import type { Receta } from './receta.entity';
import type { Adicional } from './adicional.entity';

@Entity('receta_adicional_vinculacion')
export class RecetaAdicionalVinculacion extends BaseModel {
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precioAdicional!: number; // Precio específico para esta receta

  // ✅ NUEVO: Campos para especificar cantidad de ingrediente
  @Column({ type: 'decimal', precision: 10, scale: 4, default: 1 })
  cantidad!: number; // Cantidad de ingrediente que usa este adicional

  @Column({ type: 'varchar', length: 50, default: 'UNIDADES' })
  unidad!: string; // 'GRAMOS', 'UNIDADES', 'ML', etc.

  @Column({ type: 'varchar', length: 50, nullable: true })
  unidadOriginal?: string; // Unidad seleccionada por el usuario (para conversiones)

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  // Relaciones
  @ManyToOne('Receta', 'adicionalesVinculados')
  receta!: Receta;

  @ManyToOne('Adicional', 'vinculaciones')
  adicional!: Adicional;
}
