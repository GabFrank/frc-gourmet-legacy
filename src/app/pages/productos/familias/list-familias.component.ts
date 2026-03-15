import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RepositoryService } from '../../../database/repository.service';
import { CreateEditFamiliaComponent } from './create-edit-familia.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { Familia } from '../../../database/entities/productos/familia.entity';
// add mat-menu
import { MatMenuModule } from '@angular/material/menu';
@Component({
  selector: 'app-list-familias',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule
  ],
  templateUrl: './list-familias.component.html',
  styleUrls: ['./list-familias.component.scss']
})
export class ListFamiliasComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['nombre', 'activo', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<Familia>();
  isLoading = false;

  constructor(
    private repositoryService: RepositoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadFamilias();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadFamilias(): void {
    this.isLoading = true;
    this.repositoryService.getFamilias().subscribe({
      next: (familias) => {
        this.dataSource.data = familias;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('ERROR_LOADING_FAMILIAS', error);
        this.snackBar.open('Error al cargar familias', 'CERRAR', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateEditFamiliaComponent, {
      width: '60%',
      height: '70%',
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadFamilias();
      }
    });
  }

  openEditDialog(familia: Familia): void {
    const dialogRef = this.dialog.open(CreateEditFamiliaComponent, {
      width: '60%',
      height: '70%',
      data: { isEdit: true, familia: familia }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadFamilias();
      }
    });
  }

  deleteFamilia(familia: Familia): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'CONFIRMAR_ELIMINACION',
        message: `¿Está seguro que desea eliminar la familia "${familia.nombre}"?`,
        confirmText: 'ELIMINAR',
        cancelText: 'CANCELAR'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.repositoryService.deleteFamilia(familia.id!).subscribe({
          next: () => {
            this.snackBar.open('Familia eliminada correctamente', 'CERRAR', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadFamilias();
          },
          error: (error) => {
            console.error('ERROR_DELETING_FAMILIA', error);
            this.snackBar.open('Error al eliminar familia', 'CERRAR', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
            this.isLoading = false;
          }
        });
      }
    });
  }

  toggleStatus(familia: Familia): void {
    const updatedFamilia = { ...familia, activo: !familia.activo };
    this.isLoading = true;

    this.repositoryService.updateFamilia(familia.id!, updatedFamilia).subscribe({
      next: () => {
        const statusText = updatedFamilia.activo ? 'activada' : 'desactivada';
        this.snackBar.open(`Familia ${statusText} correctamente`, 'CERRAR', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadFamilias();
      },
      error: (error) => {
        console.error('ERROR_UPDATING_FAMILIA_STATUS', error);
        this.snackBar.open('Error al cambiar estado de familia', 'CERRAR', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }
} 