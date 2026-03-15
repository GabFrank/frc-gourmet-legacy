import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseModel } from '../base.entity';
import { TamanhoPizza } from './tamanho-pizza.entity';
import { Presentacion } from './presentacion.entity';
import { EnsambladoPizzaSabor } from './ensamblado-pizza-sabor.entity';

@Entity('ensamblado_pizza')
export class EnsambladoPizza extends BaseModel {
  @Column({ type: 'date' })
  fechaCreacion!: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precioFinal!: number;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  // Relationships
  @ManyToOne(() => TamanhoPizza, tamanho => tamanho.ensamblados)
  @JoinColumn({ name: 'tamanho_pizza_id' })
  tamanho!: TamanhoPizza;

  @ManyToOne(() => Presentacion, { nullable: true })
  @JoinColumn({ name: 'presentacion_id' })
  presentacion?: Presentacion;

  @OneToMany(() => EnsambladoPizzaSabor, ensambladoSabor => ensambladoSabor.ensamblado)
  sabores?: EnsambladoPizzaSabor[];
} 