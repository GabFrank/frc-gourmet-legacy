import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { CreateEditSaborDialogComponent } from '../dialogs/create-edit-sabor-dialog/create-edit-sabor-dialog.component';
import { TabsService } from '../../../services/tabs.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-gestion-sabor',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './gestion-sabor.component.html',
  styleUrls: ['./gestion-sabor.component.scss']
})
export class GestionSaborComponent implements OnInit {

  data: any; // Para recibir datos del TabsService
  categoria?: string;

  constructor(
    private dialog: MatDialog,
    private tabsService: TabsService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Obtener datos de la pestaña activa
    const activeTab = this.tabsService.currentTab();
    this.data = activeTab?.data;
    this.categoria = this.data?.categoria;

    // Abrir automáticamente el diálogo
    this.openSaborDialog();
  }

  openSaborDialog(): void {
    const dialogRef = this.dialog.open(CreateEditSaborDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        categoria: this.categoria,
        isEditMode: !!this.categoria
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Si se guardó exitosamente, solo mostramos feedback.
        this.snackBar.open('Sabor guardado exitosamente', 'Cerrar', { duration: 3000 });
      }
      // No cerrar ni abrir pestañas aquí. El contenedor (lista) decidirá si refresca.
    });
  }

  // Método de respaldo para reabrir el diálogo si es necesario
  reopenDialog(): void {
    this.openSaborDialog();
  }
}
