import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';
import { PdvGrupoCategoria } from './pdv-grupo-categoria.entity';

@Entity('pdv_config')
export class PdvConfig extends BaseModel {
  @Column({ nullable: false, default: 0 })
  cantidad_mesas!: number;

  // Foreign key
  @Column({ nullable: true })
  pdvGrupoCategoriaId?: number;

  // Relationship
  @ManyToOne(() => PdvGrupoCategoria, { nullable: true })
  @JoinColumn({ name: 'pdvGrupoCategoriaId' })
  pdvGrupoCategoria?: PdvGrupoCategoria;

  // Umbrales de diferencia de caja (porcentaje)
  @Column({ name: 'umbral_diferencia_baja', type: 'decimal', precision: 10, scale: 2, default: 5 })
  umbralDiferenciaBaja!: number;

  @Column({ name: 'umbral_diferencia_alta', type: 'decimal', precision: 10, scale: 2, default: 15 })
  umbralDiferenciaAlta!: number;

  // Umbrales de tiempo de espera delivery (minutos)
  @Column({ name: 'delivery_tiempo_amarillo', type: 'int', default: 30 })
  deliveryTiempoAmarillo!: number;

  @Column({ name: 'delivery_tiempo_rojo', type: 'int', default: 60 })
  deliveryTiempoRojo!: number;

  // Comandas
  @Column({ name: 'pdv_tab_default', type: 'varchar', default: 'MESAS' })
  pdvTabDefault!: string;

  @Column({ name: 'comandas_habilitadas', default: false })
  comandasHabilitadas!: boolean;

  // Tamaño del grid de atajos: 1=grande, 2=mediano, 3=pequeño
  @Column({ name: 'atajos_grid_size', type: 'int', default: 3 })
  atajosGridSize!: number;

  // Tamaño del grid de productos dentro de atajos: 1=grande, 2=mediano, 3=pequeño
  @Column({ name: 'atajos_productos_grid_size', type: 'int', default: 3 })
  atajosProductosGridSize!: number;

  // Configuración para productos con variaciones (pizzas, etc.)
  @Column({ name: 'pizza_max_sabores', type: 'int', default: 2 })
  pizzaMaxSabores!: number;

  @Column({ name: 'pizza_estrategia_precio', type: 'varchar', length: 50, default: 'MAYOR_PRECIO' })
  pizzaEstrategiaPrecio!: string; // MAYOR_PRECIO | PROMEDIO
} 