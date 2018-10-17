import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import consts from '../../consts';
import Address from '../models/address';
import Marker from '../models/marker';
import Map from '../models/map';
import {
    GoogleMapsClient,
    createClient,
    ClientResponse,
    GeocodingResponse
} from '@google/maps';

@Injectable({
    providedIn: 'root'
})
export class MapService {
    private categoryUrl = `${consts.API}/category`; // URL to web api
    private addresses: Address[] = [
        {
            street: 'Hu',
            ward: 'Ben Thanh',
            district: 'Go Vap',
            city: 'Ha Noi',
            country: 'Viet Nam',
            lat: 105,
            lng: 10
        },
        {
            street: 'Hu',
            ward: 'Ben Thanh',
            district: 'Go Vap',
            city: 'Ha Noi',
            country: 'Viet Nam',
            lat: 108,
            lng: 20
        }
    ];
    private activeMarker = new Subject<Marker>();
    private activeMap = new Subject<Map>();
    private client: GoogleMapsClient;

    constructor(private http: HttpClient) {
        this.client = createClient({
            key: process.env.MAP_API
        });
    }

    getAddresses(): Observable<Address[]> {
        return of(this.addresses);
    }

    getActiveMarker(): Observable<Marker> {
        return this.activeMarker.asObservable();
    }

    getActiveMap(): Observable<Map> {
        return this.activeMap.asObservable();
    }

    setActiveMarker(marker: Marker): void {
        this.activeMarker.next(marker);
    }

    setActiveMap(map: Map): void {
        this.activeMap.next(map);
    }

    setActiveAddress(address: Address): void {
        const { street, ward, city, country, district } = { ...address };
        const addr = [street, ward, district, city, country]
            .filter((x: string) => !!x)
            .join(', ');
        this.client.geocode(
            {
                address: addr
            },
            (err, data: ClientResponse<GeocodingResponse>) => {
                if (err || !data || !data.json.results.length) {
                    return;
                }
                const place = data.json.results[0];
                const { lat, lng } = { ...place.geometry.location };
                address.lat = lat;
                address.lng = lng;
                this.setActiveMarker({
                    lat,
                    lng,
                    draggable: true
                });
                this.setActiveMap({
                    lat,
                    lng,
                    zoom: 17
                });
            }
        );
    }
}
