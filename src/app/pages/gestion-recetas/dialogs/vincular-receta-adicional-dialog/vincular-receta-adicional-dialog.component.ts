import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { RepositoryService } from '../../../../database/repository.service';
import { Adicional } from '../../../../database/entities/productos/adicional.entity';
import { RecetaAdicionalVinculacion } from '../../../../database/entities/productos/receta-adicional-vinculacion.entity';
import { Receta } from '../../../../database/entities/productos/receta.entity';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateEditAdicionalDialogComponent } from '../create-edit-adicional-dialog/create-edit-adicional-dialog.component';

export interface VincularRecetaAdicionalDialogData {
  receta: Receta;
  adicional?: Adicional;
  precioActual?: number;
  cantidadActual?: number;
  unidadActual?: string;
  activo?: boolean;
  modo?: 'create' | 'edit';
  vinculacionId?: number;
}

@Component({
  selector: 'app-vincular-receta-adicional-dialog',
  templateUrl: './vincular-receta-adicional-dialog.component.html',
  styleUrls: ['./vincular-receta-adicional-dialog.component.scss']
})
export class VincularRecetaAdicionalDialogComponent implements OnInit {

  adicionalForm!: FormGroup;
  loading = false;
  isEditMode = false;

  // Propiedades para adicional seleccionado
  adicionalSeleccionado: Adicional | null = null;

  // Propiedades para templates (NO FUNCTION CALLS)
  adicionalNombre = '';
  adicionalPrecio = 0;
  adicionalEstado = false;
  hayAdicionalSeleccionado = false;

  // ✅ NUEVO: Propiedades para cantidad y unidad
  unidadesDisponibles = [
    { valor: 'GRAMOS', texto: 'Gramos', unidadBase: 'KILOGRAMO' },
    { valor: 'KILOGRAMOS', texto: 'Kilogramos', unidadBase: 'KILOGRAMO' },
    { valor: 'MILILITROS', texto: 'Mililitros', unidadBase: 'LITRO' },
    { valor: 'LITROS', texto: 'Litros', unidadBase: 'LITRO' },
    { valor: 'UNIDADES', texto: 'Unidades', unidadBase: 'UNIDAD' },
    { valor: 'PAQUETES', texto: 'Paquetes', unidadBase: 'PAQUETE' }
  ];

    // ✅ CORREGIDO: Propiedades computadas (NO getters)
  unidadReceta = 'UNIDADES';
  unidadesCompatibles: Array<{valor: string, texto: string, unidadBase: string}> = [];

  // Propiedades computadas para template
  cantidadFormateada = '';
  unidadSeleccionada = '';
  unidadesFiltradas: Array<{valor: string, texto: string, unidadBase: string}> = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<VincularRecetaAdicionalDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VincularRecetaAdicionalDialogData,
    private repositoryService: RepositoryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
    this.actualizarPropiedadesTemplate();
  }

  private checkEditMode(): void {
    // Verificar si estamos en modo edición
    if (this.data.modo === 'edit' && this.data.adicional) {
      this.isEditMode = true;

      // ✅ NUEVO: Cargar el adicional completo desde el backend
      this.loading = true;
      this.repositoryService.getAdicional(this.data.adicional.id || 0).subscribe({
                next: (adicionalCompleto: Adicional) => {
          this.adicionalSeleccionado = adicionalCompleto;

          // Cargar datos existentes
          this.adicionalForm.patchValue({
            nombre: adicionalCompleto.nombre,
            precioAdicional: this.data.precioActual || adicionalCompleto.precioBase,
            sinPrecio: (this.data.precioActual || 0) === 0,
            cantidad: this.data.cantidadActual || 1,
            unidad: this.data.unidadActual || 'UNIDADES', // ✅ Se actualizará después
            activo: this.data.activo !== undefined ? this.data.activo : adicionalCompleto.activo
          });

          this.actualizarPropiedadesTemplate();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error cargando adicional en modo edición:', error);
          this.snackBar.open('Error al cargar información del adicional', 'Cerrar', { duration: 3000 });
          this.loading = false;
        }
      });
    }
  }

  initForm(): void {
    this.adicionalForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      precioAdicional: [0, [Validators.required, Validators.min(0)]],
      sinPrecio: [false],
      // ✅ NUEVO: Campos de cantidad y unidad
      cantidad: [1, [Validators.required, Validators.min(0.01)]],
      unidad: ['UNIDADES', [Validators.required]], // ✅ Se actualizará después
      activo: [true]
    });

    // Suscribirse a cambios en sinPrecio para controlar precioAdicional
    this.adicionalForm.get('sinPrecio')?.valueChanges.subscribe(sinPrecio => {
      const precioControl = this.adicionalForm.get('precioAdicional');
      if (sinPrecio) {
        precioControl?.setValue(0);
        precioControl?.disable();
      } else {
        precioControl?.enable();
      }
    });

    // ✅ NUEVO: Suscribirse a cambios en cantidad para actualizar propiedades
    this.adicionalForm.get('cantidad')?.valueChanges.subscribe(() => {
      this.actualizarCantidadFormateada();
    });

    this.adicionalForm.get('unidad')?.valueChanges.subscribe(() => {
      this.actualizarCantidadFormateada();
    });
  }

  // Método para abrir el diálogo de búsqueda de adicionales
  openAdicionalSearch(): void {
    const dialogRef = this.dialog.open(CreateEditAdicionalDialogComponent, {
      width: '900px',
      data: {
        recetaId: this.data.receta.id,
        mode: 'select'
      }
    });

        dialogRef.afterClosed().subscribe((selectedAdicional: Adicional) => {
      if (selectedAdicional) {
        this.onAdicionalSeleccionado(selectedAdicional);
      }
    });
  }

  private onAdicionalSeleccionado(adicional: Adicional): void {
    // ✅ NUEVO: Buscar el adicional completo en el backend
    this.loading = true;
    this.repositoryService.getAdicional(adicional.id || 0).subscribe({
            next: (adicionalCompleto: Adicional) => {
        this.adicionalSeleccionado = adicionalCompleto;

                 this.adicionalForm.patchValue({
           nombre: adicionalCompleto.nombre,
           precioAdicional: adicionalCompleto.precioBase,
           sinPrecio: false,
           cantidad: 1, // Valor por defecto
           unidad: 'UNIDADES', // ✅ Se actualizará después
           activo: adicionalCompleto.activo
         });

        this.actualizarPropiedadesTemplate();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando adicional completo:', error);
        this.snackBar.open('Error al cargar información del adicional', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.adicionalForm.valid && this.adicionalSeleccionado) {
      this.loading = true;

      // Obtener valores del formulario
      const formValues = this.adicionalForm.value;
      const precioAdicional = formValues.sinPrecio ? 0 : formValues.precioAdicional;

      if (this.isEditMode) {
        // Modo edición - actualizar vinculación existente
        // En este caso, necesitamos el ID de la vinculación existente
        // Por ahora, retornamos los datos para que el componente padre maneje la actualización
        const datosActualizados = {
          precioAdicional: precioAdicional,
          cantidad: formValues.cantidad,
          unidad: formValues.unidad,
          activo: formValues.activo,
          vinculacionId: this.data.vinculacionId
        };

        this.loading = false;
        this.dialogRef.close(datosActualizados);
      } else {
        // Modo creación - crear nueva vinculación
        const vinculacionData = {
          precioAdicional: precioAdicional,
          cantidad: formValues.cantidad,
          unidad: formValues.unidad,
          activo: formValues.activo,
          recetaId: this.data.receta.id,
          adicionalId: this.adicionalSeleccionado.id
        };

        this.repositoryService.createRecetaAdicionalVinculacion(vinculacionData).subscribe({
          next: (nuevaVinculacion: RecetaAdicionalVinculacion) => {
            this.loading = false;
            this.snackBar.open('Adicional vinculado correctamente', 'Cerrar', { duration: 2000 });
            this.dialogRef.close(nuevaVinculacion);
          },
          error: (error: Error) => {
            this.loading = false;
            console.error('Error vinculando adicional:', error);
            this.snackBar.open('Error al vincular adicional', 'Cerrar', { duration: 3000 });
          }
        });
      }
    } else {
      this.snackBar.open('Debe completar todos los campos requeridos', 'Cerrar', { duration: 3000 });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onCambiarAdicional(): void {
    // Solo permitir cambiar adicional en modo creación
    if (this.isEditMode) {
      return;
    }

    this.adicionalSeleccionado = null;
    this.adicionalForm.patchValue({
      nombre: '',
      precioAdicional: 0,
      sinPrecio: false,
      cantidad: 1,
      unidad: 'UNIDADES', // ✅ Se actualizará después
      activo: true
    });
    this.actualizarPropiedadesTemplate();
  }

        private actualizarPropiedadesTemplate(): void {
    // ✅ CORREGIDO: Actualizar unidadReceta como propiedad
    this.calcularUnidadReceta();

    this.adicionalNombre = this.adicionalSeleccionado?.nombre || '';
    this.adicionalPrecio = this.adicionalSeleccionado?.precioBase || 0;
    this.adicionalEstado = this.adicionalSeleccionado?.activo || false;
    this.hayAdicionalSeleccionado = this.adicionalSeleccionado !== null;

    // ✅ CORREGIDO: Filtrar unidades compatibles con la receta
    this.calcularUnidadesCompatibles();
    this.unidadesFiltradas = this.unidadesCompatibles;

    // ✅ NUEVO: Actualizar cantidad formateada
    this.actualizarCantidadFormateada();

    // ✅ NUEVO: Actualizar el formulario con la unidad correcta (sin disparar eventos)
    const currentUnidad = this.adicionalForm.get('unidad')?.value;
    if (!currentUnidad || currentUnidad === 'UNIDADES') {
      this.adicionalForm.patchValue({ unidad: this.unidadReceta }, { emitEvent: false });
    }
  }

  // ✅ NUEVO: Método separado para actualizar cantidad formateada
  private actualizarCantidadFormateada(): void {
    const cantidad = this.adicionalForm.get('cantidad')?.value || 0;
    const unidad = this.adicionalForm.get('unidad')?.value || 'UNIDADES';

    this.cantidadFormateada = `${cantidad} ${unidad}`;
    this.unidadSeleccionada = unidad;
  }

  // ✅ NUEVO: Método para calcular unidad de la receta
  private calcularUnidadReceta(): void {
    // Si hay un adicional seleccionado, usar su receta
    if (this.adicionalSeleccionado?.receta) {
      this.unidadReceta = this.adicionalSeleccionado.receta.unidadRendimiento || 'UNIDADES';
    } else {
      // Fallback a la receta pasada en los datos
      this.unidadReceta = this.data.receta.unidadRendimiento || 'UNIDADES';
    }
  }

  // ✅ NUEVO: Método para calcular unidades compatibles
  private calcularUnidadesCompatibles(): void {
    // Si la receta usa UNIDADES, mostrar todas las unidades
    if (this.unidadReceta === 'UNIDADES') {
      this.unidadesCompatibles = this.unidadesDisponibles;
      return;
    }

    // Si la receta usa una unidad específica, mostrar unidades compatibles
    const unidadBase = this.unidadesDisponibles.find(u => u.valor === this.unidadReceta)?.unidadBase;

    if (unidadBase) {
      this.unidadesCompatibles = this.unidadesDisponibles.filter(u => u.unidadBase === unidadBase);
    } else {
      // Fallback: mostrar todas las unidades
      this.unidadesCompatibles = this.unidadesDisponibles;
    }
  }
}
