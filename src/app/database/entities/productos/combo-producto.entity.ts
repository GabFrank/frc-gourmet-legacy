import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';
import { Combo } from './combo.entity';
import { Producto } from './producto.entity';

@Entity('combo_producto')
export class ComboProducto extends BaseModel {
  @Column({ type: 'decimal', precision: 10, scale: 3 })
  cantidad!: number;

  @Column({ type: 'boolean', default: false })
  esOpcional!: boolean;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  // Relationships
  @ManyToOne(() => Combo, combo => combo.productos)
  @JoinColumn({ name: 'combo_id' })
  combo!: Combo;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'producto_id' })
  producto!: Producto;
} 