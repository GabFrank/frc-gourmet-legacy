import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';

import { VentaItem, EstadoVentaItem } from '../../../database/entities/ventas/venta-item.entity';

export interface DividirCuentaDialogData {
  items: VentaItem[];
  total: number;
}

interface ItemGroup {
  label: string;
  items: VentaItem[];
  total: number;
}

@Component({
  selector: 'app-dividir-cuenta-dialog',
  templateUrl: './dividir-cuenta-dialog.component.html',
  styleUrls: ['./dividir-cuenta-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatDividerModule,
    MatCheckboxModule,
    MatSelectModule,
  ],
})
export class DividirCuentaDialogComponent implements OnInit {
  modo: 'iguales' | 'items' = 'iguales';
  cantidadPartes = 2;
  activeItems: VentaItem[] = [];
  totalPorParte = 0;

  // Para modo por items
  itemAssignment: Map<number, number> = new Map(); // itemId -> grupoIndex
  grupos: ItemGroup[] = [];

  constructor(
    public dialogRef: MatDialogRef<DividirCuentaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DividirCuentaDialogData
  ) {}

  ngOnInit(): void {
    this.activeItems = this.data.items.filter(i => i.estado === EstadoVentaItem.ACTIVO);
    this.recalcular();
  }

  recalcular(): void {
    if (this.modo === 'iguales') {
      this.totalPorParte = this.cantidadPartes > 0 ? this.data.total / this.cantidadPartes : this.data.total;
    } else {
      this.buildGrupos();
    }
  }

  private buildGrupos(): void {
    this.grupos = [];
    for (let i = 0; i < this.cantidadPartes; i++) {
      this.grupos.push({ label: `CUENTA ${i + 1}`, items: [], total: 0 });
    }
    for (const item of this.activeItems) {
      const grupoIdx = this.itemAssignment.get(item.id) || 0;
      if (this.grupos[grupoIdx]) {
        this.grupos[grupoIdx].items.push(item);
        this.grupos[grupoIdx].total += (item.precioVentaUnitario + (item.precioAdicionales || 0) - (item.descuentoUnitario || 0)) * item.cantidad;
      }
    }
  }

  assignItem(item: VentaItem, grupoIdx: number): void {
    this.itemAssignment.set(item.id, grupoIdx);
    this.buildGrupos();
  }

  getItemGrupo(item: VentaItem): number {
    return this.itemAssignment.get(item.id) || 0;
  }

  dividir(): void {
    if (this.modo === 'iguales') {
      this.dialogRef.close({
        modo: 'iguales',
        cantidadPartes: this.cantidadPartes,
        totalPorParte: this.totalPorParte,
      });
    } else {
      this.buildGrupos();
      this.dialogRef.close({
        modo: 'items',
        grupos: this.grupos.map(g => ({
          itemIds: g.items.map(i => i.id),
          total: g.total,
        })),
      });
    }
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
