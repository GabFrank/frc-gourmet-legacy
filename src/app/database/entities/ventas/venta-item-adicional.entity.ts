import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';
import type { Adicional } from '../productos/adicional.entity';

@Entity('venta_item_adicionales')
export class VentaItemAdicional extends BaseModel {
  @ManyToOne('VentaItem', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venta_item_id' })
  ventaItem!: any;

  @ManyToOne('Adicional', { nullable: false })
  @JoinColumn({ name: 'adicional_id' })
  adicional!: Adicional;

  @Column({ name: 'precio_cobrado', type: 'decimal', precision: 10, scale: 2 })
  precioCobrado!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  cantidad!: number;

  @Column({ default: true })
  activo!: boolean;
}
