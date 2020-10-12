import { Component, OnInit } from '@angular/core';
import { sourcesList } from 'app/resources/types';
import { DatabaseService } from 'app/services/database.service';

@Component({
	selector: 'app-sources-page',
	templateUrl: './sources-page.component.html',
	styleUrls: ['./sources-page.component.scss']
})
export class SourcesPageComponent implements OnInit {

	constructor(public database: DatabaseService) { }

	ngOnInit(): void {
	}
}
