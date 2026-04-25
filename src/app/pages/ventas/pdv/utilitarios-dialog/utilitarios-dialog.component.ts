import { Component, OnInit, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CreateRetiroCajaDialogComponent } from 'src/app/pages/financiero/caja-mayor/retiros/create-retiro-caja-dialog/create-retiro-caja-dialog.component';

interface UtilitarioOption {
  key: string;
  titulo: string;
  descripcion: string;
  icono: string;
  color: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-utilitarios-dialog',
  templateUrl: './utilitarios-dialog.component.html',
  styleUrls: ['./utilitarios-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ]
})
export class UtilitariosDialogComponent implements OnInit {
  cajaId: number = 0;
  cajaNombre: string = '';

  opciones: UtilitarioOption[] = [
    {
      key: 'RETIRO',
      titulo: 'Retiro de Caja',
      descripcion: 'Registrar retiro de efectivo de la caja de venta',
      icono: 'output',
      color: '#e65100',
    },
    {
      key: 'GASTOS',
      titulo: 'Gastos',
      descripcion: 'Proximamente',
      icono: 'receipt_long',
      color: '#9e9e9e',
      disabled: true,
    },
    {
      key: 'CIERRE_PARCIAL',
      titulo: 'Cierre Parcial',
      descripcion: 'Proximamente',
      icono: 'fact_check',
      color: '#9e9e9e',
      disabled: true,
    },
    {
      key: 'ULTIMAS_VENTAS',
      titulo: 'Ultimas Ventas',
      descripcion: 'Proximamente',
      icono: 'history',
      color: '#9e9e9e',
      disabled: true,
    },
  ];

  constructor(
    private dialog: MatDialog,
    @Optional() public dialogRef: MatDialogRef<UtilitariosDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    this.cajaId = this.data?.cajaId || 0;
    this.cajaNombre = this.data?.cajaNombre || '';
  }

  seleccionar(opt: UtilitarioOption): void {
    if (opt.disabled) return;

    if (opt.key === 'RETIRO') {
      this.dialogRef?.close();
      this.dialog.open(CreateRetiroCajaDialogComponent, {
        width: '700px',
        data: { cajaId: this.cajaId, cajaNombre: this.cajaNombre },
      });
    }
  }

  cancel(): void {
    this.dialogRef?.close();
  }
}
