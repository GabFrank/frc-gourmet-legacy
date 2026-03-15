import { Entity, Column, OneToMany } from 'typeorm';
import { BaseModel } from '../base.entity';
import { Subfamilia } from './subfamilia.entity';

@Entity('familia')
export class Familia extends BaseModel {
  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  // Relationships
  @OneToMany(() => Subfamilia, subfamilia => subfamilia.familia)
  subfamilias?: Subfamilia[];
} 