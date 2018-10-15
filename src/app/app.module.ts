import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { RoutingService } from './routing.service';
import { AgmCoreModule } from "@agm/core";

@NgModule({
    declarations: [
        // add components here
        AppComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpClientModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        AgmCoreModule.forRoot({
            apiKey: process.env.MAP_API,
            libraries: ["places"]
        })
    ],
    exports: [],
    providers: [
        RoutingService
        // add injectable things here
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
