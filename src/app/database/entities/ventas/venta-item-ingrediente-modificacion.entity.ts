import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';
import type { RecetaIngrediente } from '../productos/receta-ingrediente.entity';
import type { Producto } from '../productos/producto.entity';

export enum TipoModificacionIngrediente {
  REMOVIDO = 'REMOVIDO',
  INTERCAMBIADO = 'INTERCAMBIADO'
}

@Entity('venta_item_ingrediente_modificaciones')
export class VentaItemIngredienteModificacion extends BaseModel {
  @ManyToOne('VentaItem', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venta_item_id' })
  ventaItem!: any;

  @ManyToOne('RecetaIngrediente', { nullable: false })
  @JoinColumn({ name: 'receta_ingrediente_id' })
  recetaIngrediente!: RecetaIngrediente;

  @Column({
    name: 'tipo_modificacion',
    type: 'varchar',
    enum: TipoModificacionIngrediente
  })
  tipoModificacion!: TipoModificacionIngrediente;

  @ManyToOne('Producto', { nullable: true })
  @JoinColumn({ name: 'ingrediente_reemplazo_id' })
  ingredienteReemplazo?: Producto;

  @Column({ default: true })
  activo!: boolean;
}
