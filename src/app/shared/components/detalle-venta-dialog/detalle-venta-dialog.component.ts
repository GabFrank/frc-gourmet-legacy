import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { firstValueFrom } from 'rxjs';

import { RepositoryService } from '../../../database/repository.service';
import { Venta } from '../../../database/entities/ventas/venta.entity';
import { VentaItem } from '../../../database/entities/ventas/venta-item.entity';

export interface DetalleVentaDialogData {
  venta: Venta;
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
  ],
})
export class DetalleVentaDialogComponent implements OnInit {
  items: VentaItem[] = [];
  displayedColumns = ['producto', 'cantidad', 'precio', 'total', 'estado'];
  totalVenta = 0;

  constructor(
    public dialogRef: MatDialogRef<DetalleVentaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DetalleVentaDialogData,
    private repositoryService: RepositoryService
  ) {}

  async ngOnInit(): Promise<void> {
    // Cargar items con relaciones
    this.items = await firstValueFrom(this.repositoryService.getVentaItems(this.data.venta.id));
    this.totalVenta = this.items
      .filter(i => i.estado === 'ACTIVO')
      .reduce((sum, i) => sum + (i.precioVentaUnitario - (i.descuentoUnitario || 0)) * i.cantidad, 0);
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
