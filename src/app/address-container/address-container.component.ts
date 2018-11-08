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
    @Output()
    onFocusMap: EventEmitter<Address> = new EventEmitter();
    private addresses: Address[] = [];
    private activeAddress: Address;
    private loading = false;

    constructor(private mapService: MapService) {}

    ngOnInit(): void {
        this.queryData();
    }

    onDelete(address: Address) {
        this.addresses = this.addresses.filter(
            (addr: Address) => addr.id !== address.id
        );
        if (address.id !== '-1') {
            this.mapService.delete(address.id);
        }
    }

    queryData() {
        this.loading = true;
        this.mapService.getAddresses().subscribe((addresses: Address[]) => {
            this.addresses = addresses;
            this.loading = false;
        });
    }

    onScroll() {
        this.queryData();
    }
}
