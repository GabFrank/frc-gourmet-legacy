import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { firstValueFrom } from 'rxjs';
import { VentaEstado } from '../../../database/entities/ventas/venta.entity';

import { RepositoryService } from '../../../database/repository.service';
import { Delivery, DeliveryEstado } from '../../../database/entities/ventas/delivery.entity';
import { Caja } from '../../../database/entities/financiero/caja.entity';
import { Moneda } from '../../../database/entities/financiero/moneda.entity';
import { CrearDeliveryDialogComponent } from '../crear-delivery-dialog/crear-delivery-dialog.component';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { CobrarVentaDialogComponent, CobrarVentaDialogData } from '../cobrar-venta-dialog/cobrar-venta-dialog.component';
import { MonedaCambio } from '../../../database/entities/financiero/moneda-cambio.entity';

export interface DeliveryDialogData {
  caja: Caja;
  monedas: Moneda[];
  principalMoneda: Moneda;
  exchangeRates: MonedaCambio[];
  filteredMonedas: Moneda[];
}

interface DeliveryRow {
  delivery: any;
  nombre: string;
  telefono: string;
  estadoLabel: string;
  estadoColor: string;
  espera: string;
  totalVenta: number;
  valorDelivery: number;
  entregador: string;
  observacion: string;
  tiempoColor: string;
}

@Component({
  selector: 'app-delivery-dialog',
  templateUrl: './delivery-dialog.component.html',
  styleUrls: ['./delivery-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatPaginatorModule,
  ],
})
export class DeliveryDialogComponent implements OnInit, OnDestroy {
  deliveryRows: DeliveryRow[] = [];
  selectedDelivery: any = null;
  selectedItems: any[] = [];
  selectedPagoDetalles: any[] = [];
  estadoFiltro = '';
  estados = Object.values(DeliveryEstado);
  displayedColumns = ['telefono', 'nombre', 'estado', 'espera', 'valorDelivery', 'total', 'entregador', 'observacion'];

  // Paginación
  totalDeliveries = 0;
  pageSize = 20;
  pageIndex = 0;

  // Umbrales de tiempo
  tiempoAmarillo = 30;
  tiempoRojo = 60;

  private timerInterval: any;

  constructor(
    public dialogRef: MatDialogRef<DeliveryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeliveryDialogData,
    private repositoryService: RepositoryService,
    private dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    // Load umbrales
    try {
      const config = await firstValueFrom(this.repositoryService.getPdvConfig());
      if (config) {
        this.tiempoAmarillo = config.deliveryTiempoAmarillo || 30;
        this.tiempoRojo = config.deliveryTiempoRojo || 60;
      }
    } catch (e) {}

    await this.loadDeliveries();

    // Timer cada segundo para actualizar espera
    this.timerInterval = setInterval(() => {
      this.updateEsperas();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  async loadDeliveries(): Promise<void> {
    try {
      const filtros: any = { page: this.pageIndex + 1, pageSize: this.pageSize };
      if (this.estadoFiltro) filtros.estado = this.estadoFiltro;

      const result = await firstValueFrom(this.repositoryService.getDeliveriesByCaja(this.data.caja.id, filtros));
      this.totalDeliveries = result.total;
      this.deliveryRows = result.data.map((d: any) => this.mapDeliveryRow(d));
    } catch (error) {
      console.error('Error loading deliveries:', error);
    }
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadDeliveries();
  }

  private mapDeliveryRow(d: any): DeliveryRow {
    const mins = this.calcMinutos(d.fechaAbierto);
    return {
      delivery: d,
      nombre: d.nombre || d.cliente?.persona?.nombre || '-',
      telefono: d.telefono || '-',
      estadoLabel: d.estado,
      estadoColor: this.getEstadoColor(d.estado),
      espera: this.formatEspera(mins),
      totalVenta: this.calcTotalVenta(d),
      valorDelivery: d.precioDelivery?.valor || 0,
      entregador: d.entregadoPor?.persona?.nombre || '-',
      observacion: d.observacion || '',
      tiempoColor: this.getTiempoColor(mins, d.estado),
    };
  }

  private calcMinutos(fecha: string | Date): number {
    if (!fecha) return 0;
    return Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
  }

  private formatEspera(mins: number): string {
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  }

  private getEstadoColor(estado: DeliveryEstado): string {
    switch (estado) {
      case DeliveryEstado.ABIERTO: return 'abierto';
      case DeliveryEstado.PARA_ENTREGA: return 'listo';
      case DeliveryEstado.EN_CAMINO: return 'camino';
      case DeliveryEstado.ENTREGADO: return 'entregado';
      case DeliveryEstado.CANCELADO: return 'cancelado';
      default: return '';
    }
  }

  private getTiempoColor(mins: number, estado: DeliveryEstado): string {
    if (estado === DeliveryEstado.ENTREGADO || estado === DeliveryEstado.CANCELADO) return '';
    if (mins >= this.tiempoRojo) return 'tiempo-rojo';
    if (mins >= this.tiempoAmarillo) return 'tiempo-amarillo';
    return '';
  }

  private calcTotalVenta(d: any): number {
    if (!d.venta?.items) return 0;
    return d.venta.items.reduce((sum: number, i: any) => {
      if (i.estado === 'ACTIVO') return sum + (i.precioVentaUnitario + (i.precioAdicionales || 0) - (i.descuentoUnitario || 0)) * i.cantidad;
      return sum;
    }, 0);
  }

  private updateEsperas(): void {
    for (const row of this.deliveryRows) {
      const mins = this.calcMinutos(row.delivery.fechaAbierto);
      row.espera = this.formatEspera(mins);
      row.tiempoColor = this.getTiempoColor(mins, row.delivery.estado);
    }
  }

  // Estado flags (pre-computed, no getters in template)
  isAbierto = false;
  isParaEntrega = false;
  isEnCamino = false;
  isEntregado = false;
  isCancelado = false;
  isTerminal = false;

  selectDelivery(row: DeliveryRow): void {
    this.selectedDelivery = row.delivery;
    this.updateEstadoFlags();
    this.loadDeliveryDetails();
  }

  private updateEstadoFlags(): void {
    const estado = this.selectedDelivery?.estado;
    this.isAbierto = estado === DeliveryEstado.ABIERTO;
    this.isParaEntrega = estado === DeliveryEstado.PARA_ENTREGA;
    this.isEnCamino = estado === DeliveryEstado.EN_CAMINO;
    this.isEntregado = estado === DeliveryEstado.ENTREGADO;
    this.isCancelado = estado === DeliveryEstado.CANCELADO;
    this.isTerminal = this.isEntregado || this.isCancelado;
  }

  private async loadDeliveryDetails(): Promise<void> {
    if (!this.selectedDelivery?.venta?.id) {
      this.selectedItems = [];
      this.selectedPagoDetalles = [];
      return;
    }

    try {
      this.selectedItems = await firstValueFrom(this.repositoryService.getVentaItems(this.selectedDelivery.venta.id));
    } catch (e) {
      this.selectedItems = [];
    }

    try {
      if (this.selectedDelivery.venta.pago?.id) {
        this.selectedPagoDetalles = await firstValueFrom(this.repositoryService.getPagoDetalles(this.selectedDelivery.venta.pago.id));
      } else {
        this.selectedPagoDetalles = [];
      }
    } catch (e) {
      this.selectedPagoDetalles = [];
    }
  }

  onFiltroChange(): void {
    this.pageIndex = 0;
    this.loadDeliveries();
  }

  nuevoDelivery(): void {
    const dialogRef = this.dialog.open(CrearDeliveryDialogComponent, {
      width: '450px',
      data: { caja: this.data.caja },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.loadDeliveries();
        // Seleccionar el nuevo delivery
        const newRow = this.deliveryRows.find(r => r.delivery.id === result.delivery.id);
        if (newRow) this.selectDelivery(newRow);

        // Cerrar diálogo y cargar en PdV para tomar pedido
        this.dialogRef.close({ action: 'editItems', delivery: result.delivery, venta: result.venta });
      }
    });
  }

  // Acciones según estado
  editarItems(): void {
    if (!this.selectedDelivery) return;
    this.dialogRef.close({ action: 'editItems', delivery: this.selectedDelivery, venta: this.selectedDelivery.venta });
  }

  editarDatos(): void {
    if (!this.selectedDelivery) return;
    const dialogRef = this.dialog.open(CrearDeliveryDialogComponent, {
      width: '450px',
      data: { caja: this.data.caja, delivery: this.selectedDelivery },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.edited) {
        await this.loadDeliveries();
        const row = this.deliveryRows.find(r => r.delivery.id === this.selectedDelivery.id);
        if (row) this.selectDelivery(row);
      }
    });
  }

  editarPago(): void {
    if (!this.selectedDelivery?.venta) return;

    const dialogData: CobrarVentaDialogData = {
      venta: this.selectedDelivery.venta,
      items: this.selectedItems,
      monedas: this.data.filteredMonedas?.length > 0 ? this.data.filteredMonedas : this.data.monedas,
      exchangeRates: this.data.exchangeRates,
      principalMoneda: this.data.principalMoneda,
      caja: this.data.caja,
    };

    const dialogRef = this.dialog.open(CobrarVentaDialogComponent, {
      width: '80vw',
      height: '80vh',
      maxWidth: '95vw',
      disableClose: true,
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.success && this.selectedDelivery && this.selectedDelivery.estado !== DeliveryEstado.ENTREGADO) {
        // Cobro finalizado → preguntar si finalizar delivery
        const confirmRef = this.dialog.open(ConfirmationDialogComponent, {
          width: '400px',
          data: {
            title: 'FINALIZAR DELIVERY',
            message: 'El cobro ha sido finalizado. ¿Desea también marcar el delivery como ENTREGADO?',
          },
        });
        confirmRef.afterClosed().subscribe(async (confirmed) => {
          if (confirmed) {
            await firstValueFrom(this.repositoryService.updateDelivery(this.selectedDelivery.id, {
              estado: DeliveryEstado.ENTREGADO,
              fechaEntregado: new Date(),
            }));
          }
          await this.loadDeliveries();
          if (this.selectedDelivery) {
            const row = this.deliveryRows.find(r => r.delivery.id === this.selectedDelivery.id);
            if (row) this.selectDelivery(row);
          }
        });
      } else {
        await this.loadDeliveries();
        if (this.selectedDelivery) {
          const row = this.deliveryRows.find(r => r.delivery.id === this.selectedDelivery.id);
          if (row) this.selectDelivery(row);
        }
      }
    });
  }

  async marcarListoParaEntrega(): Promise<void> {
    if (!this.selectedDelivery) return;
    await firstValueFrom(this.repositoryService.updateDelivery(this.selectedDelivery.id, {
      estado: DeliveryEstado.PARA_ENTREGA,
      fechaParaEntrega: new Date(),
    }));
    await this.loadDeliveries();
    const row = this.deliveryRows.find(r => r.delivery.id === this.selectedDelivery.id);
    if (row) this.selectDelivery(row);
  }

  async enviar(): Promise<void> {
    if (!this.selectedDelivery) return;
    // TODO: seleccionar entregador (por ahora solo cambia estado)
    await firstValueFrom(this.repositoryService.updateDelivery(this.selectedDelivery.id, {
      estado: DeliveryEstado.EN_CAMINO,
      fechaEnCamino: new Date(),
    }));
    await this.loadDeliveries();
    const row = this.deliveryRows.find(r => r.delivery.id === this.selectedDelivery.id);
    if (row) this.selectDelivery(row);
  }

  async finalizar(): Promise<void> {
    if (!this.selectedDelivery) return;

    // Si no tiene cobro completo, abrir cobro primero
    if (!this.selectedDelivery.venta?.pago?.id || this.selectedDelivery.venta.estado !== 'CONCLUIDA') {
      this.editarPago();
      return;
    }

    // Finalizar delivery
    await firstValueFrom(this.repositoryService.updateDelivery(this.selectedDelivery.id, {
      estado: DeliveryEstado.ENTREGADO,
      fechaEntregado: new Date(),
    }));
    await this.loadDeliveries();
    const row = this.deliveryRows.find(r => r.delivery.id === this.selectedDelivery.id);
    if (row) this.selectDelivery(row);
  }

  async cambiarEstado(nuevoEstado: string): Promise<void> {
    if (!this.selectedDelivery) return;

    const estadoActual = this.selectedDelivery.estado;
    let mensaje = `¿Cambiar estado de ${estadoActual} a ${nuevoEstado}?`;
    let advertencia = '';

    // Advertencias según el cambio
    if (estadoActual === DeliveryEstado.ENTREGADO) {
      advertencia = 'Este delivery ya fue entregado. Retroceder el estado podría causar inconsistencias con el cobro.';
    }
    if (estadoActual === DeliveryEstado.CANCELADO) {
      advertencia = 'Este delivery fue cancelado. Al reactivarlo, la venta asociada también se reactivará.';
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'CAMBIAR ESTADO',
        message: advertencia ? `${advertencia}\n\n${mensaje}` : mensaje,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        const updateData: any = { estado: nuevoEstado };

        // Limpiar timestamps posteriores al nuevo estado
        if (nuevoEstado === DeliveryEstado.ABIERTO) {
          updateData.fechaParaEntrega = null;
          updateData.fechaEnCamino = null;
          updateData.fechaEntregado = null;
          updateData.fechaCancelacion = null;
          updateData.motivoCancelacion = null;
        } else if (nuevoEstado === DeliveryEstado.PARA_ENTREGA) {
          updateData.fechaEnCamino = null;
          updateData.fechaEntregado = null;
          updateData.fechaCancelacion = null;
          updateData.motivoCancelacion = null;
          if (!this.selectedDelivery.fechaParaEntrega) {
            updateData.fechaParaEntrega = new Date();
          }
        } else if (nuevoEstado === DeliveryEstado.EN_CAMINO) {
          updateData.fechaEntregado = null;
          updateData.fechaCancelacion = null;
          updateData.motivoCancelacion = null;
          if (!this.selectedDelivery.fechaEnCamino) {
            updateData.fechaEnCamino = new Date();
          }
        }

        await firstValueFrom(this.repositoryService.updateDelivery(this.selectedDelivery.id, updateData));

        // Si se reactiva desde CANCELADO, reactivar la venta
        // Nota: el stock se re-procesará cuando la venta se finalice nuevamente
        if (estadoActual === DeliveryEstado.CANCELADO && this.selectedDelivery.venta?.id) {
          await firstValueFrom(this.repositoryService.updateVenta(this.selectedDelivery.venta.id, {
            estado: 'ABIERTA' as any,
          }));
        }

        await this.loadDeliveries();
        const row = this.deliveryRows.find(r => r.delivery.id === this.selectedDelivery.id);
        if (row) this.selectDelivery(row);
      }
    });
  }

  cancelarDelivery(): void {
    if (!this.selectedDelivery) return;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'CANCELAR DELIVERY',
        message: '¿Está seguro de cancelar este delivery? Ingrese el motivo:',
        showInput: true,
        inputLabel: 'MOTIVO',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        const motivo = typeof result === 'string' ? result : 'SIN MOTIVO';
        await firstValueFrom(this.repositoryService.updateDelivery(this.selectedDelivery.id, {
          estado: DeliveryEstado.CANCELADO,
          fechaCancelacion: new Date(),
          motivoCancelacion: motivo.toUpperCase(),
        }));

        // También cancelar la venta y revertir stock si estaba CONCLUIDA
        if (this.selectedDelivery.venta?.id) {
          const ventaEstado = this.selectedDelivery.venta.estado;
          await firstValueFrom(this.repositoryService.updateVenta(this.selectedDelivery.venta.id, {
            estado: 'CANCELADA' as any,
          }));
          if (ventaEstado === 'CONCLUIDA') {
            this.repositoryService.revertirStockVenta(this.selectedDelivery.venta.id).subscribe({
              next: (r) => console.log('Stock revertido:', r),
              error: (e) => console.error('Error revirtiendo stock:', e),
            });
          }
        }

        await this.loadDeliveries();
        this.selectedDelivery = null;
        this.selectedItems = [];
        this.selectedPagoDetalles = [];
        this.updateEstadoFlags();
      }
    });
  }

  imprimir(): void {
    // TODO: implementar impresión
    this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: { title: 'IMPRIMIR', message: 'Impresión será implementada próximamente.', confirmText: 'CERRAR', showCancel: false },
    });
  }

  cerrar(): void {
    this.dialogRef.close(null);
  }

  calcTotalItems(): number {
    return this.selectedItems
      .filter(i => i.estado === 'ACTIVO')
      .reduce((sum, i) => sum + (i.precioVentaUnitario + (i.precioAdicionales || 0) - (i.descuentoUnitario || 0)) * i.cantidad, 0);
  }

}
