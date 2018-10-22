import { AddressContainerComponent } from './address-container/address-container.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SingleAddressComponent } from './single-address/single-address.component';
import { NotFoundComponent } from './not-found/not-found.component';

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
    },
    {
        path: 'not-found',
        component: NotFoundComponent
    },
    {
        path: '**',
        component: NotFoundComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}
