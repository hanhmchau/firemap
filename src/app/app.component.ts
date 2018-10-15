import { RoutingService } from './routing.service';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { MouseEvent, MapsAPILoader, AgmMap, LatLngLiteral } from '@agm/core';
import { Observable, Observer } from 'rxjs';

interface Map {
    lat: number;
    lng: number;
    zoom?: number;
}

// just an interface for type safety.
interface Marker {
    lat: number;
    lng: number;
    label?: string;
    draggable?: boolean;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'Simple To Do';
    marker: Marker;
    map: Map;
    @ViewChild('addressBox')
    public addressBoxRef: ElementRef;
    @ViewChild(AgmMap) public agmMapRef: AgmMap;

    constructor(
        private routingService: RoutingService,
        private mapsAPILoader: MapsAPILoader
    ) {
        this.routingService.startObservingUrls();
        this.marker = {
            lat: 0,
            lng: 0,
            draggable: true
        };

        this.map = {
            lat: 0,
            lng: 0,
            zoom: 8
        };
    }

    ngOnInit(): void {
        this.mapsAPILoader.load().then(() => {
            this.getCurrentPosition()
            .subscribe((latLng: LatLngLiteral) => {
                this.updateMarker(latLng.lat, latLng.lng);
                this.updateMap(latLng.lat, latLng.lng, 12);

                const bounds = new google.maps.Circle({
                    center: latLng,
                    radius: 25
                });

                const autocomplete = new google.maps.places.Autocomplete(
                    this.addressBoxRef.nativeElement,
                    {
                        types: [],
                        bounds: bounds.getBounds()
                    }
                );

                autocomplete.addListener('place_changed', () => {
                    const place: google.maps.places.PlaceResult = autocomplete.getPlace();

                    if (place.geometry) {
                        const lat = place.geometry.location.lat();
                        const lng = place.geometry.location.lng();
                        this.marker.lat = lat;
                        this.marker.lng = lng;
                        this.map.lat = this.marker.lat;
                        this.map.lng = this.marker.lng;
                        this.map.zoom = 17;
                        this.agmMapRef.triggerResize(true).then(() => {
                            (this.agmMapRef as any)._mapsWrapper.setCenter({
                                lat,
                                lng
                            });
                        });
                    }
                });
            });
        });
    }

    updateMarker(lat: number, lng: number) {
        this.marker.lat = lat;
        this.marker.lng = lng;
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
                navigator.geolocation.getCurrentPosition((position: Position) => {
                    console.log('allowed!');
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    const latLng: LatLngLiteral = {
                        lat,
                        lng
                    };
                    observer.next(latLng);
                }, () => {
                    console.log('uh oh, not allowed!')
                    observer.next({
                        lat: 0,
                        lng: 0
                    });
                });
            }
        });
    }
}
