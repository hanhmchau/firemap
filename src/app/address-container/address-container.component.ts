import { MapService } from './../services/map.service';
import { Component, Output, EventEmitter } from '@angular/core';
import Address from '../models/address';
import { ThrowStmt } from '@angular/compiler';

@Component({
    selector: 'app-address-container',
    templateUrl: './address-container.component.html',
    styleUrls: ['./address-container.component.css']
})
export class AddressContainerComponent {
    @Output() onFocusMap: EventEmitter<Address> = new EventEmitter();
    private addresses: Address[];

    constructor(private mapService: MapService) {
    }

    ngOnInit(): void {
        this.mapService.getAddresses().subscribe((addresses: Address[]) => this.addresses = addresses);
    }

    focusMap(address: Address) {
        this.mapService.setActiveAddress(address);
    }
}
