import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { Moneda } from '../../../database/entities/financiero/moneda.entity';

const REDONDEO_BASE = 500;

export interface AjusteCobrarDialogData {
  total: number;
  moneda: Moneda;
  tipoSugerido?: 'descuento' | 'aumento';
  valorSugerido?: number;
  costoTotal?: number;
}

@Component({
  selector: 'app-ajuste-cobrar-dialog',
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
  ],
  template: `
    <h2 mat-dialog-title>AJUSTE DE COBRO</h2>

    <mat-dialog-content>
      <div class="info-row">
        <span>Total actual ({{ data.moneda.simbolo }}):</span>
        <span class="info-value">{{ data.total | number:'1.0-0' }}</span>
      </div>

      <mat-divider></mat-divider>

      <!-- Tipo de ajuste -->
      <div class="tipo-section">
        <mat-radio-group [(ngModel)]="tipoAjuste" (change)="recalcular()">
          <mat-radio-button value="descuento">DESCUENTO</mat-radio-button>
          <mat-radio-button value="aumento">AUMENTO / REDONDEO</mat-radio-button>
        </mat-radio-group>
      </div>

      <!-- Modo -->
      <div class="modo-section">
        <mat-radio-group [(ngModel)]="modo" (change)="recalcular()">
          <mat-radio-button value="porcentaje">PORCENTAJE</mat-radio-button>
          <mat-radio-button value="monto">MONTO FIJO</mat-radio-button>
        </mat-radio-group>
      </div>

      <!-- Input -->
      <mat-form-field appearance="outline" style="width: 100%" *ngIf="modo === 'monto'">
        <mat-label>MONTO</mat-label>
        <input matInput type="number" [(ngModel)]="montoInput" min="0" (ngModelChange)="recalcular()" />
      </mat-form-field>

      <mat-form-field appearance="outline" style="width: 100%" *ngIf="modo === 'porcentaje'">
        <mat-label>PORCENTAJE</mat-label>
        <input matInput type="number" [(ngModel)]="porcentajeInput" min="0" max="100" (ngModelChange)="recalcular()" />
        <span matSuffix>%</span>
      </mat-form-field>

      <!-- Chips de porcentaje rápido -->
      <div class="pct-chips" *ngIf="modo === 'porcentaje'">
        <button mat-stroked-button type="button" *ngFor="let p of porcentajesRapidos"
          [class.selected]="porcentajeInput === p"
          (click)="porcentajeInput = p; recalcular()">
          {{ p }}%
        </button>
      </div>

      <mat-divider></mat-divider>

      <!-- Resultado -->
      <div class="resultado-section">
        <div class="info-row">
          <span>{{ tipoAjuste === 'descuento' ? 'Descuento' : 'Aumento' }}:</span>
          <span class="info-value" [class.valor-descuento]="tipoAjuste === 'descuento'" [class.valor-aumento]="tipoAjuste === 'aumento'">
            {{ tipoAjuste === 'descuento' ? '-' : '+' }}{{ valorCalculado | number:'1.0-0' }}
          </span>
        </div>
        <div class="info-row total-row">
          <span>Nuevo total:</span>
          <span class="info-value">{{ nuevoTotal | number:'1.0-0' }}</span>
        </div>
        <div class="alerta-costo" *ngIf="alertaCosto">
          <mat-icon>warning</mat-icon>
          <span>El nuevo total está por debajo del costo ({{ data.costoTotal | number:'1.0-0' }}). Se venderá a pérdida.</span>
        </div>
      </div>

      <!-- Redondeo -->
      <div class="redondeo-section" *ngIf="valorCalculado > 0 && nuevoTotal !== redondeoArriba && nuevoTotal !== redondeoAbajo">
        <span class="redondeo-label">Redondear nuevo total a:</span>
        <div class="redondeo-chips">
          <button mat-stroked-button type="button" [class.selected]="redondeo === 'abajo'" (click)="aplicarRedondeo('abajo')">
            <mat-icon>arrow_downward</mat-icon> {{ redondeoAbajo | number:'1.0-0' }}
          </button>
          <button mat-stroked-button type="button" [class.selected]="redondeo === 'exacto'" (click)="aplicarRedondeo('exacto')">
            EXACTO
          </button>
          <button mat-stroked-button type="button" [class.selected]="redondeo === 'arriba'" (click)="aplicarRedondeo('arriba')">
            <mat-icon>arrow_upward</mat-icon> {{ redondeoArriba | number:'1.0-0' }}
          </button>
        </div>
      </div>

      <!-- Motivo -->
      <mat-form-field appearance="outline" style="width: 100%; margin-top: 12px">
        <mat-label>MOTIVO (opcional)</mat-label>
        <input matInput [(ngModel)]="motivo" />
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(null)">CANCELAR</button>
      <button mat-raised-button color="primary" [disabled]="valorFinal === 0" (click)="aplicar()">
        <mat-icon>{{ tipoAjuste === 'descuento' ? 'discount' : 'add_circle' }}</mat-icon>
        APLICAR
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      padding: 8px 0;
    }
    .info-value { font-weight: 600; }
    .total-row { font-size: 18px; font-weight: 700; }
    .valor-descuento { color: #f44336; }
    .valor-aumento { color: #42a5f5; }
    .tipo-section, .modo-section {
      padding: 12px 0;
      mat-radio-group {
        display: flex;
        gap: 16px;
      }
    }
    .pct-chips {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 12px;
      button {
        min-width: 48px;
        &.selected {
          background-color: #b71c1c;
          color: white;
        }
      }
    }
    .resultado-section {
      padding: 8px 0;
    }
    .alerta-costo {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      margin-top: 8px;
      border-radius: 6px;
      background-color: rgba(255, 152, 0, 0.15);
      color: #ffa726;
      font-size: 12px;
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
    .redondeo-section {
      padding: 8px 0;
    }
    .redondeo-label {
      font-size: 12px;
      opacity: 0.6;
      display: block;
      margin-bottom: 6px;
    }
    .redondeo-chips {
      display: flex;
      gap: 6px;
      button {
        flex: 1;
        &.selected {
          background-color: #b71c1c;
          color: white;
        }
      }
    }
  `]
})
export class AjusteCobrarDialogComponent {
  tipoAjuste: 'descuento' | 'aumento' = 'descuento';
  modo: 'porcentaje' | 'monto' = 'monto';
  montoInput = 0;
  porcentajeInput = 0;
  motivo = '';
  porcentajesRapidos = [5, 10, 15, 20, 25, 50];

  valorCalculado = 0;
  nuevoTotal = 0;
  valorFinal = 0;
  redondeoArriba = 0;
  redondeoAbajo = 0;
  redondeo: 'arriba' | 'abajo' | 'exacto' = 'exacto';

  // Alerta de límite
  alertaCosto = false;

  constructor(
    public dialogRef: MatDialogRef<AjusteCobrarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AjusteCobrarDialogData,
  ) {
    // Pre-cargar tipo y valor sugerido
    if (data.tipoSugerido) {
      this.tipoAjuste = data.tipoSugerido;
    }
    if (data.valorSugerido && data.valorSugerido > 0) {
      this.montoInput = Math.round(data.valorSugerido);
    }
    this.recalcular();
  }

  recalcular(): void {
    if (this.modo === 'porcentaje') {
      this.valorCalculado = Math.round(this.data.total * (this.porcentajeInput || 0) / 100);
    } else {
      this.valorCalculado = this.montoInput || 0;
    }

    if (this.tipoAjuste === 'descuento') {
      this.nuevoTotal = this.data.total - this.valorCalculado;
    } else {
      this.nuevoTotal = this.data.total + this.valorCalculado;
    }

    this.redondeoArriba = Math.ceil(this.nuevoTotal / REDONDEO_BASE) * REDONDEO_BASE;
    this.redondeoAbajo = Math.floor(this.nuevoTotal / REDONDEO_BASE) * REDONDEO_BASE;
    if (this.redondeoAbajo < REDONDEO_BASE && this.nuevoTotal > 0) {
      this.redondeoAbajo = REDONDEO_BASE;
    }

    this.redondeo = 'exacto';
    this.valorFinal = this.valorCalculado;

    // Alerta si descuento hace que el cobro caiga por debajo del costo
    this.alertaCosto = false;
    if (this.tipoAjuste === 'descuento' && this.data.costoTotal && this.data.costoTotal > 0) {
      if (this.nuevoTotal < this.data.costoTotal) {
        this.alertaCosto = true;
      }
    }
  }

  aplicarRedondeo(tipo: 'arriba' | 'abajo' | 'exacto'): void {
    this.redondeo = tipo;
    let targetTotal: number;
    if (tipo === 'arriba') {
      targetTotal = this.redondeoArriba;
    } else if (tipo === 'abajo') {
      targetTotal = this.redondeoAbajo;
    } else {
      targetTotal = this.nuevoTotal;
    }

    // Recalculate the adjustment value based on the rounded target
    this.valorFinal = Math.abs(this.data.total - targetTotal);
    // If the rounded target is higher than original, it's an aumento
    if (targetTotal > this.data.total) {
      this.tipoAjuste = 'aumento';
    } else if (targetTotal < this.data.total) {
      this.tipoAjuste = 'descuento';
    }
    this.nuevoTotal = targetTotal;
  }

  aplicar(): void {
    // Return positive for descuento, negative for aumento
    const valor = this.tipoAjuste === 'descuento' ? this.valorFinal : -this.valorFinal;
    this.dialogRef.close({
      valor,
      motivo: this.motivo.trim().toUpperCase() || null,
    });
  }
}
