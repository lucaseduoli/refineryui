import { Component, OnInit } from '@angular/core';
import { TableOptionsComponent } from './table-options/table-options.component';

@Component({
  selector: 'kern-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    let size: number = 32;
  }

}
