import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatBadgeModule } from '@angular/material/badge';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormControl, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Observable, of, firstValueFrom, async } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith, switchMap } from 'rxjs/operators';
import { animate, state, style, transition, trigger } from '@angular/animations';

import { RepositoryService } from '../../../database/repository.service';
import { CajaMoneda } from '../../../database/entities/financiero/caja-moneda.entity';
import { Producto } from '../../../database/entities/productos/producto.entity';
import { VentaItem, EstadoVentaItem } from '../../../database/entities/ventas/venta-item.entity';
import { PrecioVenta } from '../../../database/entities/productos/precio-venta.entity';
import { Moneda } from '../../../database/entities/financiero/moneda.entity';
import { MonedaCambio } from '../../../database/entities/financiero/moneda-cambio.entity';
import { PdvMesa, PdvMesaEstado } from '../../../database/entities/ventas/pdv-mesa.entity';
import { ProductoSearchDialogComponent } from '../../../shared/components/producto-search-dialog/producto-search-dialog.component';
import { Presentacion } from '../../../database/entities/productos/presentacion.entity';
import { Venta, VentaEstado } from 'src/app/database/entities/ventas/venta.entity';
import { PagoEstado } from 'src/app/database/entities/compras/estado.enum';
import { TipoDetalle } from 'src/app/database/entities/compras/pago-detalle.entity';
import { AuthService } from 'src/app/services/auth.service';
import { Caja } from 'src/app/database/entities/financiero/caja.entity';
import { CreateCajaDialogComponent } from '../../financiero/cajas/create-caja-dialog/create-caja-dialog.component';
import { TabsService } from 'src/app/services/tabs.service';
import { MesaSelectionDialogComponent } from '../../../shared/components/mesa-selection-dialog/mesa-selection-dialog.component';
import { ConfirmationDialogComponent } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableDataSource } from '@angular/material/table';
import { PdvGrupoCategoria } from 'src/app/database/entities/ventas/pdv-grupo-categoria.entity';
import { CobrarVentaDialogComponent, CobrarVentaDialogData } from 'src/app/shared/components/cobrar-venta-dialog/cobrar-venta-dialog.component';
import { CancelarVentaDialogComponent } from 'src/app/shared/components/cancelar-venta-dialog/cancelar-venta-dialog.component';
import { EditVentaItemDialogComponent } from 'src/app/shared/components/edit-venta-item-dialog/edit-venta-item-dialog.component';
import { TransferirMesaDialogComponent } from 'src/app/shared/components/transferir-mesa-dialog/transferir-mesa-dialog.component';
import { BuscarClienteDialogComponent } from 'src/app/shared/components/buscar-cliente-dialog/buscar-cliente-dialog.component';
import { DescuentoDialogComponent } from 'src/app/shared/components/descuento-dialog/descuento-dialog.component';
import { DividirCuentaDialogComponent } from 'src/app/shared/components/dividir-cuenta-dialog/dividir-cuenta-dialog.component';
import { PdvCategoria } from 'src/app/database/entities/ventas/pdv-categoria.entity';
import { PdvCategoriaItem } from 'src/app/database/entities/ventas/pdv-categoria-item.entity';
import { Sector } from 'src/app/database/entities/ventas/sector.entity';

interface MonedaWithTotal {
  moneda: Moneda;
  total: number;
}

interface CurrencyDisplay {
  code: string;        // Currency code (e.g., 'PY', 'US', 'BR')
  symbol: string;      // Currency symbol (e.g., '$', '€')
  denominationCode: string; // Currency denomination code (e.g., 'PYG', 'USD', 'BRL')
  total: number;
  flag: string;
}

@Component({
  selector: 'app-pdv',
  templateUrl: './pdv.component.html',
  styleUrls: ['./pdv.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatFormFieldModule,
    MatBadgeModule,
    MatGridListModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatMenuModule,
    MatCheckboxModule
  ],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', overflow: 'hidden', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class PdvComponent implements OnInit, OnDestroy {
  private mesasRefreshInterval: any = null;
  private refreshingMesas = false;

  // Modo mover items
  moverItemsMode = false;
  selectedItemIds: Set<number> = new Set();
  // Table data
  ventaItemsDataSource = new MatTableDataSource<VentaItem>([]);
  displayedColumns: string[] = ['productoNombre', 'cantidad', 'precio', 'total', 'actions'];
  expandedElement: VentaItem | null = null;
  columnsToDisplayWithExpand: string[] = [...this.displayedColumns];

  // Search form
  searchForm: FormGroup;

  // Currency management
  monedas: Moneda[] = [];
  monedasWithTotals: MonedaWithTotal[] = [];
  saldos: Map<number, number> = new Map<number, number>();
  exchangeRates: MonedaCambio[] = [];
  filteredMonedas: Moneda[] = [];
  currencyTotalsMap: Map<number, number> = new Map<number, number>();
  // Principal currency
  principalMoneda: Moneda | null = null;
  principalMonedaId: number | null = null;

  // Product demo data for grid
  productos: Producto[] = [];

  // Tables (mesas)
  mesas: PdvMesa[] = [];
  loadingMesas = false;
  selectedMesa: PdvMesa | null = null;

  // Venta rápida (sin mesa)
  ventaRapidaActual: Venta | null = null;

  // Sector filter for tables
  sectores: Sector[] = [];
  selectedSectorId: number | null = null;

  // Pre-generated table numbers for template
  preGeneratedTableNumbers: number[] = [];

  // Loading states
  loadingExchangeRates = false;
  loadingConfig = false;

  // Cliente name editing
  isEditingClienteName = false;
  clienteNameForm: FormGroup;

  // Caja
  caja: Caja | null = null;

  //  grupo de categorias
  pdvGrupoCategorias: PdvGrupoCategoria[] = [];

  // Navegación de categorías
  navigationLevel: 'grupos' | 'categorias' | 'items' = 'grupos';
  selectedGrupo: PdvGrupoCategoria | null = null;
  selectedCategoria: PdvCategoria | null = null;
  categoriaItems: PdvCategoriaItem[] = [];
  categoriasDelGrupo: PdvCategoria[] = [];

  // tiempo abierto
  tiempoAbierto = '0h 0m';

  // Getter to combine loading states for currency display
  // get loadingCurrencies(): boolean {
  //   return this.loadingExchangeRates || this.loadingConfig;
  // }

  // Search constants
  readonly SEARCH_DIALOG_WIDTH = '800px';
  readonly SEARCH_DIALOG_HEIGHT = '600px';


  constructor(
    private repositoryService: RepositoryService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private authService: AuthService,
    private tabsService: TabsService
  ) {
    // Initialize form
    this.searchForm = this.fb.group({
      cantidad: [1],
      searchTerm: ['']
    });

    // Initialize cliente name form
    this.clienteNameForm = this.fb.group({
      nombre: ['']
    });
  }

  async ngOnInit(): Promise<void> {
    // get caja abierta from current user
    if (this.authService.currentUser) {
      this.caja = await firstValueFrom(this.repositoryService.getCajaAbiertaByUsuario(this.authService.currentUser.id));
      if (this.caja) {
        this.loadInitialData();
      } else {
        // show dialog warning that there is no caja abierta, ask if they want to open a new caja, if yes open create caja dialog
        // fist show a dialog with a warning message  
        // change this by confirmation dialog
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
          disableClose: true,
          data: {
            title: 'Caja abierta no encontrada',
            message: 'No hay una caja abierta, ¿desea abrir una nueva?',
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            // open create caja dialog
            const cajaDialogRef = this.dialog.open(CreateCajaDialogComponent, {
              width: '80vw',
              height: '80vh',
              disableClose: true
            });
            cajaDialogRef.afterClosed().subscribe(async (cajaResult) => {
              if (cajaResult?.success) {
                // Recargar la caja abierta
                this.caja = await firstValueFrom(this.repositoryService.getCajaAbiertaByUsuario(this.authService.currentUser!.id));
                if (this.caja) {
                  this.loadInitialData();
                }
              } else {
                // close tab
                this.tabsService.removeTabById('pdv');
              }
            });
          } else {
            // close tab
            this.tabsService.removeTabById('pdv');
          }
        });
      }
    } else {
      // 
    }
    //set timeout and focus on searchTerm input
    setTimeout(() => {
      const searchTermInput = document.querySelector('input[formControlName="searchTerm"]');
      if (searchTermInput) {
        (searchTermInput as HTMLInputElement).focus();
      }
    }, 100);

    // set interval to update tiempoAbierto each 60 seconds
    setInterval(() => {
      this.tiempoAbierto = this.timeOpen();
    }, 60000);


  }

  /**
   * Load initial data from database (monedas, exchange rates, products)
   */
  async loadInitialData(): Promise<void> {
    try {
      // Load monedas
      this.monedas = await firstValueFrom(this.repositoryService.getMonedas());

      // Find principal moneda (assuming it's marked in the database with a principal flag)
      const principalMonedas = this.monedas.filter(m => m.principal === true);

      if (principalMonedas.length > 0) {
        this.principalMoneda = principalMonedas[0];
        this.principalMonedaId = this.principalMoneda.id || null;
      } else {
        // Fallback if no principal currency is marked
        console.warn('No principal currency found in database');
        this.principalMoneda = this.monedas[0];
        this.principalMonedaId = this.principalMoneda?.id || null;
      }

      // Load filtered currencies based on CajaMoneda configuration
      await this.loadCajaMonedasConfig();

      // Load exchange rates
      await this.loadExchangeRates();

      // Load tables (mesas)
      await this.loadMesas();

      // Load sectores
      this.sectores = await firstValueFrom(this.repositoryService.getSectoresActivos());

      // Load PdV grupo categorias
      this.pdvGrupoCategorias = await firstValueFrom(this.repositoryService.getPdvGrupoCategorias());

      // Initialize demo data
      this.initDemoData();

      // Calculate totals
      this.calculateTotals();

    } catch (error) {
      console.error('Error loading initial data:', error);
    }

    // Auto-refresh mesas cada 1 segundo
    this.mesasRefreshInterval = setInterval(() => {
      this.refreshMesasSilent();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.mesasRefreshInterval) {
      clearInterval(this.mesasRefreshInterval);
    }
  }

  /**
   * Refresh mesas sin afectar la selección actual
   */
  private async refreshMesasSilent(): Promise<void> {
    if (this.refreshingMesas) return;
    this.refreshingMesas = true;
    try {
      const mesasFrescas = await firstValueFrom(this.repositoryService.getPdvMesas());
      const mesasActivas = mesasFrescas.filter(m => m.activo).sort((a, b) => a.numero - b.numero);

      // Actualizar estado de cada mesa sin perder la selección
      for (const mesaFresca of mesasActivas) {
        const mesaLocal = this.mesas.find(m => m.id === mesaFresca.id);
        if (mesaLocal) {
          mesaLocal.estado = mesaFresca.estado;
          // Actualizar venta solo si no es la mesa seleccionada (para no pisar datos en edición)
          if (!this.selectedMesa || this.selectedMesa.id !== mesaLocal.id) {
            mesaLocal.venta = mesaFresca.venta;
          }
        }
      }

      // Agregar mesas nuevas que no existían
      for (const mesaFresca of mesasActivas) {
        if (!this.mesas.find(m => m.id === mesaFresca.id)) {
          this.mesas.push(mesaFresca);
        }
      }

      this.mesas = [...this.mesas];
    } catch (error) {
      // Silencioso — no interrumpir al usuario
    } finally {
      this.refreshingMesas = false;
    }
  }

  /**
   * Load tables (mesas) from the database
   */
  async loadMesas(): Promise<void> {
    this.loadingMesas = true;
    try {
      // Get all active tables
      this.mesas = await firstValueFrom(this.repositoryService.getPdvMesas());

      // Filter for active tables
      this.mesas = this.mesas.filter(mesa => mesa.activo);

      // Sort tables by number
      this.mesas.sort((a, b) => a.numero - b.numero);

      console.log(`Loaded ${this.mesas.length} tables`);
    } catch (error) {
      console.error('Error loading tables:', error);
      // Initialize empty array on error
      this.mesas = [];
    } finally {
      this.loadingMesas = false;
    }
  }

  /**
   * Load tables by sector
   */
  async loadMesasBySector(sectorId: number): Promise<void> {
    this.loadingMesas = true;
    try {
      this.selectedSectorId = sectorId;
      // Get tables by sector
      this.mesas = await firstValueFrom(this.repositoryService.getPdvMesasBySector(sectorId));

      // Filter for active tables
      this.mesas = this.mesas.filter(mesa => mesa.activo);

      // Sort tables by number
      this.mesas.sort((a, b) => a.numero - b.numero);

      console.log(`Loaded ${this.mesas.length} tables for sector ${sectorId}`);
    } catch (error) {
      console.error(`Error loading tables for sector ${sectorId}:`, error);
      // Initialize empty array on error
      this.mesas = [];
    } finally {
      this.loadingMesas = false;
    }
  }

  /**
   * Reset sector filter and load all tables
   */
  async resetMesasFilter(): Promise<void> {
    this.selectedSectorId = null;
    await this.loadMesas();
  }

  // --- Navegación de categorías ---

  async selectGrupo(grupo: PdvGrupoCategoria): Promise<void> {
    this.selectedGrupo = grupo;
    this.categoriasDelGrupo = await firstValueFrom(this.repositoryService.getPdvCategoriasByGrupo(grupo.id));
    this.navigationLevel = 'categorias';
  }

  async selectCategoria(categoria: PdvCategoria): Promise<void> {
    this.selectedCategoria = categoria;
    this.categoriaItems = await firstValueFrom(this.repositoryService.getPdvCategoriaItemsByCategoria(categoria.id));
    this.navigationLevel = 'items';
  }

  async addProductFromItem(itemProducto: any): Promise<void> {
    const producto = itemProducto.producto;
    if (!producto || !producto.presentaciones || producto.presentaciones.length === 0) {
      console.error('Producto sin presentaciones');
      return;
    }
    const presentacion = producto.presentaciones[0];
    const precioVenta = presentacion.preciosVenta?.find((p: PrecioVenta) => p.principal) || presentacion.preciosVenta?.[0];
    if (!precioVenta) {
      console.error('No se encontró precio de venta');
      return;
    }
    const cantidad = this.searchForm.get('cantidad')?.value || 1;
    await this.addProduct(producto, presentacion, cantidad, precioVenta);
  }

  navigateBack(): void {
    if (this.navigationLevel === 'items') {
      this.navigationLevel = 'categorias';
      this.selectedCategoria = null;
      this.categoriaItems = [];
    } else if (this.navigationLevel === 'categorias') {
      this.navigationLevel = 'grupos';
      this.selectedGrupo = null;
      this.categoriasDelGrupo = [];
    }
  }

  navigateToGrupos(): void {
    this.navigationLevel = 'grupos';
    this.selectedGrupo = null;
    this.selectedCategoria = null;
    this.categoriasDelGrupo = [];
    this.categoriaItems = [];
  }

  // Get all mesas (for template)
  get availableMesas(): PdvMesa[] {
    return this.mesas.filter(mesa => !mesa.reservado);
  }

  // Get reserved mesas (for template)
  get reservedMesas(): PdvMesa[] {
    return this.mesas.filter(mesa => mesa.reservado);
  }

  // Get table numbers (from loaded mesas)
  get tableNumbers(): number[] {
    return this.mesas.map(mesa => mesa.numero);
  }

  /**
   * Load caja-monedas configuration to filter currencies
   */
  async loadCajaMonedasConfig(): Promise<void> {
    this.loadingConfig = true;
    try {
      // Get active caja-monedas configuration
      const cajaMonedas = await firstValueFrom(this.repositoryService.getCajasMonedas());

      // Create a map for quick lookup and to maintain order
      const configuredMonedas = new Map<number, CajaMoneda>();

      // Filter for active configurations and sort by orden
      const activeCajaMonedas = cajaMonedas
        .filter(cm => cm.activo)
        .sort((a, b) => {
          const ordenA = a.orden ? parseInt(a.orden) : 999;
          const ordenB = b.orden ? parseInt(b.orden) : 999;
          return ordenA - ordenB;
        });

      // Add to map in order
      activeCajaMonedas.forEach(cm => {
        if (cm.moneda && cm.moneda.id) {
          configuredMonedas.set(cm.moneda.id, cm);
        }
      });

      // Filter monedas based on active caja-moneda configurations
      this.filteredMonedas = this.monedas.filter(moneda =>
        moneda.id && configuredMonedas.has(moneda.id)
      );

      // If principal moneda is not in filtered list, add it
      if (this.principalMoneda && !this.filteredMonedas.some(m => m.id === this.principalMoneda?.id)) {
        this.filteredMonedas.unshift(this.principalMoneda);
      }

      console.log(`Loaded ${this.filteredMonedas.length} configured currencies`);

    } catch (error) {
      console.error('Error loading caja-monedas configuration:', error);
      // On error, use all monedas as fallback
      this.filteredMonedas = [...this.monedas];
    } finally {
      this.loadingConfig = false;
    }
  }

  /**
   * Load exchange rates from the database
   */
  async loadExchangeRates(): Promise<void> {
    this.loadingExchangeRates = true;
    try {
      // Get all active exchange rates
      this.exchangeRates = await firstValueFrom(this.repositoryService.getMonedasCambio());

      // Filter for active exchange rates
      this.exchangeRates = this.exchangeRates.filter(rate => rate.activo);
    } catch (error) {
      console.error('Error loading exchange rates:', error);
    } finally {
      this.loadingExchangeRates = false;
    }
  }

  /**
   * Calculate totals for each currency based on items in cart
   */
  calculateTotals(): void {
    if (!this.principalMoneda) return;

    // Calculate grand total in principal currency if estado is ACTIVO only
    const totalInPrincipal = this.ventaItemsDataSource.data.filter(item => item.estado === EstadoVentaItem.ACTIVO).reduce((sum, item) => sum + (item.precioVentaUnitario - item.descuentoUnitario) * item.cantidad, 0);

    // Clear previous calculations
    this.monedasWithTotals = [];

    // Add principal currency with its total
    this.monedasWithTotals.push({
      moneda: this.principalMoneda,
      total: totalInPrincipal
    });

    // Initialize saldos for principal currency
    this.saldos.set(this.principalMoneda.id!, totalInPrincipal);

    // For each filtered currency that is not the principal, calculate its total
    this.filteredMonedas.forEach(moneda => {
      if (moneda.id === this.principalMoneda?.id) return; // Skip principal

      // Find exchange rate from principal to this currency
      const exchangeRate = this.exchangeRates.find(rate =>
        rate.monedaOrigen.id === this.principalMoneda?.id &&
        rate.monedaDestino.id === moneda.id
      );

      if (exchangeRate) {
        // Convert total from principal to this currency
        const total = totalInPrincipal / exchangeRate.compraLocal;

        // Add to the list
        this.monedasWithTotals.push({
          moneda: moneda,
          total: total
        });

        // Initialize saldos for this currency
        this.saldos.set(moneda.id!, total);
      } else {
        console.warn(`No exchange rate found from ${this.principalMoneda?.denominacion} to ${moneda.denominacion}`);

        // No exchange rate found, set total to 0
        this.monedasWithTotals.push({
          moneda: moneda,
          total: 0
        });

        // Initialize saldos for this currency
        this.saldos.set(moneda.id!, 0);
      }
    });
  }

  // Initialize some demo data
  private initDemoData(): void {
    // Demo venta items

  }

  // Remove item from cart
  removeItem(item: VentaItem): void {
    //perform delete from database, if success then remove from ventaItems
    this.repositoryService.deleteVentaItem(item.id!).subscribe((success) => {
      if (success) {
        this.ventaItemsDataSource.data = this.ventaItemsDataSource.data.filter(i => i.id !== item.id);
        this.calculateTotals();
      }
    });
  }

  // Edit item from cart
  editItem(item: VentaItem): void {
    const dialogRef = this.dialog.open(EditVentaItemDialogComponent, {
      width: '400px',
      data: { ventaItem: item },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          // Construir entrada de historial con valores anteriores
          const historialEntry = {
            fecha: new Date().toISOString(),
            usuario: this.authService.currentUser?.persona?.nombre || 'N/A',
            cantidadAnterior: item.cantidad,
            descuentoAnterior: item.descuentoUnitario,
            cantidadNueva: result.cantidad,
            descuentoNuevo: result.descuentoUnitario,
          };

          // Parsear historial existente o crear array nuevo
          let historial: any[] = [];
          try {
            historial = item.historialCambios ? JSON.parse(item.historialCambios) : [];
          } catch { historial = []; }
          historial.push(historialEntry);

          // Actualizar item in-place
          await firstValueFrom(this.repositoryService.updateVentaItem(item.id, {
            cantidad: result.cantidad,
            descuentoUnitario: result.descuentoUnitario,
            modificado: true,
            modificadoPor: this.authService.currentUser,
            horaModificacion: new Date(),
            historialCambios: JSON.stringify(historial),
          }));

          // Actualizar objeto local
          item.cantidad = result.cantidad;
          item.descuentoUnitario = result.descuentoUnitario;
          item.modificado = true;
          item.historialCambios = JSON.stringify(historial);

          // Guardar observaciones
          if (result.observacionIds?.length > 0 || result.observacionLibre) {
            for (const obsId of (result.observacionIds || [])) {
              await firstValueFrom(this.repositoryService.createVentaItemObservacion({
                ventaItem: { id: item.id },
                observacion: { id: obsId },
                observacionLibre: result.observacionLibre,
              }));
            }
            if (result.observacionIds?.length === 0 && result.observacionLibre) {
              await firstValueFrom(this.repositoryService.createVentaItemObservacion({
                ventaItem: { id: item.id },
                observacionLibre: result.observacionLibre,
              }));
            }
          }

          // Recargar observaciones del item
          const obs = await firstValueFrom(this.repositoryService.getObservacionesByVentaItem(item.id));
          (item as any).observacionesVinculadas = obs;

          // Refrescar tabla
          this.ventaItemsDataSource.data = [...this.ventaItemsDataSource.data];
          this.calculateTotals();
        } catch (error) {
          console.error('Error al editar item:', error);
        }
      }
    });
  }

  // Cancel item from cart
  cancelItem(item: VentaItem): void {
    // update item with estado = CANCELADO, cancelado_por = current user, cancelado_fecha = current date,
    item.estado = EstadoVentaItem.CANCELADO;
    item.canceladoPor = this.authService.currentUser;
    item.horaCancelado = new Date();
    this.repositoryService.updateVentaItem(item.id!, item).subscribe((success) => {
      if (success) {
        this.calculateTotals();
      }
    });
  }

  // Add product to cart
  async addProduct(producto: Producto, presentacion: Presentacion, cantidad: number, precioVenta?: PrecioVenta): Promise<void> {
    console.log('Adding new producto');

    // Forzar cantidad entera si unidadBase es UNIDAD
    if (producto.unidadBase === 'UNIDAD') {
      cantidad = Math.max(1, Math.round(cantidad));
    }

    try {
      // Check if mesa is selected or venta rápida active
      if (!this.selectedMesa && !this.ventaRapidaActual) {
        // No mesa selected and no venta rápida, show dialog to select one
        await this.showMesaSelectionDialog();

        // If still no mesa selected after dialog, return without adding product
        if (!this.selectedMesa) {
          console.log('No se seleccionó ninguna mesa');
          return;
        }
      }

      // Get the venta first
      const venta = await this.getVenta();

      const existingItem = this.ventaItemsDataSource.data.find(item => item.presentacion?.id != null && item.presentacion.id === presentacion?.id);
      let ventaItem: VentaItem;

      // if (existingItem) {
      //   existingItem.cantidad += cantidad;
      //   existingItem.precioVentaUnitario = existingItem.cantidad * (existingItem.precioVentaUnitario - existingItem.descuentoUnitario);
      //   // log updating item, and the list
      //   console.log('updating item', existingItem, this.ventaItemsDataSource.data);
      //   this.ventaItemsDataSource.data = [...this.ventaItemsDataSource.data];
      //   ventaItem = existingItem;
      // } else {
      // use precioVenta or get preciosVenta from database where principal is true and presentacion.id is the same as precioVenta.presentacionId
      const precioVentaToUse = precioVenta;

      if (!precioVentaToUse) {
        throw new Error('No se encontró un precio de venta válido');
      }

      // Create a new VentaItem (only use properties that exist on the VentaItem type)
      const newVentaItem = new VentaItem();
      newVentaItem.presentacion = presentacion;
      newVentaItem.cantidad = cantidad;
      newVentaItem.precioVentaUnitario = precioVentaToUse.valor;
      newVentaItem.precioCostoUnitario = await this.findPrecioCosto(producto);
      newVentaItem.venta = venta;
      newVentaItem.precioVentaPresentacion = precioVentaToUse;
      newVentaItem.producto = producto;

      // Save the new item
      try {
        const savedItem = await firstValueFrom(this.repositoryService.createVentaItem(newVentaItem));
        // Preservar relaciones que el backend no retorna
        savedItem.producto = producto;
        savedItem.presentacion = presentacion;
        savedItem.precioVentaPresentacion = precioVentaToUse;
        const auxList = this.ventaItemsDataSource.data;
        auxList.push(savedItem);
        // log adding new item, and the list
        console.log('adding new item', savedItem, auxList);
        this.ventaItemsDataSource.data = auxList;
        ventaItem = savedItem;
      } catch (error) {
        console.error('Error al guardar el item de venta:', error);
      }
      // }

      // Recalculate totals after adding item
      this.calculateTotals();
    } catch (error) {
      console.error('Error al agregar producto:', error);
    }
  }

  /**
   * Genera o actualiza la comanda para la venta actual con items nuevos.
   */
  async generarComanda(venta: Venta, ventaItems: VentaItem[]): Promise<void> {
    try {
      const itemsData = ventaItems.map(vi => ({
        ventaItem: { id: vi.id },
        observacion: null,
      }));

      await firstValueFrom(this.repositoryService.createComandaWithItems({
        comanda: {
          venta: { id: venta.id },
          pdv_mesa: this.selectedMesa ? { id: this.selectedMesa.id } : null,
          estado: 'PENDIENTE',
        },
        items: itemsData,
      }));
    } catch (error) {
      console.error('Error al generar comanda:', error);
    }
  }

  // Add new method to show mesa selection dialog
  private async showMesaSelectionDialog(): Promise<void> {
    // Create dialog data with available mesas
    const dialogData = {
      mesas: this.mesas.filter(mesa => mesa.activo && !mesa.reservado),
      title: 'Seleccionar Mesa',
      message: 'Por favor seleccione una mesa para continuar'
    };

    // Open the dialog
    const dialogRef = this.dialog.open(MesaSelectionDialogComponent, {
      width: '60%',
      height: '60%',
      data: dialogData,
      disableClose: true
    });

    // Handle the result
    dialogRef.afterClosed().subscribe(selectedMesa => {
      if (selectedMesa) {
        this.selectedMesa = selectedMesa;
      }
    });
  }

  // return a promise, if mesa is not null, get venta from mesa, if null create a new venta
  getVenta(): Promise<Venta> {
    // Venta rápida (sin mesa)
    if (this.ventaRapidaActual) {
      return Promise.resolve(this.ventaRapidaActual);
    }
    if (this.selectedMesa == null) {
      return Promise.reject('Mesa no seleccionada');
    } else {
      if (this.selectedMesa.venta == null || this.selectedMesa.venta.estado !== VentaEstado.ABIERTA) {
        const venta = new Venta();
        venta.estado = VentaEstado.ABIERTA;
        venta.caja = this.caja!;
        venta.mesa = this.selectedMesa;
        // save venta and return promise
        return firstValueFrom(this.repositoryService.createVenta(venta).pipe(
          map(createdVenta => {
            // Ensure estado is set (IPC serialization may lose it)
            createdVenta.estado = VentaEstado.ABIERTA;
            if (this.selectedMesa) {
              this.selectedMesa.venta = createdVenta;
              // Update mesa estado to OCUPADO
              this.updateMesaEstado(this.selectedMesa, PdvMesaEstado.OCUPADO);
            }
            return createdVenta;
          })
        ));
      } else {
        return Promise.resolve(this.selectedMesa.venta);
      }
    }
  }

  /**
   * Update the estado of a mesa
   */
  private updateMesaEstado(mesa: PdvMesa, estado: PdvMesaEstado): void {
    mesa.estado = estado;
    this.repositoryService.updatePdvMesa(mesa.id!, mesa).subscribe(
      updatedMesa => {
        console.log(`Mesa ${updatedMesa.numero} updated to estado: ${updatedMesa.estado}`);
      },
      error => {
        console.error('Error updating mesa estado:', error);
      }
    );
  }

  async findPrecioCosto(producto: Producto): Promise<number> {
    try {
      const tipo = producto.tipo;

      if (tipo === 'RETAIL' || tipo === 'RETAIL_INGREDIENTE') {
        // Costo directo del producto
        const precios = await firstValueFrom(this.repositoryService.getPreciosCostoByProducto(producto.id));
        const precioActivo = precios.find(p => p.activo);
        return precioActivo ? Number(precioActivo.valor) : 0;
      }

      if (tipo === 'ELABORADO_SIN_VARIACION') {
        // Costo desde receta.costoCalculado
        const recetaId = (producto as any).receta?.id;
        if (recetaId) {
          const receta = await firstValueFrom(this.repositoryService.getReceta(recetaId));
          if (receta?.costoCalculado) return Number(receta.costoCalculado);
        }
        // Fallback a PrecioCosto del producto
        const precios = await firstValueFrom(this.repositoryService.getPreciosCostoByProducto(producto.id));
        const precioActivo = precios.find(p => p.activo);
        return precioActivo ? Number(precioActivo.valor) : 0;
      }

      if (tipo === 'ELABORADO_CON_VARIACION') {
        // Costo desde la primera receta del producto
        const recetas = (producto as any).recetas;
        if (recetas?.length > 0 && recetas[0].costoCalculado) {
          return Number(recetas[0].costoCalculado);
        }
        return 0;
      }

      if (tipo === 'COMBO') {
        // Para combos, sumar costo de componentes (futuro)
        // Por ahora intentar PrecioCosto directo
        const precios = await firstValueFrom(this.repositoryService.getPreciosCostoByProducto(producto.id));
        const precioActivo = precios.find(p => p.activo);
        return precioActivo ? Number(precioActivo.valor) : 0;
      }

      return 0;
    } catch (error) {
      console.error('Error finding precio costo:', error);
      return 0;
    }
  }

  findPrecioPrincipal(presentacion: Presentacion): number {
    // return presentacion.preciosVenta.find(p => p.principal)?.valor || 0;
    return 0;
  }

  // --- Acciones del PdV ---

  get hasActiveVenta(): boolean {
    return this.selectedMesa?.venta != null || this.ventaRapidaActual != null;
  }

  get hasActiveItems(): boolean {
    return this.ventaItemsDataSource.data.some(i => i.estado === EstadoVentaItem.ACTIVO);
  }

  cobrarVenta(): void {
    if (!this.hasActiveVenta || !this.hasActiveItems) return;

    const venta = this.ventaRapidaActual || this.selectedMesa?.venta;
    if (!venta) return;

    const dialogData: CobrarVentaDialogData = {
      venta,
      items: this.ventaItemsDataSource.data,
      monedas: this.filteredMonedas.length > 0 ? this.filteredMonedas : this.monedas,
      exchangeRates: this.exchangeRates,
      principalMoneda: this.principalMoneda!,
      caja: this.caja!,
    };

    const dialogRef = this.dialog.open(CobrarVentaDialogComponent, {
      width: '80vw',
      height: '80vh',
      maxWidth: '95vw',
      disableClose: true,
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result?.success) {
        // Liberar mesa y limpiar estado completamente
        if (this.selectedMesa) {
          // Cerrar cualquier venta huérfana abierta en esta mesa
          await firstValueFrom(this.repositoryService.cerrarVentasAbiertasMesa(this.selectedMesa.id!, VentaEstado.CONCLUIDA));
          this.updateMesaEstado(this.selectedMesa, PdvMesaEstado.DISPONIBLE);
          this.selectedMesa.venta = null as any;
          this.selectedMesa = null;
          this.clienteNameForm.get('nombre')?.setValue('');
        }
        // Limpiar venta rápida
        if (this.ventaRapidaActual) {
          this.ventaRapidaActual = null;
        }
        // Limpiar UI
        this.ventaItemsDataSource.data = [];
        this.calculateTotals();
      }
    });
  }

  cancelarVenta(): void {
    if (!this.hasActiveVenta) return;

    const venta = this.ventaRapidaActual || this.selectedMesa?.venta;
    if (!venta) return;

    const dialogRef = this.dialog.open(CancelarVentaDialogComponent, {
      width: '400px',
      data: { venta },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.confirmed) {
        try {
          // Cancelar todos los items activos
          const activeItems = this.ventaItemsDataSource.data.filter(i => i.estado === EstadoVentaItem.ACTIVO);
          for (const item of activeItems) {
            await firstValueFrom(this.repositoryService.updateVentaItem(item.id, {
              estado: EstadoVentaItem.CANCELADO,
              canceladoPor: this.authService.currentUser,
              horaCancelado: new Date(),
            }));
          }

          // Cancelar esta venta y cualquier otra abierta de la misma mesa
          await firstValueFrom(this.repositoryService.updateVenta(venta.id, {
            estado: VentaEstado.CANCELADA,
          }));

          // Liberar mesa y limpiar estado completamente
          if (this.selectedMesa) {
            // Cerrar cualquier venta huérfana abierta en esta mesa
            await firstValueFrom(this.repositoryService.cerrarVentasAbiertasMesa(this.selectedMesa.id!, VentaEstado.CANCELADA));
            await this.updateMesaEstado(this.selectedMesa, PdvMesaEstado.DISPONIBLE);
            this.selectedMesa.venta = null as any;
            this.selectedMesa = null;
            this.clienteNameForm.get('nombre')?.setValue('');
          }

          // Limpiar venta rápida
          if (this.ventaRapidaActual) {
            this.ventaRapidaActual = null;
          }

          // Limpiar UI
          this.ventaItemsDataSource.data = [];
          this.calculateTotals();
        } catch (error) {
          console.error('Error al cancelar venta:', error);
        }
      }
    });
  }

  async ventaRapida(): Promise<void> {
    if (this.ventaRapidaActual) return;

    try {
      const venta = new Venta();
      venta.estado = VentaEstado.ABIERTA;
      venta.caja = this.caja!;
      // mesa = null (venta sin mesa)

      const createdVenta = await firstValueFrom(this.repositoryService.createVenta(venta));
      this.ventaRapidaActual = createdVenta;

      // Deseleccionar mesa si había una
      this.selectedMesa = null;
      this.ventaItemsDataSource.data = [];
      this.calculateTotals();
    } catch (error) {
      console.error('Error al crear venta rápida:', error);
    }
  }

  async cobroRapido(): Promise<void> {
    if (!this.hasActiveVenta || !this.hasActiveItems) return;

    const venta = this.ventaRapidaActual || this.selectedMesa?.venta;
    if (!venta) return;

    const items = this.ventaItemsDataSource.data.filter(i => i.estado === EstadoVentaItem.ACTIVO);
    const total = items.reduce((sum, i) => sum + (i.precioVentaUnitario - (i.descuentoUnitario || 0)) * i.cantidad, 0);
    if (total <= 0) return;

    try {
      const formasPago = await firstValueFrom(this.repositoryService.getFormasPago());
      const fpPrincipal = formasPago.find(fp => fp.principal && fp.activo) || formasPago.find(fp => fp.activo);
      if (!fpPrincipal || !this.principalMoneda) return;

      const pago = await firstValueFrom(this.repositoryService.createPago({
        estado: PagoEstado.PAGADO,
        caja: this.caja!,
        activo: true,
      }));

      await firstValueFrom(this.repositoryService.createPagoDetalle({
        valor: total,
        descripcion: 'COBRO RAPIDO',
        tipo: TipoDetalle.PAGO,
        pago,
        moneda: this.principalMoneda,
        formaPago: fpPrincipal,
        activo: true,
      }));

      await firstValueFrom(this.repositoryService.updateVenta(venta.id, {
        estado: VentaEstado.CONCLUIDA,
        formaPago: fpPrincipal,
        pago,
        fechaCierre: new Date(),
      }));

      if (this.selectedMesa) {
        // Cerrar cualquier venta huérfana abierta en esta mesa
        await firstValueFrom(this.repositoryService.cerrarVentasAbiertasMesa(this.selectedMesa.id!, VentaEstado.CONCLUIDA));
        await firstValueFrom(this.repositoryService.updatePdvMesa(this.selectedMesa.id!, { estado: PdvMesaEstado.DISPONIBLE } as any));
        this.selectedMesa.venta = null as any;
        this.selectedMesa = null;
        this.clienteNameForm.get('nombre')?.setValue('');
      }
      if (this.ventaRapidaActual) {
        this.ventaRapidaActual = null;
      }

      this.ventaItemsDataSource.data = [];
      this.calculateTotals();
      await this.loadMesas();
    } catch (error) {
      console.error('Error al realizar cobro rápido:', error);
    }
  }

  async cerrarCaja(): Promise<void> {
    if (!this.caja) return;

    // Verificar ventas abiertas
    const ventas = await firstValueFrom(this.repositoryService.getVentasByCaja(this.caja.id));
    const ventasAbiertas = ventas.filter(v => v.estado === VentaEstado.ABIERTA);

    if (ventasAbiertas.length > 0) {
      const listaVentas = ventasAbiertas.map(v => `• Venta #${v.id} - ${v.nombreCliente || 'Sin cliente'}`).join('\n');
      this.dialog.open(ConfirmationDialogComponent, {
        width: '400px',
        data: {
          title: 'NO SE PUEDE CERRAR LA CAJA',
          message: `Hay ${ventasAbiertas.length} venta(s) abierta(s). Debe cerrar o cancelar todas las ventas antes de cerrar la caja.\n\n${listaVentas}`,
          confirmText: 'ENTENDIDO',
          showCancel: false
        },
      });
      return;
    }

    // Abrir diálogo de cierre con conteo de billetes (mismo componente que apertura)
    const dialogRef = this.dialog.open(CreateCajaDialogComponent, {
      width: '80vw',
      height: '80vh',
      disableClose: true,
      data: { mode: 'conteo', cajaId: this.caja.id },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.caja = null;
        this.tabsService.removeTabById('pdv');
      }
    });
  }

  openDelivery(): void {
    // TODO: Abrir diálogo de gestión de delivery
    this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: { title: 'DELIVERY', message: 'Gestión de delivery será implementada próximamente.', confirmText: 'CERRAR', showCancel: false },
    });
  }

  openUtilitarios(): void {
    // TODO: Abrir diálogo con opciones: gastos, retiros, últimas ventas, etc.
    this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: { title: 'UTILITARIOS', message: 'Módulo de utilitarios será implementado próximamente.\n\n• Gastos\n• Retiros\n• Últimas ventas\n• Cierre parcial', confirmText: 'CERRAR', showCancel: false },
    });
  }

  aplicarDescuentoVenta(): void {
    if (!this.hasActiveVenta) return;

    const venta = this.ventaRapidaActual || this.selectedMesa?.venta;
    if (!venta) return;

    // Calcular subtotal de items activos
    const subtotal = this.ventaItemsDataSource.data
      .filter(i => i.estado === EstadoVentaItem.ACTIVO)
      .reduce((sum, i) => sum + (i.precioVentaUnitario * i.cantidad), 0);

    const dialogRef = this.dialog.open(DescuentoDialogComponent, {
      width: '450px',
      data: {
        subtotal,
        descuentoPorcentaje: venta.descuentoPorcentaje,
        descuentoMonto: venta.descuentoMonto,
        descuentoMotivo: venta.descuentoMotivo,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result !== null && result !== undefined) {
        try {
          await firstValueFrom(this.repositoryService.updateVenta(venta.id, {
            descuentoPorcentaje: result.descuentoPorcentaje,
            descuentoMonto: result.descuentoMonto,
            descuentoMotivo: result.descuentoMotivo,
          }));
          venta.descuentoPorcentaje = result.descuentoPorcentaje;
          venta.descuentoMonto = result.descuentoMonto;
          venta.descuentoMotivo = result.descuentoMotivo;
          this.calculateTotals();
        } catch (error) {
          console.error('Error al aplicar descuento:', error);
        }
      }
    });
  }

  transferirMesa(): void {
    if (!this.selectedMesa || !this.selectedMesa.venta) return;

    const dialogRef = this.dialog.open(TransferirMesaDialogComponent, {
      width: '500px',
      data: { mesaActual: this.selectedMesa },
    });

    dialogRef.afterClosed().subscribe(async (mesaDestino: PdvMesa | null) => {
      if (mesaDestino && this.selectedMesa?.venta) {
        try {
          const ventaOrigenId = this.selectedMesa.venta.id;

          if (mesaDestino.venta?.id) {
            // Mesa destino tiene venta abierta: mover items + pago a la venta destino
            const items = this.ventaItemsDataSource.data.filter(i => i.estado === EstadoVentaItem.ACTIVO);
            for (const item of items) {
              await firstValueFrom(this.repositoryService.updateVentaItem(item.id, {
                venta: { id: mesaDestino.venta.id } as any,
              }));
            }
            // Transferir pago y nombre de cliente si la venta destino no tiene
            const ventaOrigen = await firstValueFrom(this.repositoryService.getVenta(ventaOrigenId));
            const updateData: any = {};
            if (ventaOrigen?.pago?.id) {
              updateData.pago = ventaOrigen.pago;
            }
            if (ventaOrigen?.nombreCliente && !mesaDestino.venta.nombreCliente) {
              updateData.nombreCliente = ventaOrigen.nombreCliente;
            }
            if (Object.keys(updateData).length > 0) {
              await firstValueFrom(this.repositoryService.updateVenta(mesaDestino.venta.id, updateData));
            }
            // Cancelar la venta origen
            await firstValueFrom(this.repositoryService.updateVenta(ventaOrigenId, {
              estado: VentaEstado.CANCELADA,
            }));
          } else {
            // Mesa destino libre: mover la venta completa (pago va con la venta)
            await firstValueFrom(this.repositoryService.updateVenta(ventaOrigenId, {
              mesa: { id: mesaDestino.id } as any,
            }));
          }

          // Liberar mesa origen
          await firstValueFrom(this.repositoryService.updatePdvMesa(this.selectedMesa.id!, { estado: PdvMesaEstado.DISPONIBLE } as any));

          // Ocupar mesa destino
          await firstValueFrom(this.repositoryService.updatePdvMesa(mesaDestino.id!, { estado: PdvMesaEstado.OCUPADO } as any));

          // Limpiar UI
          this.selectedMesa = null;
          this.ventaItemsDataSource.data = [];
          this.calculateTotals();

          // Recargar mesas
          await this.loadMesas();
        } catch (error) {
          console.error('Error al transferir mesa:', error);
        }
      }
    });
  }

  imprimirPreCuenta(): void {
    if (!this.hasActiveVenta) return;
    const venta = this.ventaRapidaActual || this.selectedMesa?.venta;
    if (!venta) return;

    const items = this.ventaItemsDataSource.data.filter(i => i.estado === EstadoVentaItem.ACTIVO);
    const total = items.reduce((sum, i) => sum + (i.precioVentaUnitario - (i.descuentoUnitario || 0)) * i.cantidad, 0);
    const mesaNum = this.selectedMesa?.numero || 'V. RÁPIDA';

    // Por ahora mostrar en diálogo (futuro: enviar a impresora)
    const lineas = items.map(i =>
      `${i.producto?.nombre || 'PRODUCTO'} x${i.cantidad} - ${((i.precioVentaUnitario - (i.descuentoUnitario || 0)) * i.cantidad).toLocaleString('es-PY')}`
    );

    const contenido = [
      `========== PRE-CUENTA ==========`,
      `Mesa: ${mesaNum}`,
      `Fecha: ${new Date().toLocaleString('es-PY')}`,
      `--------------------------------`,
      ...lineas,
      `--------------------------------`,
      `TOTAL: ${this.principalMoneda?.simbolo} ${total.toLocaleString('es-PY')}`,
      `================================`,
      `*** ESTE NO ES UN COMPROBANTE ***`,
    ].join('\n');

    // Abrir diálogo simple con la pre-cuenta
    this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'PRE-CUENTA',
        message: contenido,
        confirmText: 'CERRAR',
        showCancel: false,
      },
    });
  }

  moverItems(): void {
    if (!this.hasActiveVenta || !this.hasActiveItems) return;

    if (!this.moverItemsMode) {
      // Entrar en modo selección
      this.moverItemsMode = true;
      this.selectedItemIds.clear();
      this.columnsToDisplayWithExpand = ['select', ...this.displayedColumns];
      return;
    }

    // Ya estamos en modo — confirmar mover
    if (this.selectedItemIds.size === 0) return;

    const activeItems = this.ventaItemsDataSource.data.filter(i => i.estado === EstadoVentaItem.ACTIVO);
    const allSelected = activeItems.every(i => this.selectedItemIds.has(i.id));

    if (allSelected) {
      // Todos seleccionados — preguntar si transferir mesa completa
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '400px',
        data: {
          title: 'TRANSFERIR MESA COMPLETA',
          message: 'Todos los items están seleccionados. ¿Desea transferir la mesa completa (incluyendo cobros y datos del cliente)?',
          confirmText: 'TRANSFERIR MESA',
          cancelText: 'SOLO ITEMS',
        },
      });

      dialogRef.afterClosed().subscribe((transferirCompleta: boolean) => {
        if (transferirCompleta === true) {
          this.cancelarMoverItems();
          this.transferirMesa();
        } else if (transferirCompleta === false) {
          this.ejecutarMoverItems();
        }
        // Si es undefined (cerró el diálogo), no hacer nada
      });
    } else {
      this.ejecutarMoverItems();
    }
  }

  toggleItemSelection(itemId: number): void {
    if (this.selectedItemIds.has(itemId)) {
      this.selectedItemIds.delete(itemId);
    } else {
      this.selectedItemIds.add(itemId);
    }
  }

  toggleSelectAll(): void {
    const activeItems = this.ventaItemsDataSource.data.filter(i => i.estado === EstadoVentaItem.ACTIVO);
    const allSelected = activeItems.every(i => this.selectedItemIds.has(i.id));
    if (allSelected) {
      this.selectedItemIds.clear();
    } else {
      activeItems.forEach(i => this.selectedItemIds.add(i.id));
    }
  }

  isAllSelected(): boolean {
    const activeItems = this.ventaItemsDataSource.data.filter(i => i.estado === EstadoVentaItem.ACTIVO);
    return activeItems.length > 0 && activeItems.every(i => this.selectedItemIds.has(i.id));
  }

  cancelarMoverItems(): void {
    this.moverItemsMode = false;
    this.selectedItemIds.clear();
    this.columnsToDisplayWithExpand = [...this.displayedColumns];
  }

  private ejecutarMoverItems(): void {
    if (!this.selectedMesa) return;

    const dialogRef = this.dialog.open(TransferirMesaDialogComponent, {
      width: '500px',
      data: { mesaActual: this.selectedMesa },
    });

    dialogRef.afterClosed().subscribe(async (mesaDestino: PdvMesa | null) => {
      if (!mesaDestino || !this.selectedMesa?.venta) {
        return;
      }

      try {
        // Obtener o crear venta en mesa destino
        let ventaDestinoId: number;
        if (mesaDestino.venta?.id) {
          ventaDestinoId = mesaDestino.venta.id;
        } else {
          const nuevaVenta = await firstValueFrom(this.repositoryService.createVenta({
            estado: VentaEstado.ABIERTA,
            caja: this.caja!,
            mesa: { id: mesaDestino.id } as any,
          } as any));
          nuevaVenta.estado = VentaEstado.ABIERTA;
          ventaDestinoId = nuevaVenta.id;
          await firstValueFrom(this.repositoryService.updatePdvMesa(mesaDestino.id!, { estado: PdvMesaEstado.OCUPADO } as any));
        }

        // Mover items seleccionados
        const itemsToMove = this.ventaItemsDataSource.data.filter(i => this.selectedItemIds.has(i.id));
        for (const item of itemsToMove) {
          await firstValueFrom(this.repositoryService.updateVentaItem(item.id, {
            venta: { id: ventaDestinoId } as any,
          }));
        }

        // Verificar si quedan items activos en la mesa origen
        const itemsRestantes = this.ventaItemsDataSource.data.filter(
          i => i.estado === EstadoVentaItem.ACTIVO && !this.selectedItemIds.has(i.id)
        );

        if (itemsRestantes.length === 0) {
          // No quedan items — desocupar mesa origen
          await firstValueFrom(this.repositoryService.updateVenta(this.selectedMesa.venta.id, {
            estado: VentaEstado.CANCELADA,
          }));
          await firstValueFrom(this.repositoryService.updatePdvMesa(this.selectedMesa.id!, { estado: PdvMesaEstado.DISPONIBLE } as any));
          this.selectedMesa = null;
          this.ventaItemsDataSource.data = [];
        } else {
          // Quedan items — recargar la mesa
          this.ventaItemsDataSource.data = itemsRestantes;
        }

        this.cancelarMoverItems();
        this.calculateTotals();
        await this.loadMesas();
      } catch (error) {
        console.error('Error al mover items:', error);
      }
    });
  }

  dividirCuenta(): void {
    if (!this.hasActiveVenta || !this.hasActiveItems) return;

    const venta = this.ventaRapidaActual || this.selectedMesa?.venta;
    if (!venta) return;

    const activeItems = this.ventaItemsDataSource.data.filter(i => i.estado === EstadoVentaItem.ACTIVO);
    const total = activeItems.reduce((sum, i) => sum + (i.precioVentaUnitario - (i.descuentoUnitario || 0)) * i.cantidad, 0);

    const dialogRef = this.dialog.open(DividirCuentaDialogComponent, {
      width: '500px',
      data: { items: activeItems, total },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        // La división crea ventas hijas — cada una se cobra por separado
        // Por ahora loguear el resultado, implementación completa con backend en siguiente iteración
        console.log('División de cuenta:', result);
      }
    });
  }

  asociarCliente(): void {
    if (!this.hasActiveVenta) return;

    const venta = this.ventaRapidaActual || this.selectedMesa?.venta;
    if (!venta) return;

    const dialogRef = this.dialog.open(BuscarClienteDialogComponent, {
      width: '600px',
    });

    dialogRef.afterClosed().subscribe(async (cliente) => {
      if (cliente && venta) {
        try {
          await firstValueFrom(this.repositoryService.updateVenta(venta.id, {
            cliente: cliente,
            nombreCliente: `${cliente.persona?.nombre || ''} ${cliente.razon_social || ''}`.trim().toUpperCase(),
          }));
          venta.cliente = cliente;
          venta.nombreCliente = `${cliente.persona?.nombre || ''} ${cliente.razon_social || ''}`.trim().toUpperCase();
        } catch (error) {
          console.error('Error al asociar cliente:', error);
        }
      }
    });
  }

  // --- Atajos de teclado ---
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // No disparar si hay un diálogo abierto
    if (this.dialog.openDialogs.length > 0) return;

    switch (event.key) {
      case 'F1':
        event.preventDefault();
        this.cobrarVenta();
        break;
      case 'F2':
        event.preventDefault();
        this.cobroRapido();
        break;
      case 'F3':
        event.preventDefault();
        this.openProductSearchDialog();
        break;
      case 'F4':
        event.preventDefault();
        this.cancelarVenta();
        break;
      case 'F5':
        event.preventDefault();
        this.imprimirPreCuenta();
        break;
      case 'Escape':
        event.preventDefault();
        if (this.ventaRapidaActual) {
          // No deseleccionar — mantener venta rápida
        } else {
          this.selectedMesa = null;
          this.ventaItemsDataSource.data = [];
          this.calculateTotals();
        }
        break;
    }
  }

  // Search products using dialog
  openProductSearchDialog(): void {
    console.log('opening product search dialog');
    const searchTerm = this.searchForm.get('searchTerm')?.value?.trim() || '';

    const dialogRef = this.dialog.open(ProductoSearchDialogComponent, {
      width: '70%',
      height: '80%',
      data: { searchTerm, cantidad: this.searchForm.get('cantidad')?.value }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addProduct(result.producto, result.presentacion, result.cantidad, result.precioVenta);
        // Clear search term after adding product
        this.searchForm.get('searchTerm')?.setValue('');
      }
    });
  }

  // Handle search from input
  onSearchKeyDown(event: KeyboardEvent): void {
    console.log(event.key);
    if (event.key === '*') {
      const textBeforeAsterisk = (event.target as HTMLInputElement).value.split('*')[0];
      if (!isNaN(Number(textBeforeAsterisk))) {
        setTimeout(() => {
          this.searchForm.patchValue({
            cantidad: Number(textBeforeAsterisk),
            searchTerm: ''
          });
        }, 100);
      }
    } else if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission
      this.openProductSearchDialog();
    }
  }

  // Search products (called from template)
  searchProducts(): void {
    this.openProductSearchDialog();
  }

  selectMesa(mesa: PdvMesa): void {
    this.selectedMesa = mesa;

    // Reset cliente name form when selecting a new mesa
    this.isEditingClienteName = false;

    // Reset the nombre in the form if the mesa has a venta with a nombre_cliente
    if (mesa.venta && mesa.venta.nombreCliente) {
      this.clienteNameForm.get('nombre')?.setValue(mesa.venta.nombreCliente);
    } else {
      this.clienteNameForm.get('nombre')?.setValue('');
    }

    // Load venta items if mesa has a venta
    this.loadVentaItems(mesa);
  }

  /**
   * Load venta items for a selected mesa
   */
  async loadVentaItems(mesa: PdvMesa): Promise<void> {
    // Reset ventaItems
    this.ventaItemsDataSource.data = [];

    if (mesa.venta && mesa.venta.id) {
      try {
        // Load venta items for this venta
        const items = await firstValueFrom(this.repositoryService.getVentaItems(mesa.venta.id));
        // Cargar observaciones de cada item
        for (const item of items) {
          const obs = await firstValueFrom(this.repositoryService.getObservacionesByVentaItem(item.id));
          (item as any).observacionesVinculadas = obs;
        }
        this.ventaItemsDataSource.data = items;
        console.log(this.ventaItemsDataSource.data);
        // Calculate totals based on loaded items
        this.calculateTotals();
      } catch (error) {
        console.error('Error loading venta items:', error);
        // Reset items and totals on error
        this.ventaItemsDataSource.data = [];
        this.calculateTotals();
      }
    } else {
      // If there is no venta, clear the table
      this.ventaItemsDataSource.data = [];
      this.calculateTotals();
    }
  }

  /**
   * Start editing cliente name
   */
  startEditingClienteName(): void {
    this.isEditingClienteName = true;

    // Set initial value if available
    if (this.selectedMesa?.venta?.nombreCliente) {
      this.clienteNameForm.get('nombre')?.setValue(this.selectedMesa.venta.nombreCliente);
    } else {
      this.clienteNameForm.get('nombre')?.setValue('');
    }

    // Focus on the input field
    setTimeout(() => {
      const inputElement = document.querySelector('input[formControlName="nombre"]');
      if (inputElement) {
        (inputElement as HTMLInputElement).focus();
      }
    }, 100);
  }

  /**
   * Save cliente name
   */
  async saveClienteName(): Promise<void> {
    if (!this.selectedMesa) return;

    const raw = this.clienteNameForm.get('nombre')?.value || '';
    const nombreCliente = raw.replace(/\b\w/g, (c: string) => c.toUpperCase());
    this.clienteNameForm.get('nombre')?.setValue(nombreCliente, { emitEvent: false });

    try {
      let venta = this.selectedMesa.venta;

      if (!venta) {
        // Create a new venta if none exists
        venta = await this.getVenta();
      }

      // Update the nombreCliente
      venta.nombreCliente = nombreCliente;

      // Update the venta in the database
      const updatedVenta = await firstValueFrom(this.repositoryService.updateVenta(venta.id!, venta));

      // Update the local reference
      if (this.selectedMesa) {
        this.selectedMesa.venta = updatedVenta;

        // Update mesa estado to OCUPADO
        if (this.selectedMesa.estado !== PdvMesaEstado.OCUPADO) {
          this.updateMesaEstado(this.selectedMesa, PdvMesaEstado.OCUPADO);
        }
      }

      // Exit editing mode
      this.isEditingClienteName = false;
    } catch (error) {
      console.error('Error saving cliente name:', error);
    }
  }

  /**
   * Cancel editing cliente name
   */
  cancelEditingClienteName(): void {
    this.isEditingClienteName = false;
  }

  /**
   * Handle key press in cliente name input
   */
  onClienteNameKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.saveClienteName();
    } else if (event.key === 'Escape') {
      this.cancelEditingClienteName();
    }
  }

  /**
   * Calculates the time the caja has been open and returns a formatted string (hours and minutes)
   * @returns String with formatted time e.g. "2h 45m"
   */
  timeOpen(): string {
    if (!this.caja?.fechaApertura) {
      return '0h 0m';
    }

    const fechaApertura = new Date(this.caja.fechaApertura);
    const now = new Date();

    // Calculate the difference in milliseconds
    const diffMs = now.getTime() - fechaApertura.getTime();

    // Convert to hours and minutes
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }


} 