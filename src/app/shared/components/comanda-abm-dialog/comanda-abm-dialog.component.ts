import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component';

interface ComandaEntity {
  id?: number;
  codigo: string;
  numero: number;
  estado: string;
  descripcion?: string;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Component({
  selector: 'app-comanda-abm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatMenuModule,
    MatChipsModule,
  ],
  templateUrl: './comanda-abm-dialog.component.html',
  styleUrls: ['./comanda-abm-dialog.component.scss']
})
export class ComandaAbmDialogComponent implements OnInit {
  private api = (window as any).api;

  comandas: ComandaEntity[] = [];
  displayedColumns = ['numero', 'codigo', 'descripcion', 'estado', 'activo', 'actions'];
  loading = false;
  submitting = false;

  // Form para crear individual
  showCreateForm = false;
  createForm!: FormGroup;
  editingComanda: ComandaEntity | null = null;

  // Batch creation
  showBatchForm = false;
  batchForm!: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<ComandaAbmDialogComponent>,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.createForm = this.fb.group({
      codigo: ['', Validators.required],
      numero: [null, [Validators.required, Validators.min(1)]],
      descripcion: ['']
    });

    this.batchForm = this.fb.group({
      cantidad: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      prefijoCodigo: ['CMD', Validators.required]
    });

    this.loadComandas();
  }

  async loadComandas(): Promise<void> {
    this.loading = true;
    try {
      this.comandas = await this.api.getComandas();
      this.comandas.sort((a: ComandaEntity, b: ComandaEntity) => a.numero - b.numero);
    } catch (error) {
      console.error('Error loading comandas:', error);
      this.snackBar.open('Error al cargar comandas', 'OK', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.showBatchForm = false;
    this.editingComanda = null;
    if (this.showCreateForm) {
      const nextNumero = this.comandas.length > 0
        ? Math.max(...this.comandas.map(c => c.numero)) + 1
        : 1;
      this.createForm.reset({ codigo: '', numero: nextNumero, descripcion: '' });
    }
  }

  toggleBatchForm(): void {
    this.showBatchForm = !this.showBatchForm;
    this.showCreateForm = false;
    this.editingComanda = null;
    if (this.showBatchForm) {
      this.batchForm.reset({ cantidad: 10, prefijoCodigo: 'CMD' });
    }
  }

  editComanda(comanda: ComandaEntity): void {
    this.editingComanda = comanda;
    this.showCreateForm = true;
    this.showBatchForm = false;
    this.createForm.patchValue({
      codigo: comanda.codigo,
      numero: comanda.numero,
      descripcion: comanda.descripcion || ''
    });
  }

  async saveComanda(): Promise<void> {
    if (this.createForm.invalid) return;
    this.submitting = true;
    try {
      const formValue = this.createForm.value;
      const data = {
        codigo: (formValue.codigo as string).toUpperCase(),
        numero: formValue.numero,
        descripcion: formValue.descripcion ? (formValue.descripcion as string).toUpperCase() : undefined
      };

      if (this.editingComanda) {
        await this.api.updateComanda(this.editingComanda.id, data);
        this.snackBar.open('Comanda actualizada', 'OK', { duration: 2000 });
      } else {
        await this.api.createComanda(data);
        this.snackBar.open('Comanda creada', 'OK', { duration: 2000 });
      }

      this.showCreateForm = false;
      this.editingComanda = null;
      await this.loadComandas();
    } catch (error) {
      console.error('Error saving comanda:', error);
      this.snackBar.open('Error al guardar comanda', 'OK', { duration: 3000 });
    } finally {
      this.submitting = false;
    }
  }

  async createBatch(): Promise<void> {
    if (this.batchForm.invalid) return;
    this.submitting = true;
    try {
      const { cantidad, prefijoCodigo } = this.batchForm.value;
      const startNumero = this.comandas.length > 0
        ? Math.max(...this.comandas.map(c => c.numero)) + 1
        : 1;

      const batchData = [];
      for (let i = 0; i < cantidad; i++) {
        const numero = startNumero + i;
        batchData.push({
          codigo: `${(prefijoCodigo as string).toUpperCase()}-${String(numero).padStart(3, '0')}`,
          numero
        });
      }

      await this.api.createBatchComandas(batchData);
      this.snackBar.open(`${cantidad} comandas creadas`, 'OK', { duration: 2000 });
      this.showBatchForm = false;
      await this.loadComandas();
    } catch (error) {
      console.error('Error creating batch comandas:', error);
      this.snackBar.open('Error al crear comandas', 'OK', { duration: 3000 });
    } finally {
      this.submitting = false;
    }
  }

  async toggleActivo(comanda: ComandaEntity): Promise<void> {
    try {
      await this.api.updateComanda(comanda.id, { activo: !comanda.activo });
      this.snackBar.open(
        comanda.activo ? 'Comanda desactivada' : 'Comanda activada',
        'OK',
        { duration: 2000 }
      );
      await this.loadComandas();
    } catch (error) {
      console.error('Error toggling comanda:', error);
      this.snackBar.open('Error al actualizar comanda', 'OK', { duration: 3000 });
    }
  }

  async deleteComanda(comanda: ComandaEntity): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Eliminar Comanda',
        message: `¿Está seguro de eliminar la comanda #${comanda.numero} (${comanda.codigo})?`
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) return;
      try {
        await this.api.deleteComanda(comanda.id);
        this.snackBar.open('Comanda eliminada', 'OK', { duration: 2000 });
        await this.loadComandas();
      } catch (error: any) {
        console.error('Error deleting comanda:', error);
        this.snackBar.open(error?.message || 'Error al eliminar comanda', 'OK', { duration: 3000 });
      }
    });
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.showBatchForm = false;
    this.editingComanda = null;
  }

  close(): void {
    this.dialogRef.close();
  }
}
