import { Entity, Column, OneToMany } from 'typeorm';
import { BaseModel } from '../base.entity';
import { EnsambladoPizzaSabor } from './ensamblado-pizza-sabor.entity';

@Entity('sabor_pizza')
export class SaborPizza extends BaseModel {
  @Column({ type: 'varchar', length: 100, unique: true })
  nombre!: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  // Relationships
  @OneToMany(() => EnsambladoPizzaSabor, ensamblado => ensamblado.sabor)
  ensamblados?: EnsambladoPizzaSabor[];
} 