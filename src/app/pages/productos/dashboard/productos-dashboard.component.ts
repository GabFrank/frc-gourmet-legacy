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
import { ListRecetasComponent } from '../../gestion-recetas/list-recetas/list-recetas.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-productos-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatGridListModule,
    MatTooltipModule
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
      color: '#4caf50',
      disabled: false
    },
    {
      title: 'Subfamilias',
      description: 'Administrar subfamilias de productos',
      icon: 'subdirectory_arrow_right',
      route: 'subfamilias',
      color: '#2196f3',
      disabled: true
    },
    {
      title: 'Productos',
      description: 'Gestión completa de productos',
      icon: 'restaurant',
      route: 'productos',
      color: '#f44336',
      disabled: false
    },
    {
      title: 'Presentaciones',
      description: 'Administrar presentaciones y códigos de barra',
      icon: 'inventory',
      route: 'presentaciones',
      color: '#ff9800',
      disabled: true
    },
    {
      title: 'Precios de Venta',
      description: 'Configurar precios de venta por presentación',
      icon: 'sell',
      route: 'precos-venda',
      color: '#9c27b0',
      disabled: true
    },
    {
      title: 'Precios de Costo',
      description: 'Administrar precios de costo de productos',
      icon: 'attach_money',
      route: 'precos-costo',
      color: '#e91e63',
      disabled: true
    },
    {
      title: 'Recetas',
      description: 'Gestión de recetas e ingredientes',
      icon: 'menu_book',
      route: 'recetas',
      color: '#795548',
      disabled: false
    },
    {
      title: 'Stock',
      description: 'Movimientos y control de inventario',
      icon: 'inventory_2',
      route: 'stock',
      color: '#607d8b',
      disabled: true
    },
    {
      title: 'Combos',
      description: 'Administrar combos y paquetes de productos',
      icon: 'restaurant_menu',
      route: 'combos',
      color: '#3f51b5',
      disabled: true
    },
    {
      title: 'Promociones',
      description: 'Configurar promociones y ofertas especiales',
      icon: 'local_offer',
      route: 'promociones',
      color: '#009688',
      disabled: true
    },
    {
      title: 'Producción',
      description: 'Registros de producción y costos',
      icon: 'precision_manufacturing',
      route: 'produccion',
      color: '#cddc39',
      disabled: true
    },
    {
      title: 'Sistema Pizza',
      description: 'Sabores, tamaños y ensamblado de pizzas',
      icon: 'local_pizza',
      route: 'pizza',
      color: '#ffc107',
      disabled: true
    }
  ];

  constructor(
    private router: Router,
    private tabsService: TabsService
  ) {}

  // Method to navigate to different productos sections
  navigateTo(item: any): void {
    if (item.disabled) return;

    console.log(`Navigating to productos: ${item.route}`);

    switch (item.route) {
      case 'familias':
        this.tabsService.openTab(
          'Familias',
          ListFamiliasComponent,
          { source: 'dashboard' },
          'familias-tab',
          true
        );
        break;
      case 'productos':
        this.tabsService.openTab(
          'Productos',
          ListProductosComponent,
          { source: 'dashboard' },
          'productos-tab',
          true
        );
        break;
      case 'recetas':
        this.tabsService.openTab(
          'Recetas',
          ListRecetasComponent,
          { source: 'dashboard' },
          'recetas-tab',
          true
        );
        break;
      default:
        console.warn(`Unknown or disabled route: ${item.route}`);
        break;
    }
  }
} 