import { Injectable } from '@angular/core';
import { filter, pairwise } from 'rxjs/operators';
import { Router, RoutesRecognized, RouterEvent } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class RoutingService {
    private previousUrl = '/';

    constructor(private router: Router) {}

    startObservingUrls() {
        this.router.events
            .pipe(
                filter((ev: any) => ev instanceof RoutesRecognized),
                pairwise()
            )
            .subscribe((ev: any) => {
                const prev = (ev[0] as RouterEvent).url;
                this.previousUrl = prev;
            });
    }

    returnToLastUrl() {
        this.router.navigate([this.previousUrl]);
    }
}
