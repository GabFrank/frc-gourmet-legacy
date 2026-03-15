import { Entity, Column, OneToMany } from 'typeorm';
import { BaseModel } from '../base.entity';
import { EnsambladoPizza } from './ensamblado-pizza.entity';

@Entity('tamanho_pizza')
export class TamanhoPizza extends BaseModel {
  @Column({ type: 'varchar', length: 100, unique: true })
  nombre!: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  // Relationships
  @OneToMany(() => EnsambladoPizza, ensamblado => ensamblado.tamanho)
  ensamblados?: EnsambladoPizza[];
} 