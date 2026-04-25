import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { RepositoryService } from '../../../database/repository.service';
import { TabsService } from '../../../services/tabs.service';
import { PdvComponent } from '../pdv/pdv.component';
import { ListPreciosDeliveryComponent } from '../precios-delivery/list-precios-delivery.component';
import { ListVentasComponent } from '../historial/list-ventas.component';
import { PdvConfigDialogComponent } from 'src/app/shared/components/pdv-config-dialog/pdv-config-dialog.component';
import { PdvMesaDialogComponent } from 'src/app/shared/components/pdv-mesa-dialog/pdv-mesa-dialog.component';
import { ComandaAbmDialogComponent } from 'src/app/shared/components/comanda-abm-dialog/comanda-abm-dialog.component';
import { AtajoConfigDialogComponent } from 'src/app/shared/components/atajo-config-dialog/atajo-config-dialog.component';
import { CajaMayorDashboardComponent } from '../../financiero/caja-mayor/dashboard/caja-mayor-dashboard.component';

interface CajaAbierta {
  id: number;
  cajero: string;
  horaApertura: Date;
  horasAbierto: string;
  valorAperturaPYG: number;
  valorAperturaUSD: number;
  ventaTotal: number;
  mesasAtendidas: number;
  cantidadVentas: number;
}

interface TopProducto {
  nombre: string;
  cantidad: number;
  total: number;
  porcentaje: number;
}

interface RangoChip {
  label: string;
  value: string;
  selected: boolean;
}

@Component({
  selector: 'app-ventas-dashboard',
  templateUrl: './ventas-dashboard.component.html',
  styleUrls: ['./ventas-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatExpansionModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressBarModule,
    NgChartsModule
  ]
})
export class VentasDashboardComponent implements OnInit {

  // --- Accesos directos ---
  quickActions = [
    {
      title: 'Abrir PdV',
      icon: 'point_of_sale',
      action: 'pdv',
      color: '#4caf50'
    },
    {
      title: 'Gestionar Mesas',
      icon: 'table_restaurant',
      action: 'mesas',
      color: '#ff9800'
    },
    {
      title: 'Gestionar Comandas',
      icon: 'receipt_long',
      action: 'comandas',
      color: '#00bcd4'
    },
    {
      title: 'Configurar PdV',
      icon: 'tune',
      action: 'pdv-config',
      color: '#9c27b0'
    },
    {
      title: 'Accesos Rápidos',
      icon: 'touch_app',
      action: 'atajo-config',
      color: '#ff9800'
    },
    {
      title: 'Precios Delivery',
      icon: 'local_shipping',
      action: 'precios-delivery',
      color: '#e91e63'
    },
    {
      title: 'Deliveries',
      icon: 'delivery_dining',
      action: 'deliveries',
      color: '#f44336'
    },
    {
      title: 'Listado Ventas',
      icon: 'receipt_long',
      action: 'ventas-list',
      color: '#2196f3'
    },
    {
      title: 'Reportes',
      icon: 'bar_chart',
      action: 'reportes',
      color: '#009688'
    },
    {
      title: 'Caja Mayor',
      icon: 'account_balance',
      action: 'caja-mayor',
      color: '#1b5e20'
    }
  ];

  // --- Stats resumen ---
  ventasHoy = 18;
  totalHoyPYG = 4850000;
  ticketPromedio = 269444;
  mesasOcupadas = 5;
  mesasTotal = 12;

  // --- Cajas abiertas (mock) ---
  cajasAbiertas: CajaAbierta[] = [
    {
      id: 1,
      cajero: 'MARIA GONZALEZ',
      horaApertura: new Date(2026, 2, 24, 8, 30),
      horasAbierto: '7h 54m',
      valorAperturaPYG: 500000,
      valorAperturaUSD: 50,
      ventaTotal: 3200000,
      mesasAtendidas: 8,
      cantidadVentas: 12
    },
    {
      id: 2,
      cajero: 'CARLOS BENITEZ',
      horaApertura: new Date(2026, 2, 24, 12, 0),
      horasAbierto: '4h 24m',
      valorAperturaPYG: 300000,
      valorAperturaUSD: 30,
      ventaTotal: 1650000,
      mesasAtendidas: 5,
      cantidadVentas: 6
    }
  ];

  // --- Top productos (mock) ---
  topProductos: TopProducto[] = [
    { nombre: 'PIZZA MARGARITA GRANDE', cantidad: 24, total: 960000, porcentaje: 100 },
    { nombre: 'HAMBURGUESA CLASICA', cantidad: 18, total: 810000, porcentaje: 75 },
    { nombre: 'LOMITO COMPLETO', cantidad: 15, total: 675000, porcentaje: 62 },
    { nombre: 'COCA COLA 500ML', cantidad: 32, total: 480000, porcentaje: 50 },
    { nombre: 'EMPANADA DE CARNE X3', cantidad: 12, total: 360000, porcentaje: 37 },
    { nombre: 'CERVEZA PILSEN 1L', cantidad: 20, total: 340000, porcentaje: 35 },
    { nombre: 'MILANESA NAPOLITANA', cantidad: 9, total: 315000, porcentaje: 32 },
    { nombre: 'AGUA MINERAL 500ML', cantidad: 28, total: 224000, porcentaje: 23 }
  ];

  // --- Rango de fechas chips ---
  rangosChips: RangoChip[] = [
    { label: 'Esta semana', value: 'week', selected: true },
    { label: 'Este mes', value: 'month', selected: false },
    { label: '3 meses', value: '3months', selected: false },
    { label: '6 meses', value: '6months', selected: false }
  ];
  rangoSeleccionado = 'week';

  // --- Chart config ---
  chartData: ChartData<'line'> = { labels: [], datasets: [] };

  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#aaa',
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30,30,30,0.95)',
        titleColor: '#fff',
        bodyColor: '#ccc',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#888', font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          color: '#888',
          font: { size: 11 },
          callback: (value: any) => {
            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
            if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
            return value;
          }
        }
      }
    }
  };

  constructor(
    private repository: RepositoryService,
    private tabsService: TabsService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.updateChartData('week');
  }

  // --- Acciones ---
  navigateTo(action: string): void {
    switch (action) {
      case 'pdv':
        this.tabsService.openTab('Punto de Venta (PDV)', PdvComponent, {}, 'pdv');
        break;
      case 'mesas':
        this.dialog.open(PdvMesaDialogComponent, {
          width: '80%',
          height: '80%'
        });
        break;
      case 'comandas':
        this.dialog.open(ComandaAbmDialogComponent, {
          width: '70%',
          height: '70%'
        });
        break;
      case 'pdv-config':
        this.dialog.open(PdvConfigDialogComponent, {
          width: '600px'
        });
        break;
      case 'atajo-config':
        this.dialog.open(AtajoConfigDialogComponent, {
          width: '90vw',
          maxWidth: '90vw',
          height: '80vh',
          panelClass: 'atajo-config-dialog-container'
        });
        break;
      case 'precios-delivery':
        this.tabsService.openTab('Precios de Delivery', ListPreciosDeliveryComponent);
        break;
      case 'ventas-list':
        this.tabsService.openTab('Historial de Ventas', ListVentasComponent);
        break;
      case 'caja-mayor':
        this.tabsService.openTab('Caja Mayor', CajaMayorDashboardComponent);
        break;
      default:
        break;
    }
  }

  // --- Chart data por rango ---
  selectRango(chip: RangoChip): void {
    this.rangosChips.forEach(c => c.selected = false);
    chip.selected = true;
    this.rangoSeleccionado = chip.value;
    this.updateChartData(chip.value);
  }

  private updateChartData(rango: string): void {
    let labels: string[] = [];
    let ventas: number[] = [];
    let cantidades: number[] = [];

    switch (rango) {
      case 'week':
        labels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
        ventas = [2800000, 3100000, 2500000, 4200000, 5100000, 6800000, 4850000];
        cantidades = [12, 15, 11, 18, 22, 28, 18];
        break;
      case 'month':
        labels = Array.from({ length: 24 }, (_, i) => `${i + 1}`);
        ventas = [3200000, 2800000, 4100000, 3500000, 2900000, 5200000, 6100000,
          3800000, 4200000, 3100000, 2700000, 5800000, 6500000, 4800000,
          3900000, 4500000, 3200000, 2800000, 5100000, 6800000, 5200000,
          4100000, 3600000, 4850000];
        cantidades = ventas.map(v => Math.round(v / 270000));
        break;
      case '3months':
        labels = ['Ene S1', 'Ene S2', 'Ene S3', 'Ene S4',
          'Feb S1', 'Feb S2', 'Feb S3', 'Feb S4',
          'Mar S1', 'Mar S2', 'Mar S3', 'Mar S4'];
        ventas = [18500000, 22100000, 19800000, 24300000,
          20100000, 25600000, 21800000, 23900000,
          24500000, 26800000, 22300000, 29350000];
        cantidades = ventas.map(v => Math.round(v / 270000));
        break;
      case '6months':
        labels = ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'];
        ventas = [72000000, 85000000, 110000000, 84700000, 91400000, 102950000];
        cantidades = ventas.map(v => Math.round(v / 270000));
        break;
    }

    this.chartData = {
      labels,
      datasets: [
        {
          data: ventas,
          label: 'Ventas (Gs)',
          borderColor: '#7c4dff',
          backgroundColor: 'rgba(124, 77, 255, 0.08)',
          pointBackgroundColor: '#7c4dff',
          pointBorderColor: '#7c4dff',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2.5,
          fill: true,
          tension: 0.35
        },
        {
          data: cantidades,
          label: 'Cantidad ventas',
          borderColor: '#00e5ff',
          backgroundColor: 'rgba(0, 229, 255, 0.05)',
          pointBackgroundColor: '#00e5ff',
          pointBorderColor: '#00e5ff',
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
          fill: false,
          tension: 0.35,
          yAxisID: 'y'
        }
      ]
    };
  }
}
