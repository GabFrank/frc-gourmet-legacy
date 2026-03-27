import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { RepositoryService } from '../../../database/repository.service';
import { Venta, VentaEstado } from '../../../database/entities/ventas/venta.entity';
import { DetalleVentaDialogComponent } from '../../../shared/components/detalle-venta-dialog/detalle-venta-dialog.component';

@Component({
  selector: 'app-list-ventas',
  templateUrl: './list-ventas.component.html',
  styleUrls: ['./list-ventas.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatDialogModule,
  ],
})
export class ListVentasComponent implements OnInit {
  ventas: Venta[] = [];
  displayedColumns = ['fecha', 'mesa', 'cajero', 'estado', 'formaPago', 'total', 'acciones'];

  // Filtros
  fechaDesde: Date = new Date();
  fechaHasta: Date = new Date();
  estadoFiltro: string = '';
  estados = Object.values(VentaEstado);

  constructor(
    private repositoryService: RepositoryService,
    private dialog: MatDialog
  ) {
    // Por defecto: ventas de hoy
    this.fechaDesde.setHours(0, 0, 0, 0);
    this.fechaHasta.setHours(23, 59, 59, 999);
  }

  async ngOnInit(): Promise<void> {
    await this.filtrar();
  }

  async filtrar(): Promise<void> {
    const filtros: any = {};
    if (this.estadoFiltro) {
      filtros.estado = this.estadoFiltro;
    }
    this.ventas = await firstValueFrom(
      this.repositoryService.getVentasByDateRange(
        this.fechaDesde.toISOString(),
        this.fechaHasta.toISOString(),
        filtros
      )
    );
  }

  setRango(rango: string): void {
    const now = new Date();
    this.fechaHasta = new Date();
    this.fechaHasta.setHours(23, 59, 59, 999);

    switch (rango) {
      case 'hoy':
        this.fechaDesde = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'semana':
        this.fechaDesde = new Date(now);
        this.fechaDesde.setDate(now.getDate() - now.getDay());
        this.fechaDesde.setHours(0, 0, 0, 0);
        break;
      case 'mes':
        this.fechaDesde = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'trimestre':
        this.fechaDesde = new Date(now);
        this.fechaDesde.setMonth(now.getMonth() - 3);
        this.fechaDesde.setHours(0, 0, 0, 0);
        break;
    }
    this.filtrar();
  }

  verDetalle(venta: Venta): void {
    this.dialog.open(DetalleVentaDialogComponent, {
      width: '600px',
      data: { venta },
    });
  }

  getTotal(venta: Venta): number {
    if (!venta.items) return 0;
    return venta.items.reduce((sum: number, i: any) => {
      if (i.estado === 'ACTIVO') {
        return sum + (i.precioVentaUnitario - (i.descuentoUnitario || 0)) * i.cantidad;
      }
      return sum;
    }, 0);
  }
}
