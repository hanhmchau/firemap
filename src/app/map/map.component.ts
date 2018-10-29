import { AgmMap, LatLngLiteral, MapsAPILoader, MouseEvent } from '@agm/core';
import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    Output,
    ViewChild
} from '@angular/core';
import { createClient, GoogleMapsClient } from '@google/maps';
import { Observable, Observer } from 'rxjs';
import '../../../node_modules/google-maps-api-typings/index.d';
import Address from '../models/address';
import Map from '../models/map';
import Marker from '../models/marker';
import { MapService } from '../services/map.service';
import consts from '../../consts';

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.css']
})
export class MapComponent {
    @Input()
    address: Address;
    @Input()
    marker: Marker;
    @Input()
    map$: Observable<Map>;
    @ViewChild('addressBox')
    public addressBoxRef: ElementRef;
    @ViewChild(AgmMap)
    public agmMapRef: AgmMap;
    client: GoogleMapsClient;
    map: Map = {
        lat: 0,
        lng: 0,
        zoom: 12
    };
    autocomplete: google.maps.places.Autocomplete;
    @Input()
    width: string;
    @Output()
    onAddressUpdated: EventEmitter<any> = new EventEmitter();
    @Output()
    onMarkerUpdated: EventEmitter<Marker> = new EventEmitter();
    @Output()
    onMapUpdated: EventEmitter<Map> = new EventEmitter();
    @Output()
    onLoaded: EventEmitter<boolean> = new EventEmitter();

    constructor(
        private mapsAPILoader: MapsAPILoader,
        private mapService: MapService
    ) {}

    initializeAutocomplete() {
        this.client = createClient({ key: consts.MAP_API });
        this.mapsAPILoader.load().then(() => {
            this.getCurrentPosition().subscribe((latLng: LatLngLiteral) => {
                if (this.address.id === '-1') {
                    this.updateMarker(latLng.lat, latLng.lng);
                    this.updateMap(latLng.lat, latLng.lng, 12);
                }
                const bounds = new google.maps.Circle({
                    center: latLng,
                    radius: 25
                });

                this.initAutocomplete(bounds);
            });
            this.onLoaded.emit(true);
        });
    }

    ngOnInit(): void {
        this.map$.subscribe((map: Map) => {
            this.map.lat = map.lat;
            this.map.lng = map.lng;
            this.map.zoom = 14;
            if (this.agmMapRef) {
                this.agmMapRef.triggerResize(true).then(() => {
                    (this.agmMapRef as any)._mapsWrapper.setCenter({
                        lat: map.lat,
                        lng: map.lng
                    });
                });
            }
            this.initializeAutocomplete();
        });
    }

    initAutocomplete(bounds: google.maps.Circle) {
        this.autocomplete = new google.maps.places.Autocomplete(
            this.addressBoxRef.nativeElement,
            {
                types: [],
                bounds: bounds.getBounds()
            }
        );
        this.autocomplete.addListener(
            'place_changed',
            this.placeChanged.bind(this)
        );
    }

    placeChanged() {
        const place: google.maps.places.PlaceResult = this.autocomplete.getPlace();
        if (place.geometry) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            this.updateMarker(lat, lng);
            this.updateMap(lat, lng, 17);
            const parsedAddress = this.mapService.parseAddress(
                place.address_components
            );
            parsedAddress.lat = lat;
            parsedAddress.lng = lng;
            this.onAddressUpdated.emit({
                address: parsedAddress,
                latLng: {
                    lat,
                    lng
                }
            });
        }
    }

    updateMarker(lat: number, lng: number) {
        this.onMarkerUpdated.emit({
            lat,
            lng
        });
    }
    updateMap(lat: number, lng: number, zoom?: number) {
        const zoomAmount = zoom ? zoom : this.map.zoom;
        this.onMapUpdated.emit({ lat, lng, zoom: zoomAmount });
        this.agmMapRef.triggerResize(true).then(() => {
            (this.agmMapRef as any)._mapsWrapper.setCenter({
                lat,
                lng
            });
        });
    }
    updateMarkerPosition($event: MouseEvent) {
        const { lat = 105, lng = 10 } = { ...$event.coords };
        this.updateMarker(lat, lng);
        this.mapService
            .reverseGeocode(lat, lng)
            .subscribe((address: Address) => {
                this.onAddressUpdated.emit({
                    address,
                    latLng: {
                        lat,
                        lng
                    }
                });
            });
    }
    mapClicked($event: MouseEvent) {
        this.updateMarkerPosition($event);
    }
    markerDragged($event: MouseEvent) {
        this.updateMarkerPosition($event);
    }
    private getCurrentPosition(): Observable<LatLngLiteral> {
        return Observable.create((observer: Observer<LatLngLiteral>) => {
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position: Position) => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        const latLng: LatLngLiteral = {
                            lat,
                            lng
                        };
                        observer.next(latLng);
                    },
                    () => {
                        observer.next({
                            lat: 0,
                            lng: 0
                        });
                    }
                );
            }
        });
    }
}
