import { AddressContainerComponent } from './address-container/address-container.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SingleAddressComponent } from './single-address/single-address.component';

const routes: Routes = [
    {
        path: '',
        component: AddressContainerComponent,
        pathMatch: 'full'
    },
    {
        path: 'new-post',
        component: SingleAddressComponent
    },
    {
        path: 'address/:id',
        component: SingleAddressComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}
