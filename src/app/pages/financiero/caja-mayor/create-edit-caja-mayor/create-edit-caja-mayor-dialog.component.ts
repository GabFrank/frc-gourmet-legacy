import { Component, OnInit, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { RepositoryService } from 'src/app/database/repository.service';

@Component({
  selector: 'app-create-edit-caja-mayor-dialog',
  templateUrl: './create-edit-caja-mayor-dialog.component.html',
  styleUrls: ['./create-edit-caja-mayor-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ]
})
export class CreateEditCajaMayorDialogComponent implements OnInit {
  form!: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private repositoryService: RepositoryService,
    private snackBar: MatSnackBar,
    @Optional() public dialogRef: MatDialogRef<CreateEditCajaMayorDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    this.saving = true;
    try {
      const formValue = this.form.value;
      const cajaMayorData = {
        nombre: formValue.nombre?.toUpperCase(),
        descripcion: formValue.descripcion?.toUpperCase() || null,
        estado: 'ABIERTA',
        fechaApertura: new Date(),
      };

      await firstValueFrom(this.repositoryService.createCajaMayor(cajaMayorData));
      this.snackBar.open('Caja mayor creada correctamente', 'Cerrar', { duration: 3000 });

      if (this.dialogRef) {
        this.dialogRef.close(true);
      }
    } catch (error) {
      console.error('Error creating caja mayor:', error);
      this.snackBar.open('Error al crear caja mayor', 'Cerrar', { duration: 3000 });
    } finally {
      this.saving = false;
    }
  }

  onCancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close(false);
    }
  }
}
