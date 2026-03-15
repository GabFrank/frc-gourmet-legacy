import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RepositoryService } from '../../../../database/repository.service';
import { Receta } from '../../../../database/entities/productos/receta.entity';

export interface RecetaDialogData {
  receta?: Receta;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-receta-dialog',
  templateUrl: './receta-dialog.component.html',
  styleUrls: ['./receta-dialog.component.scss']
})
export class RecetaDialogComponent implements OnInit {
  
  recetaForm!: FormGroup;
  loading = false;
  mode: 'create' | 'edit';
  
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RecetaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RecetaDialogData,
    private repositoryService: RepositoryService,
    private snackBar: MatSnackBar
  ) {
    this.mode = data.mode;
    this.initForm();
  }
  
  ngOnInit(): void {
    if (this.mode === 'edit' && this.data.receta) {
      this.populateForm(this.data.receta);
    }
  }
  
  private initForm(): void {
    this.recetaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      descripcion: ['', [Validators.maxLength(1000)]],
      activo: [true]
    });
  }
  
  private populateForm(receta: Receta): void {
    this.recetaForm.patchValue({
      nombre: receta.nombre,
      descripcion: receta.descripcion || '',
      activo: receta.activo
    });
  }
  
  onSubmit(): void {
    if (this.recetaForm.valid) {
      this.loading = true;
      const formData = this.recetaForm.value;
      
      if (this.mode === 'create') {
        this.createReceta(formData);
      } else {
        this.updateReceta(formData);
      }
    }
  }
  
  private createReceta(formData: any): void {
    this.repositoryService.createReceta(formData).subscribe({
      next: (receta) => {
        this.loading = false;
        this.dialogRef.close({ success: true, receta });
        this.snackBar.open('Receta creada correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        this.loading = false;
        console.error('Error creating receta:', error);
        this.snackBar.open('Error al crear la receta', 'Cerrar', { duration: 3000 });
      }
    });
  }
  
  private updateReceta(formData: any): void {
    if (!this.data.receta?.id) {
      this.snackBar.open('Error: ID de receta no encontrado', 'Cerrar', { duration: 3000 });
      return;
    }
    
    this.repositoryService.updateReceta(this.data.receta.id, formData).subscribe({
      next: (result) => {
        this.loading = false;
        this.dialogRef.close({ success: true, receta: { ...this.data.receta, ...formData } });
        this.snackBar.open('Receta actualizada correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        this.loading = false;
        console.error('Error updating receta:', error);
        this.snackBar.open('Error al actualizar la receta', 'Cerrar', { duration: 3000 });
      }
    });
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
  
  getTitle(): string {
    return this.mode === 'create' ? 'Nueva Receta' : 'Editar Receta';
  }
  
  getSubmitButtonText(): string {
    return this.mode === 'create' ? 'Crear' : 'Actualizar';
  }
} 