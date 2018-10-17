import { AgmMap, LatLngLiteral, MapsAPILoader, MouseEvent } from '@agm/core';
import { Component, ElementRef, Input, Renderer, ViewChild } from '@angular/core';
import { ClientResponse, createClient, GeocodingResponse, GeocodingResult, GoogleMapsClient } from '@google/maps';
import { Observable, Observer } from 'rxjs';
import '../../../node_modules/google-maps-api-typings/index.d';
import Address from '../models/address';
import Map from '../models/map';
import Marker from '../models/marker';
import { MapService } from '../services/map.service';

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.css']
})
export class MapComponent {
    @Input() address: Address;
    marker: Marker
    map: Map;
    @ViewChild('addressBox')
    public addressBoxRef: ElementRef;
    @ViewChild(AgmMap)
    public agmMapRef: AgmMap;
    client: GoogleMapsClient;
    autocomplete: google.maps.places.Autocomplete;
    @Input() width: string;

    constructor(
        private mapsAPILoader: MapsAPILoader,
    ) {
    }

    initializeMap() {
        this.marker = {
            lat: this.address.lat,
            lng: this.address.lng,
            draggable: true
        };
        this.map = {
            lat: this.address.lat,
            lng: this.address.lng,
            zoom: 12
        };
    }

    initializeAutocomplete() {
        this.client = createClient({ key: process.env.MAP_API });
        this.mapsAPILoader.load().then(() => {
            this.getCurrentPosition().subscribe(
                (latLng: LatLngLiteral) => {
                    this.updateMarker(latLng.lat, latLng.lng);
                    this.updateMap(latLng.lat, latLng.lng, 12);
                    const bounds = new google.maps.Circle({
                        center: latLng,
                        radius: 25
                    });

                    this.initAutocomplete(bounds);
                }
            );
        });
    }

    ngOnInit(): void {
        this.initializeMap();
        this.initializeAutocomplete();
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
            // this.mapService.setActiveMarker(this.marker);
        }
    }

    updateMarker(lat: number, lng: number) {
        this.marker.lat = lat;
        this.marker.lng = lng;
        this.client.reverseGeocode(
            {
                latlng: {
                    lat,
                    lng
                }
            },
            (err: any, response: ClientResponse<GeocodingResponse>) => {
                if (!err && response.json.results.length) {
                    const res: GeocodingResult = response.json.results[0];
                }
            }
        );
    }
    updateMap(lat: number, lng: number, zoom?: number) {
        this.map.lat = lat;
        this.map.lng = lng;
        this.map.zoom = zoom ? zoom : this.map.zoom;
        this.agmMapRef.triggerResize(true).then(() => {
            (this.agmMapRef as any)._mapsWrapper.setCenter({
                lat,
                lng
            });
        });
    }
    updateMarkerPosition($event: MouseEvent) {
        const { lat, lng } = { ...$event.coords };
        this.updateMarker(lat, lng);
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
