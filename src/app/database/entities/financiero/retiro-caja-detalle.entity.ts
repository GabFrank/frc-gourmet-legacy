import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';

@Entity('retiros_caja_detalles')
export class RetiroCajaDetalle extends BaseModel {
  @ManyToOne('RetiroCaja', 'detalles', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'retiro_caja_id' })
  retiroCaja!: any;

  @ManyToOne('Moneda', { nullable: false })
  @JoinColumn({ name: 'moneda_id' })
  moneda!: any;

  @ManyToOne('FormasPago', { nullable: false })
  @JoinColumn({ name: 'forma_pago_id' })
  formaPago!: any;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto!: number;
}
