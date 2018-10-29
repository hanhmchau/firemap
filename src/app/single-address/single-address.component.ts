import { LatLngLiteral } from '@agm/core';
import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
    BehaviorSubject,
    Observable,
    Subject,
    Subscription,
    forkJoin,
    of
} from 'rxjs';
import Address from '../models/address';
import Map from '../models/map';
import Marker from '../models/marker';
import { MapService } from './../services/map.service';
import consts from '../../consts';

@Component({
    selector: 'app-single-address',
    templateUrl: './single-address.component.html',
    styleUrls: ['./single-address.component.css']
})
export class SingleAddressComponent {
    @Input()
    address: Address;
    private width: number;
    private marker: Marker;
    private mapSubject: Subject<Map>;
    private map$: Observable<Map>;
    private countries: any[] = [];
    private cities: any[] = [];
    private districts: any[] = [];
    private wards: any[] = [];
    private streetValidated = true;
    private wardDistrictValidated = true;
    private trySaved = false;
    private nearbyAddresses: any[] = [];
    private routeSubscription: Subscription;
    private savedId: string;

    constructor(
        private mapService: MapService,
        private route: ActivatedRoute,
        private router: Router,
        private toastr: ToastrService
    ) {}

    ngOnInit(): void {
        this.routeSubscription = this.route.paramMap.subscribe(paramMap => {
            const id = paramMap.get('id');
            this.fetchAddress(id);
            window.scrollTo(0, 0);
        });
    }

    ngOnDestroy(): void {
        this.routeSubscription.unsubscribe();
    }

    fetchAddress(id: string) {
        if (this.route.toString().indexOf('new') >= 0) {
            this.address = {
                id: '-1',
                street: ''
            };
            this.initialize();
        } else {
            this.mapService.getById(id).subscribe(address => {
                if (address) {
                    this.address = address;
                    this.initialize();
                    this.savedId = id.slice();
                    this.fetchInitialOptions();
                } else {
                    this.router.navigate(['/not-found']);
                }
            });
        }
        this.mapService.getCountries().subscribe(countries => {
            this.countries = countries;
        });
    }

    initialize() {
        this.marker = {
            lat: this.address.lat,
            lng: this.address.lng
        };
        const newMap = {
            lat: this.address.lat,
            lng: this.address.lng,
            zoom: 12
        };
        if (this.mapSubject) {
            this.mapSubject.next(newMap);
        } else {
            this.mapSubject = new BehaviorSubject<Map>(newMap);
            this.map$ = this.mapSubject.asObservable();
        }
    }

    onAddressUpdated(info: any) {
        const address: Address = info.address;
        const latLng: LatLngLiteral = info.latLng;
        const oldAddress = {
            ...this.address
        };
        this.address = { ...this.address, ...address };
        this.mapService.searchLatLng(latLng).subscribe((locations: any) => {
            this.address.countryId = locations[consts.GEONAME_LEVELS.COUNTRY];
            this.address.cityId = locations[consts.GEONAME_LEVELS.CITY];
            forkJoin(
                locations[consts.GEONAME_LEVELS.DISTRICT]
                    ? of(locations[consts.GEONAME_LEVELS.DISTRICT])
                    : this.mapService.searchDistrict(this.address.district),
                locations[consts.GEONAME_LEVELS.WARD]
                    ? of(locations[consts.GEONAME_LEVELS.WARD])
                    : this.mapService.searchWard(this.address.ward)
            ).subscribe((values: string[]) => {
                this.address.districtId = values[0];
                this.address.wardId = values[1] || '';
                console.log(this.address.countryId, oldAddress.countryId);
                console.log(this.address.cityId, oldAddress.cityId);
                console.log(this.address.districtId, oldAddress.districtId);
                const countryChanged =
                    this.address.countryId.toString() !==
                    oldAddress.countryId.toString();
                const cityChanged =
                    this.address.cityId.toString() !==
                    oldAddress.cityId.toString();
                const districtChanged =
                    this.address.districtId.toString() !==
                    oldAddress.districtId.toString();
                this.fetchInitialOptions(
                    countryChanged,
                    cityChanged,
                    districtChanged
                );
            });
        });
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
            if (latlng) {
                const { lat, lng } = { ...latlng };
                this.address.lat = lat;
                this.address.lng = lng;
                this.marker.lat = lat;
                this.marker.lng = lng;
                this.mapSubject.next({
                    lat,
                    lng
                });
            }
        });
    }

    isStreetValidated(): boolean {
        return !!this.address.street;
    }

    isWardDistrictValidated(): boolean {
        const { city, ward, district } = { ...this.address };
        return !!city || (!!ward && !!district);
    }

    save() {
        this.trySaved = true;
        this.streetValidated = this.isStreetValidated();
        this.wardDistrictValidated = this.isWardDistrictValidated();
        if (this.streetValidated && this.wardDistrictValidated) {
            this.toastrSuccess();
            if (this.address.id === '-1') {
                this.mapService.insert(this.address).subscribe(id => {
                    this.router.navigate(['/']);
                });
            } else {
                this.address.id = this.savedId;
                this.mapService.update(this.address).subscribe();
            }
        }
    }

    toastrSuccess() {
        this.toastr.success('Saved', undefined, {
            timeOut: 2000
        });
    }

    onCountryChanged(countryCode: string) {
        const countryId = this.countries.filter(c => c.code === countryCode)[0]
            .id;
        this.address.countryId = countryId;
        this.mapService.getCities(countryId).subscribe(cities => {
            this.cities = cities;
            this.districts = [];
            this.wards = [];
            delete this.address.district;
            delete this.address.districtId;
            delete this.address.ward;
            delete this.address.wardId;
        });
        this.refreshMap();
    }

    onCityChanged(cityId: string) {
        this.address.city = this.cities.filter(
            city => city.id === parseInt(cityId, 10)
        )[0].name;
        this.mapService.getDistricts(cityId).subscribe(districts => {
            this.districts = districts;
            this.wards = [];
            delete this.address.district;
            delete this.address.districtId;
        });
        this.refreshMap();
    }

    onDistrictChanged(districtId: string) {
        this.address.district = this.districts.filter(
            d => d.id === parseInt(districtId, 10)
        )[0].name;
        this.mapService.getWards(districtId).subscribe(wards => {
            this.wards = wards;
            this.address.ward = '';
            this.address.wardId = '';
        });
        this.refreshMap();
    }

    onWardChanged(wardId: string) {
        this.address.ward = this.wards.filter(
            ward => ward.id === parseInt(wardId, 10)
        )[0].name;
        this.address.wardId = wardId;
        this.refreshMap();
    }

    fetchInitialOptions(
        fetchCity: boolean = true,
        fetchDistrict: boolean = true,
        fetchWard: boolean = true
    ) {
        forkJoin(
            fetchCity
                ? this.mapService.getCities(this.address.countryId)
                : of(this.cities),
            fetchDistrict
                ? this.mapService.getDistricts(this.address.cityId)
                : of(this.districts),
            fetchWard
                ? this.mapService.getWards(this.address.districtId)
                : of(this.wards)
        ).subscribe((values: any[]) => {
            this.cities = values[0];
            this.districts = values[1];
            this.wards = values[2];
        });
    }

    onLoaded() {
        this.mapService.getNearby(this.address).subscribe(nearbyAddresses => {
            this.nearbyAddresses = nearbyAddresses;
        });
    }
}
