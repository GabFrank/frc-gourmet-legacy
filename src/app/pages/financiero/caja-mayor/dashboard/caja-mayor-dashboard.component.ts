import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatGridListModule } from '@angular/material/grid-list';
import { TabsService } from 'src/app/services/tabs.service';
import { ListCajasMayorComponent } from '../list-cajas-mayor/list-cajas-mayor.component';
import { ListGastosComponent } from '../gastos/list-gastos/list-gastos.component';
import { ListGastoCategoriasComponent } from '../gastos/categorias/list-gasto-categorias.component';
import { ListRetirosCajaComponent } from '../retiros/list-retiros-caja/list-retiros-caja.component';
import { ListCuentasBancariasComponent } from '../bancos/list-cuentas-bancarias/list-cuentas-bancarias.component';
import { ListMaquinasPosComponent } from '../pos/list-maquinas-pos/list-maquinas-pos.component';
import { ListAcreditacionesPosComponent } from '../pos/acreditaciones/list-acreditaciones-pos.component';
import { ListCuentasPorPagarComponent } from '../cuentas-por-pagar/list-cuentas-por-pagar/list-cuentas-por-pagar.component';
import { ListCompraCategoriasComponent } from 'src/app/pages/compras/categorias/list-compra-categorias.component';

@Component({
  selector: 'app-caja-mayor-dashboard',
  templateUrl: './caja-mayor-dashboard.component.html',
  styleUrls: ['./caja-mayor-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatGridListModule,
  ]
})
export class CajaMayorDashboardComponent implements OnInit {
  dashboardItems = [
    {
      title: 'Cajas Mayor',
      description: 'Abrir, cerrar y administrar cajas mayor',
      icon: 'account_balance',
      route: 'cajas-mayor',
      color: '#1b5e20'
    },
    {
      title: 'Gastos',
      description: 'Registrar y consultar gastos categorizados',
      icon: 'receipt_long',
      route: 'gastos',
      color: '#e65100'
    },
    {
      title: 'Categorias de Gasto',
      description: 'Administrar categorias y subcategorias de gastos',
      icon: 'category',
      route: 'gasto-categorias',
      color: '#4a148c'
    },
    {
      title: 'Retiros de Caja',
      description: 'Retiros de cajas de venta e ingresos a caja mayor',
      icon: 'move_up',
      route: 'retiros',
      color: '#0d47a1'
    },
    {
      title: 'Cuentas Bancarias',
      description: 'Administrar cuentas bancarias y saldos',
      icon: 'account_balance_wallet',
      route: 'cuentas-bancarias',
      color: '#00695c'
    },
    {
      title: 'Maquinas POS',
      description: 'Configurar terminales de tarjetas con cuenta destino y comisión',
      icon: 'credit_card',
      route: 'maquinas-pos',
      color: '#3949ab'
    },
    {
      title: 'Acreditaciones POS',
      description: 'Verificar acreditaciones, diferencias y comisiones',
      icon: 'fact_check',
      route: 'acreditaciones-pos',
      color: '#ad1457'
    },
    {
      title: 'Cuentas por Pagar',
      description: 'Gestionar deudas, préstamos y cuotas pendientes',
      icon: 'request_quote',
      route: 'cuentas-por-pagar',
      color: '#bf360c'
    },
    {
      title: 'Categorías de Compra',
      description: 'Administrar categorías para clasificar compras',
      icon: 'inventory_2',
      route: 'compra-categorias',
      color: '#5d4037'
    },
  ];

  constructor(private tabsService: TabsService) {}

  ngOnInit(): void {}

  setData(data: any): void {}

  navigateTo(route: string): void {
    switch (route) {
      case 'cajas-mayor':
        this.tabsService.openTab('Cajas Mayor', ListCajasMayorComponent);
        break;
      case 'gastos':
        this.tabsService.openTab('Gastos', ListGastosComponent);
        break;
      case 'gasto-categorias':
        this.tabsService.openTab('Categorias de Gasto', ListGastoCategoriasComponent);
        break;
      case 'retiros':
        this.tabsService.openTab('Retiros de Caja', ListRetirosCajaComponent);
        break;
      case 'cuentas-bancarias':
        this.tabsService.openTab('Cuentas Bancarias', ListCuentasBancariasComponent);
        break;
      case 'maquinas-pos':
        this.tabsService.openTab('Maquinas POS', ListMaquinasPosComponent);
        break;
      case 'acreditaciones-pos':
        this.tabsService.openTab('Acreditaciones POS', ListAcreditacionesPosComponent);
        break;
      case 'cuentas-por-pagar':
        this.tabsService.openTab('Cuentas por Pagar', ListCuentasPorPagarComponent);
        break;
      case 'compra-categorias':
        this.tabsService.openTab('Categorías de Compra', ListCompraCategoriasComponent);
        break;
    }
  }
}
