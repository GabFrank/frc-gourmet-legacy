import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';

@Entity('pdv_atajo_item_producto')
export class PdvAtajoItemProducto extends BaseModel {
  @Column({ name: 'atajo_item_id', nullable: false })
  atajoItemId!: number;

  @Column({ name: 'producto_id', nullable: false })
  productoId!: number;

  @Column({ nullable: true })
  nombre_alternativo?: string;

  @Column({ default: true })
  activo!: boolean;

  @Column({ type: 'int', default: 0 })
  posicion!: number;

  // Relationships
  @ManyToOne('PdvAtajoItem', 'atajoItemProductos', { nullable: false })
  @JoinColumn({ name: 'atajo_item_id' })
  atajoItem?: any;

  @ManyToOne('Producto', { nullable: false })
  @JoinColumn({ name: 'producto_id' })
  producto?: any;
}
