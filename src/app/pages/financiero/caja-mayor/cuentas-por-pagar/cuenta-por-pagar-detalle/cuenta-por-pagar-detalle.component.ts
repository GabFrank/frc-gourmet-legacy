import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { RepositoryService } from 'src/app/database/repository.service';
import { PagarCuotaDialogComponent } from '../pagar-cuota-dialog/pagar-cuota-dialog.component';

@Component({
  selector: 'app-cuenta-por-pagar-detalle',
  templateUrl: './cuenta-por-pagar-detalle.component.html',
  styleUrls: ['./cuenta-por-pagar-detalle.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule,
    MatTooltipModule,
    DatePipe,
  ]
})
export class CuentaPorPagarDetalleComponent implements OnInit {
  cuentaPorPagarId: number | null = null;
  cpp: any = null;
  cuotas: any[] = [];
  loading = false;
  cuotaColumns = ['numero', 'fechaVencimiento', 'monto', 'montoPagado', 'restante', 'estado', 'fechaPago', 'actions'];

  constructor(
    private repositoryService: RepositoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    if (this.cuentaPorPagarId) this.loadData();
  }

  setData(data: any): void {
    this.cuentaPorPagarId = data?.cuentaPorPagarId || null;
    if (this.cuentaPorPagarId) this.loadData();
  }

  async loadData(): Promise<void> {
    if (!this.cuentaPorPagarId) return;
    this.loading = true;
    try {
      const [cpp, cuotas] = await Promise.all([
        firstValueFrom(this.repositoryService.getCuentaPorPagar(this.cuentaPorPagarId)),
        firstValueFrom(this.repositoryService.getCuentaPorPagarCuotas(this.cuentaPorPagarId)),
      ]);
      this.cpp = cpp;
      this.cuotas = cuotas || [];
    } catch (e) {
      console.error(e);
      this.snackBar.open('Error al cargar', 'Cerrar', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  pagar(cuota: any): void {
    const ref = this.dialog.open(PagarCuotaDialogComponent, {
      width: '600px',
      data: {
        cuotaTipo: 'CPP',
        cuota,
        contextoLabel: this.cpp?.descripcion,
      },
    });
    ref.afterClosed().subscribe(r => { if (r) this.loadData(); });
  }

  estadoColor(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return '#9e9e9e';
      case 'PARCIAL': return '#ff9800';
      case 'PAGADA': return '#4caf50';
      case 'VENCIDA': return '#f44336';
      default: return '#9e9e9e';
    }
  }

  restante(c: any): number {
    return +(Number(c.monto || 0) - Number(c.montoPagado || 0)).toFixed(2);
  }

  cppEstadoColor(estado: string): string {
    switch (estado) {
      case 'ACTIVO': return '#1976d2';
      case 'PAGADO': return '#4caf50';
      case 'CANCELADO': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  }
}
