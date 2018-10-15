import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import consts from '../../consts';

@Injectable({
    providedIn: "root"
})
export class MapService {
    private categoryUrl = `${consts.API}/category`; // URL to web api
    constructor(private http: HttpClient) {}

    getCategories(): Observable<any> {
        return this.http.get<any>(this.categoryUrl);
    }
}
