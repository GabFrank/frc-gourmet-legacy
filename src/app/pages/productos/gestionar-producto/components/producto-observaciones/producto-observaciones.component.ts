import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RepositoryService } from 'src/app/database/repository.service';
import { GestionarProductoService } from '../../services/gestionar-producto.service';
import { ConfirmationDialogComponent } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { Observacion } from 'src/app/database/entities/productos/observacion.entity';
import { ProductoObservacion } from 'src/app/database/entities/productos/producto-observacion.entity';

@Component({
  selector: 'app-producto-observaciones',
  templateUrl: './producto-observaciones.component.html',
  styleUrls: ['./producto-observaciones.component.scss']
})
export class ProductoObservacionesComponent implements OnInit, OnDestroy {

  productoId: number | null = null;
  isLoading = false;

  // Observaciones vinculadas al producto
  productoObservaciones: ProductoObservacion[] = [];

  // Autocomplete
  observacionSearchControl = new FormControl('');
  filteredObservaciones: Observable<Observacion[]> = of([]);
  observacionSeleccionada: Observacion | null = null;

  // IDs ya vinculadas (para excluir del autocomplete)
  private idsVinculadas: number[] = [];

  // Formulario para crear nueva observación
  nuevaObservacionForm!: FormGroup;
  mostrarFormularioNueva = false;

  // Columnas de la tabla
  displayedColumns: string[] = ['descripcion', 'acciones'];

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
          this.loadData();
        }
      });

    this.filteredObservaciones = this.observacionSearchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        const searchText = typeof value === 'string' ? value : '';
        return this.repository.searchObservaciones(searchText);
      }),
      switchMap(observaciones => {
        const disponibles = observaciones.filter(o => !this.idsVinculadas.includes(o.id));
        return of(disponibles);
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  displayObservacion(obs: Observacion): string {
    return obs ? obs.descripcion : '';
  }

  onObservacionSelected(obs: Observacion): void {
    this.observacionSeleccionada = obs;
  }

  private initForm(): void {
    this.nuevaObservacionForm = this.fb.group({
      descripcion: ['', [Validators.required, Validators.maxLength(255)]]
    });
  }

  private loadData(): void {
    if (!this.productoId) return;
    this.isLoading = true;

    this.repository.getObservacionesByProducto(this.productoId).subscribe({
      next: (productoObs) => {
        this.productoObservaciones = productoObs;
        this.idsVinculadas = productoObs.map(po => po.observacion?.id).filter((id): id is number => !!id);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading producto observaciones:', error);
        this.snackBar.open('Error al cargar observaciones', 'CERRAR', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  vincularObservacion(): void {
    if (!this.observacionSeleccionada || !this.productoId) return;

    this.repository.createProductoObservacion({
      producto: { id: this.productoId } as any,
      observacion: { id: this.observacionSeleccionada.id } as any,
      activo: true
    }).subscribe({
      next: () => {
        this.snackBar.open('Observación vinculada correctamente', 'CERRAR', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.observacionSeleccionada = null;
        this.observacionSearchControl.setValue('');
        this.loadData();
      },
      error: (error) => {
        console.error('Error vinculando observación:', error);
        this.snackBar.open('Error al vincular observación', 'CERRAR', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  desvincularObservacion(productoObservacion: ProductoObservacion): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'CONFIRMAR DESVINCULACIÓN',
        message: `¿Está seguro que desea desvincular la observación "${productoObservacion.observacion?.descripcion}"?`,
        confirmText: 'DESVINCULAR',
        cancelText: 'CANCELAR'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && productoObservacion.id) {
        this.repository.deleteProductoObservacion(productoObservacion.id).subscribe({
          next: () => {
            this.snackBar.open('Observación desvinculada correctamente', 'CERRAR', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadData();
          },
          error: (error) => {
            console.error('Error desvinculando observación:', error);
            this.snackBar.open('Error al desvincular observación', 'CERRAR', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  toggleFormularioNueva(): void {
    this.mostrarFormularioNueva = !this.mostrarFormularioNueva;
    if (!this.mostrarFormularioNueva) {
      this.nuevaObservacionForm.reset();
    }
  }

  crearYVincularObservacion(): void {
    if (this.nuevaObservacionForm.invalid || !this.productoId) {
      this.nuevaObservacionForm.markAllAsTouched();
      return;
    }

    const descripcion = this.nuevaObservacionForm.get('descripcion')?.value?.toUpperCase();

    this.repository.createObservacion({ descripcion, activo: true }).subscribe({
      next: (nuevaObservacion) => {
        this.repository.createProductoObservacion({
          producto: { id: this.productoId } as any,
          observacion: { id: nuevaObservacion.id } as any,
          activo: true
        }).subscribe({
          next: () => {
            this.snackBar.open('Observación creada y vinculada correctamente', 'CERRAR', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.nuevaObservacionForm.reset();
            this.mostrarFormularioNueva = false;
            this.loadData();
          },
          error: (error) => {
            console.error('Error vinculando nueva observación:', error);
            this.snackBar.open('Observación creada pero no se pudo vincular', 'CERRAR', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
            this.loadData();
          }
        });
      },
      error: (error) => {
        console.error('Error creando observación:', error);
        this.snackBar.open('Error al crear observación', 'CERRAR', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
