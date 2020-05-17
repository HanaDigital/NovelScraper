import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './shared/components';

// Page routes
import { SourcesComponent } from './sources/sources.component';
import { NovelplanetSourceComponent } from './novelplanet-source/novelplanet-source.component';
import { ReadlightnovelSourceComponent } from './readlightnovel-source/readlightnovel-source.component';
import { BoxnovelSourceComponent } from './boxnovel-source/boxnovel-source.component';
import { LibraryComponent } from './library/library.component';
import { NovelComponent } from './novel/novel.component';
import { SettingComponent } from './setting/setting.component';

const routes: Routes = [
  { path: 'sources', component: SourcesComponent },
  { path: 'novelplanetSource', component: NovelplanetSourceComponent },
  { path: 'readlightnovelSource', component: ReadlightnovelSourceComponent },
  { path: 'boxnovelSource', component: BoxnovelSourceComponent },
  { path: 'novel', component: NovelComponent },
  { path: 'library', component: LibraryComponent },
  { path: 'setting', component: SettingComponent },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: '**',
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
