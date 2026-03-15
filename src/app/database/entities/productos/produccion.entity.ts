import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseModel } from '../base.entity';
import { Receta } from './receta.entity';
import { Usuario } from '../personas/usuario.entity';
import { ProduccionIngrediente } from './produccion-ingrediente.entity';

@Entity('produccion')
export class Produccion extends BaseModel {
  @Column({ type: 'date' })
  fecha!: Date;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  cantidadProducida!: number;

  @Column({ type: 'varchar', length: 100 })
  unidad!: string;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  // Relationships
  @ManyToOne(() => Receta)
  @JoinColumn({ name: 'receta_id' })
  receta!: Receta;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @OneToMany(() => ProduccionIngrediente, produccionIngrediente => produccionIngrediente.produccion)
  ingredientes?: ProduccionIngrediente[];
} 