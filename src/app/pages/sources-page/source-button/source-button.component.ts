import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { sourceObj } from 'app/resources/types';

@Component({
	selector: 'app-source-button',
	templateUrl: './source-button.component.html',
	styleUrls: ['./source-button.component.scss']
})
export class SourceButtonComponent implements OnInit {

	@Input() source: sourceObj;

	constructor(private router: Router,) { }

	ngOnInit(): void {
	}

	loadSourcePage(): void {
		this.router.navigateByUrl('/source', { state: { source: this.source } });
	}

}
