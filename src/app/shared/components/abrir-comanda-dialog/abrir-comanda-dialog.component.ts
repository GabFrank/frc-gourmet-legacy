import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

export interface AbrirComandaDialogData {
  comanda: any;
  mesas: any[];
  sectores: any[];
  isEditing?: boolean;
}

export interface AbrirComandaDialogResult {
  mesaId?: number;
  sectorId?: number;
  observacion?: string;
}

@Component({
  selector: 'app-abrir-comanda-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './abrir-comanda-dialog.component.html',
  styleUrls: ['./abrir-comanda-dialog.component.scss']
})
export class AbrirComandaDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<AbrirComandaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AbrirComandaDialogData,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    const comanda = this.data.comanda;
    this.form = this.fb.group({
      mesaId: [this.data.isEditing && comanda.pdv_mesa?.id ? comanda.pdv_mesa.id : null],
      sectorId: [this.data.isEditing && comanda.sector?.id ? comanda.sector.id : null],
      observacion: [this.data.isEditing && comanda.observacion ? comanda.observacion : '']
    });

    // Auto-populate sector when mesa is selected
    this.form.get('mesaId')!.valueChanges.subscribe(mesaId => {
      if (mesaId) {
        const mesa = this.data.mesas.find(m => m.id === mesaId);
        this.form.get('sectorId')!.setValue(mesa?.sector?.id || null);
      } else {
        this.form.get('sectorId')!.setValue(null);
      }
    });
  }

  confirm(): void {
    const value = this.form.value;
    if (this.data.isEditing) {
      // En modo edición enviar todos los campos (incluyendo nulls para desvincular)
      this.dialogRef.close({
        mesaId: value.mesaId || undefined,
        sectorId: value.sectorId || undefined,
        observacion: value.observacion?.trim() ? value.observacion.trim().toUpperCase() : undefined
      } as AbrirComandaDialogResult);
    } else {
      const result: AbrirComandaDialogResult = {};
      if (value.mesaId) result.mesaId = value.mesaId;
      if (value.sectorId) result.sectorId = value.sectorId;
      if (value.observacion?.trim()) result.observacion = value.observacion.trim().toUpperCase();
      this.dialogRef.close(result);
    }
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
