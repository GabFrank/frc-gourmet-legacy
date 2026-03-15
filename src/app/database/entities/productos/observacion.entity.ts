import { Entity, Column } from 'typeorm';
import { BaseModel } from '../base.entity';

@Entity('observacion')
export class Observacion extends BaseModel {
  @Column({ type: 'varchar', length: 255, unique: true })
  descripcion!: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;
} 