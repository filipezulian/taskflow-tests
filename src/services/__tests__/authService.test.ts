import { AuthService } from '../authService';
import { db } from '../../db';

jest.mock('../../db', () => ({
    db: {
        prepare: jest.fn(),
    },
}));

describe('AuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('login', () => {
        describe('Auth with correct information', () => {
            it('should return user data with token when credentials are correct', () => {
                const mockUser = {
                    id: 1,
                    name: 'John Doe',
                    email: 'john@example.com',
                    password: 'password123',
                };

                const mockGet = jest.fn().mockReturnValue(mockUser);
                (db.prepare as jest.Mock).mockReturnValue({ get: mockGet });

                const result = AuthService.login('john@example.com', 'password123');

                expect(result).toEqual({
                    id: 1,
                    name: 'John Doe',
                    email: 'john@example.com',
                    token: 'fake-token-1',
                });
                expect(mockGet).toHaveBeenCalledWith('john@example.com');
            });

            it('should generate token with correct user id', () => {
                const mockUser = {
                    id: 42,
                    name: 'Jane Smith',
                    email: 'jane@example.com',
                    password: 'securepass',
                };

                const mockGet = jest.fn().mockReturnValue(mockUser);
                (db.prepare as jest.Mock).mockReturnValue({ get: mockGet });

                const result = AuthService.login('jane@example.com', 'securepass');

                expect(result.token).toBe('fake-token-42');
            });

            it('should not return password in response', () => {
                const mockUser = {
                    id: 1,
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                };

                const mockGet = jest.fn().mockReturnValue(mockUser);
                (db.prepare as jest.Mock).mockReturnValue({ get: mockGet });

                const result = AuthService.login('test@example.com', 'password123');

                expect(result).not.toHaveProperty('password');
                expect(Object.keys(result)).toEqual(['id', 'name', 'email', 'token']);
            });
        });

        describe('Auth with incorrect password', () => {
            it('should throw error when password does not match', () => {
                const mockUser = {
                    id: 1,
                    name: 'John Doe',
                    email: 'john@example.com',
                    password: 'correctpassword',
                };

                const mockGet = jest.fn().mockReturnValue(mockUser);
                (db.prepare as jest.Mock).mockReturnValue({ get: mockGet });

                expect(() => AuthService.login('john@example.com', 'wrongpassword')).toThrow('Senha incorreta');
            });

            it('should throw error when password is completely different', () => {
                const mockUser = {
                    id: 2,
                    name: 'Jane Doe',
                    email: 'jane@example.com',
                    password: 'mypassword123',
                };

                const mockGet = jest.fn().mockReturnValue(mockUser);
                (db.prepare as jest.Mock).mockReturnValue({ get: mockGet });

                expect(() => AuthService.login('jane@example.com', 'differentpass')).toThrow('Senha incorreta');
            });

            it('should throw error when password case does not match', () => {
                const mockUser = {
                    id: 3,
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'Password123',
                };

                const mockGet = jest.fn().mockReturnValue(mockUser);
                (db.prepare as jest.Mock).mockReturnValue({ get: mockGet });

                expect(() => AuthService.login('test@example.com', 'password123')).toThrow('Senha incorreta');
            });
        });

        describe('Auth with non-existing email', () => {
            it('should throw error when user does not exist', () => {
                const mockGet = jest.fn().mockReturnValue(null);
                (db.prepare as jest.Mock).mockReturnValue({ get: mockGet });

                expect(() => AuthService.login('notfound@example.com', 'password123')).toThrow('Usuário ou senha inválidos');
            });

            it('should throw error when email is not in database', () => {
                const mockGet = jest.fn().mockReturnValue(undefined);
                (db.prepare as jest.Mock).mockReturnValue({ get: mockGet });

                expect(() => AuthService.login('nonexistent@example.com', 'anypassword')).toThrow('Usuário ou senha inválidos');
            });

            it('should query database with correct email', () => {
                const mockGet = jest.fn().mockReturnValue(null);
                const mockPrepare = jest.fn().mockReturnValue({ get: mockGet });
                (db.prepare as jest.Mock) = mockPrepare;

                expect(() => AuthService.login('test@example.com', 'password')).toThrow();

                expect(mockPrepare).toHaveBeenCalledWith('SELECT * FROM users WHERE email = ?');
                expect(mockGet).toHaveBeenCalledWith('test@example.com');
            });
        });

        describe('Invalid credentials - empty or whitespace', () => {
            it('should throw error when email is empty', () => {
                expect(() => AuthService.login('', 'password123')).toThrow('Usuário ou senha inválidos');
            });

            it('should throw error when password is empty', () => {
                expect(() => AuthService.login('test@example.com', '')).toThrow('Usuário ou senha inválidos');
            });

            it('should throw error when both email and password are empty', () => {
                expect(() => AuthService.login('', '')).toThrow('Usuário ou senha inválidos');
            });

            it('should throw error when email is only whitespace', () => {
                expect(() => AuthService.login('   ', 'password123')).toThrow('Usuário ou senha inválidos');
            });

            it('should throw error when password is only whitespace', () => {
                expect(() => AuthService.login('test@example.com', '   ')).toThrow('Usuário ou senha inválidos');
            });

            it('should throw error when both are only whitespace', () => {
                expect(() => AuthService.login('   ', '   ')).toThrow('Usuário ou senha inválidos');
            });
        });
    });

    describe('validateCredentials', () => {
        it('should return true when both email and password are valid', () => {
            expect(AuthService.validateCredentials('test@example.com', 'password123')).toBe(true);
        });

        it('should throw error when email is empty', () => {
            expect(() => AuthService.validateCredentials('', 'password123')).toThrow('Usuário ou senha inválidos');
        });

        it('should throw error when password is empty', () => {
            expect(() => AuthService.validateCredentials('test@example.com', '')).toThrow('Usuário ou senha inválidos');
        });

        it('should throw error when email is whitespace', () => {
            expect(() => AuthService.validateCredentials('   ', 'password123')).toThrow('Usuário ou senha inválidos');
        });

        it('should throw error when password is whitespace', () => {
            expect(() => AuthService.validateCredentials('test@example.com', '   ')).toThrow('Usuário ou senha inválidos');
        });
    });

    describe('getUserByEmail', () => {
        it('should return user when email exists', () => {
            const mockUser = {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
            };

            const mockGet = jest.fn().mockReturnValue(mockUser);
            (db.prepare as jest.Mock).mockReturnValue({ get: mockGet });

            const result = AuthService.getUserByEmail('john@example.com');

            expect(result).toEqual(mockUser);
        });

        it('should return null when email does not exist', () => {
            const mockGet = jest.fn().mockReturnValue(null);
            (db.prepare as jest.Mock).mockReturnValue({ get: mockGet });

            const result = AuthService.getUserByEmail('notfound@example.com');

            expect(result).toBeNull();
        });

        it('should query database with correct SQL', () => {
            const mockGet = jest.fn().mockReturnValue(null);
            const mockPrepare = jest.fn().mockReturnValue({ get: mockGet });
            (db.prepare as jest.Mock) = mockPrepare;

            AuthService.getUserByEmail('test@example.com');

            expect(mockPrepare).toHaveBeenCalledWith('SELECT * FROM users WHERE email = ?');
        });
    });

    describe('validateUserExists', () => {
        it('should return true when user exists', () => {
            const user = { id: 1, name: 'John', email: 'john@example.com' };
            expect(AuthService.validateUserExists(user)).toBe(true);
        });

        it('should throw error when user is null', () => {
            expect(() => AuthService.validateUserExists(null)).toThrow('Usuário ou senha inválidos');
        });

        it('should throw error when user is undefined', () => {
            expect(() => AuthService.validateUserExists(undefined)).toThrow('Usuário ou senha inválidos');
        });

        it('should throw error when user is false', () => {
            expect(() => AuthService.validateUserExists(false)).toThrow('Usuário ou senha inválidos');
        });
    });

    describe('validatePassword', () => {
        it('should return true when passwords match', () => {
            const user = { id: 1, password: 'password123' };
            expect(AuthService.validatePassword(user, 'password123')).toBe(true);
        });

        it('should throw error when passwords do not match', () => {
            const user = { id: 1, password: 'password123' };
            expect(() => AuthService.validatePassword(user, 'wrongpassword')).toThrow('Senha incorreta');
        });

        it('should throw error when password case does not match', () => {
            const user = { id: 1, password: 'Password123' };
            expect(() => AuthService.validatePassword(user, 'password123')).toThrow('Senha incorreta');
        });

        it('should be case sensitive', () => {
            const user = { id: 1, password: 'SecurePass' };
            expect(() => AuthService.validatePassword(user, 'securepass')).toThrow('Senha incorreta');
        });
    });

    describe('generateAuthResponse', () => {
        it('should generate correct response with all fields', () => {
            const user = {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
            };

            const result = AuthService.generateAuthResponse(user);

            expect(result).toEqual({
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                token: 'fake-token-1',
            });
        });

        it('should not include password in response', () => {
            const user = {
                id: 2,
                name: 'Jane Doe',
                email: 'jane@example.com',
                password: 'secretpassword',
            };

            const result = AuthService.generateAuthResponse(user);

            expect(result).not.toHaveProperty('password');
        });

        it('should generate token with correct format', () => {
            const user = { id: 99, name: 'Test', email: 'test@example.com' };
            const result = AuthService.generateAuthResponse(user);

            expect(result.token).toMatch(/^fake-token-\d+$/);
            expect(result.token).toBe('fake-token-99');
        });
    });
});
