import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseModel } from '../base.entity';

@Entity('gastos_categorias')
export class GastoCategoria extends BaseModel {
  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @ManyToOne('GastoCategoria', 'hijos', { nullable: true })
  @JoinColumn({ name: 'padre_id' })
  padre?: GastoCategoria;

  @OneToMany('GastoCategoria', 'padre')
  hijos?: GastoCategoria[];

  @Column({ default: true })
  activo!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icono?: string;
}
