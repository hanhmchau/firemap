import { MapService } from './services/map.service';
import { AddressComponent } from './address/address.component';
import { MapComponent } from './map/map.component';
import { AddressContainerComponent } from './address-container/address-container.component';
import { AgmCoreModule } from '@agm/core';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RoutingService } from './routing.service';
import { HeaderComponent } from './header/header.component';
import { AngularFontAwesomeModule } from 'angular-font-awesome';

@NgModule({
    declarations: [
        // add components here
        AppComponent,
        HeaderComponent,
        AddressContainerComponent,
        MapComponent,
        AddressComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpClientModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        AngularFontAwesomeModule,
        AgmCoreModule.forRoot({
            apiKey: process.env.MAP_API,
            libraries: ['places']
        }),
        NgbModule.forRoot()
    ],
    exports: [],
    providers: [
        RoutingService,
        MapService
        // add injectable things here
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
