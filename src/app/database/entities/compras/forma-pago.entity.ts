import { Entity, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { BaseModel } from '../base.entity';

/**
 * Entity representing payment methods
 */
@Entity('formas_pago')
export class FormasPago extends BaseModel {
  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ default: true })
  activo!: boolean;

  @Column({ name: 'movimenta_caja', default: false })
  movimentaCaja!: boolean;

  @Column({ default: false })
  principal!: boolean;

  @Column({ default: 0 })
  orden!: number;

  // Para tarjetas: maquinas POS habilitadas (puede ser >1: ej. BANCARD, INFONET, STONE).
  // Al cobrar el usuario elige cual usar.
  @ManyToMany('MaquinaPos', { createForeignKeyConstraints: false })
  @JoinTable({
    name: 'formas_pago_maquinas_pos',
    joinColumn: { name: 'forma_pago_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'maquina_pos_id', referencedColumnName: 'id' },
  })
  maquinasPos?: any[];

  // Para transferencias / PIX: cuentas bancarias destino habilitadas.
  // Al cobrar el usuario elige a cual acreditar (acreditacion inmediata, sin comision).
  @ManyToMany('CuentaBancaria', { createForeignKeyConstraints: false })
  @JoinTable({
    name: 'formas_pago_cuentas_bancarias',
    joinColumn: { name: 'forma_pago_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'cuenta_bancaria_id', referencedColumnName: 'id' },
  })
  cuentasBancarias?: any[];
}
