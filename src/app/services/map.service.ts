import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    AngularFirestore,
    AngularFirestoreCollection,
    DocumentReference,
    CollectionReference,
    Query
} from '@angular/fire/firestore';
import {
    AddressComponent,
    ClientResponse,
    createClient,
    GeocodingResponse,
    GeocodingResult,
    GoogleMapsClient,
    LatLngLiteral
} from '@google/maps';
import { Observable, Observer, of, Subject } from 'rxjs';
import { map, switchMap, tap, take, count } from 'rxjs/operators';
import consts from '../../consts';
import Address from '../models/address';
import Map from '../models/map';
import Marker from '../models/marker';
// tslint:disable-next-line:no-var-requires
const parseXML = require('xml2js').parseString;

@Injectable({
    providedIn: 'root'
})
export class MapService {
    private categoryUrl = `${0}/category`; // URL to web api
    private addresses: Address[] = [];
    private activeMarker = new Subject<Marker>();
    private activeMap = new Subject<Map>();
    private client: GoogleMapsClient;
    private addressCollectionRef: AngularFirestoreCollection<Address>;
    private lastQueriedId: string = null;
    private geonameUrl = 'https://secure.geonames.org/';

    constructor(private http: HttpClient, private fb: AngularFirestore) {
        this.client = createClient({
            key: consts.MAP_API
        });
        this.addressCollectionRef = fb.collection('addresses');
    }

    geocode(address: string): Observable<LatLngLiteral | undefined> {
        const key = consts.MAP_API;
        const params = new HttpParams().set('key', key).set('address', address);
        const headers = new HttpHeaders();
        return this.http
            .get('https://maps.googleapis.com/maps/api/geocode/json', {
                params,
                headers
            })
            .pipe(
                switchMap((value: any) => {
                    const results = value.results as GeocodingResult[];
                    const firstResult = results[0];
                    if (firstResult) {
                        const latLng = firstResult.geometry.location;
                        return of(latLng);
                    }
                    return of(undefined);
                })
            );
    }

    reverseGeocode(lat: number, lng: number): Observable<Address> {
        const key = consts.MAP_API;
        const params = new HttpParams()
            .set('key', key)
            .set('latlng', `${lat},${lng}`);
        const headers = new HttpHeaders();
        return this.http
            .get('https://maps.googleapis.com/maps/api/geocode/json', {
                params,
                headers
            })
            .pipe(
                switchMap((value: any) => {
                    const results = value.results as GeocodingResult[];
                    const firstResult = results[0];
                    const parsedAddress = this.parseAddress(
                        firstResult.address_components,
                        firstResult.formatted_address
                    );
                    parsedAddress.lat = lat;
                    parsedAddress.lng = lng;
                    return of(parsedAddress);
                })
            );
    }

    getAddresses(): Observable<Address[]> {
        return this.addressCollectionRef.snapshotChanges().pipe(
            map(actions => {
                return actions.map(action => {
                    const data = action.payload.doc.data() as Address;
                    const id = action.payload.doc.id;
                    return { ...data, id };
                });
            }),
            tap((addresses: Address[]) => (this.addresses = addresses))
        );
    }

    setActiveMarker(marker: Marker): void {
        this.activeMarker.next(marker);
    }

    setActiveMap(newMap: Map): void {
        this.activeMap.next(newMap);
    }

    setActiveAddress(address: Address): void {
        const addr = Address.toAddress(address);
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

    delete(id: string): void {
        this.addressCollectionRef.doc(id).delete();
    }

    insert(address: Address): Observable<string> {
        return Observable.create((observer: Observer<string>) => {
            delete address.id;
            this.addressCollectionRef
                .add(address)
                .then((doc: DocumentReference) => {
                    observer.next(doc.id);
                })
                .catch(() => observer.error({}));
        });
    }

    update(address: Address): Observable<any> {
        return Observable.create((observer: Observer<any>) => {
            const id = address.id;
            delete address.id;
            this.addressCollectionRef
                .doc(id)
                .update(address)
                .then(() => observer.next({}))
                .catch(() => observer.error({}));
        });
    }

    getById(id: string): Observable<Address> {
        return this.addressCollectionRef
            .doc(id)
            .snapshotChanges()
            .pipe(
                map(action => {
                    const data = action.payload.data() as Address;
                    return {
                        ...data,
                        id
                    };
                })
            );
    }

    getNearby(address: Address): Observable<any[]> {
        return Observable.create((observer: Observer<any[]>) => {
            const center = {
                lat: address.lat,
                lng: address.lng
            };
            const otherAddresses = this.addresses
                .filter(addr => addr.id !== address.id)
                .slice(0, 20);
            const latLngs = otherAddresses.map(addr => ({
                lat: addr.lat,
                lng: addr.lng
            }));
            try {
                const service = new google.maps.DistanceMatrixService();
                service.getDistanceMatrix(
                    {
                        origins: [center],
                        destinations: latLngs,
                        travelMode: google.maps.TravelMode.DRIVING
                    },
                    (response: google.maps.DistanceMatrixResponse) => {
                        const distances = response.rows[0].elements;
                        const nearbyAddresses = response.destinationAddresses
                            .map((addr, i) => ({
                                id: otherAddresses[i].id,
                                address: Address.toAddress(otherAddresses[i]),
                                distance: distances[i].distance
                            }))
                            .filter(addr => addr.distance.value <= 25 * 1000) // 25km
                            .sort((a, b) => a.distance.value - b.distance.value)
                            .slice(0, 3);
                        observer.next(nearbyAddresses);
                    }
                );
            } catch (e) {
                return;
            }
        });
    }

    getCountries(): Observable<any[]> {
        const cached = localStorage.getItem(consts.CACHE.COUNTRIES);
        if (cached) {
            return of(JSON.parse(cached));
        }
        const params = new HttpParams()
            .set('username', consts.GEONAME_USER)
            .set('featureCode', consts.GEONAME_LEVELS.COUNTRY)
            .set('style', 'SHORT');
        return this.http.get(`${this.geonameUrl}searchJSON`, { params }).pipe(
            map((countries: any) =>
                countries.geonames
                    .map((c: any) => ({
                        id: c.geonameId,
                        name: c.name,
                        code: c.countryCode
                    }))
                    .sort((a: any, b: any) =>
                        (a.name as string)
                            .toLocaleLowerCase()
                            .localeCompare(
                                (b.name as string).toLocaleLowerCase()
                            )
                    )
            ),
            tap(countries => {
                localStorage.setItem(
                    consts.CACHE.COUNTRIES,
                    JSON.stringify(countries)
                );
            })
        );
    }

    loadCities(name: string): Observable<any[]> {
        const key = name + '_' + consts.GEONAME_LEVELS.COUNTRY;
        const cached = localStorage.getItem(key);
        if (cached) {
            return of(JSON.parse(cached));
        }
        return this.searchCountry(name).pipe(
            switchMap(countryId => this.getCities(countryId)),
            tap(dests => localStorage.setItem(key, JSON.stringify(dests)))
        );
    }

    loadWards(name: string): Observable<any[]> {
        const key = name + '_' + consts.GEONAME_LEVELS.DISTRICT;
        const cached = localStorage.getItem(key);
        if (cached) {
            return of(JSON.parse(cached));
        }
        return this.searchDistrict(name).pipe(
            switchMap(id => this.getWards(id)),
            tap(dests => localStorage.setItem(key, JSON.stringify(dests)))
        );
    }

    loadDistricts(name: string): Observable<any[]> {
        const key = name + '_' + consts.GEONAME_LEVELS.CITY;
        const cached = localStorage.getItem(key);
        if (cached) {
            return of(JSON.parse(cached));
        }
        return this.searchCity(name).pipe(
            switchMap(id => this.getDistricts(id)),
            tap(dests => localStorage.setItem(key, JSON.stringify(dests)))
        );
    }

    getCities(countryId: string): Observable<any[]> {
        return this.getDestinations(countryId, consts.GEONAME_LEVELS.CITY);
    }

    getDistricts(cityId: string): Observable<any[]> {
        return this.getDestinations(cityId, consts.GEONAME_LEVELS.DISTRICT);
    }

    getWards(districtId: string): Observable<any[]> {
        return this.getDestinations(districtId, consts.GEONAME_LEVELS.WARD);
    }
    searchCountry(name: string): Observable<string> {
        return this.searchDestinations(name, consts.GEONAME_LEVELS.COUNTRY);
    }
    searchCity(name: string): Observable<string> {
        return this.searchDestinations(name, consts.GEONAME_LEVELS.CITY);
    }
    searchDistrict(name: string): Observable<string> {
        return this.searchDestinations(name, consts.GEONAME_LEVELS.DISTRICT);
    }
    searchWard(name: string): Observable<string> {
        return this.searchDestinations(name, consts.GEONAME_LEVELS.WARD);
    }
    searchLatLng(latlng: LatLngLiteral): Observable<any> {
        const params = new HttpParams()
            .set('username', consts.GEONAME_USER)
            .set('lat', latlng.lat.toString())
            .set('lng', latlng.lng.toString());
        const levels: string[] = this.getGeonameLevels();
        return this.http
            .get(`${this.geonameUrl}/extendedFindNearby`, {
                params,
                responseType: 'text'
            })
            .pipe(
                switchMap((val: string) => {
                    return Observable.create((observer: Observer<any>) => {
                        parseXML(val, (err: any, dests: any) => {
                            const locations: any[] = dests.geonames.geoname;
                            const geolocations: any = {};
                            locations.forEach(l => {
                                const fcode = l.fcode[0];
                                if (levels.indexOf(fcode) >= 0) {
                                    geolocations[fcode] = l.geonameId[0];
                                }
                            });
                            observer.next(geolocations);
                        });
                    });
                })
            );
    }

    parseAddress(
        addressComponents:
            | AddressComponent[]
            | google.maps.GeocoderAddressComponent[],
        formattedAddress: string
    ) {
        const streetNumber = this.parseAddressComponent(
            addressComponents,
            formattedAddress,
            'street_number',
            'premise'
        );
        const streetName = this.parseAddressComponent(
            addressComponents,
            formattedAddress,
            'route',
            'sublocality_level_3'
        );
        const ward = this.parseAddressComponent(
            addressComponents,
            formattedAddress,
            'administrative_area_level_3',
            'sublocality_level_3',
            'sublocality_level_2',
            'sublocality_level_1'
        );
        const district = this.parseAddressComponent(
            addressComponents,
            formattedAddress,
            'administrative_area_level_2',
            'locality'
        );
        const city = this.parseAddressComponent(
            addressComponents,
            formattedAddress,
            'administrative_area_level_1'
        );
        const country = this.parseAddressComponent(
            addressComponents,
            formattedAddress,
            'country'
        );
        const countryCode = this.parseAddressComponentShortName(
            addressComponents,
            formattedAddress,
            'country'
        );
        const street = `${streetNumber || ''} ${streetName || ''}`.trim();
        const address: Address = {
            street,
            ward,
            district,
            city,
            country,
            countryCode
        };
        return address;
    }

    private parseAddressComponentShortName(
        components: AddressComponent[] | google.maps.GeocoderAddressComponent[],
        formattedAddress: string,
        ...properties: string[]
    ): string {
        return this.parseComponent(
            components,
            formattedAddress,
            properties,
            true
        );
    }

    private parseAddressComponent(
        components: AddressComponent[] | google.maps.GeocoderAddressComponent[],
        formattedAddress: string,
        ...properties: string[]
    ): string {
        return this.parseComponent(
            components,
            formattedAddress,
            properties,
            false
        );
    }

    private parseComponent(
        components: AddressComponent[] | google.maps.GeocoderAddressComponent[],
        formattedAddress: string,
        properties: string[],
        shortName: boolean = false
    ): string {
        let comp = (components as any[])
            .filter(this.getFilter(properties))
            .map(
                (x: AddressComponent) =>
                    shortName ? x.short_name : x.long_name
            )[0];

        if (properties.indexOf('route') >= 0) {
            if (!comp) {
                const bits = formattedAddress.split(',').map(bit => bit.trim());
                const indexOfWard = bits.indexOf(
                    bits.filter(
                        bit =>
                            bit.indexOf('Phường') >= 0 ||
                            bit.indexOf('Quận') >= 0 ||
                            bit.indexOf('P. ') >= 0
                    )[0]
                );
                if (indexOfWard >= 0) {
                    return bits
                        .slice(0, indexOfWard)
                        .filter(bit => !!bit)
                        .join(', ');
                }
                return '';
            }
        }

        if (properties.indexOf('sublocality_level_1') >= 0) {
            if (!comp) {
                // ward
                const bits = formattedAddress.split(',').map(bit => bit.trim());

                const filteredBits = bits.filter(
                    bit => bit.indexOf('Phường') >= 0
                );
                if (filteredBits.length) {
                    comp = filteredBits[0];
                } else {
                    comp = bits[bits.length - 1 - 3];
                }
            }

            if (comp && comp.indexOf('Phường') < 0 && comp.indexOf('Xã') < 0) {
                return 'Phường ' + comp;
            }

            if (comp && comp.indexOf('P. ') === 0) {
                return 'Phường ' + comp.replace('P. ', '');
            }
            return comp || '';
        }

        if (properties.indexOf('administrative_area_level_1') >= 0) {
            // city
            if (comp && comp === 'Hồ Chí Minh') {
                return 'Thành Phố Hồ Chí Minh';
            }
            if (
                comp &&
                comp.indexOf('Tỉnh') < 0 &&
                comp.toLowerCase().indexOf('Thành Phố'.toLowerCase()) < 0
            ) {
                return 'Tỉnh ' + comp;
            }
            if (comp === 'Hau Giang') {
                return 'Tỉnh Hậu Giang';
            }
        }

        if (properties.indexOf('administrative_area_level_2') >= 0) {
            // district
            if (comp.indexOf('Nhuan') >= 0) {
                return 'Quận Phú Nhuận';
            }
            if (
                comp &&
                comp.indexOf('Thành Phố') &&
                comp.indexOf('Quận') < 0 &&
                comp.indexOf('Huyện') < 0 &&
                comp.indexOf('Thị Xã') < 0
            ) {
                return 'Quận ' + comp;
            }
            if (/\d/.test(comp)) {
                try {
                    const num = parseInt(comp.split(' ')[1].trim(), 10);
                    console.log(num);
                    return 'Quận ' + consts.NUMBERS[num - 1];
                } catch (e) {
                    return comp;
                }
            }
        }

        return comp;
    }

    private getFilter(properties: any[]) {
        return (comp: AddressComponent) => {
            let hasProp = false;
            properties.forEach((prop: any) => {
                comp.types.forEach(type => {
                    if (type === prop) {
                        hasProp = true;
                    }
                });
            });
            return hasProp;
        };
    }

    private searchDestinations(
        destName: string,
        featureCode: string
    ): Observable<string> {
        if (!destName) {
            return of('');
        }
        const params = new HttpParams()
            .set('username', consts.GEONAME_USER)
            .set('featureCode', featureCode)
            .set('style', 'SHORT')
            .set('name', this.transformExceptions(destName, featureCode));
        return this.http
            .get(`${this.geonameUrl}/searchJSON`, { params })
            .pipe(
                map(
                    (dests: any) =>
                        dests.geonames.length ? dests.geonames[0].geonameId : ''
                )
            );
    }

    private getDestinations(
        destId: string,
        featureCode: string
    ): Observable<any[]> {
        if (!destId) {
            return of([]);
        }
        const params = new HttpParams()
            .set('username', consts.GEONAME_USER)
            .set('featureCode', featureCode)
            .set('style', 'SHORT')
            .set('geonameId', destId);
        return this.http
            .get(`${this.geonameUrl}/childrenJSON`, {
                params
            })
            .pipe(
                map((wards: any) =>
                    wards.geonames
                        .map((c: any) =>
                            this.normalize(c.toponymName, featureCode)
                        )
                        .sort((a: string, b: string) =>
                            a
                                .toLocaleLowerCase()
                                .localeCompare(b.toLocaleLowerCase())
                        )
                )
            );
    }

    private normalize(name: string, featureCode: string): string {
        const lower = name.toLowerCase();
        switch (featureCode) {
            case consts.GEONAME_LEVELS.WARD:
                if (
                    lower &&
                    lower.indexOf('phường') < 0 &&
                    lower.indexOf('xã') < 0
                ) {
                    return 'Phường ' + name;
                }
                break;
            case consts.GEONAME_LEVELS.CITY:
                if (
                    lower &&
                    (lower === 'Hồ Chí Minh'.toLowerCase() ||
                        lower.indexOf('Ho Chi Minh'.toLowerCase())) >= 0
                ) {
                    return 'Thành Phố Hồ Chí Minh';
                }
                if (
                    lower &&
                    lower.indexOf('Tỉnh'.toLowerCase()) < 0 &&
                    lower.toLowerCase().indexOf('Thành Phố'.toLowerCase()) < 0
                ) {
                    return 'Tỉnh ' + name;
                }
                if (lower === 'Hau Giang'.toLowerCase()) {
                    return 'Tỉnh Hậu Giang';
                }
                break;
            case consts.GEONAME_LEVELS.DISTRICT:
                if (lower.indexOf('Nhuan'.toLowerCase()) >= 0) {
                    return 'Quận Phú Nhuận';
                }
                if (
                    lower &&
                    lower.indexOf('Thành Phố'.toLowerCase()) < 0 &&
                    lower.indexOf('Quận'.toLowerCase()) < 0 &&
                    lower.indexOf('Huyện'.toLowerCase()) < 0 &&
                    lower.indexOf('Thị Xã'.toLowerCase()) < 0
                ) {
                    return 'Quận ' + name;
                }
                if (/\d/.test(name)) {
                    try {
                        const num = parseInt(name.split(' ')[0].trim(), 10);
                        return 'Quận ' + consts.NUMBERS[num - 1];
                    } catch (e) {
                        return name;
                    }
                }
                break;
        }
        return name;
    }

    private transformExceptions(destName: string, featureCode: string): string {
        if (featureCode === consts.GEONAME_LEVELS.DISTRICT) {
            if (
                destName.indexOf('Tân Bình') >= 0 ||
                destName.indexOf('Bình Thạnh') >= 0
            ) {
                return 'Quận ' + destName;
            }

            if (destName.indexOf('Thủ Đức') >= 0) {
                return 'Thu Duc';
            }

            if (destName.indexOf('Quận Ba') >= 0) {
                return 'Quận 3';
            }
        }
        return destName;
    }

    private getGeonameLevels(): string[] {
        const levels: string[] = [];
        const geonames: any = consts.GEONAME_LEVELS;
        for (const key in geonames) {
            if (geonames.hasOwnProperty(key)) {
                levels.push(geonames[key]);
            }
        }
        return levels;
    }
}
