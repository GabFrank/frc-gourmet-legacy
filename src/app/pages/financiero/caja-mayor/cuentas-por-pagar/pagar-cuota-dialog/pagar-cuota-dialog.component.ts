import { Component, OnInit, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { firstValueFrom } from 'rxjs';
import { RepositoryService } from 'src/app/database/repository.service';

interface PagarCuotaDialogData {
  cuotaTipo: 'COMPRA' | 'CPP';
  cuota: any; // CompraCuota o CuentaPorPagarCuota cargada
  // Para mostrar contexto:
  contextoLabel?: string;
}

@Component({
  selector: 'app-pagar-cuota-dialog',
  templateUrl: './pagar-cuota-dialog.component.html',
  styleUrls: ['./pagar-cuota-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
  ]
})
export class PagarCuotaDialogComponent implements OnInit {
  form!: FormGroup;
  saving = false;

  cuota: any = null;
  cuotaTipo: 'COMPRA' | 'CPP' = 'COMPRA';
  contextoLabel = '';
  restante = 0;

  cajasMayor: any[] = [];
  cuentasBancarias: any[] = [];
  monedas: any[] = [];
  formasPago: any[] = [];

  constructor(
    private fb: FormBuilder,
    private repositoryService: RepositoryService,
    private snackBar: MatSnackBar,
    @Optional() public dialogRef: MatDialogRef<PagarCuotaDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: PagarCuotaDialogData,
  ) {}

  ngOnInit(): void {
    this.cuota = this.data?.cuota;
    this.cuotaTipo = this.data?.cuotaTipo || 'COMPRA';
    this.contextoLabel = this.data?.contextoLabel || '';
    this.restante = +(Number(this.cuota?.monto || 0) - Number(this.cuota?.montoPagado || 0)).toFixed(2);

    this.form = this.fb.group({
      fuente: ['CAJA_MAYOR', Validators.required],
      monto: [this.restante, [Validators.required, Validators.min(0.01)]],
      // Caja mayor
      cajaMayorId: [null],
      monedaId: [null],
      formaPagoId: [null],
      // Cuenta bancaria
      cuentaBancariaId: [null],
      observacion: [''],
    });

    this.loadLookups();
    this.form.get('fuente')!.valueChanges.subscribe(() => this.applyValidators());
    this.applyValidators();
  }

  applyValidators(): void {
    const fuente = this.form.get('fuente')!.value;
    const cm = this.form.get('cajaMayorId')!;
    const mon = this.form.get('monedaId')!;
    const fp = this.form.get('formaPagoId')!;
    const cb = this.form.get('cuentaBancariaId')!;

    if (fuente === 'CAJA_MAYOR') {
      cm.setValidators([Validators.required]);
      mon.setValidators([Validators.required]);
      fp.setValidators([Validators.required]);
      cb.clearValidators();
    } else {
      cm.clearValidators();
      mon.clearValidators();
      fp.clearValidators();
      cb.setValidators([Validators.required]);
    }
    cm.updateValueAndValidity({ emitEvent: false });
    mon.updateValueAndValidity({ emitEvent: false });
    fp.updateValueAndValidity({ emitEvent: false });
    cb.updateValueAndValidity({ emitEvent: false });
  }

  async loadLookups(): Promise<void> {
    try {
      const [cajas, cuentas, monedas, formas] = await Promise.all([
        firstValueFrom(this.repositoryService.getCajasMayor()),
        firstValueFrom(this.repositoryService.getCuentasBancarias()),
        firstValueFrom(this.repositoryService.getMonedas()),
        firstValueFrom(this.repositoryService.getFormasPago()),
      ]);
      this.cajasMayor = (cajas || []).filter((c: any) => c.estado === 'ABIERTA');
      this.cuentasBancarias = (cuentas || []).filter((c: any) => c.activo !== false);
      this.monedas = monedas || [];
      this.formasPago = (formas || []).filter((f: any) => f.movimentaCaja);
    } catch (e) { console.error(e); }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || !this.cuota?.id) return;
    const f = this.form.value;
    if (Number(f.monto) > this.restante + 0.005) {
      this.snackBar.open(`Monto excede el restante (${this.restante})`, 'Cerrar', { duration: 3000 });
      return;
    }
    this.saving = true;
    try {
      const payload: any = {
        cuotaId: this.cuota.id,
        monto: Number(f.monto),
        fuente: f.fuente,
        observacion: f.observacion || null,
      };
      if (f.fuente === 'CAJA_MAYOR') {
        payload.cajaMayorId = f.cajaMayorId;
        payload.monedaId = f.monedaId;
        payload.formaPagoId = f.formaPagoId;
      } else {
        payload.cuentaBancariaId = f.cuentaBancariaId;
      }

      if (this.cuotaTipo === 'COMPRA') {
        await firstValueFrom(this.repositoryService.pagarCompraCuota(payload));
      } else {
        await firstValueFrom(this.repositoryService.pagarCppCuota(payload));
      }
      this.snackBar.open('Pago registrado', 'Cerrar', { duration: 3000 });
      this.dialogRef?.close(true);
    } catch (e) {
      console.error(e);
      this.snackBar.open('Error al registrar pago', 'Cerrar', { duration: 3000 });
    } finally {
      this.saving = false;
    }
  }

  onCancel(): void { this.dialogRef?.close(false); }
}
