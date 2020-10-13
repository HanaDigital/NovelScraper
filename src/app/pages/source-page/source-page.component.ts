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

	scrollTracker: NodeJS.Timeout;
	currentScrollPos: number;
	waitScroll = false;

	constructor(private router: Router, private sourceManager: SourceManagerService) { }

	ngOnInit(): void {
		if (!this.source) this.source = {
			name: "BoxNovel",
			link: "https://boxnovel.com",
			icon: "assets/img/sources/boxnovel-logo.png"
		};

		this.service = this.sourceManager.getService(this.source.name);

		const scrollElement = document.getElementById("sourcePageWrapper");
		if (this.service.scrollPos >= 0) {
			this.currentScrollPos = this.service.scrollPos;
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
			this.service.scrollPos = scrollPos;
			this.currentScrollPos = scrollPos;
		}
	}

	submitSearch(event): void {
		if (event.keyCode !== 13) return;
		this.search(this.searchText);
	}

	search(value: string): void {
		if (value == undefined || value == "") {
			return;
		} else if (value.toLowerCase().includes(this.source.link.toLowerCase())) {
			this.service.searchWIthLink(value, this.source.name, false);
		} else if (value.toLowerCase().includes('https://' || 'http://')) {
			this.service.error = true;
			this.service.errorMessage = "INVALID LINK";
		} else {
			this.service.searchWithName(value, this.source.name);
		}
	}

	loadNovel(novel: novelObj): void {
		this.router.navigateByUrl('/novel', { state: { source: this.source, novel: novel } });
	}

	openInBrowser(): void {
		shell.openExternal(this.source.link);
	}

	ngOnDestroy(): void {
		clearInterval(this.scrollTracker);
	}
}
