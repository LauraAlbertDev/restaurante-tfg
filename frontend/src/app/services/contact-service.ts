import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../environment/environment';
import {map, Observable} from 'rxjs';
import {UserComment, CommentUpdateResponse} from '../common/interfaces';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}comments`;

  getComments(archived: boolean): Observable<UserComment[]> {
    const status = archived ? 1 : 0;
    return this.http.get<UserComment[]>(`${this.baseUrl}/?archived=${status}`).pipe(map(res => res ?? []));
  }

  postComment(comment: UserComment): Observable<UserComment>{
    return this.http.post<UserComment>(`${this.baseUrl}/add_comment`, comment);
  }

  toggleArchive(id:number):Observable<any>{
    return this.http.put<CommentUpdateResponse>(`${this.baseUrl}/archive/${id}`, {});
  }

  getCommentById(id: number): Observable<UserComment> {
    return this.http.get<UserComment>(`${this.baseUrl}/${id}`);
  }

  updateComment(id: number, comment: UserComment): Observable<UserComment> {
    return this.http.put<UserComment>(`${this.baseUrl}/update/${id}`, comment);
  }
}
