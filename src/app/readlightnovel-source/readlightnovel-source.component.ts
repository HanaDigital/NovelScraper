import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

// Import Library Service
import { LibraryService } from '../library.service';
// Import Readlightnovel Service
import { ReadlightnovelService } from '../readlightnovel.service';

const { shell } = require('electron');

@Component({
  selector: 'app-readlightnovel-source',
  templateUrl: './readlightnovel-source.component.html',
  styleUrls: ['./readlightnovel-source.component.scss']
})
export class ReadlightnovelSourceComponent implements OnInit {

  val: any;

  constructor(private router: Router, private library: LibraryService, public readlightnovelService: ReadlightnovelService) { }

  ngOnInit(): void {
    document.getElementById("readlightnovel-website").addEventListener("click", this.openWebsite);
  }

  // Binded to novelfull search bar
  search(val) {
    if(val == undefined || val == "") {
      return;
    } else if(val.toLowerCase().includes("readlightnovel.org/")) {
      this.readlightnovelService.show('loading');
      this.readlightnovelService.fetchFromLink(val);
    } else {
      this.readlightnovelService.show('loading');
      this.readlightnovelService.fetchFromSearch(val);
    }
  }

  openWebsite() {
    shell.openExternal('https://www.readlightnovel.org/')
  }

  // Load novelpage with the information of the novel clicked on
  loadNovelPage(novel) {
    this.router.navigateByUrl('/novel', { state: { novel: novel, source: 'readlightnovel' } });
  }
}
