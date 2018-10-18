import { LatLngLiteral } from '@agm/core';
import { MapService } from './../services/map.service';
import { Component, Input, EventEmitter, Output } from '@angular/core';
import Address from '../models/address';

@Component({
    selector: 'app-address',
    templateUrl: './address.component.html',
    styleUrls: ['./address.component.css']
})
export class AddressComponent {
    @Input()
    address: Address;
    @Input()
    editing: boolean;
    @Output()
    onDelete: EventEmitter<Address> = new EventEmitter<Address>();
    @Output()
    onEdit: EventEmitter<Address> = new EventEmitter<Address>();
    @Output()
    onStopEdit: EventEmitter<Address> = new EventEmitter<Address>();
    private width: number;

    constructor(private mapService: MapService) {

    }

    edit() {
        this.onEdit.emit(this.address);
        this.updateMapWidth();
    }

    updateMapWidth() {
        this.width = document.getElementById('table').offsetWidth;
        const agmMaps = document.getElementsByTagName('agm-map');
        const rows = document.getElementsByTagName('app-address');
        const inputs = document.getElementsByClassName('autosuggest');
        for (
            let index = 0;
            index < document.getElementsByTagName('agm-map').length;
            index++
        ) {
            const el = agmMaps.item(index) as HTMLElement;
            const rowEl = rows.item(index) as HTMLElement;
            const input = inputs.item(index) as HTMLElement;
            el.style.width = `${this.width}px`;
            input.style.width = `${this.width / 2}px`;
            const bound = rowEl.getBoundingClientRect();
            el.style.top = input.style.top = `${bound.top +
                rowEl.offsetHeight +
                1}px`;
            el.style.left = input.style.left = `${bound.left}px`;
        }
    }

    save() {
        this.editing = false;
        this.onStopEdit.emit(this.address);
    }

    delete() {
        this.onDelete.emit(this.address);
    }

    onAddressUpdated(address: Address) {
        this.address = { ...this.address, ...address };
    }

    refreshMap() {
        const { street, ward, city, country, district } = { ...this.address };
        const addr = [street, ward, district, city, country]
            .filter((x: string) => !!x)
            .join(', ');
        this.mapService.geocode(addr).subscribe((latlng: LatLngLiteral) => {
            console.log(latlng);
        });
    }
}
