import { Component } from '@angular/core';
import { TaskItemComponent } from '../task-item/task-item.component';
import { TasksServiceService } from '../tasks-service.service';
import { OnInit } from '@angular/core';
import { TaskEditComponent } from '../task-edit/task-edit.component';

@Component({
    selector: 'app-tasks-list',
    imports: [TaskItemComponent, TaskEditComponent],
    templateUrl: './tasks-list.component.html',
    styleUrl: './tasks-list.component.scss'
})
export class TasksListComponent implements OnInit {
  editTaskId: number | null = null;
  constructor(public tasksService: TasksServiceService) {}

  ngOnInit(): void {
    this.tasksService.fetchTasks();
  }

  onDeleteRow(taskId: number): void {
    this.tasksService.deleteTask(taskId);
  }

  onEditRow(taskId: number): void {
    this.editTaskId = taskId;
  }

  onCloseRow(): void {
    this.editTaskId = null;
  }

  onSaveRow(task: any): void {
    this.tasksService.editTask(task);
    this.editTaskId = null;
  }

}
