// just an interface for type safety.
export default class Marker {
    lat: number;
    lng: number;
    label?: string;
    draggable?: boolean;
    toAddress?: () => string;
}