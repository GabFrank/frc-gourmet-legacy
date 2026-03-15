import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RepositoryService } from '../database/repository.service';

@Injectable({
  providedIn: 'root'
})
export class SaboresService {

  constructor(private repositoryService: RepositoryService) { }

  createOrUpdateSabor(saborData: any): Observable<{ success: boolean, message: string }> {
    return this.repositoryService.createOrUpdateSabor(saborData);
  }

  getSaborDetails(categoria: string): Observable<any> {
    return this.repositoryService.getSaborDetails(categoria);
  }
}
