import { Component, OnInit, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { RepositoryService } from 'src/app/database/repository.service';

@Component({
  selector: 'app-edit-movimiento-dialog',
  templateUrl: './edit-movimiento-dialog.component.html',
  styleUrls: ['./edit-movimiento-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ]
})
export class EditMovimientoDialogComponent implements OnInit {
  form!: FormGroup;
  monedas: any[] = [];
  formasPago: any[] = [];
  saving = false;
  movimientoId: number = 0;
  tipoMovimiento: string = '';

  constructor(
    private fb: FormBuilder,
    private repositoryService: RepositoryService,
    private snackBar: MatSnackBar,
    @Optional() public dialogRef: MatDialogRef<EditMovimientoDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    this.movimientoId = this.data?.movimientoId || 0;
    this.tipoMovimiento = this.data?.tipoMovimiento || '';

    const detalle = this.data?.detalle;
    this.form = this.fb.group({
      monedaId: [detalle?.monedaId || null, Validators.required],
      formaPagoId: [detalle?.formaPagoId || null, Validators.required],
      monto: [detalle?.monto || null, [Validators.required, Validators.min(0.01)]],
      observacion: [this.data?.observacion || ''],
    });

    this.loadLookups();
  }

  async loadLookups(): Promise<void> {
    try {
      const [monedas, formasPago] = await Promise.all([
        firstValueFrom(this.repositoryService.getMonedas()),
        firstValueFrom(this.repositoryService.getFormasPago()),
      ]);
      this.monedas = monedas || [];
      this.formasPago = formasPago || [];
    } catch (error) {
      console.error('Error loading lookups:', error);
    }
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) return;
    this.saving = true;
    try {
      const f = this.form.value;
      await firstValueFrom(this.repositoryService.editCajaMayorMovimiento(this.movimientoId, {
        monedaId: f.monedaId,
        formaPagoId: f.formaPagoId,
        monto: f.monto,
        observacion: f.observacion?.toUpperCase() || null,
      }));
      this.snackBar.open('Movimiento actualizado correctamente', 'Cerrar', { duration: 3000 });
      this.dialogRef?.close(true);
    } catch (error) {
      console.error('Error editing movimiento:', error);
      this.snackBar.open('Error al actualizar movimiento', 'Cerrar', { duration: 3000 });
    } finally {
      this.saving = false;
    }
  }

  cancel(): void {
    this.dialogRef?.close(false);
  }
}
