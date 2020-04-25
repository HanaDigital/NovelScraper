import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

// Import Library Service
import { LibraryService } from '../library.service';

@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss']
})
export class LibraryComponent implements OnInit {

  val: any;

  constructor(private router: Router, public library: LibraryService) {  }

  ngOnInit(): void {  }

  // Binded to the search bar
  search(val) {
    this.library.getNovelsByName(val);
  }

  // Load novelpage with the information of the novel clicked on
  loadNovelPage(novel) {
    this.router.navigateByUrl('/novel', { state: { novel: novel, source: 'library' } });
  }

}
