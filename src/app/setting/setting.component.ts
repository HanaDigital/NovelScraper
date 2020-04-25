import { Component, OnInit } from '@angular/core';
import { fstat } from 'fs';
import { visitAll } from '@angular/compiler';

// Import Library Service
import { LibraryService } from '../library.service';

//Import fs for chapter management
const fs = (<any>window).require('fs-extra');

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss']
})
export class SettingComponent implements OnInit {

  val:any;

  downloadFolder = localStorage.getItem('downloadFolder');

  constructor(private libraryService: LibraryService) { }

  ngOnInit(): void {
  }

  saveDownloadFolder(val) {
    if(val === "") {
      return;
    }

    fs.access(val, fs.F_OK, (err) => {
      if(err) {
        alert("Can't access " + val);
        return;
      }

      fs.mkdir(val + '\\' + "NovelScraper-Library", (err) => {
        fs.moveSync(this.downloadFolder + '\\' + "NovelScraper-Library" + '\\library.json', val + '\\' + "NovelScraper-Library" + '\\library.json');
        console.log('library folder created!');

        localStorage.setItem("downloadFolder", val);
        this.downloadFolder = localStorage.getItem('downloadFolder');

        this.libraryService.generateLibrary();
      });
    });
  }

}
