export function updateMapWidth() {
    this.width = document.getElementById('table').offsetWidth;
    const agmMaps = document.getElementsByTagName('agm-map');
    const rows = document.getElementsByTagName('app-address');
    const inputs = document.getElementsByClassName('autosuggest');
    for (
        let index = 0;
        index < document.getElementsByTagName('agm-map').length;
        index++
    ) {
        const el = agmMaps.item(index) as HTMLElement;
        const rowEl = rows.item(index) as HTMLElement;
        const input = inputs.item(index) as HTMLElement;
        el.style.width = `${this.width}px`;
        input.style.width = `${this.width / 2}px`;
        const bound = rowEl.getBoundingClientRect();
        el.style.top = input.style.top = `${bound.top +
            rowEl.offsetHeight +
            1}px`;
        el.style.left = input.style.left = `${bound.left}px`;
    }
}
