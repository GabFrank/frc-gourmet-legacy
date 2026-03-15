import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { EliminarIngredienteDialogComponent, EliminarIngredienteDialogData } from '../shared/components/eliminar-ingrediente-dialog/eliminar-ingrediente-dialog.component';
import { SaboresVariacionesService } from './sabores-variaciones.service';

export interface ResultadoEliminacion {
  confirmado: boolean;
  eliminarDeOtrasVariaciones: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EliminarIngredienteService {

  constructor(
    private dialog: MatDialog,
    private saboresVariacionesService: SaboresVariacionesService
  ) {}

  /**
   * Abre el diálogo de confirmación para eliminar un ingrediente
   */
  abrirDialogoEliminacion(
    nombreIngrediente: string,
    nombreVariacion: string,
    cantidad: number,
    unidad: string
  ): Observable<ResultadoEliminacion | undefined> {
    const dialogRef = this.dialog.open(EliminarIngredienteDialogComponent, {
      data: {
        nombreIngrediente,
        nombreVariacion,
        cantidad,
        unidad
      },
      disableClose: true,
      width: '500px'
    });

    return dialogRef.afterClosed();
  }

  /**
   * Ejecuta la eliminación del ingrediente según la selección del usuario
   */
  eliminarIngrediente(
    recetaIngredienteId: number,
    nombreIngrediente: string,
    nombreVariacion: string,
    cantidad: number,
    unidad: string
  ): Observable<any> {
    return new Observable(observer => {
      this.abrirDialogoEliminacion(nombreIngrediente, nombreVariacion, cantidad, unidad)
        .subscribe(resultado => {
          if (resultado?.confirmado) {
            // Ejecutar la eliminación
            this.saboresVariacionesService
              .eliminarIngredienteMultiplesVariaciones(
                recetaIngredienteId,
                resultado.eliminarDeOtrasVariaciones
              )
              .subscribe({
                next: (response) => {
                  observer.next(response);
                  observer.complete();
                },
                error: (error) => {
                  observer.error(error);
                }
              });
          } else {
            // Usuario canceló
            observer.next({ cancelado: true });
            observer.complete();
          }
        });
    });
  }
}
