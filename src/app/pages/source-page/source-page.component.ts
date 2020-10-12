import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { novelObj, sourceObj } from 'app/resources/types';
import { SourceManagerService } from 'app/services/sources/source-service-manager.service';
import { sourceService } from 'app/services/sources/sourceService';
import { shell } from 'electron';

@Component({
	selector: 'app-source-page',
	templateUrl: './source-page.component.html',
	styleUrls: ['./source-page.component.scss']
})
export class SourcePageComponent implements OnInit {

	source: sourceObj = history.state.source;
	service: sourceService;

	searchText: string;

	loading: boolean = false;

	constructor(private router: Router, private sourceManager: SourceManagerService) { }

	ngOnInit(): void {
		if (!this.source) this.source = {
			name: "BoxNovel",
			link: "https://boxnovel.com",
			icon: "assets/img/sources/boxnovel-logo.png"
		};

		this.service = this.sourceManager.getService(this.source.name);
	}

	submitSearch(event): void {
		if (event.keyCode !== 13) return;
		this.search(this.searchText);
	}

	search(value: string) {
		if (value == undefined || value == "") {
			return;
		} else if (value.toLowerCase().includes(this.source.link.toLowerCase())) {
			this.loading = true;
			this.service.searchWIthLink(value, this.source.name, false).then((novel) => this.loading = false);
		} else if (value.toLowerCase().includes('https://' || 'http://')) {
			// TODO INVALID LINK
		} else {
			this.loading = true;
			this.service.searchWithName(value, this.source.name).then(() => this.loading = false);
		}
	}

	loadNovel(novel: novelObj) {
		this.router.navigateByUrl('/novel', { state: { source: this.source, novel: novel } });
	}

	openInBrowser() {
		shell.openExternal(this.source.link);
	}
}
