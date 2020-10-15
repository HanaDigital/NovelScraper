import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { novelObj } from 'app/resources/types';
import { DatabaseService } from 'app/services/database.service';
import { SourceManagerService } from 'app/services/sources/source-service-manager.service';

@Component({
	selector: 'app-library-page',
	templateUrl: './library-page.component.html',
	styleUrls: ['./library-page.component.scss']
})
export class LibraryPageComponent implements OnInit {

	showDownloaded = true;

	searchedNovels: novelObj[] = [];
	searchText: string;
	isSearch = false;

	scrollTracker: NodeJS.Timeout;
	currentScrollPos: number;
	waitScroll = false;

	constructor(public database: DatabaseService, private router: Router, public sourceManager: SourceManagerService) { }

	ngOnInit(): void {
		const scrollElement = document.getElementById("libraryPageWrapper");
		if (this.database.scrollPos >= 0) {
			this.currentScrollPos = this.database.scrollPos;
			this.waitScroll = true;
		}

		this.scrollTracker = setInterval(() => {
			if (this.waitScroll) {
				scrollElement.scrollTop = this.currentScrollPos;
				if (scrollElement.scrollTop === this.currentScrollPos) this.waitScroll = false;
			} else {
				clearInterval(this.scrollTracker);
			}
		}, 10);
	}

	scroller($event: Event): void {
		const scrollPos = ($event.target as HTMLElement).scrollTop;
		if (scrollPos !== this.currentScrollPos && !this.waitScroll) {
			this.database.scrollPos = scrollPos;
			this.currentScrollPos = scrollPos;
		}
	}

	loadNovel(novel: novelObj): void {
		for (const source of this.database.sources) {
			if (novel.source === source.name) this.router.navigateByUrl('/novel', { state: { source: source, novel: novel, fromLibrary: true, fromHome: false } });
		}
	}

	checkForUpdates(): void {
		this.sourceManager.checkForUpdates(this.database.novels);
	}

	toggleDownloaded(): void {
		this.showDownloaded = !this.showDownloaded;
	}

	search(value: string): void {
		if (value === "") {
			this.isSearch = false;
			return;
		}
		this.isSearch = true;
		this.searchedNovels = this.database.novels.filter(novel => novel.name.toLowerCase().includes(value.toLowerCase()));
	}

	cancelSearch(): void {
		this.isSearch = false;
	}

	submitSearch(event): void {
		if (event.keyCode !== 13) return;
		this.search(this.searchText);
	}

	ngOnDestroy(): void {
		clearInterval(this.scrollTracker);
	}
}
