import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NovelfullService {

  // Stores list of novels recently searched for (not in library)
  localNovels: any[] = [];

  // UI Controls on what element to show
  showEmpty: boolean = false;    // Show empty icon
  showLoading: boolean = false; // Show loading icon
  showContent: boolean = false; // Show localNovels
  showError: boolean = false;

  constructor() { }

  async downloadNovel(link, downloadID) {

  }

  async fetchFromLink(link) {

  }

  async fetchFromSearch(val) {

  }

  // Utility function turns off other elements when one is shown
  show(section: string) {
    if (section == 'empty') {
      this.showEmpty = true;
      this.showLoading = false;
      this.showContent = false;
      this.showError = false;
    } else if (section == 'loading') {
      this.showEmpty = false;
      this.showLoading = true;
      this.showContent = false;
      this.showError = false;
    } else if (section == 'content') {
      this.showEmpty = false;
      this.showLoading = false;
      this.showContent = true;
      this.showError = false;
    } else if (section == 'error') {
      this.showEmpty = false;
      this.showLoading = false;
      this.showContent = false;
      this.showError = true;
    }
  }
}
