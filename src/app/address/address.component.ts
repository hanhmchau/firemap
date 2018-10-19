import { LatLngLiteral } from '@agm/core';
import { MapService } from './../services/map.service';
import { Component, Input, EventEmitter, Output } from '@angular/core';
import Address from '../models/address';
import Marker from '../models/marker';
import Map from '../models/map';
import { Subject, Observable, ReplaySubject, BehaviorSubject } from 'rxjs';
import { updateMapWidth } from '../utils';

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
    private marker: Marker;
    private mapSubject: Subject<Map>;
    private map$: Observable<Map>;

    constructor(private mapService: MapService) {

    }

    ngOnInit(): void {
        this.marker = {
            lat: this.address.lat,
            lng: this.address.lng,
            draggable: true
        };
        this.mapSubject = new BehaviorSubject<Map>({
            lat: this.address.lat,
            lng: this.address.lng,
            zoom: 12
        });
        this.map$ = this.mapSubject.asObservable();
    }

    edit() {
        this.onEdit.emit(this.address);
        updateMapWidth();
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

    onMapUpdated(map: Map) {
        this.mapSubject.next(map);
    }

    onMarkerUpdated(marker: Marker) {
        this.marker = marker;
    }

    refreshMap() {
        const { street, ward, city, country, district } = { ...this.address };
        const addr = [street, ward, district, city, country]
            .filter((x: string) => !!x)
            .join(', ');
        this.mapService.geocode(addr).subscribe((latlng: LatLngLiteral) => {
            const { lat, lng } = { ...latlng };
            this.marker = {
                lat,
                lng
            };
            this.mapSubject.next({
                lat,
                lng
            });
        });
    }
}
