import { UserService } from '../userService';
import { db } from '../../db';

jest.mock('../../db', () => ({
    db: {
        prepare: jest.fn(),
    },
}));

describe('UserService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        describe('Invalid inputs - all fields empty', () => {
            it('should throw error when all fields are empty', () => {
                const input = {
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                };

                expect(() => UserService.create(input)).toThrow('Todos os campos são obrigatórios');
            });
        });

        describe('Invalid inputs - one field invalid at a time', () => {
            it('should throw error when name is empty', () => {
                const input = {
                    name: '',
                    email: 'test@example.com',
                    password: 'password123',
                    confirmPassword: 'password123',
                };

                expect(() => UserService.create(input)).toThrow('Todos os campos são obrigatórios');
            });

            it('should throw error when email is empty', () => {
                const input = {
                    name: 'John Doe',
                    email: '',
                    password: 'password123',
                    confirmPassword: 'password123',
                };

                expect(() => UserService.create(input)).toThrow('Todos os campos são obrigatórios');
            });

            it('should throw error when password is empty', () => {
                const input = {
                    name: 'John Doe',
                    email: 'test@example.com',
                    password: '',
                    confirmPassword: 'password123',
                };

                expect(() => UserService.create(input)).toThrow('Todos os campos são obrigatórios');
            });

            it('should throw error when confirmPassword is empty', () => {
                const input = {
                    name: 'John Doe',
                    email: 'test@example.com',
                    password: 'password123',
                    confirmPassword: '',
                };

                expect(() => UserService.create(input)).toThrow('Todos os campos são obrigatórios');
            });
        });

        describe('Invalid inputs - invalid email format', () => {
            it('should throw error when email does not contain @', () => {
                const input = {
                    name: 'John Doe',
                    email: 'testexample.com',
                    password: 'password123',
                    confirmPassword: 'password123',
                };

                expect(() => UserService.create(input)).toThrow('E-mail inválido');
            });

            it('should throw error when email does not contain .', () => {
                const input = {
                    name: 'John Doe',
                    email: 'test@examplecom',
                    password: 'password123',
                    confirmPassword: 'password123',
                };

                expect(() => UserService.create(input)).toThrow('E-mail inválido');
            });

            it('should throw error when email does not contain @ and .', () => {
                const input = {
                    name: 'John Doe',
                    email: 'testexamplecom',
                    password: 'password123',
                    confirmPassword: 'password123',
                };

                expect(() => UserService.create(input)).toThrow('E-mail inválido');
            });
        });

        describe('Invalid inputs - password mismatch', () => {
            it('should throw error when passwords do not match', () => {
                const mockGet = jest.fn().mockReturnValue(null);
                (db.prepare as jest.Mock).mockReturnValue({ get: mockGet });

                const input = {
                    name: 'John Doe',
                    email: 'test@example.com',
                    password: 'password123',
                    confirmPassword: 'differentpassword',
                };

                expect(() => UserService.create(input)).toThrow('As senhas não conferem');
            });
        });

        describe('Invalid inputs - password too short', () => {
            it('should throw error when password is less than 6 characters', () => {
                const mockGet = jest.fn().mockReturnValue(null);
                (db.prepare as jest.Mock).mockReturnValue({ get: mockGet });

                const input = {
                    name: 'John Doe',
                    email: 'test@example.com',
                    password: '12345',
                    confirmPassword: '12345',
                };

                expect(() => UserService.create(input)).toThrow('Senha inválida');
            });

            it('should throw error when password is exactly 5 characters', () => {
                const mockGet = jest.fn().mockReturnValue(null);
                (db.prepare as jest.Mock).mockReturnValue({ get: mockGet });

                const input = {
                    name: 'John Doe',
                    email: 'test@example.com',
                    password: 'pass5',
                    confirmPassword: 'pass5',
                };

                expect(() => UserService.create(input)).toThrow('Senha inválida');
            });
        });

        describe('Invalid inputs - email already exists', () => {
            it('should throw error when email is already registered', () => {
                const mockGet = jest.fn().mockReturnValue({ id: 1 });
                (db.prepare as jest.Mock).mockReturnValue({ get: mockGet });

                const input = {
                    name: 'John Doe',
                    email: 'existing@example.com',
                    password: 'password123',
                    confirmPassword: 'password123',
                };

                expect(() => UserService.create(input)).toThrow('E-mail já cadastrado');
            });
        });

        describe('Valid inputs - successful user creation', () => {
            it('should create user successfully with valid inputs', () => {
                const mockGet = jest.fn().mockReturnValue(null);
                const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 1 });
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ get: mockGet })
                    .mockReturnValueOnce({ run: mockRun });

                (db.prepare as jest.Mock) = mockPrepare;

                const input = {
                    name: 'John Doe',
                    email: 'john@example.com',
                    password: 'password123',
                    confirmPassword: 'password123',
                };

                const result = UserService.create(input);

                expect(result).toEqual({
                    id: 1,
                    name: 'John Doe',
                    email: 'john@example.com',
                });
                expect(mockRun).toHaveBeenCalledWith('John Doe', 'john@example.com', 'password123');
            });

            it('should trim whitespace from name and email', () => {
                const mockGet = jest.fn().mockReturnValue(null);
                const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 2 });
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ get: mockGet })
                    .mockReturnValueOnce({ run: mockRun });

                (db.prepare as jest.Mock) = mockPrepare;

                const input = {
                    name: '  Jane Doe  ',
                    email: '  jane@example.com  ',
                    password: 'password123',
                    confirmPassword: 'password123',
                };

                const result = UserService.create(input);

                expect(result).toEqual({
                    id: 2,
                    name: '  Jane Doe  ',
                    email: '  jane@example.com  ',
                });
                expect(mockRun).toHaveBeenCalledWith('Jane Doe', 'jane@example.com', 'password123');
            });

            it('should create user with minimum valid password (6 characters)', () => {
                const mockGet = jest.fn().mockReturnValue(null);
                const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 3 });
                const mockPrepare = jest.fn()
                    .mockReturnValueOnce({ get: mockGet })
                    .mockReturnValueOnce({ run: mockRun });

                (db.prepare as jest.Mock) = mockPrepare;

                const input = {
                    name: 'Test User',
                    email: 'test@example.com',
                    password: '123456',
                    confirmPassword: '123456',
                };

                const result = UserService.create(input);

                expect(result).toEqual({
                    id: 3,
                    name: 'Test User',
                    email: 'test@example.com',
                });
            });
        });
    });

    describe('validateEmail', () => {
        it('should return true for valid email with @ and .', () => {
            expect(UserService.validateEmail('test@example.com')).toBe(true);
        });

        it('should throw error when email missing @', () => {
            expect(() => UserService.validateEmail('testexample.com')).toThrow('E-mail inválido');
        });

        it('should throw error when email missing .', () => {
            expect(() => UserService.validateEmail('test@examplecom')).toThrow('E-mail inválido');
        });

        it('should throw error when email missing both @ and .', () => {
            expect(() => UserService.validateEmail('testexamplecom')).toThrow('E-mail inválido');
        });

        it('should return true for email with multiple dots', () => {
            expect(UserService.validateEmail('test@example.co.uk')).toBe(true);
        });

        it('should return true for email with subdomain', () => {
            expect(UserService.validateEmail('test@mail.example.com')).toBe(true);
        });
    });

    describe('getEmail', () => {
        it('should return true when email does not exist', () => {
            const mockGet = jest.fn().mockReturnValue(null);
            (db.prepare as jest.Mock).mockReturnValue({ get: mockGet });

            expect(UserService.getEmail('new@example.com')).toBe(true);
        });

        it('should throw error when email already exists', () => {
            const mockGet = jest.fn().mockReturnValue({ id: 1 });
            (db.prepare as jest.Mock).mockReturnValue({ get: mockGet });

            expect(() => UserService.getEmail('existing@example.com')).toThrow('E-mail já cadastrado');
        });

        it('should query database with correct email', () => {
            const mockGet = jest.fn().mockReturnValue(null);
            const mockPrepare = jest.fn().mockReturnValue({ get: mockGet });
            (db.prepare as jest.Mock) = mockPrepare;

            UserService.getEmail('test@example.com');

            expect(mockPrepare).toHaveBeenCalledWith('SELECT id FROM users WHERE email = ?');
            expect(mockGet).toHaveBeenCalledWith('test@example.com');
        });
    });

    describe('validatePassword', () => {
        it('should return true for matching passwords with length >= 6', () => {
            expect(UserService.validatePassword('password123', 'password123')).toBe(true);
        });

        it('should throw error when passwords do not match', () => {
            expect(() => UserService.validatePassword('password123', 'different123')).toThrow('As senhas não conferem');
        });

        it('should throw error when password is less than 6 characters', () => {
            expect(() => UserService.validatePassword('12345', '12345')).toThrow('Senha inválida');
        });

        it('should return true when password is exactly 6 characters', () => {
            expect(UserService.validatePassword('123456', '123456')).toBe(true);
        });

        it('should throw error when password is 5 characters even if they match', () => {
            expect(() => UserService.validatePassword('12345', '12345')).toThrow('Senha inválida');
        });

        it('should return true for long passwords that match', () => {
            const longPassword = 'a'.repeat(100);
            expect(UserService.validatePassword(longPassword, longPassword)).toBe(true);
        });

        it('should throw error when passwords mismatch before checking length', () => {
            expect(() => UserService.validatePassword('password', 'different')).toThrow('As senhas não conferem');
        });
    });
});
