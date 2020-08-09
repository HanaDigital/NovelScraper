import 'reflect-metadata';
import '../polyfills';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';

import { AppRoutingModule } from './app-routing.module';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { HomeModule } from './home/home.module';

import { AppComponent } from './app.component';
import { SourcesComponent } from './sources/sources.component';
import { LibraryComponent } from './library/library.component';
import { NovelplanetSourceComponent } from './novelplanet-source/novelplanet-source.component';
import { ReadlightnovelSourceComponent } from './readlightnovel-source/readlightnovel-source.component';
import { BoxnovelSourceComponent } from './boxnovel-source/boxnovel-source.component';
import { NovelComponent } from './novel/novel.component';
import { SettingComponent } from './setting/setting.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [AppComponent, SourcesComponent, LibraryComponent, NovelplanetSourceComponent, BoxnovelSourceComponent, NovelComponent, SettingComponent, ReadlightnovelSourceComponent],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    CoreModule,
    SharedModule,
    HomeModule,
    AppRoutingModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
