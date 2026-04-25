import { Component, OnInit, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { firstValueFrom } from 'rxjs';
import { RepositoryService } from 'src/app/database/repository.service';
import { CreateEditGastoDialogComponent } from '../gastos/create-edit-gasto/create-edit-gasto-dialog.component';

type EgresoTipo = 'GASTO' | 'AJUSTE' | null;

@Component({
  selector: 'app-registrar-egreso-dialog',
  templateUrl: './registrar-egreso-dialog.component.html',
  styleUrls: ['./registrar-egreso-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
  ]
})
export class RegistrarEgresoDialogComponent implements OnInit {
  tipoSeleccionado: EgresoTipo = null;
  ajusteForm!: FormGroup;
  monedas: any[] = [];
  formasPago: any[] = [];
  saving = false;
  loading = true;
  cajaMayorId: number = 0;

  tiposEgreso = [
    {
      tipo: 'GASTO' as EgresoTipo,
      titulo: 'Gasto',
      descripcion: 'Registrar un gasto categorizado (servicios, operativo, etc.)',
      icono: 'receipt_long',
      color: '#e65100',
    },
    {
      tipo: 'AJUSTE' as EgresoTipo,
      titulo: 'Ajuste de Saldo',
      descripcion: 'Egreso manual con motivo (faltante, correccion, etc.)',
      icono: 'tune',
      color: '#f44336',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private repositoryService: RepositoryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    @Optional() public dialogRef: MatDialogRef<RegistrarEgresoDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    this.cajaMayorId = this.data?.cajaMayorId || 0;
    this.ajusteForm = this.fb.group({
      moneda: [null, Validators.required],
      formaPago: [null, Validators.required],
      monto: [null, [Validators.required, Validators.min(0.01)]],
      motivo: ['', Validators.required],
    });
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const [monedas, formasPago] = await Promise.all([
        firstValueFrom(this.repositoryService.getMonedas()),
        firstValueFrom(this.repositoryService.getFormasPago()),
      ]);
      this.monedas = monedas || [];
      this.formasPago = formasPago || [];
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.loading = false;
    }
  }

  seleccionarTipo(tipo: EgresoTipo): void {
    if (tipo === 'GASTO') {
      // Cerrar este diálogo y abrir el de gasto
      this.dialogRef?.close(false);
      const gastoRef = this.dialog.open(CreateEditGastoDialogComponent, {
        width: '700px',
        data: { cajaMayorId: this.cajaMayorId },
      });
      gastoRef.afterClosed().subscribe(result => {
        // El componente padre recargará datos via el afterClosed del diálogo original
        // Necesitamos propagar el resultado
        if (result) {
          // El diálogo ya se cerró, el padre debe recargar
        }
      });
      return;
    }
    this.tipoSeleccionado = tipo;
  }

  volver(): void {
    this.tipoSeleccionado = null;
  }

  async guardarAjuste(): Promise<void> {
    if (this.ajusteForm.invalid) return;

    this.saving = true;
    try {
      const form = this.ajusteForm.value;
      await firstValueFrom(this.repositoryService.createCajaMayorMovimiento({
        cajaMayor: { id: this.cajaMayorId },
        tipoMovimiento: 'AJUSTE_NEGATIVO',
        moneda: { id: form.moneda },
        formaPago: { id: form.formaPago },
        monto: form.monto,
        observacion: form.motivo.toUpperCase(),
      }));
      this.snackBar.open('Egreso registrado correctamente', 'Cerrar', { duration: 3000 });
      this.dialogRef?.close(true);
    } catch (error) {
      console.error('Error registrando egreso:', error);
      this.snackBar.open('Error al registrar egreso', 'Cerrar', { duration: 3000 });
    } finally {
      this.saving = false;
    }
  }

  cancel(): void {
    this.dialogRef?.close(false);
  }
}
