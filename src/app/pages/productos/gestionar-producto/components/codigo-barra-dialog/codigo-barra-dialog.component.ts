import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { RepositoryService } from '../../../../../database/repository.service';
import { CodigoBarra } from '../../../../../database/entities/productos/codigo-barra.entity';
import { Presentacion } from '../../../../../database/entities/productos/presentacion.entity';
import { ConfirmationDialogComponent } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

interface DialogData {
  presentacion: Presentacion;
}

@Component({
  selector: 'app-codigo-barra-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatTableModule,
    MatTooltipModule,
    MatMenuModule,
    MatCardModule,
    MatDividerModule,
    MatSelectModule,
    MatRadioModule,
    MatButtonToggleModule
  ],
  templateUrl: './codigo-barra-dialog.component.html',
  styleUrls: ['./codigo-barra-dialog.component.scss']
})
export class CodigoBarraDialogComponent implements OnInit {
  codigoForm: FormGroup;
  isLoading = false;
  isLoadingCodigos = false;
  dialogTitle: string;
  
  // Table properties
  codigos: CodigoBarra[] = [];
  codigoDataSource = new MatTableDataSource<CodigoBarra>();
  codigoDisplayedColumns: string[] = ['id', 'codigo', 'principal', 'activo', 'actions'];
  isAddingCodigo = false;
  editingCodigoId: number | null = null;
  
  // Filter properties
  codigoFilter: 'all' | 'active' | 'inactive' = 'all';
  
  // Track if changes were made
  private hasChanges = false;

  constructor(
    private fb: FormBuilder,
    private repositoryService: RepositoryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<CodigoBarraDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.dialogTitle = `GESTIONAR CÓDIGOS - ${this.data.presentacion.nombre}`;
    
    this.codigoForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.minLength(3)]],
      principal: [false],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.loadCodigos();
  }

  // Load codigos for the current presentacion
  loadCodigos(): void {
    if (this.data.presentacion?.id) {
      this.isLoadingCodigos = true;
      
      this.repositoryService.getCodigosBarraByPresentacion(this.data.presentacion.id).subscribe({
        next: (codigos) => {
          // Apply filter if needed
          if (this.codigoFilter === 'active') {
            this.codigos = codigos.filter(codigo => codigo.activo);
          } else if (this.codigoFilter === 'inactive') {
            this.codigos = codigos.filter(codigo => !codigo.activo);
          } else {
            this.codigos = codigos;
          }
          
          this.codigoDataSource.data = this.codigos;
          this.isLoadingCodigos = false;
        },
        error: (error) => {
          console.error('Error loading codigos:', error);
          this.snackBar.open('Error al cargar códigos de barras', 'CERRAR', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.isLoadingCodigos = false;
        }
      });
    }
  }

  // Apply codigo filter
  applyCodigoFilter(): void {
    this.loadCodigos(); // Reload with the new filter
  }

  // Change codigo filter
  onCodigoFilterChange(event: any): void {
    this.codigoFilter = event.value;
    this.applyCodigoFilter();
  }

  // Start adding a new codigo
  startAddingCodigo(): void {
    this.isAddingCodigo = true;
    this.editingCodigoId = null;
    this.codigoForm.reset({
      codigo: '',
      principal: false,
      activo: true
    });
  }

  // Cancel adding/editing codigo
  cancelCodigoEdit(): void {
    this.isAddingCodigo = false;
    this.editingCodigoId = null;
    this.codigoForm.reset();
  }

  // Start editing a codigo
  editCodigo(codigo: CodigoBarra): void {
    this.isAddingCodigo = false;
    this.editingCodigoId = codigo.id!;
    this.codigoForm.patchValue({
      codigo: codigo.codigo,
      principal: codigo.principal,
      activo: codigo.activo
    });
  }

  // Save codigo (create or update)
  saveCodigo(): void {
    if (this.codigoForm.valid && this.data.presentacion?.id) {
      this.isLoadingCodigos = true;
      
      const codigoData = {
        ...this.codigoForm.value,
        presentacionId: this.data.presentacion.id,
        principal: Boolean(this.codigoForm.value.principal),
        activo: Boolean(this.codigoForm.value.activo)
      };

      const operation = this.editingCodigoId
        ? this.repositoryService.updateCodigoBarra(this.editingCodigoId, codigoData)
        : this.repositoryService.createCodigoBarra(codigoData);

      operation.subscribe({
        next: (response) => {
          const actionText = this.editingCodigoId ? 'actualizado' : 'creado';
          this.snackBar.open(`Código ${actionText} correctamente`, 'CERRAR', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.cancelCodigoEdit();
          this.loadCodigos();
          this.hasChanges = true; // Mark that changes were made
        },
        error: (error) => {
          console.error('ERROR_SAVING_CODIGO', error);
          const actionText = this.editingCodigoId ? 'actualizar' : 'crear';
          this.snackBar.open(`Error al ${actionText} código`, 'CERRAR', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.isLoadingCodigos = false;
        }
      });
    }
  }

  // Delete codigo
  deleteCodigo(codigo: CodigoBarra): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'CONFIRMAR ELIMINACION',
        message: `¿Está seguro que desea eliminar el código ${codigo.codigo}?`,
        confirmText: 'ELIMINAR',
        cancelText: 'CANCELAR'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && codigo.id) {
        this.isLoadingCodigos = true;
        this.repositoryService.deleteCodigoBarra(codigo.id).subscribe({
          next: () => {
            this.snackBar.open('Código eliminado correctamente', 'CERRAR', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadCodigos();
            this.hasChanges = true; // Mark that changes were made
          },
          error: (error) => {
            console.error('ERROR_DELETING_CODIGO', error);
            this.snackBar.open('Error al eliminar código', 'CERRAR', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
            this.isLoadingCodigos = false;
          }
        });
      }
    });
  }

  // Mark as principal
  marcarComoPrincipal(codigo: CodigoBarra): void {
    if (codigo.id) {
      this.isLoadingCodigos = true;
      
      // First, unmark all other codigos as principal
      this.codigos.forEach(c => {
        if (c.id !== codigo.id && c.principal) {
          this.repositoryService.updateCodigoBarra(c.id!, { principal: false }).subscribe();
        }
      });

      // Then mark this one as principal
      this.repositoryService.updateCodigoBarra(codigo.id, { principal: true }).subscribe({
        next: () => {
          this.snackBar.open('Código marcado como principal correctamente', 'CERRAR', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadCodigos();
          this.hasChanges = true; // Mark that changes were made
        },
        error: (error) => {
          console.error('ERROR_MARKING_PRINCIPAL', error);
          this.snackBar.open('Error al marcar código como principal', 'CERRAR', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.isLoadingCodigos = false;
        }
      });
    }
  }

  // Toggle codigo status
  toggleCodigoStatus(codigo: CodigoBarra): void {
    if (codigo.id) {
      const updatedData = { ...codigo, activo: !codigo.activo };
      this.isLoadingCodigos = true;
      
      this.repositoryService.updateCodigoBarra(codigo.id, updatedData).subscribe({
        next: () => {
          const statusText = updatedData.activo ? 'activado' : 'desactivado';
          this.snackBar.open(`Código ${statusText} correctamente`, 'CERRAR', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadCodigos();
          this.hasChanges = true; // Mark that changes were made
        },
        error: (error) => {
          console.error('ERROR_UPDATING_CODIGO_STATUS', error);
          this.snackBar.open('Error al cambiar estado de código', 'CERRAR', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.isLoadingCodigos = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(this.hasChanges);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.codigoForm.controls).forEach(key => {
      const control = this.codigoForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.codigoForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${fieldName.toUpperCase()}_REQUIRED`;
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `MINIMUM_LENGTH_${minLength}`;
    }
    
    return '';
  }
} 