
//https://edupala.com/ionic-service/#:~:text=In%20Ionic%20Angular%20application%20contains,%2C%20directives%2C%20and%20other%20services.

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ITodo } from '../models/todo.model';

const URL_PREFIX = "http://localhost:3000";
@Injectable({
  providedIn: 'root'
})
export class SignUpService {

  constructor(private http: HttpClient) { }

  getTodos(): Observable<Array<ITodo>> {
    return this.http.get<Array<ITodo>>(`${URL_PREFIX}/todos`,);
  }

  getTodo(id: string): Observable<ITodo> {
    return this.http.get<ITodo>(`${URL_PREFIX}/todos/${id}`);
  }


  addTodo(todo: ITodo) {
    debugger
    return this.http.post(`${URL_PREFIX}/todos`, todo)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.log(error.message);
          return throwError("Error while creating a todo" + error.message);
        }));
  }


  updateTodo(todo: ITodo, id: string): Observable<ITodo> {
    return this.http.put<ITodo>(`${URL_PREFIX}/todos/${id}`, todo)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          // this.errorHandler.log("Error while updating a todo", error);
          console.log(error.message);
          return throwError("Error while updating a todo " + error.message);
        }));
  }

  deleteTodo(id: string) {
    return this.http.delete(`${URL_PREFIX}/todos/${id}`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log(error.message);
        return throwError("Error while deleting a todo " + error.message);
      }));
  }
}