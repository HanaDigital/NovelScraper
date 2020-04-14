import { Injectable } from '@angular/core';
import { SelectMultipleControlValueAccessor } from '@angular/forms';

// import cloudscraper to bypass cloudflare
const cloudscraper = (<any>window).require('cloudscraper');
// import jquery
const $ = (<any>window).require('jquery');
//Import fs for chapter management
const fs = (<any>window).require('fs');

// Import Library Service
import { LibraryService } from './library.service';
import { unwatchFile } from 'fs';

@Injectable({
  providedIn: 'root'
})
export class NovelplanetService {

  // Stores list of novels recently searched for (not in library)
  localNovels: any[] = [];

  // UI Controls on what element to show
  showEmpty: boolean = true;    // Show empty icon
  showLoading: boolean = false; // Show loading icon
  showContent: boolean = false; // Show localNovels
  showError: boolean = false;

  missingCoverSrc: string = "https://i.imgur.com/BiKNsaI.png";

  constructor(private library: LibraryService) { }

  // Downloads novel
  async downloadNovel(link, downloadID) {
    console.log('Building...');

    let downloadedChapters = [];
    try {
      let stringHtml = await this.getHtmlString(link);

      let html = document.createElement('html');
      html.innerHTML = stringHtml;

      let infoSections = html.getElementsByClassName('post-contentDetails')[0].getElementsByTagName('p');
      for (let i = 0; i < infoSections.length; i++) {
        try {
          if (infoSections[i].getElementsByClassName('infoLabel')[0].textContent == "Author:") {
            this.library.updateAuthor(link, infoSections[i].getElementsByTagName('a')[0].innerText);
          }
        } catch (error) { }
      }

      // Get chapter links and names
      let chapters = html.getElementsByClassName('rowChapter');
      this.library.updateTotalChapters(link, chapters.length);
      let chapterLinks = [];
      let chapterNames = [];
      let novelName = html.getElementsByClassName('title')[0].textContent;
      for (let i = 0; i < chapters.length; i++) {
        chapterLinks.push("https://novelplanet.com/" + chapters[i].getElementsByTagName('a')[0].getAttribute('href'));
        chapterNames.push(chapters[i].getElementsByTagName('a')[0].innerText.replace(/(\r\n|\n|\r)/gm, "").replace(novelName, ''));
      }
      chapterLinks.reverse();
      chapterNames.reverse();

      // Update totalChapter defind in library
      this.library.updateTotalChapters(link, chapterLinks.length);

      let startIndex = 0;

      let novel = this.library.getNovel(link);
      if(novel.state.downloaded) {
        console.log('Loading existing chapters...');
        let chapters = fs.readFileSync(novel.info.folderPath + '\\chapters.json');
        let chapterList = JSON.parse(chapters);
        downloadedChapters = chapterList.chapters;
        startIndex = downloadedChapters.length;
      }

      // Download each chapter at a time
      for (let i = startIndex; i < chapterLinks.length; i++) {
        if (this.library.downloadTrackers[downloadID].cancel) {
          console.log('Download canceled!')
          return false;
        }

        let stringHtml = await this.getHtmlString(chapterLinks[i]);
        let pageHtml = new DOMParser().parseFromString(stringHtml, 'text/html');
        let html = pageHtml.getElementById('divReadContent');

        let chapterTitle = chapterNames[i];

        let ads = html.getElementsByTagName('div');
        for (let x = 0; x < ads.length; x++) {
          ads[x].remove();
        }

        let chapterBody = html.outerHTML;
        chapterBody += "<br/><br/>"
        chapterBody += "<p>dr-nyt's NovelScraper scraped this novel from a pirate site.</p>"
        chapterBody += "<p>If you can, please support the author(s) of this novel: " + novel.info.author + "</p>"
        downloadedChapters.push({ title: chapterTitle, data: chapterBody });

        let percentage = +(((i / chapterLinks.length) * 100).toFixed(2));
        this.library.updateDownloadTracker(downloadID, percentage);
      }

      this.library.cancelDownload(downloadID);
      await this.library.generateEpub(link, downloadedChapters);
      return true;

    } catch (error) {
      console.log(error);
    }
  }

  // Fetch novel from a link and store it in localNovels for display
  async fetchFromLink(link) {
    try {
      let stringHtml = await this.getHtmlString(link);
      let html = document.createElement('html');
      html.innerHTML = stringHtml;
      let imageSection = html.getElementsByClassName('post-previewInDetails')[0];
      let infoSections = html.getElementsByClassName('post-contentDetails')[0].getElementsByTagName('p');
      let chapters = html.getElementsByClassName('rowChapter');

      let name = html.getElementsByClassName('title')[0].textContent;
      let latestChapter = chapters[0].getElementsByTagName('a')[0].innerText.replace(/(\r\n|\n|\r)/gm, "");
      let cover = imageSection.getElementsByTagName('img')[0].src;
      if(cover.includes('/Uploads/') || cover.includes('/Content/') || cover.includes('/Novel/')) {
        cover = this.missingCoverSrc;
      }
      let totalChapters = chapters.length;
      let source = "novelplanet";
      let author = "";
      let genre = "";
      let summary = "unknown";
      try {
        summary = html.getElementsByClassName('container')[0].getElementsByTagName('div')[0].getElementsByTagName('div')[3].textContent.replace(/(\r\n|\n|\r)/gm, "");
      } catch (error) { console.log(error); }


      for (let i = 0; i < infoSections.length; i++) {
        try {
          if (infoSections[i].getElementsByClassName('infoLabel')[0].textContent == "Author:") {
            author = infoSections[i].getElementsByTagName('a')[0].textContent;
          } else if (infoSections[i].getElementsByClassName('infoLabel')[0].textContent == "Genre:") {
            genre = "";
            for (let x = 0; x < infoSections[i].getElementsByTagName('a').length; x++) {
              genre += infoSections[i].getElementsByTagName('a')[x].innerText + ', ';
            }
            genre = genre.slice(0, -2);
          }
        } catch (error) {
          continue;
        }
      }

      this.localNovels.unshift({
        info: {
          link: link,
          name: name,
          latestChapter: latestChapter,
          cover: cover,
          totalChapters: totalChapters,
          source: source,
          author: author,
          genre: genre,
          summary: summary
        },
        state: {
          downloaded: false
        }
      });
      this.show('content');

    } catch (error) {
      console.log(error);
      this.show('error');
    }
  }

  // Fetch novels by name and store them in localNovels for display
  async fetchFromSearch(val) {
    val = val.replace(' ', '%20')
    let searchLink = "https://novelplanet.com/NovelList?name=" + val;

    try {
      let stringHtml = await this.getHtmlString(searchLink);
      let html = document.createElement('html');
      html.innerHTML = stringHtml;

      let container = html.getElementsByClassName('container')[1];
      let novelList = container.getElementsByTagName('article');

      if (novelList.length == 0) {
        this.show('empty');
        return;
      }

      let link = "";
      let name = "";
      let latestChapter = "";
      let cover = "";
      let totalChapters = "unknown";
      let source = "novelplanet";
      let author = "unknown";
      let genre = "";
      let summary = ""

      let genres;
      for (let i = novelList.length - 1; i >= 0; i--) {
        link = 'https://novelplanet.com' + novelList[i].getElementsByClassName('title')[0].getAttribute('href');
        name = novelList[i].getElementsByClassName('title')[0].textContent;
        latestChapter = novelList[i].getElementsByClassName('post-content')[0].getElementsByTagName('div')[2].getElementsByTagName('a')[0].textContent;
        cover = novelList[i].getElementsByClassName('post-preview')[0].getElementsByTagName('img')[0].src;
        if(cover.includes('/Uploads/') || cover.includes('/Content/') || cover.includes('/Novel/')) {
          cover = this.missingCoverSrc;
        }
        console.log(cover);
        genres = novelList[i].getElementsByClassName('post-content')[0].getElementsByTagName('div')[1].getElementsByTagName('a');
        genre = "";
        for (let x = 0; x < genres.length; x++) {
          genre += genres[x].innerText + ', ';
        }
        genre = genre.slice(0, -2);
        summary = novelList[i].getElementsByClassName('divDescriptionInList')[0].getAttribute('title');
        this.localNovels.unshift({
          info: {
            link: link,
            name: name,
            latestChapter: latestChapter,
            cover: cover,
            totalChapters: totalChapters,
            source: source,
            author: author,
            genre: genre,
            summary: summary
          },
          state: {
            downloaded: false
          }
        });
      }
      this.show('content');
    } catch (error) {
      console.log(error);
      this.show('error');
    }
  }

  // Utility function to get html from a link using selenium
  async getHtmlString(link) {
    var options = {
      method: 'GET',
      url: link,
    }

    let stringHtml = await cloudscraper(options, (error, response, novelHtmlString) => {
      return novelHtmlString;
    });
    return stringHtml;
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

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
