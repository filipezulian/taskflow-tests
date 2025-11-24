import { TaskService } from '../TaskService';
import { db } from '../../db';

jest.mock('../../db', () => ({
    db: {
        prepare: jest.fn(),
    },
}));

describe('TaskService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createTask', () => {
        describe('Create with valid data', () => {
            it('should create task successfully with title and description', () => {
                const mockTask = {
                    id: 1,
                    user_id: 1,
                    title: 'Test Task',
                    description: 'Test Description',
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 1 });
                const mockGet = jest.fn().mockReturnValue(mockTask);
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const input = {
                    userId: 1,
                    title: 'Test Task',
                    description: 'Test Description',
                };

                const result = TaskService.createTask(input);

                expect(result).toEqual(mockTask);
                expect(mockRun).toHaveBeenCalled();
            });

            it('should create task with valid title only (no description)', () => {
                const mockTask = {
                    id: 2,
                    user_id: 1,
                    title: 'Task without description',
                    description: null,
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 2 });
                const mockGet = jest.fn().mockReturnValue(mockTask);
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const input = {
                    userId: 1,
                    title: 'Task without description',
                };

                const result = TaskService.createTask(input) as any;

                expect(result).toEqual(mockTask);
                expect(result.description).toBeNull();
            });

            it('should trim whitespace from title', () => {
                const mockTask = {
                    id: 3,
                    user_id: 1,
                    title: 'Trimmed Task',
                    description: 'Test',
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 3 });
                const mockGet = jest.fn().mockReturnValue(mockTask);
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const input = {
                    userId: 1,
                    title: '  Trimmed Task  ',
                    description: 'Test',
                };

                TaskService.createTask(input);

                expect(mockRun).toHaveBeenCalledWith(
                    1,
                    'Trimmed Task',
                    'Test',
                    expect.any(String),
                    expect.any(String)
                );
            });

            it('should set default status to "todo"', () => {
                const mockTask = {
                    id: 4,
                    user_id: 1,
                    title: 'New Task',
                    description: 'Description',
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 4 });
                const mockGet = jest.fn().mockReturnValue(mockTask);
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const input = {
                    userId: 1,
                    title: 'New Task',
                    description: 'Description',
                };

                const result = TaskService.createTask(input) as any;

                expect(result.status).toBe('todo');
            });

            it('should set created_at and updated_at timestamps', () => {
                const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 5 });
                const mockGet = jest.fn().mockReturnValue({
                    id: 5,
                    user_id: 1,
                    title: 'Task',
                    description: null,
                    status: 'todo',
                    created_at: expect.any(String),
                    updated_at: expect.any(String),
                });
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const input = {
                    userId: 1,
                    title: 'Task',
                };

                TaskService.createTask(input);

                expect(mockRun).toHaveBeenCalledWith(
                    1,
                    'Task',
                    null,
                    expect.any(String),
                    expect.any(String)
                );
            });
        });

        describe('Create with empty title', () => {
            it('should throw error when title is empty string', () => {
                const input = {
                    userId: 1,
                    title: '',
                    description: 'Some description',
                };

                expect(() => TaskService.createTask(input)).toThrow('O título é obrigatório');
            });

            it('should throw error when title is only whitespace', () => {
                const input = {
                    userId: 1,
                    title: '   ',
                    description: 'Some description',
                };

                expect(() => TaskService.createTask(input)).toThrow('O título é obrigatório');
            });

            it('should throw error when title is tab characters', () => {
                const input = {
                    userId: 1,
                    title: '\t\t\t',
                    description: 'Some description',
                };

                expect(() => TaskService.createTask(input)).toThrow('O título é obrigatório');
            });

            it('should throw error when title is newlines', () => {
                const input = {
                    userId: 1,
                    title: '\n\n',
                    description: 'Some description',
                };

                expect(() => TaskService.createTask(input)).toThrow('O título é obrigatório');
            });
        });

        describe('Testing minimum input allowed for title', () => {
            it('should create task with 1 character title', () => {
                const mockTask = {
                    id: 6,
                    user_id: 1,
                    title: 'A',
                    description: null,
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 6 });
                const mockGet = jest.fn().mockReturnValue(mockTask);
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const input = {
                    userId: 1,
                    title: 'A',
                };

                const result = TaskService.createTask(input) as any;

                expect(result).toEqual(mockTask);
                expect(result.title).toBe('A');
            });

            it('should create task with 1 character after trimming', () => {
                const mockTask = {
                    id: 7,
                    user_id: 1,
                    title: 'X',
                    description: null,
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 7 });
                const mockGet = jest.fn().mockReturnValue(mockTask);
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const input = {
                    userId: 1,
                    title: '   X   ',
                };

                const result = TaskService.createTask(input) as any;

                expect(result.title).toBe('X');
            });

            it('should create task with single digit as title', () => {
                const mockTask = {
                    id: 8,
                    user_id: 1,
                    title: '1',
                    description: null,
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 8 });
                const mockGet = jest.fn().mockReturnValue(mockTask);
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const input = {
                    userId: 1,
                    title: '1',
                };

                const result = TaskService.createTask(input) as any;

                expect(result.title).toBe('1');
            });

            it('should create task with single special character as title', () => {
                const mockTask = {
                    id: 9,
                    user_id: 1,
                    title: '!',
                    description: null,
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 9 });
                const mockGet = jest.fn().mockReturnValue(mockTask);
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const input = {
                    userId: 1,
                    title: '!',
                };

                const result = TaskService.createTask(input) as any;

                expect(result.title).toBe('!');
            });
        });

        describe('Testing maximum input allowed for title', () => {
            it('should create task with 255 character title', () => {
                const title255 = 'A'.repeat(255);
                const mockTask = {
                    id: 10,
                    user_id: 1,
                    title: title255,
                    description: null,
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 10 });
                const mockGet = jest.fn().mockReturnValue(mockTask);
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const input = {
                    userId: 1,
                    title: title255,
                };

                const result = TaskService.createTask(input) as any;

                expect(result.title).toBe(title255);
                expect(result.title.length).toBe(255);
            });

            it('should create task with 256 character title (testing if there is a limit)', () => {
                const title256 = 'B'.repeat(256);
                const mockTask = {
                    id: 11,
                    user_id: 1,
                    title: title256,
                    description: null,
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 11 });
                const mockGet = jest.fn().mockReturnValue(mockTask);
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const input = {
                    userId: 1,
                    title: title256,
                };

                const result = TaskService.createTask(input) as any;

                expect(result.title).toBe(title256);
                expect(result.title.length).toBe(256);
            });

            it('should create task with very long title (1000 characters)', () => {
                const longTitle = 'X'.repeat(1000);
                const mockTask = {
                    id: 12,
                    user_id: 1,
                    title: longTitle,
                    description: null,
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 12 });
                const mockGet = jest.fn().mockReturnValue(mockTask);
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const input = {
                    userId: 1,
                    title: longTitle,
                };

                const result = TaskService.createTask(input) as any;

                expect(result.title.length).toBe(1000);
            });
        });

        describe('Create with empty description', () => {
            it('should create task when description is undefined', () => {
                const mockTask = {
                    id: 13,
                    user_id: 1,
                    title: 'Task without description',
                    description: null,
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 13 });
                const mockGet = jest.fn().mockReturnValue(mockTask);
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const input = {
                    userId: 1,
                    title: 'Task without description',
                };

                const result = TaskService.createTask(input) as any;

                expect(result.description).toBeNull();
            });

            it('should create task when description is empty string', () => {
                const mockTask = {
                    id: 14,
                    user_id: 1,
                    title: 'Task with empty description',
                    description: '',
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 14 });
                const mockGet = jest.fn().mockReturnValue(mockTask);
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const input = {
                    userId: 1,
                    title: 'Task with empty description',
                    description: '',
                };

                const result = TaskService.createTask(input) as any;

                expect(result.description).toBe('');
            });

            it('should create task when description is whitespace only', () => {
                const mockTask = {
                    id: 15,
                    user_id: 1,
                    title: 'Task',
                    description: '   ',
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 15 });
                const mockGet = jest.fn().mockReturnValue(mockTask);
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const input = {
                    userId: 1,
                    title: 'Task',
                    description: '   ',
                };

                const result = TaskService.createTask(input) as any;

                expect(result.description).toBe('   ');
            });

            it('should handle null description explicitly', () => {
                const mockTask = {
                    id: 16,
                    user_id: 1,
                    title: 'Task',
                    description: null,
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 16 });
                const mockGet = jest.fn().mockReturnValue(mockTask);
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const input = {
                    userId: 1,
                    title: 'Task',
                    description: undefined,
                };

                TaskService.createTask(input);

                expect(mockRun).toHaveBeenCalledWith(
                    1,
                    'Task',
                    null,
                    expect.any(String),
                    expect.any(String)
                );
            });
        });
    });

    describe('validateTitle', () => {
        it('should return true for valid title', () => {
            expect(TaskService.validateTitle('Valid Title')).toBe(true);
        });

        it('should throw error for empty title', () => {
            expect(() => TaskService.validateTitle('')).toThrow('O título é obrigatório');
        });

        it('should throw error for whitespace only title', () => {
            expect(() => TaskService.validateTitle('   ')).toThrow('O título é obrigatório');
        });

        it('should return true for single character title', () => {
            expect(TaskService.validateTitle('A')).toBe(true);
        });

        it('should return true for very long title', () => {
            expect(TaskService.validateTitle('A'.repeat(1000))).toBe(true);
        });
    });

    describe('updateTask', () => {
        describe('Editing a task', () => {
            it('should update task title successfully', () => {
                const existingTask = {
                    id: 1,
                    user_id: 1,
                    title: 'Old Title',
                    description: 'Old Description',
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const updatedTask = {
                    ...existingTask,
                    title: 'New Title',
                    updated_at: '2025-11-23T11:00:00.000Z',
                };

                const mockGet = jest.fn()
                    .mockReturnValueOnce(existingTask)
                    .mockReturnValueOnce(updatedTask);
                const mockRun = jest.fn();
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ get: mockGet })
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const result = TaskService.updateTask(1, 'New Title', 'Old Description') as any;

                expect(result.title).toBe('New Title');
                expect(mockRun).toHaveBeenCalled();
            });

            it('should update task description successfully', () => {
                const existingTask = {
                    id: 2,
                    user_id: 1,
                    title: 'Task Title',
                    description: 'Old Description',
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const updatedTask = {
                    ...existingTask,
                    description: 'New Description',
                    updated_at: '2025-11-23T11:00:00.000Z',
                };

                const mockGet = jest.fn()
                    .mockReturnValueOnce(existingTask)
                    .mockReturnValueOnce(updatedTask);
                const mockRun = jest.fn();
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ get: mockGet })
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const result = TaskService.updateTask(2, 'Task Title', 'New Description') as any;

                expect(result.description).toBe('New Description');
            });

            it('should update both title and description', () => {
                const existingTask = {
                    id: 3,
                    user_id: 1,
                    title: 'Old Title',
                    description: 'Old Description',
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const updatedTask = {
                    ...existingTask,
                    title: 'New Title',
                    description: 'New Description',
                    updated_at: '2025-11-23T11:00:00.000Z',
                };

                const mockGet = jest.fn()
                    .mockReturnValueOnce(existingTask)
                    .mockReturnValueOnce(updatedTask);
                const mockRun = jest.fn();
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ get: mockGet })
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const result = TaskService.updateTask(3, 'New Title', 'New Description') as any;

                expect(result.title).toBe('New Title');
                expect(result.description).toBe('New Description');
            });

            it('should update only title when description is undefined', () => {
                const existingTask = {
                    id: 4,
                    user_id: 1,
                    title: 'Old Title',
                    description: 'Keep This Description',
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const updatedTask = {
                    ...existingTask,
                    title: 'Updated Title',
                    updated_at: '2025-11-23T11:00:00.000Z',
                };

                const mockGet = jest.fn()
                    .mockReturnValueOnce(existingTask)
                    .mockReturnValueOnce(updatedTask);
                const mockRun = jest.fn();
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ get: mockGet })
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const result = TaskService.updateTask(4, 'Updated Title') as any;

                expect(mockRun).toHaveBeenCalledWith(
                    'Updated Title',
                    'Keep This Description',
                    expect.any(String),
                    4
                );
            });

            it('should update only description when title is undefined', () => {
                const existingTask = {
                    id: 5,
                    user_id: 1,
                    title: 'Keep This Title',
                    description: 'Old Description',
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const updatedTask = {
                    ...existingTask,
                    description: 'Updated Description',
                    updated_at: '2025-11-23T11:00:00.000Z',
                };

                const mockGet = jest.fn()
                    .mockReturnValueOnce(existingTask)
                    .mockReturnValueOnce(updatedTask);
                const mockRun = jest.fn();
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ get: mockGet })
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const result = TaskService.updateTask(5, undefined, 'Updated Description') as any;

                expect(mockRun).toHaveBeenCalledWith(
                    'Keep This Title',
                    'Updated Description',
                    expect.any(String),
                    5
                );
            });

            it('should trim whitespace from updated title', () => {
                const existingTask = {
                    id: 6,
                    user_id: 1,
                    title: 'Old Title',
                    description: 'Description',
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const updatedTask = {
                    ...existingTask,
                    title: 'Trimmed Title',
                    updated_at: '2025-11-23T11:00:00.000Z',
                };

                const mockGet = jest.fn()
                    .mockReturnValueOnce(existingTask)
                    .mockReturnValueOnce(updatedTask);
                const mockRun = jest.fn();
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ get: mockGet })
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                TaskService.updateTask(6, '  Trimmed Title  ', 'Description');

                expect(mockRun).toHaveBeenCalledWith(
                    'Trimmed Title',
                    'Description',
                    expect.any(String),
                    6
                );
            });

            it('should throw error when updating with empty title', () => {
                const existingTask = {
                    id: 7,
                    user_id: 1,
                    title: 'Old Title',
                    description: 'Description',
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockGet = jest.fn().mockReturnValue(existingTask);
                const mockPrepare = jest.fn().mockReturnValue({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                expect(() => TaskService.updateTask(7, '', 'Description')).toThrow('O título é obrigatório');
            });

            it('should throw error when updating with whitespace-only title', () => {
                const existingTask = {
                    id: 8,
                    user_id: 1,
                    title: 'Old Title',
                    description: 'Description',
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockGet = jest.fn().mockReturnValue(existingTask);
                const mockPrepare = jest.fn().mockReturnValue({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                expect(() => TaskService.updateTask(8, '   ', 'Description')).toThrow('O título é obrigatório');
            });
        });

        describe('Updating with non-existent id', () => {
            it('should throw error when task does not exist', () => {
                const mockGet = jest.fn().mockReturnValue(null);
                const mockPrepare = jest.fn().mockReturnValue({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                expect(() => TaskService.updateTask(999, 'New Title')).toThrow('Tarefa não encontrada');
            });

            it('should throw error when task id is not found in database', () => {
                const mockGet = jest.fn().mockReturnValue(undefined);
                const mockPrepare = jest.fn().mockReturnValue({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                expect(() => TaskService.updateTask(888, 'New Title', 'New Description')).toThrow('Tarefa não encontrada');
            });

            it('should check task existence before attempting update', () => {
                const mockGet = jest.fn().mockReturnValue(null);
                const mockPrepare = jest.fn().mockReturnValue({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                expect(() => TaskService.updateTask(123, 'Title')).toThrow('Tarefa não encontrada');

                expect(mockPrepare).toHaveBeenCalledWith('SELECT * FROM tasks WHERE id = ?');
                expect(mockGet).toHaveBeenCalledWith(123);
            });
        });
    });

    describe('deleteTask', () => {
        describe('Deleting a task', () => {
            it('should delete task successfully', () => {
                const mockRun = jest.fn().mockReturnValue({ changes: 1 });
                const mockPrepare = jest.fn().mockReturnValue({ run: mockRun });

                (db.prepare as jest.Mock) = mockPrepare;

                TaskService.deleteTask(1);

                expect(mockPrepare).toHaveBeenCalledWith('DELETE FROM tasks WHERE id = ?');
                expect(mockRun).toHaveBeenCalledWith(1);
            });

            it('should delete task and verify changes count', () => {
                const mockRun = jest.fn().mockReturnValue({ changes: 1 });
                const mockPrepare = jest.fn().mockReturnValue({ run: mockRun });

                (db.prepare as jest.Mock) = mockPrepare;

                expect(() => TaskService.deleteTask(5)).not.toThrow();
            });

            it('should handle deletion of multiple different tasks', () => {
                const mockRun = jest.fn().mockReturnValue({ changes: 1 });
                const mockPrepare = jest.fn().mockReturnValue({ run: mockRun });

                (db.prepare as jest.Mock) = mockPrepare;

                TaskService.deleteTask(10);
                TaskService.deleteTask(20);
                TaskService.deleteTask(30);

                expect(mockRun).toHaveBeenCalledTimes(3);
                expect(mockRun).toHaveBeenNthCalledWith(1, 10);
                expect(mockRun).toHaveBeenNthCalledWith(2, 20);
                expect(mockRun).toHaveBeenNthCalledWith(3, 30);
            });
        });

        describe('Deleting non-existent id (decision coverage)', () => {
            it('should throw error when task does not exist', () => {
                const mockRun = jest.fn().mockReturnValue({ changes: 0 });
                const mockPrepare = jest.fn().mockReturnValue({ run: mockRun });

                (db.prepare as jest.Mock) = mockPrepare;

                expect(() => TaskService.deleteTask(999)).toThrow('Tarefa não encontrada');
            });

            it('should check changes count after delete attempt', () => {
                const mockRun = jest.fn().mockReturnValue({ changes: 0 });
                const mockPrepare = jest.fn().mockReturnValue({ run: mockRun });

                (db.prepare as jest.Mock) = mockPrepare;

                expect(() => TaskService.deleteTask(777)).toThrow('Tarefa não encontrada');

                expect(mockRun).toHaveBeenCalledWith(777);
            });

            it('should throw error when changes count is 0 (branch: changes === 0)', () => {
                const mockRun = jest.fn().mockReturnValue({ changes: 0 });
                const mockPrepare = jest.fn().mockReturnValue({ run: mockRun });

                (db.prepare as jest.Mock) = mockPrepare;

                expect(() => TaskService.deleteTask(456)).toThrow('Tarefa não encontrada');
            });

            it('should not throw error when changes count is 1 (branch: changes !== 0)', () => {
                const mockRun = jest.fn().mockReturnValue({ changes: 1 });
                const mockPrepare = jest.fn().mockReturnValue({ run: mockRun });

                (db.prepare as jest.Mock) = mockPrepare;

                expect(() => TaskService.deleteTask(100)).not.toThrow();
            });

            it('should verify existence check happens during delete operation', () => {
                const mockRun = jest.fn().mockReturnValue({ changes: 0 });
                const mockPrepare = jest.fn().mockReturnValue({ run: mockRun });

                (db.prepare as jest.Mock) = mockPrepare;

                try {
                    TaskService.deleteTask(555);
                } catch (error: any) {
                    expect(error.message).toBe('Tarefa não encontrada');
                }

                expect(mockPrepare).toHaveBeenCalledWith('DELETE FROM tasks WHERE id = ?');
            });
        });
    });

    describe('validateTaskExists', () => {
        it('should return true when task exists', () => {
            const task = { id: 1, title: 'Task' };
            expect(TaskService.validateTaskExists(task)).toBe(true);
        });

        it('should throw error when task is null', () => {
            expect(() => TaskService.validateTaskExists(null)).toThrow('Tarefa não encontrada');
        });

        it('should throw error when task is undefined', () => {
            expect(() => TaskService.validateTaskExists(undefined)).toThrow('Tarefa não encontrada');
        });

        it('should throw error when task is false', () => {
            expect(() => TaskService.validateTaskExists(false)).toThrow('Tarefa não encontrada');
        });
    });

    describe('moveTask', () => {
        describe('Moving a task from todo to doing', () => {
            it('should move task from todo to doing successfully', () => {
                const existingTask = {
                    id: 1,
                    user_id: 1,
                    title: 'My Task',
                    description: 'Task description',
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const movedTask = {
                    ...existingTask,
                    status: 'doing',
                    updated_at: '2025-11-23T11:00:00.000Z',
                };

                const mockGet = jest.fn()
                    .mockReturnValueOnce(existingTask)
                    .mockReturnValueOnce(movedTask);
                const mockRun = jest.fn();
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ get: mockGet })
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const result = TaskService.moveTask(1, 'doing') as any;

                expect(result.status).toBe('doing');
                expect(mockRun).toHaveBeenCalledWith('doing', expect.any(String), 1);
            });

            it('should move task from todo to done', () => {
                const existingTask = {
                    id: 2,
                    user_id: 1,
                    title: 'Task',
                    description: null,
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const movedTask = {
                    ...existingTask,
                    status: 'done',
                    updated_at: '2025-11-23T11:00:00.000Z',
                };

                const mockGet = jest.fn()
                    .mockReturnValueOnce(existingTask)
                    .mockReturnValueOnce(movedTask);
                const mockRun = jest.fn();
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ get: mockGet })
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const result = TaskService.moveTask(2, 'done') as any;

                expect(result.status).toBe('done');
            });

            it('should move task from doing to done', () => {
                const existingTask = {
                    id: 3,
                    user_id: 1,
                    title: 'Task',
                    description: 'Description',
                    status: 'doing',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const movedTask = {
                    ...existingTask,
                    status: 'done',
                    updated_at: '2025-11-23T11:00:00.000Z',
                };

                const mockGet = jest.fn()
                    .mockReturnValueOnce(existingTask)
                    .mockReturnValueOnce(movedTask);
                const mockRun = jest.fn();
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ get: mockGet })
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                const result = TaskService.moveTask(3, 'done') as any;

                expect(result.status).toBe('done');
            });

            it('should update the updated_at timestamp when moving', () => {
                const existingTask = {
                    id: 4,
                    user_id: 1,
                    title: 'Task',
                    description: null,
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const movedTask = {
                    ...existingTask,
                    status: 'doing',
                    updated_at: '2025-11-23T12:00:00.000Z',
                };

                const mockGet = jest.fn()
                    .mockReturnValueOnce(existingTask)
                    .mockReturnValueOnce(movedTask);
                const mockRun = jest.fn();
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ get: mockGet })
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                TaskService.moveTask(4, 'doing');

                expect(mockRun).toHaveBeenCalledWith('doing', expect.any(String), 4);
            });

            it('should verify task exists before moving', () => {
                const existingTask = {
                    id: 5,
                    user_id: 1,
                    title: 'Task',
                    description: null,
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const movedTask = {
                    ...existingTask,
                    status: 'doing',
                    updated_at: '2025-11-23T11:00:00.000Z',
                };

                const mockGet = jest.fn()
                    .mockReturnValueOnce(existingTask)
                    .mockReturnValueOnce(movedTask);
                const mockRun = jest.fn();
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ get: mockGet })
                    .mockReturnValueOnce({ run: mockRun })
                    .mockReturnValueOnce({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                TaskService.moveTask(5, 'doing');

                expect(mockPrepare).toHaveBeenCalledWith('SELECT * FROM tasks WHERE id = ?');
                expect(mockGet).toHaveBeenCalledWith(5);
            });
        });

        describe('Moving to non-existent status', () => {
            it('should throw error when status is invalid', () => {
                const existingTask = {
                    id: 10,
                    user_id: 1,
                    title: 'Task',
                    description: null,
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockGet = jest.fn().mockReturnValue(existingTask);
                const mockPrepare = jest.fn().mockReturnValue({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                expect(() => TaskService.moveTask(10, 'invalid' as any)).toThrow('Status inválido');
            });

            it('should throw error for empty string status', () => {
                const existingTask = {
                    id: 11,
                    user_id: 1,
                    title: 'Task',
                    description: null,
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockGet = jest.fn().mockReturnValue(existingTask);
                const mockPrepare = jest.fn().mockReturnValue({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                expect(() => TaskService.moveTask(11, '' as any)).toThrow('Status inválido');
            });

            it('should throw error for status "completed"', () => {
                const existingTask = {
                    id: 12,
                    user_id: 1,
                    title: 'Task',
                    description: null,
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockGet = jest.fn().mockReturnValue(existingTask);
                const mockPrepare = jest.fn().mockReturnValue({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                expect(() => TaskService.moveTask(12, 'completed' as any)).toThrow('Status inválido');
            });

            it('should throw error for status "pending"', () => {
                const existingTask = {
                    id: 13,
                    user_id: 1,
                    title: 'Task',
                    description: null,
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockGet = jest.fn().mockReturnValue(existingTask);
                const mockPrepare = jest.fn().mockReturnValue({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                expect(() => TaskService.moveTask(13, 'pending' as any)).toThrow('Status inválido');
            });

            it('should validate status before attempting database update', () => {
                const existingTask = {
                    id: 14,
                    user_id: 1,
                    title: 'Task',
                    description: null,
                    status: 'todo',
                    created_at: '2025-11-23T10:00:00.000Z',
                    updated_at: '2025-11-23T10:00:00.000Z',
                };

                const mockGet = jest.fn().mockReturnValue(existingTask);
                const mockRun = jest.fn();
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ get: mockGet })
                    .mockReturnValueOnce({ run: mockRun });

                (db.prepare as jest.Mock) = mockPrepare;

                expect(() => TaskService.moveTask(14, 'wrong-status' as any)).toThrow('Status inválido');

                // Should not reach the UPDATE statement
                expect(mockRun).not.toHaveBeenCalled();
            });

            it('should throw error when moving non-existent task', () => {
                const mockGet = jest.fn().mockReturnValue(null);
                const mockPrepare = jest.fn().mockReturnValue({ get: mockGet });

                (db.prepare as jest.Mock) = mockPrepare;

                expect(() => TaskService.moveTask(999, 'doing')).toThrow('Tarefa não encontrada');
            });
        });
    });

    describe('validateStatus', () => {
        it('should return true for status "todo"', () => {
            expect(TaskService.validateStatus('todo')).toBe(true);
        });

        it('should return true for status "doing"', () => {
            expect(TaskService.validateStatus('doing')).toBe(true);
        });

        it('should return true for status "done"', () => {
            expect(TaskService.validateStatus('done')).toBe(true);
        });

        it('should throw error for invalid status', () => {
            expect(() => TaskService.validateStatus('invalid' as any)).toThrow('Status inválido');
        });

        it('should throw error for null status', () => {
            expect(() => TaskService.validateStatus(null as any)).toThrow('Status inválido');
        });

        it('should throw error for undefined status', () => {
            expect(() => TaskService.validateStatus(undefined as any)).toThrow('Status inválido');
        });
    });
});