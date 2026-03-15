import { Component, OnInit } from '@angular/core';
import { TabsService } from '../../../services/tabs.service';
import { RepositoryService } from '../../../database/repository.service';
import { Receta } from '../../../database/entities/productos/receta.entity';
import { GestionRecetasComponent } from '../gestion-recetas.component';

@Component({
  selector: 'app-receta-detalle',
  templateUrl: './receta-detalle.component.html',
  styleUrls: ['./receta-detalle.component.scss']
})
export class RecetaDetalleComponent implements OnInit {
  
  receta: Receta | null = null;
  loading = false;
  tabData: any = {};
  
  constructor(
    private tabsService: TabsService,
    private repositoryService: RepositoryService
  ) {}
  
  ngOnInit(): void {
    this.loadReceta();
  }
  
  // Method used by the tab service to set data
  setData(data: any): void {
    console.log('Setting data for RecetaDetalleComponent:', data);
    this.tabData = data;
    this.loadReceta();
  }
  
  loadReceta(): void {
    const recetaId = this.tabData?.recetaId;
    if (!recetaId) {
      this.closeTab();
      return;
    }
    
    this.loading = true;
    this.repositoryService.getReceta(recetaId).subscribe({
      next: (receta: Receta) => {
        this.receta = receta;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading receta:', error);
        this.closeTab();
      }
    });
  }
  
  editReceta(): void {
    if (this.receta) {
      // Open edit tab
      this.tabsService.openTab(
        `Editar Receta - ${this.receta.nombre}`,
        GestionRecetasComponent,
        { mode: 'edit', recetaId: this.receta.id },
        `editar-receta-${this.receta.id}-tab`
      );
      
      // Close current detail tab
      this.closeTab();
    }
  }
  
  backToList(): void {
    this.closeTab();
  }
  
  private closeTab(): void {
    const currentTab = this.tabsService.currentTab();
    if (currentTab) {
      this.tabsService.removeTabById(currentTab.id);
    }
  }
} 