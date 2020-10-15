import { Component, Input, OnInit } from '@angular/core';
import { novelObj } from 'app/resources/types';
@Component({
	selector: 'app-novel-card',
	templateUrl: './novel-card.component.html',
	styleUrls: ['./novel-card.component.scss']
})
export class NovelCardComponent implements OnInit {

	@Input() novel: novelObj;
	name: string;

	constructor() { }

	ngOnInit(): void {
		const length = 35;
		if (this.novel.name.length > length) {
			this.name = this.novel.name.substring(0, length) + '...';
		} else {
			this.name = this.novel.name;
		}
	}

}
