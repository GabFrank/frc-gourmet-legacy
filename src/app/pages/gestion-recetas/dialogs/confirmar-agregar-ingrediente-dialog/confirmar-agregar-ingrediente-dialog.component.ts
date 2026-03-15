import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmarAgregarIngredienteDialogData {
  nombreIngrediente: string;
}

@Component({
  selector: 'app-confirmar-agregar-ingrediente-dialog',
  templateUrl: './confirmar-agregar-ingrediente-dialog.component.html',
  styleUrls: ['./confirmar-agregar-ingrediente-dialog.component.scss']
})
export class ConfirmarAgregarIngredienteDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<ConfirmarAgregarIngredienteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmarAgregarIngredienteDialogData
  ) {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }
}

