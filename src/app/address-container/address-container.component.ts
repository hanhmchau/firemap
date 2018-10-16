import { Component } from '@angular/core';
import Address from '../models/address';

@Component({
    selector: 'app-address-container',
    templateUrl: './address-container.component.html',
    styleUrls: ['./address-container.component.css']
})
export class AddressContainerComponent {
    private addresses: Address[] = [{
        street: 'Hu'
    }];
}
