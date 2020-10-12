import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomePageComponent } from './pages/home-page/home-page.component';
import { SourcesPageComponent } from './pages/sources-page/sources-page.component';
import { LibraryPageComponent } from './pages/library-page/library-page.component';
import { SourcePageComponent } from './pages/source-page/source-page.component';
import { NovelComponent } from './pages/novel/novel.component';

const routes: Routes = [
	{ path: '', component: HomePageComponent },
	{ path: 'sources', component: SourcesPageComponent },
	{ path: 'source', component: SourcePageComponent },
	{ path: 'novel', component: NovelComponent },
	{ path: 'library', component: LibraryPageComponent },
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
