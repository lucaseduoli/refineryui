import { MatTableDataSource } from '@angular/material/table';
import generateData from 'src/app/base/temp/fakeData';
import { MatSort } from '@angular/material/sort';
import { DataSource, SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Column, ColumnType, DataType } from '../../base/entities/table-column';
import { OrganizationApolloService } from 'src/app/base/services/organization/organization-apollo.service';
import { RecordApolloService } from 'src/app/base/services/record/record-apollo.service';
import { ProjectApolloService } from '../../base/services/project/project-apollo.service';
import { first } from 'rxjs/operators';
import { Observable, Subscription, forkJoin} from 'rxjs';
import { RouteService } from 'src/app/base/services/route.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Project } from 'src/app/base/entities/project';
import {moveItemInArray, CdkDragDrop} from '@angular/cdk/drag-drop';


@Component({
  selector: 'kern-tbody',
  templateUrl: './tbody.component.html',
  styleUrls: ['./tbody.component.scss']
})

export class TbodyComponent implements OnInit {
  constructor(    private projectApolloService: ProjectApolloService,
                  private recordApolloService: RecordApolloService,
                  private organizationService: OrganizationApolloService,
                  private router: Router,
                  private routeService: RouteService,
                  private activatedRoute: ActivatedRoute)
                  {
                    this.dataSource = new MatTableDataSource();
                  }
  static DUMMY_SESSION_ID = "00000000-0000-0000-0000-000000000000";
  displayedColumns: string[] = ['checkbox'];
  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  @ViewChild(MatSort) sort: MatSort= new MatSort();
  total = 100000;
  private buffer = 200; // limit from bottom to trigger

  loggedInUser: any;
  displayUserId: any;
  project$: any;
  project: Project;
  subscriptions$: Subscription[] = [];
  sortOrder = [] ;
  attributesQuery$: any;
  labelingTasksQuery$: any;
  labelingTasks$: any;
  labelingTasksMap = new Map<string, any>();
  labelHotkeys: Map<string, { taskId: string, labelId: string }> = new Map<string, { taskId: string, labelId: string }>();
  showTokenDisabled = true;
  labelingTaskWait: boolean;
  labelingTaskColumns = [];
  columns: Column[];
  sessionData: any;
  session$: any;
  recordList$ = [];



  async onTableScroll(e: any): Promise<void> {
    console.log("scroll event");
    const tableViewHeight = e.target.offsetHeight; // viewport
    const tableScrollHeight = e.target.scrollHeight; // lenght of all table
    const scrollLocation = e.target.scrollTop; // how far was the scroll
    const limit = tableScrollHeight - tableViewHeight - this.buffer;
    if (scrollLocation > limit && this.dataSource.data.length < this.total){
      await this.concatData();
    }
  }

  ngOnInit(): void {
    this.routeService.updateActivatedRoute(this.activatedRoute);
    const projectId = this.activatedRoute.parent.snapshot.paramMap.get("projectId");
    const initialTasks$ = [];
    initialTasks$.push(this.prepareUser());
    initialTasks$.push(this.prepareProject(projectId));
    initialTasks$.push(this.prepareSortOrder(projectId));
    initialTasks$.push(this.getLabelingTasks(projectId));
    forkJoin(initialTasks$).pipe(first()).subscribe(e => {
      this.requestSessionData(projectId, TbodyComponent.DUMMY_SESSION_ID).then(() => {
        // console.log(this.sessionData.recordIds);
      this.concatData();
      });
      this.columns = this.generateColumns();
      this.displayedColumns.push(...this.columns.map( element => element.columnDef));
      if (this.displayedColumns.length > 7){
        this.displayedColumns = [];
        window.alert("Error, there are too many datapoints to handle");
      }
    });
    // initialTasks$.push(this.prepareProject(projectId));
    // initialTasks$.push(this.prepareLabelingTask(projectId));
    // initialTasks$.push(this.prepareSortOrder(projectId));

    // console.log(this.columns);
  }


  async concatData(): Promise<void>{
    let data: any[];
    if (this.dataSource)
     {
        data = [...this.dataSource.data, await this.getDataServer(15, this.project.id)];
     }
     else
     {
      data = await this.getDataServer(15, this.project.id);
     }
    this.dataSource = new MatTableDataSource(data);
    this.dataSource.sort = new MatSort();
  }
  async getDataServer(requestNum: number, projectId: string): Promise<Array<any>> {
    if (requestNum < 1){
      return [];
    }
    const recordList = [];
    for ( let i = this.sessionData.currentIndex; i < requestNum; i++){
      // this.recordApolloService.getRecordByRecordId(projectId,this.sessionData.recordIds[i]).subscribe(e=>console.log(e))
      const pipeFirst = this.recordApolloService.getRecordByRecordId(projectId, this.sessionData.recordIds[i]).pipe(first());
      pipeFirst.subscribe(e => recordList.push(e));
      this.recordList$.push(pipeFirst);
    }

    await forkJoin(this.recordList$).pipe(first()).toPromise();
    this.sessionData.currentIndex += requestNum;
    return recordList;

  }

  isAllSelected(): boolean{
    return (this.selection.selected.length === this.dataSource.data.length);
  }
  masterToogle(): void{
    if (this.isAllSelected()){
      this.selection.clear();
    }
    else{
      this.dataSource.data.forEach(row => this.selection.select(row));
    }
  }
  delete(): void{
    this.selection.selected.forEach(item => {
      const index: number = this.dataSource.data.findIndex(data => data === item);
      this.dataSource.data.splice(index, 1);
    });
    this.concatData();
    this.selection.clear();
    this.dataSource._updateChangeSubscription();
    this.dataSource.sort = this.sort;
  }

  duplicate(): void{
    this.selection.selected.forEach(item => {
      const index: number = this.dataSource.data.findIndex(data => data === item);
      this.dataSource.data.splice(index, 0 , {...item});
    });
    this.selection.clear();
    this.dataSource._updateChangeSubscription();
    this.dataSource.sort = this.sort;
  }

  columnDropped(event: CdkDragDrop<string[]>): void {
    if (event){
        moveItemInArray(this.displayedColumns, event.previousIndex + 1 , event.currentIndex + 1);
      }
    }

  // fetcing data functions
  prepareUser(): Observable<any>{
    const pipeFirst = this.organizationService.getUserInfo()
    .pipe(first());

    pipeFirst.subscribe((user) => {
    this.loggedInUser = user;
    this.displayUserId = user.id;
  });
    return pipeFirst;
  }

  prepareProject(projectId: string): Observable<any> {
    this.project$ = this.projectApolloService.getProjectById(projectId);
    this.subscriptions$.push(this.project$.subscribe((project) => {
      this.project = project;
    }));


    return this.project$.pipe(first());
  }

  prepareSortOrder(projectId: string): Observable<any> {
    let vc$;
    [this.attributesQuery$, vc$] = this.projectApolloService.getAttributesByProjectId(projectId);
    const pipeFirst = vc$.pipe(first());

    this.subscriptions$.push(vc$.subscribe((attributes) => {
      attributes.forEach((att) => {
        // data loss, lost referenced Id, dataType and isPrimaryKey
        this.sortOrder.push({ key: att.name, order: att.relativePosition, dataType: att.DataType });
      });
      this.sortOrder.sort((a, b) => a.order - b.order);
      // this.applyColumnOrder();
    }));
    console.log("PIPE FIRST");
    console.log(pipeFirst);
    return pipeFirst;
  }

  prepareLabelingTask(projectID: string): any {
    [this.labelingTasksQuery$, this.labelingTasks$] = this.projectApolloService.getLabelingTasksByProjectId(projectID);
    console.log("this.labeling tasks");
    // console.log(this.labelingTasks$)
    // this.labelingTasks$.subscribe(e=>console.log(e))
    // this.subscriptions$.push(this.labelingTasks$.subscribe((tasks) => {
    //   tasks.sort((a, b) => this.compareOrderLabelingTasks(a, b)); // ensure same position

    //   this.labelHotkeys.clear();
    //   if (this.onlyLabelsChanged(tasks)) {
    //     tasks.forEach((task) => {
    //       task.labels.sort((a, b) => a.name.localeCompare(b.name));
    //       task.labels.forEach(l => {
    //         if (l.hotkey) this.labelHotkeys.set(l.hotkey, { taskId: task.id, labelId: l.id });
    //       });
    //       this.labelingTasksMap.get(task.id).labels = task.labels;
    //     });
    //     console.log("LabelHotKey")
    //     console.log(this.labelHotkeys)
    //     console.log("LabelingTaskMap")
    //     console.log(this.labelingTasksMap)
    //   } else {
    //     this.labelingTasksMap.clear();
    //     this.showTokenDisabled = true;
    //     tasks.forEach((task) => {
    //       task.labels.sort((a, b) => a.name.localeCompare(b.name));
    //       task.labels.forEach(l => {
    //         if (l.hotkey) this.labelHotkeys.set(l.hotkey, { taskId: task.id, labelId: l.id });
    //       });
    //       this.labelingTasksMap.set(task.id, task);
    //       if (this.showTokenDisabled && task.taskType == LabelingTask.INFORMATION_EXTRACTION) this.showTokenDisabled = false;
    //     });
    //   }

    //   this.labelingTaskWait = false;
    // }));
    return this.labelingTasks$.pipe(first());
  }

  getLabelingTasks(projectID: string): Observable<any>{
    [this.labelingTasksQuery$, this.labelingTasks$] = this.projectApolloService.getLabelingTasksByProjectId(projectID);
    this.labelingTasks$.subscribe((tasks) => {
      tasks.forEach(element => {
        if (element.taskType === "MULTICLASS_CLASSIFICATION")
        {
          this.labelingTaskColumns.push(element);
        }
      });
    });
    return this.labelingTasks$.pipe(first());

  }

  generateColumns(): Array<any>{
    const columns: Column[] = [];
    this.sortOrder.forEach((attribute) => {
      console.log(attribute);
      columns.push({
        columnDef: attribute.key as string,
        header: attribute.key as string,
        isSort: true,
        isPrimaryKey: false,
        classStyle: "attribute " + attribute.key,
        columnType: ColumnType.DATA_POINT,
        dataType: DataType.TEXT
      });
    });

    this.labelingTaskColumns.forEach((labelingTask) => {
      columns.push({
        columnDef: labelingTask.name as string,
        header: labelingTask.name as string,
        isSort: false,
        isPrimaryKey: false,
        classStyle: "labelingTask " + labelingTask.name,
        columnType: ColumnType.LABELING_TASK,
        dataType: DataType.TEXT,
        parent: labelingTask
      });
    });
    return columns;

  }

  async requestSessionData(projectId: string, sessionId: string): Promise<void> {
    const requestedPos = 0;
    const result = await this.recordApolloService.getSessionBySessionId(projectId, sessionId)
      .pipe(first()).toPromise();
    this.sessionData = {
      recordIds: result.sessionRecordIds as string[],
      partial: false,
      sessionId: result.sessionId,
      currentIndex: requestedPos,
      projectId: projectId,
    };
    // localStorage.setItem('sessionData', JSON.stringify(this.sessionData));
    // console.log(this.sessionData);
  }
}
