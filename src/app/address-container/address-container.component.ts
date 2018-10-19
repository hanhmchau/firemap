import { MapService } from './../services/map.service';
import { Component, Output, EventEmitter } from '@angular/core';
import Address from '../models/address';
import { updateMapWidth } from '../utils';

@Component({
    selector: 'app-address-container',
    templateUrl: './address-container.component.html',
    styleUrls: ['./address-container.component.css']
})
export class AddressContainerComponent {
    @Output() onFocusMap: EventEmitter<Address> = new EventEmitter();
    private addresses: Address[];
    private activeAddress: Address;

    constructor(private mapService: MapService) {
    }

    ngOnInit(): void {
        this.mapService.getAddresses().subscribe((addresses: Address[]) => this.addresses = addresses);
    }

    focusMap(address: Address) {
        this.mapService.setActiveAddress(address);
    }

    onEdit(address: Address) {
        this.activeAddress = address;
    }

    onStopEdit() {
        this.activeAddress = undefined;
    }

    onDelete(address: Address) {
        this.addresses = this.addresses.filter((addr: Address) => addr.id !== address.id);
        if (address.id !== '-1') {
            this.mapService.delete(address.id).subscribe();
        }
    }

    add() {
        const newAddress: Address = {
            id: '-1',
            street: 'Unnamed Street',
            lat: 105,
            lng: 10
        };
        this.addresses = [
            newAddress,
            ...this.addresses
        ];
        this.activeAddress = newAddress;
        setTimeout(() => {
            updateMapWidth();
        }, 0);
    }
}
