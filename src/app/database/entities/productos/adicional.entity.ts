import { Entity, Column, ManyToMany, JoinTable, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';
import type { Receta } from './receta.entity';
import type { RecetaAdicionalVinculacion } from './receta-adicional-vinculacion.entity';

@Entity('adicional')
export class Adicional extends BaseModel {
  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  precioBase!: number; // Precio base del adicional

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  categoria?: string; // Ej: "Carnes", "Lácteos", "Salsas"

  // ✅ NUEVA RELACIÓN: Cada adicional puede tener su propia receta
  @OneToOne('Receta', { nullable: true })
  @JoinColumn({ name: 'receta_id' })
  receta?: Receta;

  // Relación con recetas (muchos a muchos) - para disponibilidad
  @ManyToMany('Receta', 'adicionalesDisponibles')
  @JoinTable({
    name: 'receta_adicional',
    joinColumn: { name: 'adicional_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'receta_id', referencedColumnName: 'id' }
  })
  recetas!: Receta[];

  // Relación con vinculaciones
  @OneToMany('RecetaAdicionalVinculacion', 'adicional')
  vinculaciones!: RecetaAdicionalVinculacion[];
}
