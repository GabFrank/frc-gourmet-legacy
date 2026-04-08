import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';

@Entity('pdv_atajo_grupo_item')
export class PdvAtajoGrupoItem extends BaseModel {
  @Column({ name: 'atajo_grupo_id', nullable: false })
  atajoGrupoId!: number;

  @Column({ name: 'atajo_item_id', nullable: false })
  atajoItemId!: number;

  @Column({ type: 'int', default: 0 })
  posicion!: number;

  // Relationships
  @ManyToOne('PdvAtajoGrupo', 'atajoGrupoItems', { nullable: false })
  @JoinColumn({ name: 'atajo_grupo_id' })
  atajoGrupo?: any;

  @ManyToOne('PdvAtajoItem', 'atajoGrupoItems', { nullable: false })
  @JoinColumn({ name: 'atajo_item_id' })
  atajoItem?: any;
}
