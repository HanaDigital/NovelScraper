import { Injectable } from '@angular/core';
import { novelObj } from 'app/resources/types';
import { BoxnovelService } from './boxnovel.service';
import { ReadlightnovelService } from './readlightnovel-service.service';
import { sourceService } from './sourceService';

@Injectable({
	providedIn: 'root'
})
export class SourceManagerService {

	isChecking: boolean = false;

	constructor(public boxnovelService: BoxnovelService, public readlightnovelService: ReadlightnovelService) { }

	getService(sourceName: string): sourceService {
		if (sourceName === "BoxNovel") return this.boxnovelService;
		else if (sourceName === "ReadLightNovel") return this.readlightnovelService;
		else return undefined;
	}

	async checkForUpdates(novels: novelObj[]) {
		if (this.isChecking) return;
		this.isChecking = true;
		try {
			for (const novel of novels) {
				const service = this.getService(novel.source);
				await service.searchWIthLink(novel.link, novel.source, true);
			}
		} catch (error) {
			console.log(error);
		}
		this.isChecking = false;
	}
}
