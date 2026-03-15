import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RepositoryService } from '../../../database/repository.service';
import { Adicional } from '../../../database/entities/productos/adicional.entity';
import { CreateEditAdicionalDialogComponent } from '../dialogs/create-edit-adicional-dialog/create-edit-adicional-dialog.component';

@Component({
  selector: 'app-list-adicionales',
  templateUrl: './list-adicionales.component.html',
  styleUrls: ['./list-adicionales.component.scss']
})
export class ListAdicionalesComponent implements OnInit {
  displayedColumns: string[] = ['nombre', 'precioBase', 'categoria', 'receta', 'activo', 'acciones'];
  dataSource = new MatTableDataSource<Adicional>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading = false;
  totalItems = 0;
  currentPage = 0;
  pageSize = 10;

  // Filtros
  searchTerm = '';
  activeFilter: 'all' | 'active' | 'inactive' = 'all';
  categoriaFilter = '';

  constructor(
    private repositoryService: RepositoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAdicionales();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadAdicionales(): void {
    this.loading = true;

    const filters = {
      search: this.searchTerm || undefined,
      activo: this.activeFilter === 'all' ? null : this.activeFilter === 'active',
      categoria: this.categoriaFilter || undefined,
      page: this.currentPage,
      pageSize: this.pageSize
    };

    this.repositoryService.getAdicionalesWithFilters(filters).subscribe({
      next: (response) => {
        this.dataSource.data = response.items;
        this.totalItems = response.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading adicionales:', error);
        this.snackBar.open('Error al cargar los adicionales', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAdicionales();
  }

  applyFilter(): void {
    this.currentPage = 0;
    this.loadAdicionales();
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateEditAdicionalDialogComponent, {
      width: '800px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAdicionales();
        this.snackBar.open('Adicional creado exitosamente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  editAdicional(adicional: Adicional): void {
    const dialogRef = this.dialog.open(CreateEditAdicionalDialogComponent, {
      width: '800px',
      data: { mode: 'edit', adicional }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAdicionales();
        this.snackBar.open('Adicional actualizado exitosamente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  deleteAdicional(adicional: Adicional): void {
    if (confirm(`¿Estás seguro de que quieres eliminar el adicional "${adicional.nombre}"?`)) {
      this.repositoryService.deleteAdicional(adicional.id).subscribe({
        next: () => {
          this.loadAdicionales();
          this.snackBar.open('Adicional eliminado exitosamente', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error deleting adicional:', error);
          this.snackBar.open('Error al eliminar el adicional', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  viewReceta(adicional: Adicional): void {
    if (adicional.receta) {
      // Aquí podrías abrir un diálogo para ver la receta del adicional
      this.snackBar.open(`Receta: ${adicional.receta.nombre}`, 'Cerrar', { duration: 3000 });
    } else {
      this.snackBar.open('Este adicional no tiene receta asociada', 'Cerrar', { duration: 3000 });
    }
  }



  getRecetaStatus(adicional: Adicional): string {
    return adicional.receta ? 'Con Receta' : 'Sin Receta';
  }

  getRecetaStatusColor(adicional: Adicional): string {
    return adicional.receta ? 'accent' : 'warn';
  }
}
