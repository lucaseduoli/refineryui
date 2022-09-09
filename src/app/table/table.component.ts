import { TbodyComponent } from './tbody/tbody.component';
import { Component, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'kern-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit {
  @ViewChild(TbodyComponent)
  private TbodyComponent!: TbodyComponent
  constructor() { }

  ngOnInit(): void {
    let size: number = 32;
  }
  deleteRows():void
  {
    this.TbodyComponent.delete();
  }
  duplicateRows(): void{
    this.TbodyComponent.duplicate();
  }
}
