import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';
import { EnsambladoPizza } from './ensamblado-pizza.entity';
import { SaborPizza } from './sabor-pizza.entity';

@Entity('ensamblado_pizza_sabor')
export class EnsambladoPizzaSabor extends BaseModel {
  @Column({ type: 'decimal', precision: 5, scale: 4 })
  proporcion!: number;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  // Relationships
  @ManyToOne(() => EnsambladoPizza, ensamblado => ensamblado.sabores)
  @JoinColumn({ name: 'ensamblado_pizza_id' })
  ensamblado!: EnsambladoPizza;

  @ManyToOne(() => SaborPizza, sabor => sabor.ensamblados)
  @JoinColumn({ name: 'sabor_pizza_id' })
  sabor!: SaborPizza;
} 