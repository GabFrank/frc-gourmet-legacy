import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { firstValueFrom } from 'rxjs';

import { Producto } from '../../../database/entities/productos/producto.entity';
import { Presentacion } from '../../../database/entities/productos/presentacion.entity';
import { PdvConfig } from '../../../database/entities/ventas/pdv-config.entity';
import { RepositoryService } from '../../../database/repository.service';
import {
  PersonalizarProductoDialogComponent,
  PersonalizarProductoDialogData,
  PersonalizarProductoDialogResult
} from '../personalizar-producto-dialog/personalizar-producto-dialog.component';

interface VariacionLabels {
  size: string;
  variation: string;
  variations: string;
  portion: string;
}

export interface SeleccionarVariacionDialogData {
  producto: Producto;
  cantidad: number;
  pdvConfig: PdvConfig;
}

export interface SaborSeleccionado {
  recetaPresentacion: any;
  proporcion: number;
  personalizacion: PersonalizarProductoDialogResult | null;
}

export interface SeleccionarVariacionDialogResult {
  presentacion: Presentacion;
  sabores: SaborSeleccionado[];
  precioCalculado: number;
  costoCalculado: number;
  cantidad: number;
  personalizacionGeneral: PersonalizarProductoDialogResult | null;
  ensambladoDescripcion: string;
}

@Component({
  selector: 'app-seleccionar-variacion-dialog',
  templateUrl: './seleccionar-variacion-dialog.component.html',
  styleUrls: ['./seleccionar-variacion-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
  ],
})
export class SeleccionarVariacionDialogComponent implements OnInit {
  loading = true;
  labels: VariacionLabels = { size: 'PRESENTACION', variation: 'VARIACION', variations: 'VARIACIONES', portion: 'PORCION' };

  // Paso 1: Tamaños
  presentaciones: Presentacion[] = [];
  selectedPresentacion: Presentacion | null = null;

  // Paso 2: Sabores
  variacionesDisponibles: any[] = [];
  saboresSeleccionados: SaborSeleccionado[] = [];
  maxSabores = 2;

  // Paso 3: Resumen
  cantidad: number;
  personalizacionGeneral: PersonalizarProductoDialogResult | null = null;

  // Precios pre-computados
  precioCalculado = 0;
  costoCalculado = 0;
  estrategiaPrecio = 'MAYOR_PRECIO';
  precioRangoMin = 0;
  precioRangoMax = 0;

  // Stepper control
  pasoActual = 0;

  constructor(
    public dialogRef: MatDialogRef<SeleccionarVariacionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SeleccionarVariacionDialogData,
    private repositoryService: RepositoryService,
    private dialog: MatDialog
  ) {
    this.cantidad = data.cantidad || 1;
    this.maxSabores = data.pdvConfig?.pizzaMaxSabores || 2;
    this.estrategiaPrecio = data.pdvConfig?.pizzaEstrategiaPrecio || 'MAYOR_PRECIO';
  }

  async ngOnInit(): Promise<void> {
    try {
      // Cargar presentaciones del producto
      const producto = this.data.producto;
      this.presentaciones = (producto.presentaciones || []).filter((p: any) => p.activo);

      // Detectar labels según categoría del primer sabor
      if (producto.sabores && producto.sabores.length > 0) {
        const categoria = producto.sabores[0].categoria?.toUpperCase();
        if (categoria === 'PIZZA') {
          this.labels = { size: 'TAMAÑO', variation: 'SABOR', variations: 'SABORES', portion: 'MITAD' };
        }
      }

      // Si solo hay 1 presentación, auto-seleccionar
      if (this.presentaciones.length === 1) {
        await this.selectPresentacion(this.presentaciones[0]);
      }
    } catch (error) {
      console.error('Error initializing seleccionar-variacion-dialog:', error);
    } finally {
      this.loading = false;
    }
  }

  async selectPresentacion(presentacion: Presentacion): Promise<void> {
    this.selectedPresentacion = presentacion;
    this.saboresSeleccionados = [];
    this.personalizacionGeneral = null;
    this.recalcular();

    // Cargar variaciones para este tamaño
    try {
      this.variacionesDisponibles = await firstValueFrom(
        this.repositoryService.getVariacionesByProductoAndPresentacion(
          this.data.producto.id,
          presentacion.id
        )
      );

      // Calcular rango de precios
      const precios = this.variacionesDisponibles
        .map(v => this.getPrecioVariacion(v))
        .filter(p => p > 0);
      this.precioRangoMin = precios.length > 0 ? Math.min(...precios) : 0;
      this.precioRangoMax = precios.length > 0 ? Math.max(...precios) : 0;

      // Avanzar al paso 2
      this.pasoActual = 1;
    } catch (error) {
      console.error('Error loading variaciones:', error);
    }
  }

  getPrecioVariacion(variacion: any): number {
    const precioVenta = variacion.preciosVenta?.find((p: any) => p.principal && p.activo);
    return precioVenta ? Number(precioVenta.valor) : 0;
  }

  isSaborDisponible(variacion: any): boolean {
    return this.getPrecioVariacion(variacion) > 0;
  }

  isSaborSeleccionado(variacion: any): boolean {
    return this.saboresSeleccionados.some(s => s.recetaPresentacion.id === variacion.id);
  }

  toggleSabor(variacion: any): void {
    if (!this.isSaborDisponible(variacion)) return;

    const index = this.saboresSeleccionados.findIndex(s => s.recetaPresentacion.id === variacion.id);

    if (index >= 0) {
      // Deseleccionar
      this.saboresSeleccionados.splice(index, 1);
    } else {
      // Verificar máximo
      if (this.saboresSeleccionados.length >= this.maxSabores) return;

      // Verificar si es el mismo sabor repetido
      const saborId = variacion.sabor?.id;
      const yaExiste = this.saboresSeleccionados.some(
        s => s.recetaPresentacion.sabor?.id === saborId
      );
      if (yaExiste) {
        // Auto-consolidar: ya existe este sabor, no agregar duplicado
        return;
      }

      this.saboresSeleccionados.push({
        recetaPresentacion: variacion,
        proporcion: 1, // Se recalcula abajo
        personalizacion: null
      });
    }

    // Recalcular proporciones
    this.recalcularProporciones();
    this.recalcular();
  }

  private recalcularProporciones(): void {
    const count = this.saboresSeleccionados.length;
    if (count === 0) return;
    const proporcion = count === 1 ? 1 : Number((1 / count).toFixed(4));
    for (const sabor of this.saboresSeleccionados) {
      sabor.proporcion = proporcion;
    }
  }

  async personalizarSabor(sabor: SaborSeleccionado): Promise<void> {
    const receta = sabor.recetaPresentacion.receta;
    if (!receta) return;

    const dialogData: PersonalizarProductoDialogData = {
      producto: this.data.producto,
      presentacion: this.selectedPresentacion!,
      precioVenta: sabor.recetaPresentacion.preciosVenta?.find((p: any) => p.principal) || { valor: 0 },
      cantidad: 1,
      recetaId: receta.id,
      modoEdicion: !!sabor.personalizacion,
      ingredientesRemovidos: sabor.personalizacion?.ingredientesRemovidos,
      ingredientesIntercambiados: sabor.personalizacion?.ingredientesIntercambiados,
      adicionalesSeleccionados: sabor.personalizacion?.adicionalesSeleccionados?.map(a => a.adicionalId),
      observacionIds: sabor.personalizacion?.observacionIds,
      observacionLibre: sabor.personalizacion?.observacionLibre || undefined,
    };

    const dialogRef = this.dialog.open(PersonalizarProductoDialogComponent, {
      data: dialogData,
      width: '700px',
      maxHeight: '85vh',
      disableClose: false,
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      sabor.personalizacion = result;
      this.recalcular();
    }
  }

  async personalizarGeneral(): Promise<void> {
    // Usar la receta del primer sabor para cargar adicionales y observaciones
    const primerSabor = this.saboresSeleccionados[0];
    if (!primerSabor) return;

    const receta = primerSabor.recetaPresentacion.receta;
    if (!receta) return;

    const dialogData: PersonalizarProductoDialogData = {
      producto: this.data.producto,
      presentacion: this.selectedPresentacion!,
      precioVenta: { valor: this.precioCalculado } as any,
      cantidad: 1,
      recetaId: receta.id,
      modoEdicion: !!this.personalizacionGeneral,
      adicionalesSeleccionados: this.personalizacionGeneral?.adicionalesSeleccionados?.map(a => a.adicionalId),
      observacionIds: this.personalizacionGeneral?.observacionIds,
      observacionLibre: this.personalizacionGeneral?.observacionLibre || undefined,
    };

    const dialogRef = this.dialog.open(PersonalizarProductoDialogComponent, {
      data: dialogData,
      width: '700px',
      maxHeight: '85vh',
      disableClose: false,
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      this.personalizacionGeneral = result;
      this.recalcular();
    }
  }

  recalcular(): void {
    if (this.saboresSeleccionados.length === 0) {
      this.precioCalculado = 0;
      this.costoCalculado = 0;
      return;
    }

    // Calcular precio según estrategia
    const precios = this.saboresSeleccionados.map(s => this.getPrecioVariacion(s.recetaPresentacion));

    switch (this.estrategiaPrecio) {
      case 'PROMEDIO':
        this.precioCalculado = precios.reduce((a, b) => a + b, 0) / precios.length;
        break;
      case 'MAYOR_PRECIO':
      default:
        this.precioCalculado = Math.max(...precios);
        break;
    }

    // Costo siempre proporcional
    this.costoCalculado = this.saboresSeleccionados.reduce((total, s) => {
      return total + (Number(s.recetaPresentacion.costo_calculado) || 0) * s.proporcion;
    }, 0);

    // Sumar adicionales de personalizaciones por sabor
    let totalAdicionales = 0;
    for (const sabor of this.saboresSeleccionados) {
      if (sabor.personalizacion) {
        totalAdicionales += sabor.personalizacion.precioAdicionalTotal * sabor.proporcion;
      }
    }
    // Sumar adicionales generales
    if (this.personalizacionGeneral) {
      totalAdicionales += this.personalizacionGeneral.precioAdicionalTotal;
    }

    this.precioCalculado += totalAdicionales;
  }

  generarDescripcion(): string {
    if (!this.selectedPresentacion || this.saboresSeleccionados.length === 0) return '';

    const productoNombre = this.data.producto.nombre;
    const presentacionNombre = this.selectedPresentacion.nombre;

    if (this.saboresSeleccionados.length === 1) {
      const saborNombre = this.saboresSeleccionados[0].recetaPresentacion.sabor?.nombre || '';
      return `${productoNombre} ${presentacionNombre} ${saborNombre}`.toUpperCase();
    }

    const saboresTexto = this.saboresSeleccionados
      .map(s => {
        const fraccion = this.saboresSeleccionados.length === 2 ? '1/2' :
                         this.saboresSeleccionados.length === 3 ? '1/3' : `1/${this.saboresSeleccionados.length}`;
        return `${fraccion} ${s.recetaPresentacion.sabor?.nombre || ''}`;
      })
      .join(' + ');

    return `${productoNombre} ${presentacionNombre} ${saboresTexto}`.toUpperCase();
  }

  tienePersonalizacion(sabor: SaborSeleccionado): boolean {
    if (!sabor.personalizacion) return false;
    const p = sabor.personalizacion;
    return p.ingredientesRemovidos.length > 0 ||
           p.ingredientesIntercambiados.length > 0 ||
           p.adicionalesSeleccionados.length > 0 ||
           p.observacionIds.length > 0 ||
           !!p.observacionLibre;
  }

  get precioTotal(): number {
    return this.precioCalculado * this.cantidad;
  }

  incrementarCantidad(): void {
    this.cantidad++;
  }

  decrementarCantidad(): void {
    if (this.cantidad > 1) this.cantidad--;
  }

  irAPaso(paso: number): void {
    this.pasoActual = paso;
  }

  confirmar(): void {
    if (!this.selectedPresentacion || this.saboresSeleccionados.length === 0) return;

    const result: SeleccionarVariacionDialogResult = {
      presentacion: this.selectedPresentacion,
      sabores: this.saboresSeleccionados,
      precioCalculado: this.precioCalculado,
      costoCalculado: this.costoCalculado,
      cantidad: this.cantidad,
      personalizacionGeneral: this.personalizacionGeneral,
      ensambladoDescripcion: this.generarDescripcion(),
    };

    this.dialogRef.close(result);
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
