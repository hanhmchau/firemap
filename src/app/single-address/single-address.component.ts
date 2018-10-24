import { LatLngLiteral } from '@agm/core';
import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
    BehaviorSubject,
    Observable,
    Subject,
    Subscription,
    forkJoin
} from 'rxjs';
import Address from '../models/address';
import Map from '../models/map';
import Marker from '../models/marker';
import { MapService } from './../services/map.service';

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
                    this.fetchInitialOptions();
                    this.mapService
                        .getNearby(this.address)
                        .subscribe(nearbyAddresses => {
                            this.nearbyAddresses = nearbyAddresses;
                        });
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
            lng: this.address.lng,
            draggable: true
        };
        this.mapSubject = new BehaviorSubject<Map>({
            lat: this.address.lat,
            lng: this.address.lng,
            zoom: 12
        });
        this.map$ = this.mapSubject.asObservable();
    }

    onAddressUpdated(address: Address) {
        this.address = { ...this.address, ...address };
        forkJoin(
            this.mapService.searchCountry(this.address.country),
            this.mapService.searchCity(this.address.city),
            this.mapService.searchDistrict(this.address.district),
            this.mapService.searchWard(this.address.ward)
        ).subscribe((values) => {
            console.log(values);
            this.address.countryId = values[0];
            this.address.cityId = values[1];
            this.address.districtId = values[2];
            this.address.wardId = values[3];
            this.fetchInitialOptions();
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
                this.marker = {
                    lat,
                    lng
                };
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
            delete this.address.ward;
            delete this.address.wardId;
        });
        this.refreshMap();
    }

    onDistrictChanged(districtId: string) {
        this.address.district = this.districts.filter(
            d => d.id === parseInt(districtId, 10)
        )[0].name;
        this.mapService.getWards(districtId).subscribe(wards => {
            this.wards = wards;
        });
        this.refreshMap();
    }

    onWardChanged(wardId: string) {
        this.address.ward = this.wards.filter(
            ward => ward.id === parseInt(wardId, 10)
        )[0].name;
        this.refreshMap();
    }

    fetchInitialOptions() {
        forkJoin(
            this.mapService.getCities(this.address.countryId),
            this.mapService.getDistricts(this.address.cityId),
            this.mapService.getWards(this.address.districtId)
        ).subscribe((values: any[]) => {
            this.cities = values[0];
            this.districts = values[1];
            this.wards = values[2];
        });
    }
}
