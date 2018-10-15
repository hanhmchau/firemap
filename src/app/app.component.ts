import { RoutingService } from './routing.service';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { MouseEvent, MapsAPILoader, AgmMap } from '@agm/core';

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
        this.map = {
            lat: 0,
            lng: 0,
            zoom: 8
        };
    }

    ngOnInit(): void {
        this.mapsAPILoader.load().then(() => {
            const autocomplete = new google.maps.places.Autocomplete(
                this.addressBoxRef.nativeElement,
                {
                    types: []
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

            this.setCurrentPosition();
        });
    }

    updateMarkerPosition($event: MouseEvent) {
        const { lat, lng } = { ...$event.coords };
        this.marker = { lat, lng, draggable: true };
    }

    mapClicked($event: MouseEvent) {
        this.updateMarkerPosition($event);
    }

    markerDragged($event: MouseEvent) {
        this.updateMarkerPosition($event);
    }

    private setCurrentPosition() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((position: Position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                this.marker = { lat, lng };
                this.map.lat = lat;
                this.map.lng = lng;
            });
        }
    }
}
