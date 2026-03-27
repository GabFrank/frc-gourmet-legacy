import { Column, Entity, OneToMany } from 'typeorm';
import { BaseModel } from '../base.entity';

/**
 * Entity representing a currency
 */
@Entity('monedas')
export class Moneda extends BaseModel {
  @Column()
  denominacion!: string;

  @Column()
  simbolo!: string;

  @Column({ nullable: true })
  flagIcon!: string;

  @Column({ nullable: true })
  countryCode!: string;

  @Column({ nullable: true, type: 'text' })
  flagIconBase64!: string;

  @Column({ default: true })
  activo!: boolean;

  @Column({ default: false })
  principal!: boolean;

  @Column({ type: 'int', default: 0, comment: 'Cantidad de decimales para formateo (0 para PYG, 2 para USD/BRL)' })
  decimales!: number;

  // @OneToMany('PrecioVenta', 'moneda')
  // preciosVenta!: PrecioVenta[];
}
