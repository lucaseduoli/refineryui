import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BaseModule } from './base/base.module';
import { ExceptionInterceptor } from './base/interceptors/exception.interceptor';
import { GlobalErrorHandler } from './base/interceptors/global-exception.interceptor';
import { NotificationService } from './base/services/notification.service';
import { DataModule } from './data/data.module';
import { ProjectsModule } from './projects/projects.module';
import { ImportModule } from './import/import.module';
import { MonitorModule } from './monitor/monitor.module';
import { GraphQLModule } from './graphql.module';
import { ProjectOverviewModule } from './project-overview/project-overview.module';
import { WeakSupervisionModule } from './weak-supervision/weak-supervision.module';
import { ZeroShotModule } from './zero-shot-details/zero-shot-details.module';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { LabelingModule } from './labeling/labeling.module';
import { KnowledgeBasesModule } from './knowledge-bases/knowledge-bases.module';
import { ConfigModule } from './config/config.module';
import { IntercomModule } from 'ng-intercom';
import { NotificationCenterModule } from './notification-center/notification-center.module';
import { RecordIDEModule } from './record-ide/record-ide.module';
import { TableComponent } from './table/table.component';
import { TableOptionsComponent } from './table/table-options/table-options.component';
import { TbodyComponent } from './table/tbody/tbody.component';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


@NgModule({
  declarations: [AppComponent, TableComponent, TableOptionsComponent, TbodyComponent],
  exports:[MatSortModule,MatCheckboxModule,MatTableModule],
  imports: [
    MatSortModule,
    MatCheckboxModule,
    MatTableModule,
    BrowserModule,
    AppRoutingModule,
    BaseModule,
    DataModule,
    ProjectsModule,
    ImportModule,
    MonitorModule,
    GraphQLModule,
    HttpClientModule,
    ProjectOverviewModule,
    WeakSupervisionModule,
    ZeroShotModule,
    LabelingModule,
    RecordIDEModule,
    NotificationCenterModule,
    MonacoEditorModule.forRoot(),
    KnowledgeBasesModule,
    ConfigModule,
    IntercomModule.forRoot({
      appId: 'jwhvb3yv', // from your Intercom config
      updateOnRouterChange: true, // will automatically run `update` on router event changes. Default: `false`
    }),
    BrowserAnimationsModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: ExceptionInterceptor, multi: true },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    NotificationService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
