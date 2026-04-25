import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';

@Entity('gastos_detalles')
export class GastoDetalle extends BaseModel {
  @ManyToOne('Gasto', 'detalles', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gasto_id' })
  gasto!: any;

  @ManyToOne('Moneda', { nullable: false })
  @JoinColumn({ name: 'moneda_id' })
  moneda!: any;

  @ManyToOne('FormasPago', { nullable: false })
  @JoinColumn({ name: 'forma_pago_id' })
  formaPago!: any;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  observacion?: string;
}
