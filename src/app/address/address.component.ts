import { Component, Input } from '@angular/core';
import Address from '../models/address';

@Component({
    selector: 'app-address',
    templateUrl: './address.component.html',
    styleUrls: ['./address.component.css']
})
export class AddressComponent {
    @Input() address: Address;
    private editing: boolean = false;
    private width: number;

    ngAfterViewInit(): void {
        this.width = document.getElementById('table').offsetWidth;
    }

    edit() {
        this.editing = true;
        console.log(document.getElementsByTagName('agm-map')[0]);
        (document.getElementsByTagName('agm-map')[0] as HTMLElement).style.width = `${this.width}px`;
    }

    save() {
        this.editing = false;
    }
}
