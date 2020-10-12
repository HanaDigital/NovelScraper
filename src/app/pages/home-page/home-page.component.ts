import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { novelObj } from 'app/resources/types';
import { DatabaseService } from 'app/services/database.service';
import { SourceManagerService } from 'app/services/sources/source-service-manager.service';
import { shell } from 'electron';

@Component({
	selector: 'app-home-page',
	templateUrl: './home-page.component.html',
	styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {

	updateNovels: novelObj[] = [];

	constructor(private database: DatabaseService, private router: Router, public sourceManager: SourceManagerService) { }

	ngOnInit(): void {
		this.loadNovels();
	}

	loadNovels(): void {
		if (this.database.loaded) {
			this.updateNovels = this.database.novels.filter(novel => !novel.isUpdated && novel.downloaded);
		} else {
			const intID = setInterval(() => {
				if (this.database.loaded) {
					this.updateNovels = this.database.novels.filter(novel => !novel.isUpdated && novel.downloaded);
					clearInterval(intID);
				}
			}, 500);
		}
	}

	loadNovel(novel: novelObj) {
		for (const source of this.database.sources) {
			if (novel.source === source.name) this.router.navigateByUrl('/novel', { state: { source: source, novel: novel, fromLibrary: false, fromHome: true } });
		}
	}

	checkForUpdates(): void {
		this.sourceManager.checkForUpdates(this.database.novels).then(() => this.loadNovels());
	}

	openGithubStars(): void {
		shell.openExternal("https://github.com/HanaDigital/NovelScraper");
	}

	openBugReport(): void {
		shell.openExternal("https://github.com/HanaDigital/NovelScraper/issues/new/choose");
	}

	openDiscord(): void {
		shell.openExternal("https://discord.gg/Wya4Dst");
	}
}
