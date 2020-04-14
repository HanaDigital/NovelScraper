import { Injectable, NgZone } from '@angular/core';

// Import Library Service
import { LibraryService } from './library.service';
// import cloudscraper to bypass cloudflare
const cloudscraper = (<any>window).require('cloudscraper');
//Import fs for chapter management
const fs = (<any>window).require('fs');

@Injectable({
  providedIn: 'root'
})
export class BoxnovelService {

  // Stores list of novels recently searched for (not in library)
  localNovels: any[] = [];

  // UI Controls on what element to show
  showEmpty: boolean = true;    // Show empty icon
  showLoading: boolean = false; // Show loading icon
  showContent: boolean = false; // Show localNovels
  showError: boolean = false;

  constructor(private ngZone: NgZone, private library: LibraryService) { }

  // Downloads novel
  async downloadNovel(link, downloadID) {
    console.log('Building...');

    let downloadedChapters = [];
    try {
      let stringHtml = await this.getHtmlString(link);
      let html = document.createElement('html');
      html.innerHTML = stringHtml;

      let chapters = html.getElementsByClassName('wp-manga-chapter');

      // Set summary in case it didnt exist before
      let summary = "";
      let summaryList = html.getElementsByClassName('summary__content')[0].getElementsByTagName('p');
      try {
        for (let i = 0; i < summaryList.length; i++) {
          summary += summaryList[i].innerText.trim() + "\n";
        }
        this.library.updateSummary(link, summary);
      } catch (error) {
        summary = "unkown";
        console.log(error);
      }

      // Get chapter links and names
      let chapterLinks = [];
      let chapterNames = [];
      for (let i = 0; i < chapters.length; i++) {
        chapterLinks.push(chapters[i].getElementsByTagName('a')[0].getAttribute('href'));
        chapterNames.push(chapters[i].getElementsByTagName('a')[0].innerText.trim().replace(/(\r\n|\n|\r)/gm, ""));
      }
      chapterLinks.reverse();
      chapterNames.reverse();

      // Update totalChapter defind in library
      this.library.updateTotalChapters(link, chapterLinks.length);

      let startIndex = 0;

      let novel = this.library.getNovel(link);
      if (novel.state.downloaded) {
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
        let html = pageHtml.getElementsByClassName('entry-content')[0];

        let chapterTitle = chapterNames[i];

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

  async fetchFromLink(link) {
    let stringHtml = await this.getHtmlString(link);
    let html = document.createElement('html');
    html.innerHTML = stringHtml;

    try {
      let title = html.getElementsByClassName('post-title')[0]
      try { title.getElementsByTagName('span')[0].remove(); } catch(error) {  }
      let name = title.textContent.trim();
      let latestChapter = html.getElementsByClassName('wp-manga-chapter')[0].getElementsByTagName('a')[0].innerText.trim();
      let cover = html.getElementsByClassName('summary_image')[0].getElementsByTagName('img')[0].src;
      let totalChapters = html.getElementsByClassName('wp-manga-chapter').length;
      let source = "boxnovel";
      let author = "";
      let genre = "";
      let summary = "";

      // Get list of authors
      let authorList = html.getElementsByClassName('author-content')[0].getElementsByTagName('a');
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
      let genreList = html.getElementsByClassName('genres-content')[0].getElementsByTagName('a');
      try {
        for (let i = 0; i < genreList.length; i++) {
          genre += genreList[i].innerText.trim() + ', ';
        }
        genre = genre.slice(0, -2);
      } catch (error) {
        genre = "unkown";
        console.log(error);
      }

      // Get all the summary <p> tags
      let summaryList = html.getElementsByClassName('summary__content')[0].getElementsByTagName('p');
      try {
        for (let i = 0; i < summaryList.length; i++) {
          summary += summaryList[i].innerText.trim() + "\n";
        }
      } catch (error) {
        summary = "unkown";
        console.log(error);
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
    val = val.replace(' ', '+')
    let searchLink = "https://boxnovel.com/?s=" + val + "&post_type=wp-manga";

    try {
      let stringHtml = await this.getHtmlString(searchLink);

      let html = document.createElement('html');
      html.innerHTML = stringHtml;

      let novelList = html.getElementsByClassName('c-tabs-item__content');

      for (let i = novelList.length - 1; i >= 0; i--) {
        let link = novelList[i].getElementsByClassName('post-title')[0].getElementsByTagName('a')[0].href;
        let name = novelList[i].getElementsByClassName('post-title')[0].getElementsByTagName('a')[0].innerText.trim();
        let latestChapter = novelList[i].getElementsByClassName('chapter')[0].getElementsByTagName('a')[0].innerText.trim();
        let cover = novelList[i].getElementsByClassName('tab-thumb')[0].getElementsByTagName('img')[0].src;
        let totalChapters = "unknown";
        let source = "boxnovel";
        let author = "";
        let genre = "";
        let summary = "unkown";

        // Get list of authors
        let authorList = novelList[i].getElementsByClassName('summary-content')[1].getElementsByTagName('a');
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
        let genreList = novelList[i].getElementsByClassName('summary-content')[2].getElementsByTagName('a');
        try {
          for (let i = 0; i < genreList.length; i++) {
            genre += genreList[i].innerText.trim() + ', ';
          }
          genre = genre.slice(0, -2);
        } catch (error) {
          genre = "unkown";
          console.log(error);
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
      }

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
}
