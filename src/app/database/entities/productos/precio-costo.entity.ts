import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';
import { Producto } from './producto.entity';
import { Receta } from './receta.entity';
import { Moneda } from '../financiero/moneda.entity';

export enum FuenteCosto {
  COMPRA = 'COMPRA',
  MANUAL = 'MANUAL',
  AJUSTE_RECETA = 'AJUSTE_RECETA',
}

@Entity('precio_costo')
export class PrecioCosto extends BaseModel {
  @Column({ type: 'varchar', length: 50 })
  fuente!: FuenteCosto;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor!: number;

  @Column({ type: 'date' })
  fecha!: Date;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  // Relationships - Un PrecioCosto puede estar vinculado a Producto O Receta
  @ManyToOne(() => Producto, producto => producto.preciosCosto, { nullable: true })
  @JoinColumn({ name: 'producto_id' })
  producto?: Producto;

  @ManyToOne(() => Receta, receta => receta.preciosCosto, { nullable: true })
  @JoinColumn({ name: 'receta_id' })
  receta?: Receta;

  @ManyToOne(() => Moneda)
  @JoinColumn({ name: 'moneda_id' })
  moneda!: Moneda;
} 