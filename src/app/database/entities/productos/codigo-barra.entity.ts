import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';
import type { Presentacion } from './presentacion.entity';

@Entity('codigo_barra')
export class CodigoBarra extends BaseModel {
  @Column({ type: 'varchar', length: 255 })
  codigo!: string;

  @Column({ type: 'boolean', default: false, comment: 'Indica si este es el código de barras por defecto para la presentación.' })
  principal!: boolean;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  // Relationships
  @ManyToOne('Presentacion', 'codigosBarras')
  @JoinColumn({ name: 'presentacion_id' })
  presentacion!: Presentacion;
} 