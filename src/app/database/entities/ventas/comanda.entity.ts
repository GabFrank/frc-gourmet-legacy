import { Column, Entity, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';
import { PdvMesa } from './pdv-mesa.entity';

export enum ComandaEstado {
  PENDIENTE = 'PENDIENTE',
  EN_PREPARACION = 'EN_PREPARACION',
  LISTA = 'LISTA',
  ENTREGADA = 'ENTREGADA',
  CANCELADA = 'CANCELADA',
}

@Entity('comandas')
export class Comanda extends BaseModel {
  @Column()
  codigo!: string;

  @Column({ type: 'int', default: 0 })
  numero!: number;

  @Column({
    type: 'varchar',
    enum: ComandaEstado,
    default: ComandaEstado.PENDIENTE,
  })
  estado!: ComandaEstado;

  @ManyToOne(() => PdvMesa, { nullable: true })
  @JoinColumn({ name: 'pdv_mesa_id' })
  pdv_mesa?: PdvMesa;

  @ManyToOne('Venta', { nullable: true })
  @JoinColumn({ name: 'venta_id' })
  venta?: any;

  @OneToMany('ComandaItem', 'comanda', { cascade: true })
  items?: any[];

  @Column({ default: true })
  activo!: boolean;
}
