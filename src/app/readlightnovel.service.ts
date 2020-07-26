import { Injectable, NgZone } from '@angular/core';

// Import Library Service
import { LibraryService } from './library.service';
import { exception } from 'console';
// import cloudscraper to bypass cloudflare
const cloudscraper = (<any>window).require('cloudscraper');
//Import fs for chapter management
const fs = (<any>window).require('fs');

@Injectable({
  providedIn: 'root'
})
export class ReadlightnovelService {

  // Stores list of novels recently searched for (not in library)
  localNovels: any[] = [];

  // UI Controls on what element to show
  showEmpty: boolean = true;    // Show empty icon
  showLoading: boolean = false; // Show loading icon
  showContent: boolean = false; // Show localNovels
  showError: boolean = false;
  showNotify: boolean = false;

  constructor(private ngZone: NgZone, private library: LibraryService) { }

  async downloadNovel(link, downloadID) {
    console.log('Building...');

    let downloadedChapters = [];
    try {
      let stringHtml = await this.getHtmlString(link);
      let html = document.createElement('html');
      html.innerHTML = stringHtml;

      // Get chapter links and names
      let chapterLinks = [];
      let chapterNames = [];
      let chapterVolumes = html.getElementsByClassName("tab-content");
      for (let s = 0; s < chapterVolumes.length; s++) {
        let chapterTabs = chapterVolumes[s].getElementsByClassName("tab-pane");
        for (let i = 0; i < chapterTabs.length; i++) {
          if (chapterTabs[i].getElementsByTagName("li").length !== 0) {
            let chapterHolders = chapterTabs[i].getElementsByTagName("li");
            for (let x = 0; x < chapterHolders.length; x++) {
              chapterLinks.push(chapterHolders[x].getElementsByTagName('a')[0].getAttribute('href'));
              chapterNames.push(chapterHolders[x].innerText);
            }
          }
        }
      }

      // Update totalChapter defind in library
      this.library.updateTotalChapters(link, chapterLinks.length);

      let startIndex = 0;

      // Update novel if already downloaded
      let novel = this.library.getNovel(link);
      try {
        if (novel.state.downloaded) {
          console.log('Loading existing chapters...');
          let chapters = fs.readFileSync(novel.info.folderPath + '\\chapters.json');
          let chapterList = JSON.parse(chapters);
          downloadedChapters = chapterList.chapters;
          startIndex = downloadedChapters.length;
        }
      } catch (error) {
        console.log(error);
        console.log("Couldn't load update files. Starting download from start.");
      }

      // Download each chapter at a time
      for (let i = startIndex; i < chapterLinks.length; i++) {
        if (this.library.downloadTrackers[downloadID].cancel) {
          console.log('Download canceled!')
          return false;
        }
        // console.log(chapterLinks[i]);
        try {
          // let stringHtml = await this.getHtmlString("https://www.readlightnovel.org/overlord-ln/volume-8/chapter-");
          let stringHtml = await this.getHtmlString(chapterLinks[i]);
          stringHtml = stringHtml.replace(/<!doctype HTML>/i, "");
          let pageHtml = new DOMParser().parseFromString(stringHtml, 'text/html');
          let chapterHtml = pageHtml.getElementsByClassName('desc')[0].getElementsByClassName("hidden")[0];

          let chapterTitle = chapterNames[i];

          let chapterBody = "<h3>" + chapterTitle + "</h3>";
          chapterBody += chapterHtml.outerHTML;
          chapterBody = chapterBody.replace(/< *br *>/gi, "<br/>"); // Make sure all <br/> tags end correctly for xhtml
          chapterBody = chapterBody.replace(/<br *\/ *br *>/gi, "");  // Remove any useless </br> tags
          chapterBody = chapterBody.replace(/(<img("[^"]*"|[^\/">])*)>/gi, "$1/>"); // Make sure img tag ends correctly for xhtml

          // Add propoganda
          chapterBody += "<br/><br/>"
          chapterBody += "<p>dr-nyt's NovelScraper scraped this novel from a pirate site.</p>"
          chapterBody += "<p>If you can, please support the author(s) of this novel: " + novel.info.author + "</p>"
          downloadedChapters.push({ title: chapterTitle, data: chapterBody });

          let percentage = +(((i / chapterLinks.length) * 100).toFixed(2));
          this.library.updateDownloadTracker(downloadID, percentage);
        } catch (error) {
          console.log(error);
          if (error.statusCode === 404) {
            continue;
          } else {
            throw "Error while loading URL:" + chapterLinks[i];
          }
        }
      }

      this.library.cancelDownload(downloadID);
      await this.library.generateEpub(link, downloadedChapters);
      return true;

    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async fetchFromLink(link) {
    try {
      // Remove any duplicates of the novel
      for (let novel of this.localNovels) {
        if (novel.info.link == link) {
          this.localNovels.splice(this.localNovels.indexOf(novel), 1);
        }
      }

      let novel = this.library.getNovel(link);

      let name = "";
      let latestChapter = "";
      let cover = "";
      let totalChapters = 0;
      let source = "readlightnovel";
      let author = "";
      let genre = "";
      let summary = ""
      let downloaded = false;
      let inLibrary = false;

      if (novel === undefined) {
        let stringHtml = await this.getHtmlString(link);
        let html = document.createElement('html');
        html.innerHTML = stringHtml;

        name = html.getElementsByClassName("block-title")[0].getElementsByTagName("h1")[0].innerText;
        try {
          latestChapter = html.getElementsByClassName("novel-right")[0].getElementsByClassName("novel-detail-item")[5].getElementsByTagName("a")[0].innerText;
        } catch (error) {
          console.log(error);
        }
        cover = html.getElementsByClassName('novel-cover')[0].getElementsByTagName("img")[0].src;

        let chapterTabs = html.getElementsByClassName("tab-content")[0].getElementsByClassName("tab-pane");
        for (let i = 0; i < chapterTabs.length; i++) {
          if (chapterTabs[i].getElementsByTagName("li").length !== 0) {
            totalChapters += chapterTabs[i].getElementsByTagName("li").length;
          }
        }

        source = "readlightnovel";

        // Get list of authors
        let authorList = html.getElementsByClassName("novel-left")[0].getElementsByClassName("novel-detail-item")[4].getElementsByTagName("li");
        try {
          for (let i = 0; i < authorList.length; i++) {
            author += authorList[i].innerText.trim() + ', ';
          }
          author = author.slice(0, -2);
        } catch (error) {
          author = "unkown";
          console.log(error);
        }

        // Get list of genres
        let genreList = html.getElementsByClassName("novel-left")[0].getElementsByClassName("novel-detail-item")[1].getElementsByTagName("a");
        try {
          for (let i = 0; i < genreList.length; i++) {
            genre += genreList[i].innerText.trim() + ', ';
          }
          genre = genre.slice(0, -2);
        } catch (error) {
          genre = "unkown";
          console.log(error);
        }

        // Get list of summary
        let summaryList = html.getElementsByClassName("novel-right")[0].getElementsByClassName("novel-detail-item")[0].getElementsByTagName("p");
        try {
          for (let i = 0; i < summaryList.length; i++) {
            summary += summaryList[i].innerText.trim() + "\n";
          }
        } catch (error) {
          summary = "unkown";
          console.log(error);
        }

      } else {
        name = novel.info.name;
        console.log(name + " in library!");
        latestChapter = novel.info.latestChapter;
        cover = novel.info.cover;
        totalChapters = novel.info.totalChapters;
        source = novel.info.source;
        author = novel.info.author;
        genre = novel.info.genre;
        summary = novel.info.summary;
        downloaded = novel.state.downloaded;
        inLibrary = true;
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
          downloaded: downloaded,
          inLibrary: inLibrary
        }
      });

      this.ngZone.run(() => {
        this.show('content');
      });

    } catch (error) {
      this.ngZone.run(() => {
        console.log(error);
        this.show('error');
        return;
      });
    }
  }

  async fetchFromSearch(val) {
    this.show("notify");
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

  updateInLibrary(link, update) {
    for (let novel of this.localNovels) {
      if (novel.info.link == link) {
        novel.state.inLibrary = update;
      }
    }
  }

  updateDownloaded(link, update) {
    for (let novel of this.localNovels) {
      if (novel.info.link == link) {
        novel.state.downloaded = update;
      }
    }
  }

  // Utility function turns off other elements when one is shown
  show(section: string) {
    if (section == 'empty') {
      this.showEmpty = true;
      this.showLoading = false;
      this.showContent = false;
      this.showError = false;
      this.showNotify = false;
    } else if (section == 'loading') {
      this.showEmpty = false;
      this.showLoading = true;
      this.showContent = false;
      this.showError = false;
      this.showNotify = false;
    } else if (section == 'content') {
      this.showEmpty = false;
      this.showLoading = false;
      this.showContent = true;
      this.showError = false;
      this.showNotify = false;
    } else if (section == 'error') {
      this.showEmpty = false;
      this.showLoading = false;
      this.showContent = false;
      this.showError = true;
      this.showNotify = false;
    } else if (section == 'notify') {
      this.showEmpty = false;
      this.showLoading = false;
      this.showContent = false;
      this.showError = false;
      this.showNotify = true;
    }
  }
}
