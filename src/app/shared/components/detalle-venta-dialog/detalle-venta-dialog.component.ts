import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';

import { RepositoryService } from '../../../database/repository.service';
import { Venta } from '../../../database/entities/ventas/venta.entity';
import { VentaItem } from '../../../database/entities/ventas/venta-item.entity';
import { PagoDetalle } from '../../../database/entities/compras/pago-detalle.entity';

export interface DetalleVentaDialogData {
  venta: Venta;
}

interface ItemRow {
  item: VentaItem;
  mozo: string;
  totalItem: number;
  cancelInfo: string;
}

interface PagoDetalleRow {
  detalle: PagoDetalle;
  monedaNombre: string;
  formaPagoNombre: string;
  valorDisplay: string;
}

@Component({
  selector: 'app-detalle-venta-dialog',
  templateUrl: './detalle-venta-dialog.component.html',
  styleUrls: ['./detalle-venta-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
  ],
})
export class DetalleVentaDialogComponent implements OnInit {
  itemRows: ItemRow[] = [];
  pagoDetalleRows: PagoDetalleRow[] = [];
  itemColumns = ['producto', 'mozo', 'cantidad', 'precio', 'descuento', 'total', 'estado'];
  pagoColumns = ['moneda', 'formaPago', 'valor', 'tipo', 'observacion'];
  totalVenta = 0;
  duracion = '-';

  constructor(
    public dialogRef: MatDialogRef<DetalleVentaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DetalleVentaDialogData,
    private repositoryService: RepositoryService
  ) {}

  async ngOnInit(): Promise<void> {
    // Cargar items
    const items = await firstValueFrom(this.repositoryService.getVentaItems(this.data.venta.id));
    this.itemRows = items.map(item => ({
      item,
      mozo: (item as any).createdBy?.persona?.nombre || '-',
      totalItem: item.estado === 'CANCELADO' ? 0 : (item.precioVentaUnitario + (item.precioAdicionales || 0) - (item.descuentoUnitario || 0)) * item.cantidad,
      cancelInfo: this.getCancelInfo(item),
    }));

    this.totalVenta = this.itemRows.reduce((sum, r) => sum + r.totalItem, 0);

    // Cargar pago detalles
    if (this.data.venta.pago?.id) {
      const detalles = await firstValueFrom(this.repositoryService.getPagoDetalles(this.data.venta.pago.id));
      this.pagoDetalleRows = detalles.map(d => ({
        detalle: d,
        monedaNombre: `${d.moneda?.simbolo || ''} ${d.moneda?.denominacion || ''}`,
        formaPagoNombre: (d.formaPago as any)?.nombre || '-',
        valorDisplay: `${d.moneda?.simbolo || ''} ${(d.valor || 0).toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
      }));
    }

    // Calcular duración
    this.duracion = this.calcDuracion();
  }

  private getCancelInfo(item: VentaItem): string {
    if (item.estado !== 'CANCELADO') return '';
    const parts: string[] = [];
    if ((item as any).canceladoPor?.persona?.nombre) {
      parts.push(`por ${(item as any).canceladoPor.persona.nombre}`);
    }
    if (item.horaCancelado) {
      parts.push(`a las ${new Date(item.horaCancelado).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}`);
    }
    return parts.length > 0 ? `CANCELADO ${parts.join(' ')}` : 'CANCELADO';
  }

  private calcDuracion(): string {
    const venta = this.data.venta;
    if (!venta.fechaCierre || !venta.createdAt) return '-';
    const ms = new Date(venta.fechaCierre).getTime() - new Date(venta.createdAt).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const restMins = mins % 60;
    return `${hrs}h ${restMins}m`;
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
