import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Venta } from '../../../database/entities/ventas/venta.entity';

export interface CancelarVentaDialogData {
  venta: Venta;
}

@Component({
  selector: 'app-cancelar-venta-dialog',
  templateUrl: './cancelar-venta-dialog.component.html',
  styleUrls: ['./cancelar-venta-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
})
export class CancelarVentaDialogComponent {
  motivo = '';

  constructor(
    public dialogRef: MatDialogRef<CancelarVentaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CancelarVentaDialogData
  ) {}

  confirmar(): void {
    this.dialogRef.close({ confirmed: true, motivo: this.motivo.toUpperCase() });
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
