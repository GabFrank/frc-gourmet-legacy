import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseModel } from '../base.entity';
import { Producto } from './producto.entity';
import { PromocionPresentacion } from './promocion-presentacion.entity';

export enum TipoPromocion {
  DESCUENTO_PORCENTAJE = 'DESCUENTO_PORCENTAJE',
  DESCUENTO_MONTO = 'DESCUENTO_MONTO',
  PRODUCTO_GRATIS = 'PRODUCTO_GRATIS',
  COMBO_ESPECIAL = 'COMBO_ESPECIAL'
}

@Entity('promocion')
export class Promocion extends BaseModel {
  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'varchar', length: 50 })
  tipo!: TipoPromocion;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor?: number;

  @Column({ type: 'date' })
  fechaInicio!: Date;

  @Column({ type: 'date' })
  fechaFin!: Date;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  // Relationships
  @ManyToOne(() => Producto, { nullable: true })
  @JoinColumn({ name: 'producto_aplica_id' })
  productoAplica?: Producto;

  @ManyToOne(() => Producto, { nullable: true })
  @JoinColumn({ name: 'producto_ganado_id' })
  productoGanado?: Producto;

  @OneToMany(() => PromocionPresentacion, promocionPresentacion => promocionPresentacion.promocion)
  presentaciones?: PromocionPresentacion[];
} 