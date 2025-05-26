import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Task } from '../task.model';
import { CommonModule } from '@angular/common';

@Component({
    selector: '[app-task-item]',
    imports: [CommonModule],
    templateUrl: './task-item.component.html',
    styleUrl: './task-item.component.scss'
})
export class TaskItemComponent {
 @Input({required: true}) task!: Task;
 @Output() edit = new EventEmitter<number>();
 @Output() delete = new EventEmitter<number>();
 
}
