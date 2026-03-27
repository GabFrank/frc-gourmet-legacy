import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { firstValueFrom } from 'rxjs';

import { RepositoryService } from '../../../database/repository.service';
import { PrecioDelivery } from '../../../database/entities/ventas/precio-delivery.entity';

export interface CreateEditPrecioDeliveryDialogData {
  precioDelivery: PrecioDelivery | null;
}

@Component({
  selector: 'app-create-edit-precio-delivery-dialog',
  template: `
    <h2 mat-dialog-title>{{ isEditing ? 'EDITAR' : 'NUEVO' }} PRECIO DE DELIVERY</h2>
    <mat-dialog-content>
      <form [formGroup]="form" style="display: flex; flex-direction: column; gap: 12px">
        <mat-form-field appearance="outline">
          <mat-label>DESCRIPCIÓN</mat-label>
          <input matInput formControlName="descripcion" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>VALOR</mat-label>
          <input matInput type="number" formControlName="valor" min="0" />
        </mat-form-field>
        <mat-slide-toggle formControlName="activo">ACTIVO</mat-slide-toggle>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancelar()">CANCELAR</button>
      <button mat-raised-button color="primary" [disabled]="!form.valid || processing" (click)="guardar()">
        <mat-icon>save</mat-icon>
        {{ processing ? 'GUARDANDO...' : 'GUARDAR' }}
      </button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
  ],
})
export class CreateEditPrecioDeliveryDialogComponent implements OnInit {
  form!: FormGroup;
  isEditing = false;
  processing = false;

  constructor(
    public dialogRef: MatDialogRef<CreateEditPrecioDeliveryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateEditPrecioDeliveryDialogData,
    private fb: FormBuilder,
    private repositoryService: RepositoryService
  ) {}

  ngOnInit(): void {
    this.isEditing = !!this.data.precioDelivery;
    const p = this.data.precioDelivery;
    this.form = this.fb.group({
      descripcion: [p?.descripcion || '', Validators.required],
      valor: [p?.valor || 0, [Validators.required, Validators.min(0)]],
      activo: [p?.activo ?? true],
    });
  }

  async guardar(): Promise<void> {
    if (!this.form.valid || this.processing) return;
    this.processing = true;

    const data = {
      descripcion: this.form.value.descripcion.toUpperCase(),
      valor: this.form.value.valor,
      activo: this.form.value.activo,
    };

    try {
      if (this.isEditing) {
        await firstValueFrom(this.repositoryService.updatePrecioDelivery(this.data.precioDelivery!.id, data));
      } else {
        await firstValueFrom(this.repositoryService.createPrecioDelivery(data));
      }
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error guardando precio delivery:', error);
      this.processing = false;
    }
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
