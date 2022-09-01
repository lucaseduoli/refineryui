import { MatTableDataSource } from '@angular/material/table';
import generateData from 'src/app/base/temp/fakeData';
import dataRow from 'src/app/base/temp/Datarow';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'kern-tbody',
  templateUrl: './tbody.component.html',
  styleUrls: ['./tbody.component.scss']
})
export class TbodyComponent implements OnInit {
  displayedColumns: string[] = ['checkbox', 'index', 'content', 'human label', 'predictions', 'status', 'more'];
  dataSource: MatTableDataSource<dataRow>;
  @ViewChild(MatSort) sort: MatSort;
  total = 100000;
  private buffer = 200; // limit from bottom to trigger

  onTableScroll(e: any): void {
    const tableViewHeight = e.target.offsetHeight; // viewport
    const tableScrollHeight = e.target.scrollHeight; // lenght of all table
    const scrollLocation = e.target.scrollTop; // how far was the scroll
    const limit = tableScrollHeight - tableViewHeight - this.buffer;
    if (scrollLocation > limit && this.dataSource.data.length < this.total){
      this.getData();
    }
  }
  constructor() { }

  ngOnInit(): void {
    this.getData();
  }
  getData(): void{
    const data: dataRow[] = this.dataSource ? [...this.dataSource.data, ...generateData(10)] : generateData(10);
    this.dataSource = new MatTableDataSource(data);
    this.dataSource.sort = this.sort;
  }

}
