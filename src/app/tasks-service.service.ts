import { Injectable, signal, WritableSignal } from '@angular/core';

import { Task } from './task.model';
import { HttpClient } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TasksServiceService {

  taskList: WritableSignal<Task[]> = signal<Task[]>([]);

  constructor(private http: HttpClient) {}

  fetchTasks() {
    this.http.get<Task[]>('/assets/mock.json').pipe(
      map((res) => res.sort((a, b) => a.id - b.id))
    ).subscribe((tasks) => {
      this.taskList.set(tasks);
    });
  }

  editTask(task: Task) {
    this.taskList.update((tasks) => {
      return tasks.map(t => t.id === task.id ? { ...task } : t);
    });
  }

  deleteTask(id: number) {
    this.taskList.update((tasks) => {
      return tasks.filter(t => t.id !== id);
    });
  }

  addTask(task: Task) {
    this.taskList.update((tasks) => {
      return [...tasks, { ...task, id: tasks.length + 1 }];
    });
  }
}
