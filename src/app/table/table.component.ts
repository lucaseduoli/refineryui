import { TbodyComponent } from './tbody/tbody.component';
import { Attribute, Component, OnInit, ViewChild } from '@angular/core';
import { Column, ColumnType, DataType } from '../base/entities/table-column';
import { OrganizationApolloService } from 'src/app/base/services/organization/organization-apollo.service';
import { RecordApolloService } from 'src/app/base/services/record/record-apollo.service';
import { ProjectApolloService } from './../base/services/project/project-apollo.service';
import { first } from 'rxjs/operators';
import { Observable, Subscription,forkJoin} from 'rxjs';
import { RouteService } from 'src/app/base/services/route.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Project } from 'src/app/base/entities/project';
import {
  LabelingTask,
} from 'src/app/base/enum/graphql-enums';

@Component({
  selector: 'kern-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit {
  @ViewChild(TbodyComponent)
  private TbodyComponent!: TbodyComponent;

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
  labelingTaskColumns=[];
  Columns:Column[];


  constructor(
    private projectApolloService: ProjectApolloService,
    private recordApolloService: RecordApolloService,
    private organizationService: OrganizationApolloService,
    private router: Router,
    private routeService: RouteService,
    private activatedRoute: ActivatedRoute)
    {
  }

  ngOnInit(): void {
    this.routeService.updateActivatedRoute(this.activatedRoute);
    const projectId = this.activatedRoute.parent.snapshot.paramMap.get("projectId");
    const initialTasks$ = [];
    initialTasks$.push(this.prepareUser());
    initialTasks$.push(this.prepareProject(projectId));
    initialTasks$.push(this.prepareSortOrder(projectId));
    initialTasks$.push(this.getLabelingTasks(projectId));
    forkJoin(initialTasks$).pipe(first()).subscribe(e=>{
      // console.log(e);
      this.Columns = this.generateColumns();
    });
    // initialTasks$.push(this.prepareProject(projectId));
    // initialTasks$.push(this.prepareLabelingTask(projectId));
    // initialTasks$.push(this.prepareSortOrder(projectId));
  }
  deleteRows():void
  {
    this.TbodyComponent.delete();
  }
  duplicateRows(): void{
    this.TbodyComponent.duplicate();
  }

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
  prepareSortOrder(projectId: string) : Observable<any> {
    let vc$;
    [this.attributesQuery$, vc$] = this.projectApolloService.getAttributesByProjectId(projectId);
    const pipeFirst = vc$.pipe(first());

    this.subscriptions$.push(vc$.subscribe((attributes) => {
      attributes.forEach((att) => {
        //data loss, lost referenced Id, dataType and isPrimaryKey
        this.sortOrder.push({ key: att.name, order: att.relativePosition, dataType: att.DataType });
      });
      this.sortOrder.sort((a, b) => a.order - b.order);
      // this.applyColumnOrder();
    }));
    console.log("PIPE FIRST")
    console.log(pipeFirst)
    return pipeFirst;
  }

  prepareLabelingTask(projectID: string) {
    [this.labelingTasksQuery$, this.labelingTasks$] = this.projectApolloService.getLabelingTasksByProjectId(projectID);
    console.log("this.labeling tasks")
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
  getLabelingTasks(projectID: string):Observable<any>{
    [this.labelingTasksQuery$, this.labelingTasks$] = this.projectApolloService.getLabelingTasksByProjectId(projectID);
    this.labelingTasks$.subscribe((tasks)=>{
      tasks.forEach(element => {
        if(element.taskType==="MULTICLASS_CLASSIFICATION")
        {
          this.labelingTaskColumns.push(element);
        }
      });
    })
    return this.labelingTasks$.pipe(first());

  }

  generateColumns(){
    let columns: Column[] = [];
    this.sortOrder.forEach((attribute)=>{
      columns.push({
        columnDef: attribute.key as string,
        header: attribute.key as string,
        isSort: attribute.dataType as boolean,
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
}
