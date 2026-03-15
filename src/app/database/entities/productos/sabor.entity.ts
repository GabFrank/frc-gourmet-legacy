import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';
import { Producto } from './producto.entity';

@Entity('sabor')
export class Sabor extends BaseModel {
  @Column({ type: 'varchar', length: 100 })
  nombre!: string; // "Calabresa", "Pepperoni"

  @Column({ type: 'varchar', length: 100 })
  categoria!: string; // "PIZZA", "HAMBURGUESA", "PASTA"

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  // Relationships
  @ManyToOne(() => Producto, producto => producto.sabores)
  @JoinColumn({ name: 'producto_id' })
  producto!: Producto;
}
