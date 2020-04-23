import { Injectable } from '@angular/core';
// import { link } from 'fs';
// import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

// Import nconf for controlling library
import nconf from 'nconf';

//Import fs for chapter management
const fs = (<any>window).require('fs');
import shellJS from 'shelljs'

// Import rimraf for folder deletion
import rimraf from 'rimraf';

const request = (<any>window).require('request');
// Import Epub File Generator
// const epubGen = (<any>window).require('epub-gen');
// import epubGen from 'epub-gen';
const epubGen = (<any>window).require('nodepub');

const mime = (<any>window).require('mime');

// Import electron app module
import { remote, shell } from 'electron';

// declare electron
declare var electron: any;

@Injectable({
  providedIn: 'root'
})

export class LibraryService {

  // List of novels fetched from the library
  libraryNovels: any;

  downloadFolder: string = remote.app.getPath('downloads');

  // UI Controls on what element to show
  showEmpty: boolean = true;
  showLoading: boolean = false;
  showContent: boolean = false;

  // Keeps track of each novel being downloaded
  downloadTrackers: any = [];

  constructor() {

    // Handles when app is closed
    electron.ipcRenderer.on('app-close', _ => {
      this.save();
      electron.ipcRenderer.send('closed');
    });

    this.generateLibrary();
  }

  async generateEpub(link, chapters) {
    let novel = this.getNovel(link);
    let novelPath = await this.generateFolderPath(novel, chapters);
    if (!novelPath) {
      console.log('Novel file name wasnt generated.');
      return;
    }

    this.updateDownloaded(novel.info.link, true);
    // let option = {
    //   title: novel.info.name, // *Required, title of the book.
    //   author: novel.info.author, // *Required, name of the author.
    //   cover: novel.info.cover, // Url or File path, both ok.
    //   content: chapters
    // };
    // new epubGen(option, novelFile);

    let metadata = {
      id: '0000-0000-0001',
      title: novel.info.name,
      author: novel.info.author,
      genre: novel.info.genre,
      language: 'en',
      description: 'dr-nyt\'s NovelScraper downloaded this novel from a pirate site.',
      contents: 'Table of Contents',
      images: []
    };
    var req = await request({
      method: 'GET',
      uri: novel.info.cover
    });

    var out = await fs.createWriteStream(novelPath[2]);
    await req.pipe(out);

    await req.on('end', () => {
      let epub = epubGen.document(metadata, novelPath[2]);

      for (let i = 0; i < chapters.length; i++) {
        epub.addSection(chapters[i].title, chapters[i].data);
      }

      epub.writeEPUB(
        function (e) { console.log("Error:", e); },
        novelPath[0], novelPath[1],
        function () { console.log("No errors.") }
      );
    });
    return true;
  }

  async generateFolderPath(novel, chapters) {
    let libraryFolder = this.downloadFolder + '\\' + "NovelScraper-Library";
    let novelFolder = libraryFolder + '\\' + novel.info.name.replace(/[/\\?%*:|"<>]/g, '');
    let novelFile = novel.info.name.replace(/[/\\?%*:|"<>]/g, '');
    console.log(novelFolder, novelFile);
    let chaptersFile = novelFolder + '\\' + "chapters.json"

    // Create Novel Folder if it doesnt already exist
    await shellJS.mkdir('-p', novelFolder);

    let coverMediaType = mime.getType(novel.info.cover);
    let coverExtension = mime.getExtension(coverMediaType);
    let coverPath = novelFolder + '\\cover.' + coverExtension;

    // await this.downloadFile(novel.info.cover , coverPath);

    // Save novel chapters to a json file
    let chaptersObj = { chapters: chapters }
    let json = JSON.stringify(chaptersObj, null, 4);
    await fs.writeFile(chaptersFile, json, function (err) {
      if (err) {
        console.log(err);
        return;
      }
      console.log("Chapters Saved!");
    });

    this.updateFolderPath(novel.info.link, novelFolder);
    return [novelFolder, novelFile, coverPath];
  }

  async downloadFile(file_url, targetPath) {
    var req = await request({
      method: 'GET',
      uri: file_url
    });

    var out = await fs.createWriteStream(targetPath);
    await req.pipe(out);

    await req.on('end', function () {
      console.log("Cover succesfully downloaded");
    });
  }

  openLibraryFolder(folderPath) {
    shell.openItem(folderPath);
  }

  // Add download to the downloadTracker list and return the index
  addDownloadTracker(link) {
    let downloadID = this.downloadTrackers.length;
    this.downloadTrackers.push({ link: link, downloadID: downloadID, width: '0%', cancel: false });
    return downloadID;
  }

  // Set the downloadTracker to cancel the download
  cancelDownload(downloadID) {
    this.downloadTrackers[downloadID].cancel = true;
  }

  // Update downloadTracker with the percentage of the download
  updateDownloadTracker(downloadID, percentage) {
    let tracker = this.downloadTrackers[downloadID];
    tracker.width = percentage + '%';
  }

  // load novels into the libraryNovels array to be displayed
  loadNovels() {
    this.libraryNovels = this.get("novels");
    if (this.libraryNovels.length > 0) {
      this.show('content');
    }
  }

  // Fetch novels from the library by their names
  getNovelsByName(name) {
    let novels = this.get('novels');
    let result = [];
    for (let novel of novels) {
      if (novel.info.name.toLowerCase().includes(name)) {
        result.push(novel);
      }
    }
    this.libraryNovels = result;
  }

  // Add a new novel to the library
  addNovel(
    link: string,
    name: string,
    latestChapter: string,
    cover: string,
    totalChapters: any,
    source: string,
    author: string,
    genre: string,
    summary: string) {
    // Check if the novel already exists in the library
    if (this.getNovel(link)) {
      console.log("Novel is already in the library!");
      return;
    }

    let info = {
      "link": link,
      "name": name,
      "latestChapter": latestChapter,
      "cover": cover,
      "totalChapters": totalChapters,
      "source": source,
      "author": author,
      "genre": genre,
      "summary": summary,
      "folderPath": ""
    }
    let state = {
      "downloaded": false
    }

    let novelObj = { "info": info, "state": state };
    let novels = this.get('novels');
    novels.push(novelObj);
    this.set("novels", novels);
  }

  // Fetch a novel from the library by their link
  getNovel(link) {
    let novels = this.get('novels');
    for (let novel of novels) {
      if (novel.info.link == link) {
        return novel;
      }
    }
  }

  // Remove a novel from the library by their link
  removeNovel(link) {
    let novels = this.get("novels");
    let index = this.getNovelIndex(link);
    try {
      rimraf(novels[index].info.folderPath, function () { console.log("folder deleted!"); });
    } catch (error) {
      console.log(error);
    }
    if (index > -1) {
      novels.splice(index, 1);
      this.set("novels", novels);
    }
  }

  // Get the index of a novel in the library array by their link
  getNovelIndex(link) {
    let novels = this.get("novels");
    let novel = this.getNovel(link);
    return novels.indexOf(novel);
  }

  // nconf Utility function to set a key:value pair in the library
  set(key, value) {
    nconf.set(key, value);
    this.save();
  }

  // nconf Utility function to get a value in the library
  get(key) {
    return nconf.get(key);
  }

  // nconf Utility function to remove a key:value pair in the library
  remove(key) {
    nconf.set(key, undefined);
    this.save();
  }

  // nconf Utility function to save the library to a file
  // the save function is set to be thread controlled to avoid override.
  wait: boolean = false;
  save() {
    let id = setInterval(() => {
      if (!this.wait) {
        this.wait = true;
        nconf.save(function (err) {
          if (err) {
            console.error(err.message);
            return;
          }
          console.log('Configuration saved successfully.');
        });
        this.wait = false;
        clearInterval(id);
      } else {
        console.log('waiting to save...');
      }
    }, 500);
  }

  // Utility function to update link of the novel by their link
  updateLink(link, update) {
    let novels = this.get("novels");
    let index = this.getNovelIndex(link);
    novels[index].info.link = update;
    this.set("novels", novels);
  }

  // Utility function to update name of the novel by their link
  updateName(link, update) {
    let novels = this.get("novels");
    let index = this.getNovelIndex(link);
    novels[index].info.name = update;
    this.set("novels", novels);
  }

  // Utility function to update latestChapter of the novel by their link
  updateLatestChapter(link, update) {
    let novels = this.get("novels");
    let index = this.getNovelIndex(link);
    novels[index].info.latestChapter = update;
    this.set("novels", novels);
  }

  // Utility function to update cover of the novel by their link
  updateCover(link, update) {
    let novels = this.get("novels");
    let index = this.getNovelIndex(link);
    novels[index].info.cover = update;
    this.set("novels", novels);
  }

  // Utility function to update totalChapters of the novel by their link
  updateTotalChapters(link, update) {
    let novels = this.get("novels");
    let index = this.getNovelIndex(link);
    novels[index].info.totalChapters = update;
    this.set("novels", novels);
  }

  // Utility function to update source of the novel by their link
  updateSource(link, update) {
    let novels = this.get("novels");
    let index = this.getNovelIndex(link);
    novels[index].info.source = update;
    this.set("novels", novels);
  }

  // Utility function to update author of the novel by their link
  updateAuthor(link, update) {
    let novels = this.get("novels");
    let index = this.getNovelIndex(link);
    novels[index].info.author = update;
    this.set("novels", novels);
  }

  // Utility function to update genre of the novel by their link
  updateGenre(link, update) {
    let novels = this.get("novels");
    let index = this.getNovelIndex(link);
    novels[index].info.genre = update;
    this.set("novels", novels);
  }

  // Utility function to update summary of the novel by their link
  updateSummary(link, update) {
    let novels = this.get("novels");
    let index = this.getNovelIndex(link);
    novels[index].info.summary = update;
    this.set("novels", novels);
  }

  // Utility function to update folderPath of the novel by their link
  updateFolderPath(link, update) {
    let novels = this.get("novels");
    let index = this.getNovelIndex(link);
    novels[index].info.folderPath = update;
    this.set("novels", novels);
  }

  // Utility function to update downloaded state of the novel by their link
  updateDownloaded(link, update) {
    let novels = this.get("novels");
    let index = this.getNovelIndex(link);
    novels[index].state.downloaded = update;
    this.set("novels", novels);
  }

  // Utility function turns off other elements when one is shown
  show(section: string) {
    if (section == 'empty') {
      this.showEmpty = true;
      this.showLoading = false;
      this.showContent = false;
    } else if (section == 'loading') {
      this.showEmpty = false;
      this.showLoading = true;
      this.showContent = false;
    } else if (section == 'content') {
      this.showEmpty = false;
      this.showLoading = false;
      this.showContent = true;
    }
  }

  async generateLibrary() {
    // Check if library exists
    let libraryFolder = this.downloadFolder + '\\' + "NovelScraper-Library";
    let libraryObj = { "novels": [] };

    await fs.mkdir(libraryFolder, (err) => {
      console.log('library folder created!');
    });

    fs.access(libraryFolder + '\\library.json', fs.F_OK, (err) => {
      if (err) {
        console.log("No Library found. Generating new Library!")
        let json = JSON.stringify(libraryObj); //convert it back to json

        fs.writeFile(libraryFolder + '\\library.json', json, (err) => {
          if (err) {
            return console.log(err);
          }
          console.log("New Library generated successfully!");
          // Load library.json file
          nconf.use('file', { file: libraryFolder + '\\' + 'library.json' });
          nconf.load();
          console.log('Library loaded!');
          this.loadNovels();
        });
      } else {
        // Load library.json file
        nconf.use('file', { file: libraryFolder + '\\' + 'library.json' });
        nconf.load();
        console.log('Library loaded!');
        this.loadNovels();
      }
    });
  }
}
