import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';
import { Moneda } from '../financiero/moneda.entity';

@Entity('conversion_moneda')
export class ConversionMoneda extends BaseModel {
  @Column({ type: 'decimal', precision: 10, scale: 6 })
  tasa!: number;

  @Column({ type: 'date' })
  fecha!: Date;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  // Relationships
  @ManyToOne(() => Moneda)
  @JoinColumn({ name: 'moneda_origen_id' })
  monedaOrigen!: Moneda;

  @ManyToOne(() => Moneda)
  @JoinColumn({ name: 'moneda_destino_id' })
  monedaDestino!: Moneda;
} 