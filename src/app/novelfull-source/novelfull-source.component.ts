import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

// Import Library Service
import { LibraryService } from '../library.service';
// Import NovelFull Service
import { NovelfullService } from '../novelfull.service';

@Component({
  selector: 'app-novelfull-source',
  templateUrl: './novelfull-source.component.html',
  styleUrls: ['./novelfull-source.component.scss']
})
export class NovelfullSourceComponent implements OnInit {

  val: any;

  constructor(private router: Router, private library: LibraryService ,public novelfullService: NovelfullService) { }

  ngOnInit(): void {
  }

  // Binded to novelfull search bar
  search(val) {
    if(val == undefined || val == "") {
      return;
    } else if(val.toLowerCase().includes("novelfull.com/")) {
      this.novelfullService.show('loading');
      this.novelfullService.fetchFromLink(val);
    } else {
      this.novelfullService.show('loading');
      this.novelfullService.fetchFromSearch(val);
    }
  }

}
