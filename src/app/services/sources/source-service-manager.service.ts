import { Injectable } from '@angular/core';
import { novelObj } from 'app/resources/types';
import { BoxnovelService } from './boxnovel.service';
import { NovelfullService } from './novelfull.service';
import { ReadlightnovelService } from './readlightnovel-service.service';
import { sourceService } from './sourceService';

@Injectable({
	providedIn: 'root'
})
export class SourceManagerService {

	isChecking = false;

	constructor(public boxnovelService: BoxnovelService, public readlightnovelService: ReadlightnovelService, public novelFullService: NovelfullService) { }

	getService(sourceName: string): sourceService {
		if (sourceName === "BoxNovel") return this.boxnovelService;
		else if (sourceName === "ReadLightNovel") return this.readlightnovelService;
		else if (sourceName === "NovelFull") return this.novelFullService;
		else return undefined;
	}

	async checkForUpdates(novels: novelObj[]): Promise<void> {
		if (this.isChecking) return;
		this.isChecking = true;
		for (const novel of novels) {
			try {
				const service = this.getService(novel.source);
				await service.searchWIthLink(novel.link, novel.source, true);
			} catch (error) {
				console.log(error);
			}
		}
		this.isChecking = false;
	}
}
