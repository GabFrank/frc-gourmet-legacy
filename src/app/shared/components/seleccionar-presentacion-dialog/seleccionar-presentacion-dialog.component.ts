import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface SeleccionarPresentacionDialogData {
  producto: any;
  presentaciones: any[];
}

@Component({
  selector: 'app-seleccionar-presentacion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './seleccionar-presentacion-dialog.component.html',
  styleUrls: ['./seleccionar-presentacion-dialog.component.scss']
})
export class SeleccionarPresentacionDialogComponent {
  presentaciones: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<SeleccionarPresentacionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SeleccionarPresentacionDialogData
  ) {
    this.presentaciones = (data.presentaciones || []).filter((p: any) =>
      p.preciosVenta && p.preciosVenta.length > 0
    );
  }

  selectPrecio(presentacion: any, precioVenta: any): void {
    this.dialogRef.close({ presentacion, precioVenta });
  }

  getPrincipalPrecio(presentacion: any): any {
    return presentacion.preciosVenta?.find((p: any) => p.principal) || presentacion.preciosVenta?.[0];
  }
}
