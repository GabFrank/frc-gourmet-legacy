import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

export interface GenericSearchConfig {
  title: string;
  displayedColumns: string[];
  columnLabels: { [key: string]: string };
  columnAlignments?: { [key: string]: 'left' | 'center' | 'right' };
  booleanColumns?: { [key: string]: { trueValue: string; falseValue: string } };
  searchFn: (query: string, page: number, pageSize: number, activeFilter?: 'all' | 'active' | 'inactive') => Promise<{ items: any[], total: number }>;
  displayFn?: (item: any) => string;
  showActiveFilter?: boolean;
}

/**
 * Ejemplo de uso de la configuración mejorada:
 * 
 * const config: GenericSearchConfig = {
 *   title: 'BUSCAR FAMILIA',
 *   displayedColumns: ['nombre', 'activo'],
 *   columnLabels: {
 *     nombre: 'NOMBRE',
 *     activo: 'ACTIVO'
 *   },
 *   columnAlignments: {
 *     nombre: 'left',
 *     activo: 'center'
 *   },
 *   booleanColumns: {
 *     activo: { trueValue: 'Sí', falseValue: 'No' }
 *   },
 *   showActiveFilter: true,
 *   searchFn: async (query, page, pageSize, activeFilter) => {
 *     // Implementar búsqueda con filtro de estado
 *     return { items: [], total: 0 };
 *   }
 * };
 */
interface ItemWithDisplayValues {
  [key: string]: any;
  __displayValues?: { [key: string]: string };
}

@Component({
  selector: 'app-generic-search-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatCardModule,
    MatTooltipModule,
    MatRadioModule,
    ReactiveFormsModule
  ],
  templateUrl: './generic-search-dialog.component.html',
  styleUrls: ['./generic-search-dialog.component.scss']
})
export class GenericSearchDialogComponent implements OnInit {
  searchControl = new FormControl('');
  items: ItemWithDisplayValues[] = [];
  displayedColumns: string[] = [];
  columnLabels: { [key: string]: string } = {};
  columnAlignments: { [key: string]: 'left' | 'center' | 'right' } = {};
  booleanColumns: { [key: string]: { trueValue: string; falseValue: string } } = {};
  
  // Filter properties
  activeFilter: 'all' | 'active' | 'inactive' = 'active';
  showActiveFilter = false;
  
  isLoading = false;
  totalItems = 0;
  currentPage = 0;
  pageSize = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private dialogRef: MatDialogRef<GenericSearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public config: GenericSearchConfig
  ) {
    this.displayedColumns = [...config.displayedColumns, 'actions'];
    this.columnLabels = config.columnLabels;
    this.columnAlignments = config.columnAlignments || {};
    this.booleanColumns = config.booleanColumns || {};
    this.showActiveFilter = config.showActiveFilter || false;
  }
  
  ngOnInit(): void {
    // Setup search when typing with debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 0;
        this.search();
      });
    
    // Initial search
    this.search();
  }
  
  async search(): Promise<void> {
    this.isLoading = true;
    try {
      const query = this.searchControl.value || '';
      const result = await this.config.searchFn(query, this.currentPage, this.pageSize, this.activeFilter);
      // Pre-compute display values for each item
      this.items = result.items.map(item => this.preComputeDisplayValues(item));
      this.totalItems = result.total;
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.search();
  }
  
  onActiveFilterChange(filter: 'all' | 'active' | 'inactive'): void {
    this.activeFilter = filter;
    this.currentPage = 0; // Reset to first page when filter changes
    this.search();
  }
  
  selectItem(item: any): void {
    // Remove the added display values property before returning the item
    if (item.__displayValues) {
      const { __displayValues, ...cleanItem } = item;
      this.dialogRef.close(cleanItem);
    } else {
      this.dialogRef.close(item);
    }
  }
  
  cancel(): void {
    this.dialogRef.close();
  }
  
  // Helper method to display item text for display fields
  displayText(item: any, column: string): string {
    if (!item) return '';
    
    // Handle nested properties (e.g., "persona.nombre")
    if (column.includes('.')) {
      const props = column.split('.');
      let value = item;
      for (const prop of props) {
        value = value?.[prop];
        if (value === undefined) return '';
      }
      return this.formatValue(value, column);
    }
    
    const value = item[column];
    return this.formatValue(value, column);
  }

  // Format value based on column type and configuration
  private formatValue(value: any, column: string): string {
    if (value === undefined || value === null) return '';
    
    // Handle boolean values
    if (typeof value === 'boolean' && this.booleanColumns[column]) {
      const config = this.booleanColumns[column];
      return value ? config.trueValue : config.falseValue;
    }
    
    // Handle boolean values without specific configuration (default)
    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }
    
    return value.toString();
  }

  // Get alignment class for a column
  getColumnAlignment(column: string): string {
    const alignment = this.columnAlignments[column] || 'left';
    return `text-${alignment}`;
  }

  // Pre-compute display values for all columns
  private preComputeDisplayValues(item: any): ItemWithDisplayValues {
    const itemWithDisplay: ItemWithDisplayValues = { ...item, __displayValues: {} };
    
    // For each display column, pre-compute its display text
    for (const column of this.config.displayedColumns) {
      itemWithDisplay.__displayValues![column] = this.displayText(item, column);
    }
    
    return itemWithDisplay;
  }
  
  // Method to detect Enter key and trigger search
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.search();
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 