import { Entity, ManyToOne, JoinColumn, Column } from 'typeorm';
import { BaseModel } from '../base.entity';
import { Producto } from './producto.entity';
import { Observacion } from './observacion.entity';

@Entity('producto_observacion')
export class ProductoObservacion extends BaseModel {
  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'producto_id' })
  producto!: Producto;

  @ManyToOne(() => Observacion)
  @JoinColumn({ name: 'observacion_id' })
  observacion!: Observacion;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;
} 