import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-receta-dependencies-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon color="warn">warning</mat-icon>
      Confirmar eliminación de receta
    </h2>

    <mat-dialog-content>
      <div class="warning-message">
        <p><strong>¡Atención!</strong> La receta "<strong>{{ data.receta.nombre }}</strong>" está vinculada a los siguientes productos:</p>
      </div>

      <div class="dependencies-list">
        <mat-list>
          <mat-list-item *ngFor="let producto of data.productosVinculados">
            <mat-icon matListItemIcon [class.active]="producto.activo" [class.inactive]="!producto.activo">
              {{ producto.activo ? 'check_circle' : 'cancel' }}
            </mat-icon>
            <div matListItemTitle>{{ producto.nombre }}</div>
            <div matListItemLine>
              <span class="product-type">{{ producto.tipo }}</span>
              <span class="status-chip" [class.active]="producto.activo" [class.inactive]="!producto.activo">
                {{ producto.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          </mat-list-item>
        </mat-list>
      </div>

      <div class="danger-message">
        <p><strong>⚠️ Acción irreversible:</strong></p>
        <ul>
          <li>La receta será eliminada permanentemente</li>
          <li>Se eliminarán todos los ingredientes asociados</li>
          <li>Se eliminarán todos los precios de venta y costo</li>
          <li>Los productos vinculados quedarán sin receta</li>
          <li>Esta acción no se puede deshacer</li>
        </ul>
      </div>

      <div class="confirmation-message">
        <p><strong>¿Está seguro que desea continuar con la eliminación?</strong></p>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>
        <mat-icon>cancel</mat-icon>
        Cancelar
      </button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true" cdkFocusInitial>
        <mat-icon>delete_forever</mat-icon>
        Eliminar definitivamente
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .warning-message {
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 16px;
    }

    .danger-message {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      padding: 12px;
      margin: 16px 0;
    }

    .danger-message ul {
      margin: 8px 0;
      padding-left: 20px;
    }

    .danger-message li {
      margin: 4px 0;
    }

    .confirmation-message {
      background-color: #d1ecf1;
      border: 1px solid #bee5eb;
      border-radius: 4px;
      padding: 12px;
      margin-top: 16px;
    }

    .dependencies-list {
      margin: 16px 0;
    }

    .product-type {
      font-size: 12px;
      color: #666;
      margin-right: 8px;
    }

    .status-chip {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 10px;
      font-weight: bold;
    }

    .status-chip.active {
      background-color: #d4edda;
      color: #155724;
    }

    .status-chip.inactive {
      background-color: #f8d7da;
      color: #721c24;
    }

    mat-icon.active {
      color: #28a745;
    }

    mat-icon.inactive {
      color: #dc3545;
    }

    mat-dialog-actions {
      padding: 16px 0;
    }

    mat-dialog-content {
      max-height: 400px;
      overflow-y: auto;
    }
  `]
})
export class RecetaDependenciesDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<RecetaDependenciesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      receta: { id: number; nombre: string };
      productosVinculados: Array<{ id: number; nombre: string; tipo: string; activo: boolean }>;
    }
  ) {}
}
