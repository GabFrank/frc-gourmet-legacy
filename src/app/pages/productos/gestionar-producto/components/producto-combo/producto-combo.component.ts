import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RepositoryService } from 'src/app/database/repository.service';
import { GestionarProductoService } from '../../services/gestionar-producto.service';
import { ConfirmationDialogComponent } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { Producto } from 'src/app/database/entities/productos/producto.entity';
import { Presentacion } from 'src/app/database/entities/productos/presentacion.entity';
import { PrecioVenta } from 'src/app/database/entities/productos/precio-venta.entity';

@Component({
  selector: 'app-producto-combo',
  templateUrl: './producto-combo.component.html',
  styleUrls: ['./producto-combo.component.scss']
})
export class ProductoComboComponent implements OnInit, OnDestroy {

  productoId: number | null = null;
  combo: any = null;
  comboProductos: any[] = [];
  isLoading = false;

  // Form
  mostrarFormAgregar = false;
  isEditing = false;
  editingComboProductoId: number | null = null;
  comboProductoForm!: FormGroup;

  // Autocomplete
  productoSearchControl = new FormControl('');
  filteredProductos: Observable<Producto[]> = of([]);
  todosProductos: Producto[] = [];
  productoSeleccionado: Producto | null = null;

  // Presentaciones del producto seleccionado
  presentacionesDisponibles: Presentacion[] = [];
  requierePresentacion = false;

  // Table
  displayedColumns: string[] = ['producto', 'cantidad', 'costo', 'precioVenta', 'esOpcional', 'acciones'];

  // Summary
  costoTotal = 0;
  precioVentaSugerido = 0;
  precioVentaPrincipal = 0;
  margenPorcentaje = 0;
  cmvPorcentaje = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private repository: RepositoryService,
    private productoService: GestionarProductoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.productoService.productoId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(productoId => {
        if (productoId) {
          this.productoId = productoId;
          this.loadComboData();
        }
      });

    this.filteredProductos = this.productoSearchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => this.filterProductos(value || ''))
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  displayProducto(producto: Producto): string {
    return producto ? producto.nombre : '';
  }

  onProductoSelected(producto: Producto): void {
    this.productoSeleccionado = producto;
    this.comboProductoForm.patchValue({ productoId: producto.id, presentacionId: null });
    this.loadPresentaciones(producto.id);
  }

  private loadPresentaciones(productoId: number): void {
    this.repository.getPresentacionesByProducto(productoId, 0, 100, 'activos').subscribe({
      next: (result) => {
        const presentaciones = result.data || result;
        this.presentacionesDisponibles = Array.isArray(presentaciones) ? presentaciones.filter((p: Presentacion) => p.activo) : [];
        this.requierePresentacion = this.presentacionesDisponibles.length > 0;

        if (this.requierePresentacion) {
          this.comboProductoForm.get('presentacionId')?.setValidators(Validators.required);
          // Auto-select if only one presentacion
          if (this.presentacionesDisponibles.length === 1) {
            this.comboProductoForm.patchValue({ presentacionId: this.presentacionesDisponibles[0].id });
          }
        } else {
          this.comboProductoForm.get('presentacionId')?.clearValidators();
        }
        this.comboProductoForm.get('presentacionId')?.updateValueAndValidity();
      },
      error: (error) => {
        console.error('Error loading presentaciones:', error);
        this.presentacionesDisponibles = [];
        this.requierePresentacion = false;
      }
    });
  }

  private filterProductos(value: string): Observable<Producto[]> {
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    const idsEnCombo = this.comboProductos.map(cp => cp.producto?.id);
    const disponibles = this.todosProductos.filter(
      p => p.id !== this.productoId && p.activo && !idsEnCombo.includes(p.id)
    );

    if (!filterValue) {
      return of(disponibles);
    }

    return of(disponibles.filter(p =>
      p.nombre?.toLowerCase().includes(filterValue)
    ));
  }

  private initForm(): void {
    this.comboProductoForm = this.fb.group({
      productoId: [null, Validators.required],
      presentacionId: [null],
      cantidad: [1, [Validators.required, Validators.min(0.01)]],
      esOpcional: [false]
    });
  }

  private loadComboData(): void {
    if (!this.productoId) return;
    this.isLoading = true;

    this.loadPrecioVentaPrincipal();

    this.repository.getComboByProducto(this.productoId).subscribe({
      next: (combo) => {
        if (combo) {
          this.combo = combo;
          this.comboProductos = (combo.productos || []).filter((cp: any) => cp.activo);
          this.calculateSummary();
          this.loadTodosProductos();
          this.isLoading = false;
        } else {
          this.autoCreateCombo();
        }
      },
      error: (error) => {
        console.error('Error loading combo:', error);
        this.snackBar.open('Error al cargar combo', 'CERRAR', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  private loadPrecioVentaPrincipal(): void {
    if (!this.productoId) return;
    this.repository.getPreciosVentaByProducto(this.productoId, true).subscribe({
      next: (precios) => {
        const principal = precios.find((pv: PrecioVenta) => pv.principal);
        this.precioVentaPrincipal = principal ? Number(principal.valor) : 0;
        this.calculateSummary();
      },
      error: () => {
        this.precioVentaPrincipal = 0;
      }
    });
  }

  private autoCreateCombo(): void {
    if (!this.productoId) return;

    this.repository.createCombo({
      nombre: 'COMBO',
      productoId: this.productoId
    }).subscribe({
      next: (combo) => {
        this.combo = combo;
        this.comboProductos = [];
        this.calculateSummary();
        this.loadTodosProductos();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating combo:', error);
        this.snackBar.open('Error al crear combo', 'CERRAR', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  private loadTodosProductos(): void {
    this.repository.getProductos().subscribe({
      next: (productos) => {
        this.todosProductos = productos;
      },
      error: (error) => {
        console.error('Error loading productos:', error);
      }
    });
  }

  getCosto(cp: any): number {
    // 1. costoCalculado from receta (elaborados)
    if (cp.producto?.costoCalculado) {
      return Number(cp.producto.costoCalculado);
    }
    // 2. Direct preciosCosto
    const preciosCosto = cp.producto?.preciosCosto;
    if (!preciosCosto || preciosCosto.length === 0) return 0;
    const activos = preciosCosto.filter((pc: any) => pc.activo !== false);
    if (activos.length === 0) return 0;
    return activos[activos.length - 1].valor || 0;
  }

  getPrecioVenta(cp: any): number {
    const preciosVenta = cp.producto?.preciosVenta;
    if (!preciosVenta || preciosVenta.length === 0) return 0;
    const principal = preciosVenta.find((pv: any) => pv.principal);
    return principal ? principal.valor : preciosVenta[0].valor || 0;
  }

  getDisplayNombre(cp: any): string {
    const nombre = cp.producto?.nombre || '';
    if (cp.presentacion?.nombre) {
      return `${nombre} (${cp.presentacion.nombre})`;
    }
    return nombre;
  }

  private calculateSummary(): void {
    this.costoTotal = 0;
    this.precioVentaSugerido = 0;

    for (const cp of this.comboProductos) {
      const cantidad = Number(cp.cantidad) || 0;
      this.costoTotal += this.getCosto(cp) * cantidad;
      this.precioVentaSugerido += this.getPrecioVenta(cp) * cantidad;
    }

    const precioRef = this.precioVentaPrincipal > 0 ? this.precioVentaPrincipal : this.precioVentaSugerido;
    if (precioRef > 0) {
      this.cmvPorcentaje = (this.costoTotal / precioRef) * 100;
      this.margenPorcentaje = ((precioRef - this.costoTotal) / precioRef) * 100;
    } else {
      this.cmvPorcentaje = 0;
      this.margenPorcentaje = 0;
    }
  }

  toggleFormAgregar(): void {
    this.mostrarFormAgregar = !this.mostrarFormAgregar;
    if (!this.mostrarFormAgregar) {
      this.resetForm();
    }
  }

  agregarProducto(): void {
    if (this.comboProductoForm.invalid || !this.combo || !this.productoSeleccionado) {
      this.comboProductoForm.markAllAsTouched();
      return;
    }

    const formValue = this.comboProductoForm.value;

    this.repository.createComboProducto({
      comboId: this.combo.id,
      productoId: formValue.productoId,
      presentacionId: formValue.presentacionId || null,
      cantidad: formValue.cantidad,
      esOpcional: formValue.esOpcional
    }).subscribe({
      next: () => {
        this.snackBar.open('Producto agregado al combo', 'CERRAR', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.resetForm();
        this.mostrarFormAgregar = false;
        this.loadComboData();
      },
      error: (error) => {
        console.error('Error adding producto to combo:', error);
        this.snackBar.open('Error al agregar producto', 'CERRAR', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  editarComboProducto(cp: any): void {
    this.isEditing = true;
    this.editingComboProductoId = cp.id;
    this.mostrarFormAgregar = true;
    this.productoSeleccionado = cp.producto;
    this.productoSearchControl.setValue(cp.producto);
    this.comboProductoForm.patchValue({
      productoId: cp.producto?.id,
      cantidad: cp.cantidad,
      esOpcional: cp.esOpcional
    });
    // Load presentaciones for this product, then set the selected one
    if (cp.producto?.id) {
      this.repository.getPresentacionesByProducto(cp.producto.id, 0, 100, 'activos').subscribe({
        next: (result) => {
          const presentaciones = result.data || result;
          this.presentacionesDisponibles = Array.isArray(presentaciones) ? presentaciones.filter((p: Presentacion) => p.activo) : [];
          this.requierePresentacion = this.presentacionesDisponibles.length > 0;
          if (this.requierePresentacion) {
            this.comboProductoForm.get('presentacionId')?.setValidators(Validators.required);
          } else {
            this.comboProductoForm.get('presentacionId')?.clearValidators();
          }
          this.comboProductoForm.get('presentacionId')?.updateValueAndValidity();
          // Set the currently selected presentacion
          if (cp.presentacion?.id) {
            this.comboProductoForm.patchValue({ presentacionId: cp.presentacion.id });
          }
        }
      });
    }
  }

  actualizarComboProducto(): void {
    if (this.comboProductoForm.invalid || !this.editingComboProductoId) {
      this.comboProductoForm.markAllAsTouched();
      return;
    }

    const formValue = this.comboProductoForm.value;

    this.repository.updateComboProducto(this.editingComboProductoId, {
      cantidad: formValue.cantidad,
      esOpcional: formValue.esOpcional,
      presentacionId: formValue.presentacionId || null
    }).subscribe({
      next: () => {
        this.snackBar.open('Producto actualizado', 'CERRAR', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.resetForm();
        this.mostrarFormAgregar = false;
        this.loadComboData();
      },
      error: (error) => {
        console.error('Error updating combo producto:', error);
        this.snackBar.open('Error al actualizar producto', 'CERRAR', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  eliminarComboProducto(cp: any): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'CONFIRMAR ELIMINACIÓN',
        message: `¿Está seguro que desea eliminar "${this.getDisplayNombre(cp)}" del combo?`,
        confirmText: 'ELIMINAR',
        cancelText: 'CANCELAR'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && cp.id) {
        this.repository.deleteComboProducto(cp.id).subscribe({
          next: () => {
            this.snackBar.open('Producto eliminado del combo', 'CERRAR', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadComboData();
          },
          error: (error) => {
            console.error('Error deleting combo producto:', error);
            this.snackBar.open('Error al eliminar producto', 'CERRAR', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  guardarOActualizar(): void {
    if (this.isEditing) {
      this.actualizarComboProducto();
    } else {
      this.agregarProducto();
    }
  }

  cancelarEdicion(): void {
    this.resetForm();
    this.mostrarFormAgregar = false;
  }

  private resetForm(): void {
    this.comboProductoForm.reset({ productoId: null, presentacionId: null, cantidad: 1, esOpcional: false });
    this.productoSearchControl.setValue('');
    this.productoSeleccionado = null;
    this.presentacionesDisponibles = [];
    this.requierePresentacion = false;
    this.isEditing = false;
    this.editingComboProductoId = null;
  }
}
