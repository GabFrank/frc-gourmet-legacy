import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';
import { Promocion } from './promocion.entity';
import { Presentacion } from './presentacion.entity';

@Entity('promocion_presentacion')
export class PromocionPresentacion extends BaseModel {
  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  // Relationships
  @ManyToOne(() => Promocion, promocion => promocion.presentaciones)
  @JoinColumn({ name: 'promocion_id' })
  promocion!: Promocion;

  @ManyToOne(() => Presentacion)
  @JoinColumn({ name: 'presentacion_id' })
  presentacion!: Presentacion;
} 