import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { novelObj, sourcesList } from 'app/resources/types';
import { DatabaseService } from 'app/services/database.service';
import { SourceManagerService } from 'app/services/sources/source-service-manager.service';
import { sources } from '../../resources/sourceList';

@Component({
	selector: 'app-library-page',
	templateUrl: './library-page.component.html',
	styleUrls: ['./library-page.component.scss']
})
export class LibraryPageComponent implements OnInit {

	showDownloaded: boolean = true;

	searchedNovels: novelObj[] = [];

	searchText: string;

	isSearch: boolean = false;

	constructor(public database: DatabaseService, private router: Router, public sourceManager: SourceManagerService) { }

	ngOnInit(): void { }

	loadNovel(novel: novelObj) {
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
}
