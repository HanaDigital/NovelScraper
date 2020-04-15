import { Component } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../environments/environment';
import { BrowserWindow } from 'electron';
import { RouterOutlet } from '@angular/router';

// Import Library Service
import { LibraryService } from './library.service';

const {remote} = require('electron');

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public menuButtons: any;
  public menuBackground: string;
  public buttonHighlight: string;

  constructor(
    public electronService: ElectronService,
    private translate: TranslateService,
    private library: LibraryService
  ) {
    translate.setDefaultLang('en');

    // Define button colors to maintain
    this.menuButtons = document.getElementsByClassName("menuButton");
    this.menuBackground = "#033e63";
    this.buttonHighlight = "linear-gradient(90deg, rgba(6,113,179,1) 0%, rgba(3,62,99,1) 100%)";


    // console.log('AppConfig', AppConfig);

    if (electronService.isElectron) {
      // console.log(process.env);
      // console.log('Mode electron');
      // console.log('Electron ipcRenderer', electronService.ipcRenderer);
      // console.log('NodeJS childProcess', electronService.childProcess);
    } else {
      // console.log('Mode web');
    }
  }

  //UI Control
  // Higlight the home button and open the home page
  loadHomePage() {
      this.deselectButtons();
      this.menuButtons[0].style.background = this.buttonHighlight;
  }

  // Higlight the sources button and open the sources page
  loadSourcesPage() {
      this.deselectButtons();
      this.menuButtons[1].style.background = this.buttonHighlight;
  }

  // Higlight the library button and open the library page
  loadLibraryPage() {
      this.deselectButtons();
      this.menuButtons[2].style.background = this.buttonHighlight;
      this.library.loadNovels();
  }

  // Deselect all menu buttons
  deselectButtons() {
      for(let i = 0; i < this.menuButtons.length; i++) {
        this.menuButtons[i].style.background = this.menuBackground;
      }
  }

  // Window Controls
  // Minimize Window
  minWindow() {
    remote.getCurrentWindow().minimize();
  }

  // Maximize and unMaximize Window
  maxWindow() {
    remote.getCurrentWindow().isMaximized() ? remote.getCurrentWindow().unmaximize() : remote.getCurrentWindow().maximize();
  }

  // Close Window
  closeWindow() {
    remote.getCurrentWindow().close();
  }
}