import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { UserService } from './services/userService';
import { AuthService } from './services/authService';
import { TaskService, TaskStatus } from './services/TaskService';

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const userId = Number(req.header('x-user-id'));
    if (!userId) {
        return res.status(401).json({ error: 'Acesso não autorizado' });
    }
    (req as any).userId = userId;
    next();
}

app.post('/users', (req, res) => {
    try {
        const user = UserService.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            confirmPassword: req.body.confirmPassword,
        });
        res.status(201).json(user);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        const result = AuthService.login(email, password);
        res.json(result);
    } catch (err: any) {
        const msg = err.message;
        const status = msg === 'Senha incorreta' ? 401 : 400;
        res.status(status).json({ error: msg });
    }
});

app.post('/tasks', authMiddleware, (req, res) => {
    try {
        const task = TaskService.createTask({
            userId: (req as any).userId,
            title: req.body.title,
            description: req.body.description,
        });
        res.status(201).json(task);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/tasks', authMiddleware, (req, res) => {
    const userId = (req as any).userId as number;
    const tasks = TaskService.listByUser(userId);
    res.json(tasks);
});

app.put('/tasks/:id', authMiddleware, (req, res) => {
    try {
        const id = Number(req.params.id);
        const task = TaskService.updateTask(id, req.body.title, req.body.description);
        res.json(task);
    } catch (err: any) {
        const status = err.message === 'Tarefa não encontrada' ? 404 : 400;
        res.status(status).json({ error: err.message });
    }
});

app.delete('/tasks/:id', authMiddleware, (req, res) => {
    try {
        const id = Number(req.params.id);
        TaskService.deleteTask(id);
        res.status(204).send();
    } catch (err: any) {
        const status = err.message === 'Tarefa não encontrada' ? 404 : 400;
        res.status(status).json({ error: err.message });
    }
});

app.patch('/tasks/:id/status', authMiddleware, (req, res) => {
    try {
        const id = Number(req.params.id);
        const status = req.body.status as TaskStatus;
        const task = TaskService.moveTask(id, status);
        res.json(task);
    } catch (err: any) {
        const msg = err.message;
        const statusCode =
            msg === 'Tarefa não encontrada' ? 404 :
                msg === 'Status inválido' ? 400 :
                    400;
        res.status(statusCode).json({ error: msg });
    }
});

export default app;
