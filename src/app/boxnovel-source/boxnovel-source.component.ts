import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

// Import Library Service
import { LibraryService } from '../library.service';
// Import BoxNovel Service
import { BoxnovelService } from '../boxnovel.service';

const { shell } = require('electron');

@Component({
  selector: 'app-boxnovel-source',
  templateUrl: './boxnovel-source.component.html',
  styleUrls: ['./boxnovel-source.component.scss']
})
export class BoxnovelSourceComponent implements OnInit {

  val: any;

  constructor(private router: Router, private library: LibraryService, public boxnovelService: BoxnovelService) { }

  ngOnInit(): void {
    document.getElementById("boxnovel-website").addEventListener("click", this.openWebsite);
  }

  // Binded to boxnovel search bar
  search(val) {
    if (val == undefined || val == "") {
      return;
    } else if (val.toLowerCase().includes("boxnovel.com/novel/")) {
      this.boxnovelService.show('loading');
      val = val.split('?')[0];
      this.boxnovelService.fetchFromLink(val);
    } else {
      this.boxnovelService.show('loading');
      this.boxnovelService.fetchFromSearch(val);
    }
  }

  openWebsite() {
    shell.openExternal('https://boxnovel.com/')
  }

  // Load novelpage with the information of the novel clicked on
  loadNovelPage(novel) {
    this.router.navigateByUrl('/novel', { state: { novel: novel, source: 'boxnovel' } });
  }

}
