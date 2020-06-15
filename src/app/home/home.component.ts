import { Component, OnInit } from '@angular/core';
const { shell } = require('electron');

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit(): void { }

  openStars() {
    shell.openExternal("https://github.com/HanaDigital/NovelScraper");
  }
  openDiscord() {
    shell.openExternal("https://discord.gg/Wya4Dst");
  }
  openBug() {
    shell.openExternal("https://github.com/HanaDigital/NovelScraper/issues/new/choose");
  }
}
