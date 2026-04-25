import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';
import { Moneda } from './moneda.entity';
import { TipoCuentaBancaria } from './banking-enums';

@Entity('cuentas_bancarias')
export class CuentaBancaria extends BaseModel {
  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @Column({ type: 'varchar', length: 100 })
  banco!: string;

  @Column({ type: 'varchar', length: 50, name: 'numero_cuenta' })
  numeroCuenta!: string;

  @Column({
    type: 'varchar',
    name: 'tipo_cuenta',
    enum: TipoCuentaBancaria,
    default: TipoCuentaBancaria.CORRIENTE
  })
  tipoCuenta!: TipoCuentaBancaria;

  @ManyToOne(() => Moneda)
  @JoinColumn({ name: 'moneda_id' })
  moneda!: Moneda;

  @Column({ type: 'varchar', length: 200, nullable: true })
  titular?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  alias?: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  saldo!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'saldo_reservado' })
  saldoReservado!: number;

  @Column({ default: true })
  activo!: boolean;
}
