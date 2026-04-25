import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';

@Entity('compras_categorias')
export class CompraCategoria extends BaseModel {
  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @ManyToOne('CompraCategoria', { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'padre_id' })
  padre?: any;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icono?: string;

  @Column({ default: true })
  activo!: boolean;
}
