import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';

import { RepositoryService } from '../../../database/repository.service';
import { PdvMesa } from '../../../database/entities/ventas/pdv-mesa.entity';

export interface TransferirMesaDialogData {
  mesaActual: PdvMesa;
}

@Component({
  selector: 'app-transferir-mesa-dialog',
  templateUrl: './transferir-mesa-dialog.component.html',
  styleUrls: ['./transferir-mesa-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
})
export class TransferirMesaDialogComponent implements OnInit {
  mesasDisponibles: PdvMesa[] = [];
  selectedMesa: PdvMesa | null = null;
  loading = true;

  constructor(
    public dialogRef: MatDialogRef<TransferirMesaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TransferirMesaDialogData,
    private repositoryService: RepositoryService
  ) {}

  async ngOnInit(): Promise<void> {
    // Mostrar TODAS las mesas activas (no solo disponibles) para permitir transferir a mesas ya abiertas
    const mesas = await firstValueFrom(this.repositoryService.getPdvMesas());
    this.mesasDisponibles = mesas
      .filter(m => m.activo && m.id !== this.data.mesaActual.id)
      .sort((a, b) => a.numero - b.numero);
    this.loading = false;
  }

  selectMesa(mesa: PdvMesa): void {
    this.selectedMesa = mesa;
  }

  confirmar(): void {
    this.dialogRef.close(this.selectedMesa);
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
