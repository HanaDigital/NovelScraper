import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

// Import Library Service
import { LibraryService } from '../library.service';
// Import Novelplanet Service
import { NovelplanetService } from '../novelplanet.service';
// Import BoxNovel Service
import { BoxnovelService } from '../boxnovel.service';

import { ThrowStmt } from '@angular/compiler';

@Component({
  selector: 'app-novel',
  templateUrl: './novel.component.html',
  styleUrls: ['./novel.component.scss']
})
export class NovelComponent implements OnInit {
  // Get the novel object from the page that loaded this page
  novel: any = history.state.novel;
  val: any;
  // Get the name of the page that loaded this page
  source: string = history.state.source;
  pageSource: string;

  // UI controls on which elements to show
  showLoading: boolean = false;
  showNotice: boolean = true;

  // Novel state controls on what buttons to show
  inLibrary: boolean = false;
  downloaded: boolean = false;
  downloading: boolean = false;

  // Index of the downloadTracker in the library
  downloadID: number = 0;

  // UI
  coverChangeDialogue;

  constructor(
    private router: Router,
    public library: LibraryService,
    public novelplanetService: NovelplanetService,
    private boxnovelService: BoxnovelService) { }

  // On init
  ngOnInit(): void {
    this.coverChangeDialogue = document.getElementById("coverChangeDialogue");
    this.coverChangeDialogue.addEventListener('click', (event) => {
      if (event.target == this.coverChangeDialogue) {
        this.coverChangeDialogue.style.display = "none";
      }
    });


    // For testing purposes only
    if (this.novel === undefined) {
      this.novel = {
        info: {
          "link": "https://novelplanet.com/Novel/Dragon-God-of-Blood",
          "name": "Tales Of Demons and Gods",
          "latestChapter": "Chapter 1365 - The Mysterious Deskmate (125) (Ongoing)",
          "cover": "assets/test/tldg.jpg",
          "totalChapters": 2208,
          "source": "novelplanet",
          "author": "KillerBee",
          "genre": "Action, Adventure, Drama, Fantasy, Harem, Martial Arts, Romance, Seinen, Tragedy, Wuxia, Xianxia",
          "summary": "Zhou Han, whose family members all died in battles, chose to join the army and try to get more resources for his martial cultivation by undertaking battle achievements. One day, when he opened a scroll put on his bed by an unknown person, he entered a special space-time of an ancient sacrificing spirit. Though he did not understand what a sacrificing spirit was, or how their system functioned, the spirit acknowledged that he had absorbed Zhou Han’s energy for half a year. That was the reason why Zhou Han had became so weak and could not fight for the past several months. But the good news was that the spirit wanted to accept Zhou Han as his master before he could absorb his energy, and so the spirit could help him cultivate. With the help of the spirit, Zhou Han became a martial god in his army, and was chosen by the martial union of the empire to be trained for the more important task of defending the country from the demons."
        },
        state: {
          "isDownloading": false,
          "downloaded": false
        }
      };
    }

    // Check if the current novel is already saved in the library
    let libraryNovel = this.library.getNovel(this.novel.info.link);
    if (libraryNovel) {
      this.novel = libraryNovel;
      // Check if the novel is currently being downloaded
      for (let i = 0; i < this.library.downloadTrackers.length; i++) {
        if (this.novel.info.link == this.library.downloadTrackers[i].link && !this.library.downloadTrackers[i].cancel) {
          this.downloadID = this.library.downloadTrackers[i].downloadID;
          this.downloading = true;
        }
      }
      // Check if the novel has already been downloaded
      if (this.novel.state.downloaded) {
        this.downloaded = true;
      }
      this.inLibrary = true;
    }

    // Set name of the page to whatever source loaded this page
    if (this.source == 'novelplanet') {
      this.pageSource = 'NovelPlanet'
    } else if (this.source == 'boxnovel') {
      this.pageSource = 'BoxNovel'
    } else if (this.source == 'library') {
      this.pageSource = 'Library'
    } else {
      this.pageSource = 'Error: update novel.component.ts'
    }
  }

  // Binded to the download button
  download() {
    if (this.downloading) { return; }
    else if (this.novel.info.source == 'novelplanet') {
      this.downloadID = this.library.addDownloadTracker(this.novel.info.link);
      this.downloading = true;
      this.novelplanetService.downloadNovel(this.novel.info.link, this.downloadID).then((saved) => {
        if (saved) {
          this.novel.info.folderPath = this.library.getNovel(this.novel.info.link).info.folderPath;
          this.downloading = false;
          this.downloaded = true;
          this.novelplanetService.updateDownloaded(this.novel.info.link, true);
        }
      });
    } else if (this.novel.info.source == 'boxnovel') {
      this.downloadID = this.library.addDownloadTracker(this.novel.info.link);
      this.downloading = true;
      this.boxnovelService.downloadNovel(this.novel.info.link, this.downloadID).then((saved) => {
        if (saved) {
          this.novel.info.folderPath = this.library.getNovel(this.novel.info.link).info.folderPath;
          this.downloading = false;
          this.downloaded = true;
          this.boxnovelService.updateDownloaded(this.novel.info.link, true);
        }
      });
    }
  }

  openCoverDialogue() {
    this.coverChangeDialogue.style.display = "flex";
  }

  changeNovelCover(val) {
    if (val == "" || !this.inLibrary) { return; }
    this.library.updateCover(this.novel.info.link, val);
    this.novel.info.cover = val;
  }

  openFolder() {
    this.library.openLibraryFolder(this.novel.info.folderPath);
  }

  // Binded to the cancel download button
  cancelDownload() {
    try {
      this.library.cancelDownload(this.downloadID);
    } catch (error) { console.log(error); }
    this.downloading = false;
  }

  // Binded to the add to library button
  addToLibrary() {
    this.library.addNovel(
      this.novel.info.link,
      this.novel.info.name,
      this.novel.info.latestChapter,
      this.novel.info.cover,
      this.novel.info.totalChapters,
      this.novel.info.source,
      this.novel.info.author,
      this.novel.info.genre,
      this.novel.info.summary);
    this.inLibrary = true;

    if(this.novel.info.source == 'novelplanet') {
      this.novelplanetService.updateInLibrary(this.novel.info.link, true);
    } else if(this.novel.info.source == 'boxnovel') {
      this.boxnovelService.updateInLibrary(this.novel.info.link, true);
    }
  }

  // Binded to the remove from library button
  removeFromLibrary() {
    this.library.removeNovel(this.novel.info.link);
    this.inLibrary = false;
    this.downloaded = false;

    if(this.novel.info.source == 'novelplanet') {
      this.novelplanetService.updateInLibrary(this.novel.info.link, false);
    } else if(this.novel.info.source == 'boxnovel') {
      this.boxnovelService.updateInLibrary(this.novel.info.link, false);
    }
  }

  // Keeps track of page to return to on back button
  return() {
    this.library.loadNovels();
    if (this.source == 'novelplanet') {
      this.router.navigateByUrl('/novelplanetSource');
    } else if (this.source == 'boxnovel') {
      this.router.navigateByUrl('/boxnovelSource');
    } else if (this.source == 'library') {
      this.router.navigateByUrl('/library');
    } else {
      this.router.navigateByUrl('/novelplanetSource');
    }
  }
}
