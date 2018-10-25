export default class Address {
    static toAddress(address: Address): string {
        const { street, ward, city, country, district } = { ...address };
        const addr = [street, ward, district, city, country]
            .filter((x: string) => !!x)
            .join(', ');
        return addr;
    }
    id?: string;
    street: string;
    ward?: string;
    district?: string;
    city?: string;
    country?: string;
    lat?: number;
    lng?: number;
    label?: number;
    countryCode?: string;
    countryId?: string;
    cityId?: string;
    districtId?: string;
    wardId?: string;
}
