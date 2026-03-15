import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../base.entity';
import { Producto } from './producto.entity';

export enum StockMovimientoTipo {
  COMPRA = 'COMPRA',
  VENTA = 'VENTA',
  TRANSFERENCIA = 'TRANSFERENCIA',
  AJUSTE_POSITIVO = 'AJUSTE_POSITIVO',
  AJUSTE_NEGATIVO = 'AJUSTE_NEGATIVO',
  DESCARTE = 'DESCARTE',
  PRODUCCION_ENTRADA = 'PRODUCCION_ENTRADA',
  PRODUCCION_SALIDA = 'PRODUCCION_SALIDA',
}

export enum StockMovimientoTipoReferencia {
  VENTA = 'VENTA',
  COMPRA = 'COMPRA',
  PRODUCCION = 'PRODUCCION',
  AJUSTE = 'AJUSTE',
  TRANSFERENCIA = 'TRANSFERENCIA',
  DESCARTE = 'DESCARTE'
}

@Entity('stock_movimiento')
export class StockMovimiento extends BaseModel {
  @Column({ type: 'decimal', precision: 10, scale: 3 })
  cantidad!: number;

  @Column({ type: 'varchar', length: 50 })
  tipo!: StockMovimientoTipo;

  @Column({ type: 'int', nullable: true })
  referencia?: number;

  @Column({ type: 'varchar', length: 50 })
  tipoReferencia!: StockMovimientoTipoReferencia;

  @Column({ type: 'date' })
  fecha!: Date;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @Column({ type: 'text', nullable: true, comment: 'Observaciones del movimiento de stock' })
  observaciones?: string;

  // Relationships
  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'producto_id' })
  producto!: Producto;
} 