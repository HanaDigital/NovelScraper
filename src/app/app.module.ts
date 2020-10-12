import 'reflect-metadata';
import '../polyfills';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppComponent } from './app.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { SourcesPageComponent } from './pages/sources-page/sources-page.component';
import { LibraryPageComponent } from './pages/library-page/library-page.component';
import { SourceButtonComponent } from './pages/sources-page/source-button/source-button.component';
import { SourcePageComponent } from './pages/source-page/source-page.component';
import { NovelCardComponent } from './shared/novel-card/novel-card.component';
import { NovelComponent } from './pages/novel/novel.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
	return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
	declarations: [AppComponent, HomePageComponent, SourcesPageComponent, LibraryPageComponent, SourceButtonComponent, SourcePageComponent, NovelCardComponent, NovelComponent],
	imports: [
		BrowserModule,
		FormsModule,
		HttpClientModule,
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
