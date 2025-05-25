import { TaskCategory } from "./categoty.enum";

export interface Task {
    id: number;
    name: string;
    date: Date;
    category: TaskCategory;
    remainingDays?: number | null;
}