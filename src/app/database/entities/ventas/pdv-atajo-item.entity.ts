import { Entity, Column, OneToMany } from 'typeorm';
import { BaseModel } from '../base.entity';

@Entity('pdv_atajo_item')
export class PdvAtajoItem extends BaseModel {
  @Column({ nullable: false })
  nombre!: string;

  @Column({ default: true })
  activo!: boolean;

  @Column({ nullable: true })
  icono?: string;

  @Column({ name: 'color_fondo', nullable: true })
  colorFondo?: string;

  @Column({ name: 'color_texto', nullable: true, default: '#FFFFFF' })
  colorTexto?: string;

  // Relationships
  @OneToMany(() => PdvAtajoGrupoItem, (gi) => gi.atajoItem)
  atajoGrupoItems?: PdvAtajoGrupoItem[];

  @OneToMany(() => PdvAtajoItemProducto, (ip) => ip.atajoItem)
  atajoItemProductos?: PdvAtajoItemProducto[];
}

// Import after the class declaration to avoid circular dependencies
import { PdvAtajoGrupoItem } from './pdv-atajo-grupo-item.entity';
import { PdvAtajoItemProducto } from './pdv-atajo-item-producto.entity';
