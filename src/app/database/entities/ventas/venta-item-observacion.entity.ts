import { Entity, ManyToOne, JoinColumn, Column } from 'typeorm';
import { BaseModel } from '../base.entity';
import { Observacion } from '../productos/observacion.entity';

@Entity('venta_item_observaciones')
export class VentaItemObservacion extends BaseModel {
  @ManyToOne('VentaItem', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venta_item_id' })
  ventaItem!: any;

  @ManyToOne(() => Observacion, { nullable: false })
  @JoinColumn({ name: 'observacion_id' })
  observacion!: Observacion;

  @Column({ type: 'varchar', length: 500, nullable: true })
  observacionLibre?: string;

  @ManyToOne('VentaItemSabor', { nullable: true })
  @JoinColumn({ name: 'venta_item_sabor_id' })
  ventaItemSabor?: any;

  @Column({ default: true })
  activo!: boolean;
}
