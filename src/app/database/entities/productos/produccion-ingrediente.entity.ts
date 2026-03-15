import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';
import { Produccion } from './produccion.entity';
import { Producto } from './producto.entity';

@Entity('produccion_ingrediente')
export class ProduccionIngrediente extends BaseModel {
  @Column({ type: 'decimal', precision: 10, scale: 3 })
  cantidadUsada!: number;

  @Column({ type: 'varchar', length: 100 })
  unidad!: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  // Relationships
  @ManyToOne(() => Produccion, produccion => produccion.ingredientes)
  @JoinColumn({ name: 'produccion_id' })
  produccion!: Produccion;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'ingrediente_id' })
  ingrediente!: Producto;
} 