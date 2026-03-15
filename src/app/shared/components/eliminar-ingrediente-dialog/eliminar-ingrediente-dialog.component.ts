import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';

export interface EliminarIngredienteDialogData {
  nombreIngrediente: string;
  nombreVariacion: string;
  cantidad: number;
  unidad: string;
}

@Component({
  selector: 'app-eliminar-ingrediente-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatCheckboxModule,
    FormsModule
  ],
  template: `
    <h2 mat-dialog-title>Eliminar Ingrediente</h2>

    <mat-dialog-content>
      <p>
        ¿Estás seguro de que deseas eliminar el ingrediente
        <strong>{{ data.nombreIngrediente }}</strong>
        de la variación <strong>{{ data.nombreVariacion }}</strong>?
      </p>

      <p>
        <strong>Detalles:</strong><br>
        Cantidad: {{ data.cantidad }} {{ data.unidad }}
      </p>

                   <mat-checkbox
               [(ngModel)]="eliminarDeOtrasVariaciones"
               color="warn">
               Eliminar de todas las variaciones del mismo sabor que usen este ingrediente
             </mat-checkbox>

             <p *ngIf="eliminarDeOtrasVariaciones" class="warning-text">
               ⚠️ Esta acción eliminará PERMANENTEMENTE el ingrediente de todas las variaciones del mismo sabor que lo contengan.
             </p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-raised-button
        color="warn"
        (click)="confirmar()"
        [disabled]="loading">
                       {{ eliminarDeOtrasVariaciones ? 'Eliminar del Mismo Sabor' : 'Eliminar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .warning-text {
      color: #f57c00;
      font-weight: 500;
      margin-top: 16px;
      padding: 8px;
      background-color: #fff3e0;
      border-radius: 4px;
      border-left: 4px solid #f57c00;
    }

    mat-dialog-content {
      min-width: 400px;
    }

    mat-checkbox {
      margin-top: 16px;
      display: block;
    }
  `]
})
export class EliminarIngredienteDialogComponent {
  eliminarDeOtrasVariaciones = false;
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<EliminarIngredienteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EliminarIngredienteDialogData
  ) {}

  confirmar(): void {
    this.loading = true;
    this.dialogRef.close({
      confirmado: true,
      eliminarDeOtrasVariaciones: this.eliminarDeOtrasVariaciones
    });
  }
}
