import { Entity, Column, OneToMany } from 'typeorm';
import { BaseModel } from '../base.entity';

@Entity('pdv_atajo_grupo')
export class PdvAtajoGrupo extends BaseModel {
  @Column({ nullable: false })
  nombre!: string;

  @Column({ default: true })
  activo!: boolean;

  @Column({ type: 'int', default: 0 })
  posicion!: number;

  @Column({ nullable: true })
  icono?: string;

  // Relationships
  @OneToMany(() => PdvAtajoGrupoItem, (gi) => gi.atajoGrupo)
  atajoGrupoItems?: PdvAtajoGrupoItem[];
}

// Import after the class declaration to avoid circular dependencies
import { PdvAtajoGrupoItem } from './pdv-atajo-grupo-item.entity';
