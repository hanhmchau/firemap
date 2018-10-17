import { Component, ViewChild, ElementRef, Input, Renderer } from '@angular/core';
import { MouseEvent, MapsAPILoader, AgmMap, LatLngLiteral } from '@agm/core';
import { Observable, Observer } from 'rxjs';
import '../../../node_modules/google-maps-api-typings/index.d';
import Map from '../models/map';
import Marker from '../models/marker';
import {
    GoogleMapsClient,
    createClient,
    ClientResponse,
    GeocodingResponse,
    GeocodingResult
} from '@google/maps';
import { MapService } from '../services/map.service';
import Address from '../models/address';

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.css']
})
export class MapComponent {
    @Input()
    address: Address;
    marker: Marker;
    map: Map;
    @ViewChild('addressBox')
    public addressBoxRef: ElementRef;
    @ViewChild(AgmMap)
    public agmMapRef: AgmMap;
    client: GoogleMapsClient;
    autocomplete: google.maps.places.Autocomplete;
    @Input() width: string;

    constructor(
        private renderer: Renderer,
        private mapsAPILoader: MapsAPILoader,
        private mapService: MapService
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

        this.mapService.getActiveMarker().subscribe(marker => {
            this.marker.lat = marker.lat;
            this.marker.lng = marker.lng;
            if (marker.draggable !== undefined) {
                this.marker.draggable = marker.draggable;
            }
        });

        this.mapService.getActiveMap().subscribe((map: Map) => {
            this.updateMap(map.lat, map.lng, 17);
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
            this.marker.lat = lat;
            this.marker.lng = lng;
            this.updateMap(lat, lng, 17);
            this.mapService.setActiveMarker(this.marker);
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
                response.json.results.forEach((res: GeocodingResult) => {
                    console.log(res.address_components);
                });
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
