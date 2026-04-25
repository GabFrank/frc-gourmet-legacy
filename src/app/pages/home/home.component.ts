import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TabsService } from 'src/app/services/tabs.service';
import { CajaMayorDashboardComponent } from 'src/app/pages/financiero/caja-mayor/dashboard/caja-mayor-dashboard.component';

interface AccesoRapido {
  titulo: string;
  descripcion: string;
  icono: string;
  color: string;
  key: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ]
})
export class HomeComponent implements OnInit {
  accesosRapidos: AccesoRapido[] = [
    {
      titulo: 'Caja Mayor',
      descripcion: 'Control financiero, gastos, retiros y movimientos',
      icono: 'account_balance',
      color: '#1b5e20',
      key: 'caja-mayor',
    },
  ];

  constructor(private tabsService: TabsService) {}

  ngOnInit(): void {}

  setData(_data: any): void {}

  abrir(acceso: AccesoRapido): void {
    if (acceso.key === 'caja-mayor') {
      this.tabsService.openTab('Caja Mayor', CajaMayorDashboardComponent);
    }
  }
}
