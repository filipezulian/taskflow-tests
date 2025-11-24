import { db } from '../db';
import { CreateTaskInput } from './dtos/CreateTaskInput';

export type TaskStatus = 'todo' | 'doing' | 'done';

export class TaskService {
    static createTask(input: CreateTaskInput) {
        const { userId, title, description } = input;

        TaskService.validateTitle(title);

        const now = new Date().toISOString();

        const stmt = db.prepare(`
      INSERT INTO tasks (user_id, title, description, status, created_at, updated_at)
      VALUES (?, ?, ?, 'todo', ?, ?)
    `);

        const info = stmt.run(userId, title.trim(), description ?? null, now, now);
        return TaskService.getTaskById(Number(info.lastInsertRowid));
    }

    static validateTitle(title: string) {
        if (!title.trim()) {
            throw new Error('O título é obrigatório');
        }
        return true;
    }

    static getTaskById(id: number) {
        const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
        if (!row) return null;
        return row;
    }

    static updateTask(id: number, title?: string, description?: string) {
        const existing = TaskService.getTaskById(id);

        TaskService.validateTaskExists(existing);

        const newTitle = title !== undefined ? title.trim() : (existing as any).title;
        const newDescription = description !== undefined ? description : (existing as any).description;

        TaskService.validateTitle(newTitle); const now = new Date().toISOString();

        db.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, updated_at = ?
      WHERE id = ?
    `).run(newTitle, newDescription, now, id);

        return TaskService.getTaskById(id);
    }

    static validateTaskExists(task: any) {
        if (!task) {
            throw new Error('Tarefa não encontrada');
        }
        return true;
    }

    static deleteTask(id: number) {
        const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
        if (info.changes === 0) {
            throw new Error('Tarefa não encontrada');
        }
    }

    static moveTask(id: number, status: TaskStatus) {
        const existing = TaskService.getTaskById(id);

        TaskService.validateTaskExists(existing);
        TaskService.validateStatus(status);

        const now = new Date().toISOString();
        db.prepare(`
      UPDATE tasks
      SET status = ?, updated_at = ?
      WHERE id = ?
    `).run(status, now, id);

        return TaskService.getTaskById(id);
    }

    static validateStatus(status: TaskStatus) {
        if (!['todo', 'doing', 'done'].includes(status)) {
            throw new Error('Status inválido');
        }
        return true;
    }

    static listByUser(userId: number) {
        return db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at ASC').all(userId);
    }
}
