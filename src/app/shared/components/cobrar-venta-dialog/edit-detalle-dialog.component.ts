import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface EditDetalleDialogData {
  modo: 'observacion' | 'valor' | 'password';
  valorActual?: number;
  observacionActual?: string;
  monedaSimbolo?: string;
}

@Component({
  selector: 'app-edit-detalle-dialog',
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
  template: `
    <h2 mat-dialog-title>{{ titulo }}</h2>

    <mat-dialog-content>
      <mat-form-field appearance="outline" style="width: 100%" *ngIf="data.modo === 'observacion'">
        <mat-label>OBSERVACIÓN / NOMBRE DE QUIEN PAGA</mat-label>
        <input matInput [(ngModel)]="observacion" />
      </mat-form-field>

      <mat-form-field appearance="outline" style="width: 100%" *ngIf="data.modo === 'valor'">
        <mat-label>VALOR ({{ data.monedaSimbolo }})</mat-label>
        <input matInput type="number" [(ngModel)]="valor" min="0" />
      </mat-form-field>

      <div *ngIf="data.modo === 'password'">
        <p style="opacity: 0.6; font-size: 13px; margin-bottom: 12px">Ingrese credenciales de un usuario autorizado para ver esta información.</p>
        <mat-form-field appearance="outline" style="width: 100%">
          <mat-label>USUARIO</mat-label>
          <input matInput [(ngModel)]="nickname" />
        </mat-form-field>
        <mat-form-field appearance="outline" style="width: 100%">
          <mat-label>CONTRASEÑA</mat-label>
          <input matInput type="password" [(ngModel)]="password" (keydown.enter)="guardar()" />
        </mat-form-field>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(null)">CANCELAR</button>
      <button mat-raised-button color="primary" (click)="guardar()">
        <mat-icon>{{ data.modo === 'password' ? 'lock_open' : 'save' }}</mat-icon>
        {{ data.modo === 'password' ? 'VERIFICAR' : 'GUARDAR' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 300px;
      padding-top: 12px;
    }
  `]
})
export class EditDetalleDialogComponent {
  observacion = '';
  valor = 0;
  nickname = '';
  password = '';

  titulo = '';

  constructor(
    public dialogRef: MatDialogRef<EditDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditDetalleDialogData,
  ) {
    this.observacion = data.observacionActual || '';
    this.valor = data.valorActual || 0;

    if (data.modo === 'observacion') this.titulo = 'OBSERVACIÓN';
    else if (data.modo === 'valor') this.titulo = 'EDITAR VALOR';
    else this.titulo = 'AUTORIZACIÓN REQUERIDA';
  }

  guardar(): void {
    if (this.data.modo === 'observacion') {
      this.dialogRef.close({ observacion: this.observacion.trim().toUpperCase() || '' });
    } else if (this.data.modo === 'valor') {
      if (this.valor <= 0) return;
      this.dialogRef.close({ valor: this.valor });
    } else {
      if (!this.nickname || !this.password) return;
      this.dialogRef.close({ nickname: this.nickname.toUpperCase(), password: this.password });
    }
  }
}
