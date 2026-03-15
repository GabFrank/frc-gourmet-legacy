import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseModel } from '../base.entity';
import { Producto } from './producto.entity';
import { ComboProducto } from './combo-producto.entity';

@Entity('combo')
export class Combo extends BaseModel {
  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  // Relationships
  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'producto_id' })
  producto!: Producto;

  @OneToMany(() => ComboProducto, comboProducto => comboProducto.combo)
  productos?: ComboProducto[];
} 