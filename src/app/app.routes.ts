import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: '/tasks-list', pathMatch: 'full' },
    {
      path: 'tasks-list',
      loadComponent: () =>
        import('./tasks-list/tasks-list.component').then(
          (m) => m.TasksListComponent
        ),
    },
  ];
  