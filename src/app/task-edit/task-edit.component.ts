import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Task } from '../task.model';
import { FormsModule } from '@angular/forms';

@Component({
    selector: '[app-task-edit]',
    imports: [FormsModule],
    templateUrl: './task-edit.component.html',
    styleUrl: './task-edit.component.scss'
})
export class TaskEditComponent {
  @Input({required: true}) task!: Task;
  @Output() save = new EventEmitter<Task>();
   @Output() cancel = new EventEmitter<void>();
}
