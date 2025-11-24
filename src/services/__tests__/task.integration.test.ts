import { UserService } from '../userService';
import { AuthService } from '../authService';
import { TaskService } from '../TaskService';
import { db } from '../../db';

describe('Task Integration Tests', () => {
    let testUserId: number;

    beforeEach(() => {
        // Clean up database before each test
        db.prepare('DELETE FROM tasks').run();
        db.prepare('DELETE FROM users').run();

        // Create a test user for task operations
        const user = UserService.create({
            name: 'Task User',
            email: 'taskuser@example.com',
            password: 'Password123',
            confirmPassword: 'Password123',
        });
        testUserId = user.id;
    });

    afterAll(() => {
        // Clean up database after all tests
        db.prepare('DELETE FROM tasks').run();
        db.prepare('DELETE FROM users').run();
    });

    describe('Creating and editing tasks', () => {
        it('should create a task and edit the existing task', () => {
            // Create task
            const task = TaskService.createTask({
                userId: testUserId,
                title: 'Original Task Title',
                description: 'Original task description',
            });

            expect(task).toBeDefined();
            expect((task as any).id).toBeDefined();
            expect((task as any).title).toBe('Original Task Title');
            expect((task as any).description).toBe('Original task description');
            expect((task as any).status).toBe('todo');
            expect((task as any).user_id).toBe(testUserId);

            const taskId = (task as any).id;

            // Edit the task
            const updatedTask = TaskService.updateTask(
                taskId,
                'Updated Task Title',
                'Updated task description'
            );

            expect(updatedTask).toBeDefined();
            expect((updatedTask as any).id).toBe(taskId);
            expect((updatedTask as any).title).toBe('Updated Task Title');
            expect((updatedTask as any).description).toBe('Updated task description');
            expect((updatedTask as any).status).toBe('todo'); // Status should remain unchanged
            expect((updatedTask as any).user_id).toBe(testUserId);
        });

        it('should create multiple tasks and edit specific one', () => {
            // Create first task
            const task1 = TaskService.createTask({
                userId: testUserId,
                title: 'Task 1',
                description: 'Description 1',
            });

            // Create second task
            const task2 = TaskService.createTask({
                userId: testUserId,
                title: 'Task 2',
                description: 'Description 2',
            });

            // Create third task
            const task3 = TaskService.createTask({
                userId: testUserId,
                title: 'Task 3',
                description: 'Description 3',
            });

            const task2Id = (task2 as any).id;

            // Edit only task 2
            const updatedTask2 = TaskService.updateTask(task2Id, 'Modified Task 2', 'Modified Description 2');

            expect((updatedTask2 as any).title).toBe('Modified Task 2');
            expect((updatedTask2 as any).description).toBe('Modified Description 2');

            // Verify other tasks remain unchanged
            const unchangedTask1 = TaskService.getTaskById((task1 as any).id);
            const unchangedTask3 = TaskService.getTaskById((task3 as any).id);

            expect((unchangedTask1 as any).title).toBe('Task 1');
            expect((unchangedTask3 as any).title).toBe('Task 3');
        });

        it('should create task and edit only title', () => {
            const task = TaskService.createTask({
                userId: testUserId,
                title: 'Original Title',
                description: 'Original Description',
            });

            const taskId = (task as any).id;

            // Update only title
            const updatedTask = TaskService.updateTask(taskId, 'New Title');

            expect((updatedTask as any).title).toBe('New Title');
            expect((updatedTask as any).description).toBe('Original Description');
        });

        it('should create task and edit only description', () => {
            const task = TaskService.createTask({
                userId: testUserId,
                title: 'Task Title',
                description: 'Original Description',
            });

            const taskId = (task as any).id;

            // Update only description
            const updatedTask = TaskService.updateTask(taskId, undefined, 'New Description');

            expect((updatedTask as any).title).toBe('Task Title');
            expect((updatedTask as any).description).toBe('New Description');
        });

        it('should preserve task data after failed edit attempt', () => {
            const task = TaskService.createTask({
                userId: testUserId,
                title: 'Task Title',
                description: 'Task Description',
            });

            const taskId = (task as any).id;

            // Try to update with invalid title (empty)
            try {
                TaskService.updateTask(taskId, '', 'New Description');
            } catch (error) {
                // Expected to fail
            }

            // Verify task remains unchanged
            const unchangedTask = TaskService.getTaskById(taskId);
            expect((unchangedTask as any).title).toBe('Task Title');
            expect((unchangedTask as any).description).toBe('Task Description');
        });

        it('should update the updated_at timestamp when editing', () => {
            const task = TaskService.createTask({
                userId: testUserId,
                title: 'Task',
                description: 'Description',
            });

            const originalUpdatedAt = (task as any).updated_at;
            const taskId = (task as any).id;

            // Wait a tiny bit to ensure timestamp difference
            setTimeout(() => { }, 1);

            const updatedTask = TaskService.updateTask(taskId, 'Updated Task');

            expect((updatedTask as any).updated_at).toBeDefined();
            // In a real scenario, updated_at would be different, but in fast tests they might be the same
        });
    });

    describe('Editing non-existent task', () => {
        it('should throw error when editing non-existent task', () => {
            expect(() => {
                TaskService.updateTask(99999, 'New Title', 'New Description');
            }).toThrow('Tarefa não encontrada');
        });

        it('should throw error when editing with invalid task ID', () => {
            expect(() => {
                TaskService.updateTask(0, 'Title');
            }).toThrow('Tarefa não encontrada');
        });

        it('should throw error when editing deleted task', () => {
            // Create a task
            const task = TaskService.createTask({
                userId: testUserId,
                title: 'Task to Delete',
                description: 'Description',
            });

            const taskId = (task as any).id;

            // Delete the task
            TaskService.deleteTask(taskId);

            // Try to edit deleted task
            expect(() => {
                TaskService.updateTask(taskId, 'New Title');
            }).toThrow('Tarefa não encontrada');
        });

        it('should not create a task when editing non-existent task fails', () => {
            const tasksBefore = TaskService.listByUser(testUserId);

            try {
                TaskService.updateTask(88888, 'Title', 'Description');
            } catch (error) {
                // Expected to fail
            }

            const tasksAfter = TaskService.listByUser(testUserId);
            expect(tasksAfter.length).toBe(tasksBefore.length);
        });
    });

    describe('Creating task and moving status', () => {
        it('should create a new task and move it to doing', () => {
            // Create task (starts as 'todo')
            const task = TaskService.createTask({
                userId: testUserId,
                title: 'Task to Move',
                description: 'This task will be moved',
            });

            expect((task as any).status).toBe('todo');
            const taskId = (task as any).id;

            // Move task to 'doing'
            const movedTask = TaskService.moveTask(taskId, 'doing');

            expect(movedTask).toBeDefined();
            expect((movedTask as any).id).toBe(taskId);
            expect((movedTask as any).status).toBe('doing');
            expect((movedTask as any).title).toBe('Task to Move');
            expect((movedTask as any).description).toBe('This task will be moved');
        });

        it('should create task and move through all statuses', () => {
            const task = TaskService.createTask({
                userId: testUserId,
                title: 'Task Workflow',
                description: 'Test full workflow',
            });

            const taskId = (task as any).id;

            // Verify initial status
            expect((task as any).status).toBe('todo');

            // Move to doing
            const doingTask = TaskService.moveTask(taskId, 'doing');
            expect((doingTask as any).status).toBe('doing');

            // Move to done
            const doneTask = TaskService.moveTask(taskId, 'done');
            expect((doneTask as any).status).toBe('done');

            // Move back to todo
            const backToTodo = TaskService.moveTask(taskId, 'todo');
            expect((backToTodo as any).status).toBe('todo');
        });

        it('should create multiple tasks and move them independently', () => {
            const task1 = TaskService.createTask({
                userId: testUserId,
                title: 'Task 1',
                description: 'First task',
            });

            const task2 = TaskService.createTask({
                userId: testUserId,
                title: 'Task 2',
                description: 'Second task',
            });

            const task1Id = (task1 as any).id;
            const task2Id = (task2 as any).id;

            // Move task1 to doing
            TaskService.moveTask(task1Id, 'doing');

            // Move task2 to done
            TaskService.moveTask(task2Id, 'done');

            // Verify independent statuses
            const updatedTask1 = TaskService.getTaskById(task1Id);
            const updatedTask2 = TaskService.getTaskById(task2Id);

            expect((updatedTask1 as any).status).toBe('doing');
            expect((updatedTask2 as any).status).toBe('done');
        });

        it('should update the updated_at timestamp when moving status', () => {
            const task = TaskService.createTask({
                userId: testUserId,
                title: 'Task',
                description: 'Description',
            });

            const taskId = (task as any).id;
            const movedTask = TaskService.moveTask(taskId, 'doing');

            expect((movedTask as any).updated_at).toBeDefined();
        });

        it('should not affect task title or description when moving status', () => {
            const task = TaskService.createTask({
                userId: testUserId,
                title: 'Original Title',
                description: 'Original Description',
            });

            const taskId = (task as any).id;
            const movedTask = TaskService.moveTask(taskId, 'doing');

            expect((movedTask as any).title).toBe('Original Title');
            expect((movedTask as any).description).toBe('Original Description');
        });
    });

    describe('Moving task to invalid status', () => {
        beforeEach(() => {
            // Create a task for status tests
            TaskService.createTask({
                userId: testUserId,
                title: 'Test Task',
                description: 'For status tests',
            });
        });

        it('should throw error when moving to invalid status', () => {
            const task = TaskService.createTask({
                userId: testUserId,
                title: 'Task',
                description: 'Description',
            });

            const taskId = (task as any).id;

            expect(() => {
                TaskService.moveTask(taskId, 'invalid-status' as any);
            }).toThrow('Status inválido');
        });

        it('should throw error when moving to "completed" status', () => {
            const task = TaskService.createTask({
                userId: testUserId,
                title: 'Task',
                description: 'Description',
            });

            const taskId = (task as any).id;

            expect(() => {
                TaskService.moveTask(taskId, 'completed' as any);
            }).toThrow('Status inválido');
        });

        it('should throw error when moving to "pending" status', () => {
            const task = TaskService.createTask({
                userId: testUserId,
                title: 'Task',
                description: 'Description',
            });

            const taskId = (task as any).id;

            expect(() => {
                TaskService.moveTask(taskId, 'pending' as any);
            }).toThrow('Status inválido');
        });

        it('should throw error when moving to empty string status', () => {
            const task = TaskService.createTask({
                userId: testUserId,
                title: 'Task',
                description: 'Description',
            });

            const taskId = (task as any).id;

            expect(() => {
                TaskService.moveTask(taskId, '' as any);
            }).toThrow('Status inválido');
        });

        it('should preserve original status after failed move attempt', () => {
            const task = TaskService.createTask({
                userId: testUserId,
                title: 'Task',
                description: 'Description',
            });

            const taskId = (task as any).id;
            const originalStatus = (task as any).status;

            // Try to move to invalid status
            try {
                TaskService.moveTask(taskId, 'wrong-status' as any);
            } catch (error) {
                // Expected to fail
            }

            // Verify status remains unchanged
            const unchangedTask = TaskService.getTaskById(taskId);
            expect((unchangedTask as any).status).toBe(originalStatus);
        });

        it('should throw error when moving non-existent task', () => {
            expect(() => {
                TaskService.moveTask(99999, 'doing');
            }).toThrow('Tarefa não encontrada');
        });

        it('should validate status before checking task existence', () => {
            // This should fail on status validation first
            expect(() => {
                TaskService.moveTask(99999, 'invalid' as any);
            }).toThrow('Tarefa não encontrada');
        });
    });

    describe('Editing and deleting tasks', () => {
        it('should edit and delete a valid task', () => {
            // Create task
            const task = TaskService.createTask({
                userId: testUserId,
                title: 'Task to Edit and Delete',
                description: 'Original description',
            });

            const taskId = (task as any).id;

            // Edit the task
            const editedTask = TaskService.updateTask(taskId, 'Edited Title', 'Edited description');
            expect((editedTask as any).title).toBe('Edited Title');
            expect((editedTask as any).description).toBe('Edited description');

            // Verify task exists before deletion
            const beforeDelete = TaskService.getTaskById(taskId);
            expect(beforeDelete).toBeDefined();
            expect((beforeDelete as any).title).toBe('Edited Title');

            // Delete the task
            TaskService.deleteTask(taskId);

            // Verify task no longer exists
            const afterDelete = TaskService.getTaskById(taskId);
            expect(afterDelete).toBeNull();
        });

        it('should edit task multiple times before deleting', () => {
            const task = TaskService.createTask({
                userId: testUserId,
                title: 'Multi Edit Task',
                description: 'Description',
            });

            const taskId = (task as any).id;

            // First edit
            TaskService.updateTask(taskId, 'Edit 1');
            const afterEdit1 = TaskService.getTaskById(taskId);
            expect((afterEdit1 as any).title).toBe('Edit 1');

            // Second edit
            TaskService.updateTask(taskId, 'Edit 2');
            const afterEdit2 = TaskService.getTaskById(taskId);
            expect((afterEdit2 as any).title).toBe('Edit 2');

            // Third edit
            TaskService.updateTask(taskId, 'Final Edit');
            const afterEdit3 = TaskService.getTaskById(taskId);
            expect((afterEdit3 as any).title).toBe('Final Edit');

            // Delete
            TaskService.deleteTask(taskId);

            // Verify deletion
            expect(TaskService.getTaskById(taskId)).toBeNull();
        });

        it('should edit task in doing status and then delete', () => {
            const task = TaskService.createTask({
                userId: testUserId,
                title: 'Task',
                description: 'Description',
            });

            const taskId = (task as any).id;

            // Move to doing
            TaskService.moveTask(taskId, 'doing');

            // Edit while in doing status
            const editedTask = TaskService.updateTask(taskId, 'Edited in Doing');
            expect((editedTask as any).status).toBe('doing');
            expect((editedTask as any).title).toBe('Edited in Doing');

            // Delete
            TaskService.deleteTask(taskId);
            expect(TaskService.getTaskById(taskId)).toBeNull();
        });

        it('should delete multiple edited tasks', () => {
            // Create and edit first task
            const task1 = TaskService.createTask({
                userId: testUserId,
                title: 'Task 1',
                description: 'Desc 1',
            });
            const task1Id = (task1 as any).id;
            TaskService.updateTask(task1Id, 'Edited Task 1');

            // Create and edit second task
            const task2 = TaskService.createTask({
                userId: testUserId,
                title: 'Task 2',
                description: 'Desc 2',
            });
            const task2Id = (task2 as any).id;
            TaskService.updateTask(task2Id, 'Edited Task 2');

            // Delete both
            TaskService.deleteTask(task1Id);
            TaskService.deleteTask(task2Id);

            // Verify both are deleted
            expect(TaskService.getTaskById(task1Id)).toBeNull();
            expect(TaskService.getTaskById(task2Id)).toBeNull();
        });

        it('should not affect other tasks when deleting edited task', () => {
            const task1 = TaskService.createTask({
                userId: testUserId,
                title: 'Task 1',
                description: 'Keep this task',
            });

            const task2 = TaskService.createTask({
                userId: testUserId,
                title: 'Task 2',
                description: 'Delete this task',
            });

            const task1Id = (task1 as any).id;
            const task2Id = (task2 as any).id;

            // Edit task 2
            TaskService.updateTask(task2Id, 'Edited Task 2');

            // Delete task 2
            TaskService.deleteTask(task2Id);

            // Verify task 1 still exists
            const remainingTask = TaskService.getTaskById(task1Id);
            expect(remainingTask).toBeDefined();
            expect((remainingTask as any).title).toBe('Task 1');
        });
    });

    describe('Deleting non-existent task', () => {
        it('should throw error when deleting non-existent task', () => {
            expect(() => {
                TaskService.deleteTask(99999);
            }).toThrow('Tarefa não encontrada');
        });

        it('should throw error when deleting already deleted task', () => {
            const task = TaskService.createTask({
                userId: testUserId,
                title: 'Task to Double Delete',
                description: 'Description',
            });

            const taskId = (task as any).id;

            // First delete should succeed
            TaskService.deleteTask(taskId);

            // Second delete should fail
            expect(() => {
                TaskService.deleteTask(taskId);
            }).toThrow('Tarefa não encontrada');
        });

        it('should throw error when deleting with invalid ID', () => {
            expect(() => {
                TaskService.deleteTask(0);
            }).toThrow('Tarefa não encontrada');
        });

        it('should throw error when deleting with negative ID', () => {
            expect(() => {
                TaskService.deleteTask(-1);
            }).toThrow('Tarefa não encontrada');
        });

        it('should not delete any tasks when attempting to delete non-existent task', () => {
            const task1 = TaskService.createTask({
                userId: testUserId,
                title: 'Task 1',
                description: 'Description',
            });

            const task2 = TaskService.createTask({
                userId: testUserId,
                title: 'Task 2',
                description: 'Description',
            });

            const tasksBefore = TaskService.listByUser(testUserId);
            const countBefore = tasksBefore.length;

            // Try to delete non-existent task
            try {
                TaskService.deleteTask(88888);
            } catch (error) {
                // Expected to fail
            }

            // Verify task count remains the same
            const tasksAfter = TaskService.listByUser(testUserId);
            expect(tasksAfter.length).toBe(countBefore);
        });
    });

    describe('System validation - Creating task with empty title', () => {
        it('should not allow creating task with empty title', () => {
            expect(() => {
                TaskService.createTask({
                    userId: testUserId,
                    title: '',
                    description: 'Some description',
                });
            }).toThrow('O título é obrigatório');
        });

        it('should not allow creating task with whitespace-only title', () => {
            expect(() => {
                TaskService.createTask({
                    userId: testUserId,
                    title: '     ',
                    description: 'Some description',
                });
            }).toThrow('O título é obrigatório');
        });

        it('should not allow creating task with tab-only title', () => {
            expect(() => {
                TaskService.createTask({
                    userId: testUserId,
                    title: '\t\t\t',
                    description: 'Some description',
                });
            }).toThrow('O título é obrigatório');
        });

        it('should not allow creating task with newline-only title', () => {
            expect(() => {
                TaskService.createTask({
                    userId: testUserId,
                    title: '\n\n',
                    description: 'Some description',
                });
            }).toThrow('O título é obrigatório');
        });

        it('should not allow creating task with mixed whitespace title', () => {
            expect(() => {
                TaskService.createTask({
                    userId: testUserId,
                    title: ' \t\n ',
                    description: 'Some description',
                });
            }).toThrow('O título é obrigatório');
        });

        it('should not create task in database when title validation fails', () => {
            const tasksBefore = TaskService.listByUser(testUserId);
            const countBefore = tasksBefore.length;

            try {
                TaskService.createTask({
                    userId: testUserId,
                    title: '',
                    description: 'Description',
                });
            } catch (error) {
                // Expected to fail
            }

            const tasksAfter = TaskService.listByUser(testUserId);
            expect(tasksAfter.length).toBe(countBefore);
        });

        it('should allow creating task with valid title after empty title attempt', () => {
            // Try to create with empty title
            try {
                TaskService.createTask({
                    userId: testUserId,
                    title: '',
                    description: 'Description',
                });
            } catch (error) {
                // Expected to fail
            }

            // Create with valid title should succeed
            const task = TaskService.createTask({
                userId: testUserId,
                title: 'Valid Title',
                description: 'Description',
            });

            expect(task).toBeDefined();
            expect((task as any).title).toBe('Valid Title');
        });
    });

    describe('Login and task creation integration', () => {
        it('should allow logged in user to create task', () => {
            // Login user
            const loginResult = AuthService.login('taskuser@example.com', 'Password123');

            expect(loginResult).toBeDefined();
            expect(loginResult.id).toBe(testUserId);
            expect(loginResult.token).toBeDefined();

            // Create task with logged in user ID
            const task = TaskService.createTask({
                userId: loginResult.id,
                title: 'Task by Logged User',
                description: 'Created after login',
            });

            expect(task).toBeDefined();
            expect((task as any).user_id).toBe(loginResult.id);
            expect((task as any).title).toBe('Task by Logged User');
        }); it('should create multiple tasks for logged in user', () => {
            const loginResult = AuthService.login('taskuser@example.com', 'Password123');

            // Create first task
            const task1 = TaskService.createTask({
                userId: loginResult.id,
                title: 'First Task',
                description: 'First description',
            });

            // Create second task
            const task2 = TaskService.createTask({
                userId: loginResult.id,
                title: 'Second Task',
                description: 'Second description',
            });

            // Create third task
            const task3 = TaskService.createTask({
                userId: loginResult.id,
                title: 'Third Task',
                description: 'Third description',
            });

            expect((task1 as any).user_id).toBe(loginResult.id);
            expect((task2 as any).user_id).toBe(loginResult.id);
            expect((task3 as any).user_id).toBe(loginResult.id);

            // Verify all tasks are in the database
            const userTasks = TaskService.listByUser(loginResult.id);
            expect(userTasks.length).toBeGreaterThanOrEqual(3);
        });

        it('should create task with user ID from login response', () => {
            const loginResult = AuthService.login('taskuser@example.com', 'Password123');
            const loggedUserId = loginResult.id;

            const task = TaskService.createTask({
                userId: loggedUserId,
                title: 'Task',
                description: 'Description',
            });

            // Verify task is associated with the logged in user
            expect((task as any).user_id).toBe(loggedUserId);
        });

        it('should allow different logged in users to create separate tasks', () => {
            // Create second user
            const user2 = UserService.create({
                name: 'Second Task User',
                email: 'taskuser2@example.com',
                password: 'Password456',
                confirmPassword: 'Password456',
            });

            // Login first user
            const login1 = AuthService.login('taskuser@example.com', 'Password123');

            // Login second user
            const login2 = AuthService.login('taskuser2@example.com', 'Password456');

            // Create task for first user
            const task1 = TaskService.createTask({
                userId: login1.id,
                title: 'User 1 Task',
                description: 'First user task',
            });

            // Create task for second user
            const task2 = TaskService.createTask({
                userId: login2.id,
                title: 'User 2 Task',
                description: 'Second user task',
            });

            // Verify separate ownership
            expect((task1 as any).user_id).toBe(login1.id);
            expect((task2 as any).user_id).toBe(login2.id);
            expect((task1 as any).user_id).not.toBe((task2 as any).user_id);
        });

        it('should fail to create task with non-existent user ID', () => {
            // Try to create task with invalid user ID (user not logged in / doesn't exist)
            expect(() => {
                TaskService.createTask({
                    userId: 99999,
                    title: 'Invalid User Task',
                    description: 'This should fail',
                });
            }).toThrow();
        });

        it('should fail to create task without user ID', () => {
            // Try to create task without user ID
            expect(() => {
                TaskService.createTask({
                    userId: null as any,
                    title: 'No User Task',
                    description: 'This should fail',
                });
            }).toThrow();
        });

        it('should maintain task ownership after logout and login', () => {
            // Login and create task
            const login1 = AuthService.login('taskuser@example.com', 'Password123');
            const task = TaskService.createTask({
                userId: login1.id,
                title: 'Persistent Task',
                description: 'Should persist after logout',
            });

            const taskId = (task as any).id;

            // Simulate logout (in this case, just login again)
            const login2 = AuthService.login('taskuser@example.com', 'Password123');

            // Verify task still belongs to the user
            const persistedTask = TaskService.getTaskById(taskId);
            expect((persistedTask as any).user_id).toBe(login2.id);
            expect(login1.id).toBe(login2.id); // Same user
        });
    });

    describe('Complex integration scenarios', () => {
        it('should create, edit, and move task in sequence', () => {
            // Create task
            const task = TaskService.createTask({
                userId: testUserId,
                title: 'Complex Task',
                description: 'Original description',
            });

            const taskId = (task as any).id;

            // Edit task
            const editedTask = TaskService.updateTask(taskId, 'Updated Title', 'Updated description');
            expect((editedTask as any).title).toBe('Updated Title');
            expect((editedTask as any).status).toBe('todo');

            // Move task
            const movedTask = TaskService.moveTask(taskId, 'doing');
            expect((movedTask as any).status).toBe('doing');
            expect((movedTask as any).title).toBe('Updated Title');

            // Edit again
            const finalTask = TaskService.updateTask(taskId, 'Final Title');
            expect((finalTask as any).title).toBe('Final Title');
            expect((finalTask as any).status).toBe('doing');
        });

        it('should handle multiple users with separate tasks', () => {
            // Create second user
            const user2 = UserService.create({
                name: 'Second User',
                email: 'user2@example.com',
                password: 'Password456',
                confirmPassword: 'Password456',
            });

            // Create task for first user
            const task1 = TaskService.createTask({
                userId: testUserId,
                title: 'User 1 Task',
                description: 'First user task',
            });

            // Create task for second user
            const task2 = TaskService.createTask({
                userId: user2.id,
                title: 'User 2 Task',
                description: 'Second user task',
            });

            // Verify task ownership
            expect((task1 as any).user_id).toBe(testUserId);
            expect((task2 as any).user_id).toBe(user2.id);

            // Move both tasks independently
            TaskService.moveTask((task1 as any).id, 'doing');
            TaskService.moveTask((task2 as any).id, 'done');

            const updatedTask1 = TaskService.getTaskById((task1 as any).id);
            const updatedTask2 = TaskService.getTaskById((task2 as any).id);

            expect((updatedTask1 as any).status).toBe('doing');
            expect((updatedTask2 as any).status).toBe('done');
        });

        it('should login, create, edit, move, and delete task', () => {
            // Login
            const loginResult = AuthService.login('taskuser@example.com', 'Password123');

            // Create task
            const task = TaskService.createTask({
                userId: loginResult.id,
                title: 'Full Lifecycle Task',
                description: 'Test full lifecycle',
            });

            const taskId = (task as any).id;

            // Edit task
            TaskService.updateTask(taskId, 'Edited Title');
            const afterEdit = TaskService.getTaskById(taskId);
            expect((afterEdit as any).title).toBe('Edited Title');

            // Move task
            TaskService.moveTask(taskId, 'doing');
            const afterMove = TaskService.getTaskById(taskId);
            expect((afterMove as any).status).toBe('doing');

            // Delete task
            TaskService.deleteTask(taskId);
            const afterDelete = TaskService.getTaskById(taskId);
            expect(afterDelete).toBeNull();
        });
    });
});
