import { Component, OnInit } from '@angular/core';
import { getSources } from '../templates/sources';

@Component({
  selector: 'app-sources',
  templateUrl: './sources.component.html',
  styleUrls: ['./sources.component.scss']
})
export class SourcesComponent implements OnInit {

  sourceList = getSources();

  constructor() { }

  ngOnInit(): void {
  }

}
