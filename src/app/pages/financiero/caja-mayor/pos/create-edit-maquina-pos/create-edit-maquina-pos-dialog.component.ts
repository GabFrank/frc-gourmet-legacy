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
  selector: 'app-create-edit-maquina-pos-dialog',
  templateUrl: './create-edit-maquina-pos-dialog.component.html',
  styleUrls: ['./create-edit-maquina-pos-dialog.component.scss'],
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
export class CreateEditMaquinaPosDialogComponent implements OnInit {
  form!: FormGroup;
  saving = false;
  isEditing = false;
  maquinaId: number | null = null;
  cuentas: any[] = [];

  constructor(
    private fb: FormBuilder,
    private repositoryService: RepositoryService,
    private snackBar: MatSnackBar,
    @Optional() public dialogRef: MatDialogRef<CreateEditMaquinaPosDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    this.maquinaId = this.data?.maquinaPosId || null;
    this.isEditing = !!this.maquinaId;

    this.form = this.fb.group({
      nombre: ['', Validators.required],
      cuentaBancariaId: [null, Validators.required],
      proveedor: [''],
      porcentajeComision: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      minutosAcreditacion: [0, [Validators.required, Validators.min(0)]],
      activo: [true],
    });

    this.loadLookups();
  }

  async loadLookups(): Promise<void> {
    try {
      const cuentas = await firstValueFrom(this.repositoryService.getCuentasBancarias());
      this.cuentas = (cuentas || []).filter((c: any) => c.activo !== false);
      if (this.isEditing && this.maquinaId) {
        const m = await firstValueFrom(this.repositoryService.getMaquinaPos(this.maquinaId));
        if (m) {
          this.form.patchValue({
            nombre: m.nombre,
            cuentaBancariaId: m.cuentaBancaria?.id,
            proveedor: m.proveedor || '',
            porcentajeComision: Number(m.porcentajeComision),
            minutosAcreditacion: Number(m.minutosAcreditacion),
            activo: m.activo,
          });
        }
      }
    } catch (error) { console.error(error); }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    this.saving = true;
    try {
      const f = this.form.value;
      const data: any = {
        nombre: f.nombre,
        cuentaBancaria: { id: f.cuentaBancariaId },
        proveedor: f.proveedor || null,
        porcentajeComision: f.porcentajeComision,
        minutosAcreditacion: f.minutosAcreditacion,
        activo: f.activo,
      };
      if (this.isEditing && this.maquinaId) {
        await firstValueFrom(this.repositoryService.updateMaquinaPos(this.maquinaId, data));
        this.snackBar.open('Maquina POS actualizada', 'Cerrar', { duration: 3000 });
      } else {
        await firstValueFrom(this.repositoryService.createMaquinaPos(data));
        this.snackBar.open('Maquina POS creada', 'Cerrar', { duration: 3000 });
      }
      this.dialogRef?.close(true);
    } catch (error) {
      console.error(error);
      this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 });
    } finally {
      this.saving = false;
    }
  }

  onCancel(): void { this.dialogRef?.close(false); }
}
