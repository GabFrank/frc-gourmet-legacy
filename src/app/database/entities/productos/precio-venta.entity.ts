import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';
import type { Presentacion } from './presentacion.entity';
import { Moneda } from '../financiero/moneda.entity';
import { TipoPrecio } from '../financiero/tipo-precio.entity';
import type { Receta } from './receta.entity';
import type { RecetaPresentacion } from './receta-presentacion.entity';

@Entity('precio_venta')
export class PrecioVenta extends BaseModel {
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor!: number;

  @Column({ type: 'boolean', default: false, comment: 'Indica si este es el precio por defecto para la presentación o receta.' })
  principal!: boolean;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  // Relationships
  @ManyToOne('Presentacion', { nullable: true })
  @JoinColumn({ name: 'presentacion_id' })
  presentacion?: Presentacion;

  @ManyToOne('Receta', { nullable: true })
  @JoinColumn({ name: 'receta_id' })
  receta?: Receta;

  // ✅ NUEVA RELACIÓN: Precios específicos para variaciones de receta
  @ManyToOne('RecetaPresentacion', { nullable: true })
  @JoinColumn({ name: 'receta_presentacion_id' })
  recetaPresentacion?: RecetaPresentacion;

  @ManyToOne(() => Moneda)
  @JoinColumn({ name: 'moneda_id' })
  moneda!: Moneda;

  @ManyToOne(() => TipoPrecio)
  @JoinColumn({ name: 'tipo_precio_id' })
  tipoPrecio!: TipoPrecio;
}
