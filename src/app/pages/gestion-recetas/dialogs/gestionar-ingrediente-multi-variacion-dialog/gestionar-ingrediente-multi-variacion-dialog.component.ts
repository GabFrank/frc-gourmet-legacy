import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';
import { RecetaPresentacion } from '../../../../database/entities/productos/receta-presentacion.entity';
import { RecetaIngrediente } from '../../../../database/entities/productos/receta-ingrediente.entity';

export interface GestionarIngredienteMultiVariacionDialogData {
  nombreIngrediente: string;
  unidadIngrediente: string;
  variaciones: RecetaPresentacion[];
  ingredienteOriginal: RecetaIngrediente;
  // ✅ NUEVO: Información para mostrar correctamente las unidades
  cantidadOriginal: number;
  unidadOriginal: string;
}

@Component({
  selector: 'app-gestionar-ingrediente-multi-variacion-dialog',
  templateUrl: './gestionar-ingrediente-multi-variacion-dialog.component.html',
  styleUrls: ['./gestionar-ingrediente-multi-variacion-dialog.component.scss']
})
export class GestionarIngredienteMultiVariacionDialogComponent implements OnInit {

  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<GestionarIngredienteMultiVariacionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GestionarIngredienteMultiVariacionDialogData
  ) {
    this.form = this.fb.group({
      variaciones: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm(): void {
    const variacionesFormArray = this.form.get('variaciones') as FormArray;
    this.data.variaciones.forEach(variacion => {
      variacionesFormArray.push(this.fb.group({
        id: [variacion.id],
        nombre: [variacion.nombre_generado],
        seleccionada: [true], // Por defecto todas seleccionadas
        // ✅ CORREGIDO: Usar la cantidad original en lugar de la convertida
        cantidad: [this.data.cantidadOriginal || 0]
      }));
    });
  }

  get variacionesControls() {
    return (this.form.get('variaciones') as FormArray).controls;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.valid) {
      const resultado = this.form.value.variaciones
        .filter((v: any) => v.seleccionada && v.cantidad > 0)
        .map((v: any) => ({
          variacionId: v.id,
          cantidad: v.cantidad
        }));

      this.dialogRef.close(resultado);
    }
  }

  trackById(index: number, item: any): number {
    return item.value.id;
  }
}

