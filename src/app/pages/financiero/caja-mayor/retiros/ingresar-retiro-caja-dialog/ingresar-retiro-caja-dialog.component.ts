import { Component, OnInit, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { RepositoryService } from 'src/app/database/repository.service';

@Component({
  selector: 'app-ingresar-retiro-caja-dialog',
  templateUrl: './ingresar-retiro-caja-dialog.component.html',
  styleUrls: ['./ingresar-retiro-caja-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ]
})
export class IngresarRetiroCajaDialogComponent implements OnInit {
  form!: FormGroup;
  saving = false;
  retiro: any = null;
  detalles: any[] = [];
  cajasMayor: any[] = [];
  detallesColumns = ['moneda', 'formaPago', 'monto'];

  constructor(
    private fb: FormBuilder,
    private repositoryService: RepositoryService,
    private snackBar: MatSnackBar,
    @Optional() public dialogRef: MatDialogRef<IngresarRetiroCajaDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      cajaMayorId: [null, Validators.required],
    });

    if (this.data?.retiro) {
      this.retiro = this.data.retiro;
      this.detalles = this.retiro.detalles || [];
    }

    this.loadCajasMayor();
  }

  async loadCajasMayor(): Promise<void> {
    try {
      const cajas = await firstValueFrom(this.repositoryService.getCajasMayor());
      this.cajasMayor = (cajas || []).filter((c: any) => c.estado === 'ABIERTA');
    } catch (error) {
      console.error('Error loading cajas mayor:', error);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || !this.retiro) return;

    this.saving = true;
    try {
      const cajaMayorId = this.form.value.cajaMayorId;
      await firstValueFrom(this.repositoryService.ingresarRetiroCaja(this.retiro.id, cajaMayorId));
      this.snackBar.open('Retiro ingresado a caja mayor correctamente', 'Cerrar', { duration: 3000 });

      if (this.dialogRef) {
        this.dialogRef.close(true);
      }
    } catch (error) {
      console.error('Error ingresando retiro:', error);
      this.snackBar.open('Error al ingresar retiro', 'Cerrar', { duration: 3000 });
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
