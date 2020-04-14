import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

// Import Library Service
import { LibraryService } from '../library.service';
// Import Novelplanet Service
import { NovelplanetService } from '../novelplanet.service';

@Component({
  selector: 'app-novelplanet-source',
  templateUrl: './novelplanet-source.component.html',
  styleUrls: ['./novelplanet-source.component.scss']
})
export class NovelplanetSourceComponent implements OnInit {

  val: any;

  constructor(private router: Router, private library: LibraryService, public novelplanetService: NovelplanetService) { }

  ngOnInit(): void {

  }

  // Binded to novelplanet search bar
  search(val) {
    if(val == undefined || val == "") {
      return;
    } else if(val.toLowerCase().includes("novelplanet.com/novel/")) {
      this.novelplanetService.show('loading');
      val = val.split('?')[0];
      this.novelplanetService.fetchFromLink(val);
    } else {
      this.novelplanetService.show('loading');
      this.novelplanetService.fetchFromSearch(val);
    }
  }

  // Load novelpage with the information of the novel clicked on
  loadNovelPage(novel) {
    this.router.navigateByUrl('/novel', { state: { novel: novel, source: 'novelplanet' } });
  }
}
