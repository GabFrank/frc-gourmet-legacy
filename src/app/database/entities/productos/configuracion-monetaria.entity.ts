import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';
import { Moneda } from '../financiero/moneda.entity';

@Entity('configuracion_monetaria')
export class ConfiguracionMonetaria extends BaseModel {
  @Column({ type: 'date' })
  fechaConfiguracion!: Date;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  // Relationships
  @ManyToOne(() => Moneda)
  @JoinColumn({ name: 'moneda_principal_id' })
  monedaPrincipal!: Moneda;
} 