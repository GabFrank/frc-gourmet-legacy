import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-ingrediente-sabor-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './ingrediente-sabor-dialog.component.html',
  styleUrls: ['./ingrediente-sabor-dialog.component.scss']
})
export class IngredienteSaborDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<IngredienteSaborDialogComponent>
  ) { }

  ngOnInit(): void {
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    // Lógica para guardar
    // this.dialogRef.close(data);
  }
}
