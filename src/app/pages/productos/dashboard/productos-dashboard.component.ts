import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatGridListModule } from '@angular/material/grid-list';
import { Router } from '@angular/router';
import { TabsService } from '../../../services/tabs.service';
import { ListFamiliasComponent } from '../familias/list-familias.component';
import { ListProductosComponent } from '../list-productos/list-productos.component';

@Component({
  selector: 'app-productos-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatGridListModule
  ],
  templateUrl: './productos-dashboard.component.html',
  styleUrls: ['./productos-dashboard.component.scss']
})
export class ProductosDashboardComponent {
  // Dashboard cards for productos management
  dashboardItems = [
    {
      title: 'Familias',
      description: 'Administrar familias de productos',
      icon: 'category',
      route: 'familias',
      color: '#4caf50'
    },
    {
      title: 'Subfamilias', 
      description: 'Administrar subfamilias de productos',
      icon: 'subdirectory_arrow_right',
      route: 'subfamilias',
      color: '#2196f3'
    },
    {
      title: 'productos',
      description: 'Gestión completa de productos',
      icon: 'restaurant',
      route: 'productos',
      color: '#f44336'
    },
    {
      title: 'Presentaciones',
      description: 'Administrar presentaciones y códigos de barra',
      icon: 'inventory',
      route: 'presentaciones',
      color: '#ff9800'
    },
    {
      title: 'Preços de Venda',
      description: 'Configurar precios de venta por presentación',
      icon: 'sell',
      route: 'precos-venda',
      color: '#9c27b0'
    },
    {
      title: 'Preços de Costo',
      description: 'Administrar precios de costo de productos',
      icon: 'attach_money',
      route: 'precos-costo',
      color: '#e91e63'
    },
    {
      title: 'Recetas',
      description: 'Gestión de recetas e ingredientes',
      icon: 'menu_book',
      route: 'recetas',
      color: '#795548'
    },
    {
      title: 'Stock',
      description: 'Movimientos y control de inventario',
      icon: 'inventory_2',
      route: 'stock',
      color: '#607d8b'
    },
    {
      title: 'Combos',
      description: 'Administrar combos y paquetes de productos',
      icon: 'restaurant_menu',
      route: 'combos',
      color: '#3f51b5'
    },
    {
      title: 'Promociones',
      description: 'Configurar promociones y ofertas especiales',
      icon: 'local_offer',
      route: 'promociones',
      color: '#009688'
    },
    {
      title: 'Producción',
      description: 'Registros de producción y costos',
      icon: 'precision_manufacturing',
      route: 'produccion',
      color: '#cddc39'
    },
    {
      title: 'Sistema Pizza',
      description: 'Sabores, tamaños y ensamblado de pizzas',
      icon: 'local_pizza',
      route: 'pizza',
      color: '#ffc107'
    }
  ];

  constructor(
    private router: Router,
    private tabsService: TabsService
  ) {}

  // Method to navigate to different productos sections
  navigateTo(route: string): void {
    console.log(`Navigating to productos: ${route}`);
    
    switch (route) {
      case 'familias':
        this.tabsService.openTab(
          'Familias',
          ListFamiliasComponent,
          { source: 'dashboard' },
          'familias-tab',
          true
        );
        break;
      case 'subfamilias':
        // this.tabsService.openTab(
        //   'Subfamilias',
        //   ListSubfamiliasComponent,
        //   { source: 'dashboard' },
        //   'subfamilias-tab',
        //   true
        // );
        break;
      case 'productos':
        this.tabsService.openTab(
          'productos',
          ListProductosComponent,
          { source: 'dashboard' },
          'productos-tab',
          true
        );
        break;
      case 'presentaciones':
        // this.tabsService.openTab(
        //   'Presentaciones',
        //   ListPresentacionesComponent,
        //   { source: 'dashboard' },
        //   'presentaciones-tab',
        //   true
        // );
        break;
      case 'precos-venda':
        // this.tabsService.openTab(
        //   'Preços de Venda',
        //   ListPrecosVendaComponent,
        //   { source: 'dashboard' },
        //   'precos-venda-tab',
        //   true
        // );
        break;
      case 'precos-costo':
        // this.tabsService.openTab(
        //   'Preços de Costo',
        //   ListPrecosCostoComponent,
        //   { source: 'dashboard' },
        //   'precos-costo-tab',
        //   true
        // );
        break;
      case 'recetas':
        // this.tabsService.openTab(
        //   'Recetas',
        //   ListRecetasComponent,
        //   { source: 'dashboard' },
        //   'recetas-tab',
        //   true
        // );
        break;
      case 'stock':
        // this.tabsService.openTab(
        //   'Stock',
        //   ListStockMovimientosComponent,
        //   { source: 'dashboard' },
        //   'stock-tab',
        //   true
        // );
        break;
      case 'combos':
        // this.tabsService.openTab(
        //   'Combos',
        //   ListCombosComponent,
        //   { source: 'dashboard' },
        //   'combos-tab',
        //   true
        // );
        break;
      case 'promociones':
        // this.tabsService.openTab(
        //   'Promociones',
        //   ListPromocionesComponent,
        //   { source: 'dashboard' },
        //   'promociones-tab',
        //   true
        // );
        break;
      case 'produccion':
        // this.tabsService.openTab(
        //   'Producción',
        //   ListProduccionComponent,
        //   { source: 'dashboard' },
        //   'produccion-tab',
        //   true
        // );
        break;
      case 'pizza':
        // this.tabsService.openTab(
        //   'Sistema Pizza',
        //   PizzaDashboardComponent,
        //   { source: 'dashboard' },
        //   'pizza-tab',
        //   true
        // );
        break;
      default:
        console.warn(`Unknown route: ${route}`);
        break;
    }
  }
} 