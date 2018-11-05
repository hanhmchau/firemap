import { map, switchMap } from 'rxjs/operators';
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
    private fetchWards: boolean = true;
    private fetchDistricts: boolean = true;
    private fetchCities: boolean = true;

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
                    // this.fetchInitialOptions();
                    this.populateSelects(this.address);
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

    populateSelects(address: Address) {
        this.cities = [address.city];
        this.districts = [address.district];
        this.wards = [address.ward];
    }

    onAddressUpdated(info: any) {
        const oldAddress = this.address;
        const address: Address = info.address;
        this.populateSelects(address);
        this.address = {
            ...this.address,
            ...address
        };
        this.fetchWards = true;
        if (oldAddress.district !== address.district) {
            this.fetchWards = true;
        }
        if (oldAddress.city !== address.city) {
            this.fetchDistricts = true;
        }
        if (oldAddress.country !== address.country) {
            this.fetchCities = true;
        }
    }

    loadWards() {
        if (this.fetchWards) {
            this.mapService
            .searchDistrict(this.address.district)
            .pipe(switchMap(geonameId => this.mapService.getWards(geonameId)))
            .subscribe(wards => {
                if (wards.length) {
                    this.fetchWards = false;
                    this.wards = wards;
                }
            });
        }
    }

    loadDistricts() {
        if (this.fetchDistricts) {
            this.mapService
            .searchCity(this.address.city)
            .pipe(switchMap(geonameId => this.mapService.getDistricts(geonameId)))
            .subscribe(districts => {
                this.fetchDistricts = false;
                this.districts = districts;
            });
        }
    }

    loadCities() {
        if (this.fetchCities) {
            this.mapService
            .searchCountry(this.address.country)
            .pipe(switchMap(geonameId => this.mapService.getCities(geonameId)))
            .subscribe(cities => {
                this.fetchCities = false;
                this.cities = cities;
            });
        }
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
            this.fetchCities = true;
            this.fetchWards = true;
            this.fetchDistricts = true;
        });
        this.refreshMap();
    }

    onCityChanged(cityId: string) {
        this.address.city = this.cities.filter(
            city => city === cityId
        )[0];
        this.mapService.getDistricts(cityId).subscribe(districts => {
            this.districts = districts;
            this.wards = [];
            delete this.address.district;
            delete this.address.districtId;
            this.fetchWards = true;
            this.fetchDistricts = true;
        });
        this.refreshMap();
    }

    onDistrictChanged(districtId: string) {
        this.address.district = this.districts.filter(
            d => d === districtId
        )[0];
        this.mapService.getWards(districtId).subscribe(wards => {
            this.wards = wards;
            this.address.ward = '';
            this.address.wardId = '';
            this.fetchDistricts = true;
        });
        this.refreshMap();
    }

    onWardChanged(wardId: string) {
        this.address.ward = this.wards.filter(
            ward => ward === wardId
        )[0];
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
