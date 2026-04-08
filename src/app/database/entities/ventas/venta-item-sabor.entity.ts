import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';
import type { RecetaPresentacion } from '../productos/receta-presentacion.entity';

@Entity('venta_item_sabores')
export class VentaItemSabor extends BaseModel {
  @ManyToOne('VentaItem', 'saboresVenta', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venta_item_id' })
  ventaItem!: any;

  @ManyToOne('RecetaPresentacion', { nullable: false })
  @JoinColumn({ name: 'receta_presentacion_id' })
  recetaPresentacion!: RecetaPresentacion;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  proporcion!: number; // 1.0 entera, 0.5 mitad, 0.33 tercio

  @Column({ name: 'precio_referencia', type: 'decimal', precision: 10, scale: 2 })
  precioReferencia!: number;

  @Column({ name: 'costo_referencia', type: 'decimal', precision: 10, scale: 2 })
  costoReferencia!: number;

  @Column({ default: true })
  activo!: boolean;
}
