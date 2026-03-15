import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';
import type { RecetaIngrediente } from './receta-ingrediente.entity';
import { Producto } from './producto.entity';

@Entity('receta_ingrediente_intercambiable')
export class RecetaIngredienteIntercambiable extends BaseModel {
  @ManyToOne('RecetaIngrediente')
  @JoinColumn({ name: 'receta_ingrediente_id' })
  recetaIngrediente!: RecetaIngrediente;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'ingrediente_opcion_id' })
  ingredienteOpcion!: Producto;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costoExtra?: number;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;
} 