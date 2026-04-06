import { Component, Inject, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSelect } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { RepositoryService } from '../../../database/repository.service';
import { Delivery, DeliveryEstado } from '../../../database/entities/ventas/delivery.entity';
import { PrecioDelivery } from '../../../database/entities/ventas/precio-delivery.entity';
import { Caja } from '../../../database/entities/financiero/caja.entity';
import { Venta, VentaEstado } from '../../../database/entities/ventas/venta.entity';
import { BuscarClienteDialogComponent } from '../buscar-cliente-dialog/buscar-cliente-dialog.component';

export interface CrearDeliveryDialogData {
  caja: Caja;
  delivery?: any;
}

@Component({
  selector: 'app-crear-delivery-dialog',
  templateUrl: './crear-delivery-dialog.component.html',
  styleUrls: ['./crear-delivery-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatTooltipModule,
  ],
})
export class CrearDeliveryDialogComponent implements OnInit, OnDestroy {
  @ViewChild('telefonoInput') telefonoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('nombreInput') nombreInput!: ElementRef<HTMLInputElement>;
  @ViewChild('direccionInput') direccionInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('precioSelect') precioSelect!: MatSelect;
  @ViewChild('observacionInput') observacionInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('confirmarBtn') confirmarBtn!: ElementRef<HTMLButtonElement>;
  @ViewChild(MatAutocompleteTrigger) autoTrigger!: MatAutocompleteTrigger;

  telefono = '';
  nombre = '';
  direccion = '';
  observacion = '';
  precioDeliveryId: number | null = null;
  cobroAnticipado = false;

  preciosDelivery: PrecioDelivery[] = [];
  clienteEncontrado: any = null;
  clientesSugeridos: any[] = [];
  buscando = false;
  processing = false;
  isEditMode = false;
  precioDeliveryOriginalId: number | null = null;

  private telefonoSubject = new Subject<string>();

  constructor(
    public dialogRef: MatDialogRef<CrearDeliveryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CrearDeliveryDialogData,
    private repositoryService: RepositoryService,
    private dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    const precios = await firstValueFrom(this.repositoryService.getPreciosDelivery());
    this.preciosDelivery = precios
      .filter((p: any) => p.activo)
      .sort((a: any, b: any) => Number(a.valor) - Number(b.valor));

    if (this.data.delivery) {
      this.isEditMode = true;
      const d = this.data.delivery;
      this.telefono = d.telefono || '';
      this.nombre = d.nombre || d.cliente?.persona?.nombre || '';
      this.direccion = d.direccion || '';
      this.observacion = d.observacion || '';
      this.precioDeliveryId = d.precioDelivery?.id || null;
      this.precioDeliveryOriginalId = this.precioDeliveryId;
      this.cobroAnticipado = d.cobroAnticipado || false;
      this.clienteEncontrado = d.cliente || null;
    } else {
      // Precio por defecto: el de menor valor (principal a futuro)
      if (this.preciosDelivery.length > 0) {
        this.precioDeliveryId = this.preciosDelivery[0].id;
      }
    }

    this.telefonoSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(async (tel) => {
      if (tel.length >= 3) {
        this.buscando = true;
        try {
          this.clientesSugeridos = await firstValueFrom(this.repositoryService.buscarClientesPorTelefono(tel)) || [];
          if (this.clientesSugeridos.length === 1 && this.clientesSugeridos[0].persona?.telefono === tel) {
            this.seleccionarCliente(this.clientesSugeridos[0]);
          }
        } catch (e) {
          this.clientesSugeridos = [];
        } finally {
          this.buscando = false;
        }
      } else {
        this.clientesSugeridos = [];
        this.clienteEncontrado = null;
      }
    });
  }

  ngOnDestroy(): void {
    this.telefonoSubject.complete();
  }

  onTelefonoChange(): void {
    this.clienteEncontrado = null;
    this.telefonoSubject.next(this.telefono);
  }

  onEnterTelefono(event: Event): void {
    event.preventDefault();
    // Cerrar autocomplete si está abierto
    if (this.autoTrigger?.panelOpen) {
      this.autoTrigger.closePanel();
    }
    this.clientesSugeridos = [];
    // Navegar al siguiente campo
    setTimeout(() => this.nombreInput?.nativeElement?.focus(), 50);
  }

  onAutoCompleteSelected(event: any): void {
    this.seleccionarCliente(event.option.value);
    // Navegar al siguiente campo después de seleccionar
    setTimeout(() => this.nombreInput?.nativeElement?.focus(), 50);
  }

  seleccionarCliente(cliente: any): void {
    this.clienteEncontrado = cliente;
    this.telefono = cliente.persona?.telefono || this.telefono;
    this.nombre = cliente.persona?.nombre || '';
    this.direccion = cliente.persona?.direccion || '';
    this.clientesSugeridos = [];
  }

  focusDireccion(): void {
    this.direccionInput?.nativeElement?.focus();
  }

  focusPrecio(): void {
    this.precioSelect?.focus();
    setTimeout(() => this.precioSelect?.open(), 50);
  }

  focusObservacion(): void {
    this.observacionInput?.nativeElement?.focus();
  }

  focusConfirmar(): void {
    this.confirmarBtn?.nativeElement?.focus();
  }

  abrirBuscarCliente(): void {
    const dialogRef = this.dialog.open(BuscarClienteDialogComponent, {
      width: '600px',
      maxHeight: '80vh',
    });

    dialogRef.afterClosed().subscribe((cliente: any) => {
      if (cliente) {
        this.seleccionarCliente(cliente);
      }
    });
  }

  get canConfirm(): boolean {
    return this.telefono.length >= 4 && !this.processing;
  }

  async confirmar(): Promise<void> {
    if (!this.canConfirm) return;
    this.processing = true;

    try {
      let cliente = this.clienteEncontrado;
      if (!cliente) {
        cliente = await firstValueFrom(this.repositoryService.crearClienteRapido({
          telefono: this.telefono,
          nombre: this.nombre || undefined,
          direccion: this.direccion || undefined,
        }));
      }

      if (this.isEditMode) {
        const updateData: any = {
          nombre: (this.nombre || cliente?.persona?.nombre || '').toUpperCase(),
          telefono: this.telefono,
          direccion: this.direccion.toUpperCase() || undefined,
          observacion: this.observacion.toUpperCase() || undefined,
          cobroAnticipado: this.cobroAnticipado,
          cliente,
        };

        if (this.precioDeliveryId !== this.precioDeliveryOriginalId) {
          updateData.precioDelivery = this.precioDeliveryId ? { id: this.precioDeliveryId } : null;
        }

        await firstValueFrom(this.repositoryService.updateDelivery(this.data.delivery.id, updateData));
        this.dialogRef.close({ edited: true });
      } else {
        const deliveryData: Partial<Delivery> = {
          cliente,
          nombre: (this.nombre || cliente?.persona?.nombre || '').toUpperCase(),
          telefono: this.telefono,
          direccion: this.direccion.toUpperCase() || undefined,
          observacion: this.observacion.toUpperCase() || undefined,
          estado: DeliveryEstado.ABIERTO,
          fechaAbierto: new Date(),
          cobroAnticipado: this.cobroAnticipado,
        };

        if (this.precioDeliveryId) {
          deliveryData.precioDelivery = { id: this.precioDeliveryId } as any;
        }

        const delivery = await firstValueFrom(this.repositoryService.createDelivery(deliveryData));

        const ventaData: Partial<Venta> = {
          estado: VentaEstado.ABIERTA,
          caja: this.data.caja,
          delivery,
          nombreCliente: deliveryData.nombre,
        };
        const venta = await firstValueFrom(this.repositoryService.createVenta(ventaData));

        this.dialogRef.close({ delivery, venta });
      }
    } catch (error) {
      console.error('Error en delivery:', error);
      this.processing = false;
    }
  }

  get precioDeliveryCambio(): boolean {
    return this.isEditMode && this.precioDeliveryId !== this.precioDeliveryOriginalId;
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
