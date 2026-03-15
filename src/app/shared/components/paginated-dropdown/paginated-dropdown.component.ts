import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

export interface PaginatedDropdownOption {
  id: number | string;
  label: string;
  value: any;
  description?: string;
  disabled?: boolean;
}

export interface PaginatedDropdownConfig {
  placeholder: string;
  searchPlaceholder: string;
  noDataMessage: string;
  loadMoreText: string;
  pageSize: number;
  searchDebounceMs: number;
  showSearch: boolean;
  clearable: boolean;
  disabled?: boolean;
}

export interface PaginatedDropdownSearchEvent {
  searchTerm: string;
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-paginated-dropdown',
  templateUrl: './paginated-dropdown.component.html',
  styleUrls: ['./paginated-dropdown.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PaginatedDropdownComponent),
      multi: true
    }
  ]
})
export class PaginatedDropdownComponent implements OnInit, OnDestroy, OnChanges, ControlValueAccessor {

  @Input() config: PaginatedDropdownConfig = {
    placeholder: 'Seleccionar opción',
    searchPlaceholder: 'Buscar...',
    noDataMessage: 'No hay datos disponibles',
    loadMoreText: 'Cargar más...',
    pageSize: 10,
    searchDebounceMs: 300,
    showSearch: true,
    clearable: true,
    disabled: false
  };

  @Input() options: PaginatedDropdownOption[] = [];
  @Input() loading = false;
  @Input() totalItems = 0;
  @Input() hasMoreItems = false;

  @Output() searchChange = new EventEmitter<PaginatedDropdownSearchEvent>();
  @Output() loadMore = new EventEmitter<void>();

  // Propiedades para templates (NO FUNCTION CALLS - siguiendo @initial-rules)
  selectedValue: any = null;
  searchTerm = '';
  currentPage = 0;
  isDropdownOpen = false;

  // Propiedades computadas para template
  filteredOptions: PaginatedDropdownOption[] = [];
  showLoadMoreOption = false;
  showNoDataMessage = false;
  placeholderText = '';
  searchPlaceholderText = '';
  noDataText = '';
  loadMoreText = '';

  // Control de búsqueda
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // ControlValueAccessor
  private onChange = (value: any) => {};
  private onTouched = () => {};

  ngOnInit(): void {
    this.initializeProperties();
    this.setupSearch();
    this.updateComputedProperties();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeProperties(): void {
    this.placeholderText = this.config.placeholder;
    this.searchPlaceholderText = this.config.searchPlaceholder;
    this.noDataText = this.config.noDataMessage;
    this.loadMoreText = this.config.loadMoreText;
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(this.config.searchDebounceMs),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.currentPage = 0;
        this.emitSearchChange(searchTerm, 0);
      });
  }

  private updateComputedProperties(): void {
    this.filteredOptions = [...this.options];
    this.showLoadMoreOption = this.hasMoreItems && !this.loading;
    this.showNoDataMessage = this.options.length === 0 && !this.loading;
  }

  // Métodos públicos para template
  onSearchInputChange(event: any): void {
    const value = event.target?.value || '';
    this.searchTerm = value.toUpperCase(); // Siguiendo @initial-rules: UPPERCASE strings
    this.searchSubject.next(this.searchTerm);
  }

  onOptionSelect(value: any): void {
    // Verificar si es la opción "Cargar más"
    if (value === 'load-more') {
      this.onLoadMoreClick();
      return;
    }

    this.selectedValue = value;
    this.onChange(this.selectedValue);
    this.onTouched();
    this.isDropdownOpen = false;
  }

  onLoadMoreClick(): void {
    this.currentPage++;
    this.loadMore.emit();
    this.emitSearchChange(this.searchTerm, this.currentPage);
  }

  onClearSelection(): void {
    if (!this.config.clearable || this.config.disabled) return;

    this.selectedValue = null;
    this.onChange(null);
    this.onTouched();
  }

  onDropdownOpen(): void {
    this.isDropdownOpen = true;
    // Cargar datos iniciales si no hay opciones
    if (this.options.length === 0 && !this.loading) {
      this.emitSearchChange('', 0);
    }
  }

  onDropdownClose(): void {
    this.isDropdownOpen = false;
  }

  private emitSearchChange(searchTerm: string, page: number): void {
    this.searchChange.emit({
      searchTerm,
      page,
      pageSize: this.config.pageSize
    });
  }

  // Métodos para obtener texto de opción seleccionada
  getSelectedOptionText(): string {
    if (!this.selectedValue) return '';

    const selectedOption = this.options.find(opt => opt.value === this.selectedValue);
    return selectedOption ? selectedOption.label : '';
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.selectedValue = value;
    this.updateComputedProperties();
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.config.disabled = isDisabled;
  }

  // Watchers para inputs (siguiendo @initial-rules: actualizar propiedades cuando cambian inputs)
  ngOnChanges(): void {
    this.updateComputedProperties();
  }
}
