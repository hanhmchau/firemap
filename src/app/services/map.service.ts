import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    AddressComponent,
    ClientResponse,
    createClient,
    GeocodingResponse,
    GeocodingResult,
    GoogleMapsClient
} from '@google/maps';
import { Observable, of, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import consts from '../../consts';
import Address from '../models/address';
import Map from '../models/map';
import Marker from '../models/marker';

@Injectable({
    providedIn: 'root'
})
export class MapService {
    private categoryUrl = `${0}/category`; // URL to web api
    private addresses: Address[] = [
        {
            id: '1',
            street: 'Hu',
            ward: 'Ben Thanh',
            district: 'Go Vap',
            city: 'Ha Noi',
            country: 'Viet Nam',
            lat: 105,
            lng: 10
        },
        {
            id: '2',
            street: 'Hi Hi',
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
            key: consts.MAP_API
        });
    }

    reverseGeocode(lat: number, lng: number): Observable<Address> {
        const key = consts.MAP_API;
        const params = new HttpParams()
            .set('key', key)
            .set('latlng', `${lat},${lng}`);
        const headers = new HttpHeaders();
        // .set('Access-Control-Allow-Origin', '*')
        // .set(
        //     'Access-Control-Allow-Origin',
        //     `X-Requested-With, content-type, access-control-allow-origin,
        //     access-control-allow-methods, access-control-allow-headers`
        // );
        return this.http
            .get('https://maps.googleapis.com/maps/api/geocode/json', {
                params,
                headers
            })
            .pipe(
                switchMap((value: any) => {
                    const results = value.results as GeocodingResult[];
                    const firstResult = results[0];
                    const addressComponents = firstResult.address_components;
                    console.log(firstResult);
                    const streetNumber = this.parseAddressComponent(
                        addressComponents,
                        'street_number',
                        'premise'
                    );
                    const streetName = this.parseAddressComponent(
                        addressComponents,
                        'route',
                        'sublocality_level_3'
                    );
                    const ward = this.parseAddressComponent(
                        addressComponents,
                        'administrative_area_level_3',
                        'sublocality_level_3',
                        'sublocality_level_2'
                    );
                    const district = this.parseAddressComponent(
                        addressComponents,
                        'administrative_area_level_2',
                        'locality'
                    );
                    const city = this.parseAddressComponent(
                        addressComponents,
                        'administrative_area_level_1'
                    );
                    const country = this.parseAddressComponent(
                        addressComponents,
                        'country'
                    );
                    const street = `${streetNumber} ${streetName}`.trim();
                    const address = {
                        street,
                        ward,
                        district,
                        city,
                        country,
                        lat,
                        lng
                    };
                    return of(address);
                })
            );
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

    delete(id: string): Observable<any> {
        return of(0);
        // return this.http.get('delete url');
    }

    private parseAddressComponent(
        components: AddressComponent[],
        ...properties: string[]
    ): string {
        return (
            components
                .filter(this.getFilter(properties))
                .map((x: AddressComponent) => x.long_name)[0] || ''
        );
    }

    private getFilter(properties: any[]) {
        return (comp: AddressComponent) => {
            let hasProp = false;
            properties.forEach((prop: any) => {
                comp.types.forEach((type) => {
                    if (type === prop) {
                        hasProp = true;
                    }
                });
            });
            return hasProp;
        };
    }
}
