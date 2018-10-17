import { Component } from '@angular/core';
import Address from './models/address';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    onFocusMap(address: Address) {
    }
}
