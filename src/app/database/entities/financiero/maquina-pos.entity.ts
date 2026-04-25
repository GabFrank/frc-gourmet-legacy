import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';
import { CuentaBancaria } from './cuenta-bancaria.entity';

@Entity('maquinas_pos')
export class MaquinaPos extends BaseModel {
  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @ManyToOne(() => CuentaBancaria)
  @JoinColumn({ name: 'cuenta_bancaria_id' })
  cuentaBancaria!: CuentaBancaria;

  @Column({ type: 'varchar', length: 100, nullable: true })
  proveedor?: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    name: 'porcentaje_comision'
  })
  porcentajeComision!: number;

  @Column({ type: 'int', default: 0, name: 'minutos_acreditacion' })
  minutosAcreditacion!: number;

  @Column({ default: true })
  activo!: boolean;
}
