import { AgmCoreModule } from '@agm/core';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AngularFontAwesomeModule } from 'angular-font-awesome';
import { ToastrModule } from 'ngx-toastr';
import consts from '../consts';
import { AddressContainerComponent } from './address-container/address-container.component';
import { AddressComponent } from './address/address.component';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { MapComponent } from './map/map.component';
import { RoutingService } from './routing.service';
import { MapService } from './services/map.service';
import { SingleAddressComponent } from './single-address/single-address.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { NotFoundComponent } from './not-found/not-found.component';
import { ApolloModule, APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLinkModule, HttpLink } from 'apollo-angular-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';

const defaultOptions = {
    watchQuery: {
        fetchPolicy: 'network-only',
        errorPolicy: 'ignore'
    },
    query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all'
    }
};

@NgModule({
    declarations: [
        // add components here
        AppComponent,
        HeaderComponent,
        AddressContainerComponent,
        MapComponent,
        AddressComponent,
        SingleAddressComponent,
        NotFoundComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpClientModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        AngularFontAwesomeModule,
        AgmCoreModule.forRoot({
            apiKey: consts.MAP_API,
            libraries: ['places']
        }),
        NgbModule.forRoot(),
        AngularFireModule.initializeApp(consts.FIREBASE),
        AngularFirestoreModule.enablePersistence(),
        ToastrModule.forRoot({
            preventDuplicates: true,
            positionClass: 'toast-bottom-right'
        }),
        InfiniteScrollModule,
        HttpLinkModule,
        ApolloModule
    ],
    exports: [],
    providers: [
        RoutingService,
        MapService,
        {
            provide: APOLLO_OPTIONS,
            useFactory(httpLink: HttpLink) {
                return {
                    cache: new InMemoryCache(),
                    link: httpLink.create({
                        uri:
                            'https://us-central1-firemap-219503.cloudfunctions.net/api/graphql'
                    }),
                    defaultOptions
                };
            },
            deps: [HttpLink]
        }
        // add injectable things here
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
