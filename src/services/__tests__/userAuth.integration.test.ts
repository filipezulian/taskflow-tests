import { UserService } from '../userService';
import { AuthService } from '../authService';
import { db } from '../../db';

describe('User and Login Integration Tests', () => {
    beforeEach(() => {
        db.prepare('DELETE FROM tasks').run();
        db.prepare('DELETE FROM users').run();
    });

    afterAll(() => {
        db.prepare('DELETE FROM tasks').run();
        db.prepare('DELETE FROM users').run();
    });

    describe('Creating user and logging in', () => {
        it('should create a user and login successfully', () => {
            const user = UserService.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'SecurePass123',
                confirmPassword: 'SecurePass123',
            });

            expect(user).toBeDefined();
            expect(user.id).toBeDefined();
            expect(user.email).toBe('john@example.com');
            expect(user.name).toBe('John Doe');

            const loginResult = AuthService.login('john@example.com', 'SecurePass123');

            expect(loginResult).toBeDefined();
            expect(loginResult.token).toBeDefined();
            expect(loginResult.email).toBe('john@example.com');
            expect(loginResult.id).toBe(user.id);
        });

        it('should create multiple users and login with each one', () => {
            const user1 = UserService.create({
                name: 'User One',
                email: 'user1@example.com',
                password: 'Password123',
                confirmPassword: 'Password123',
            });

            const user2 = UserService.create({
                name: 'User Two',
                email: 'user2@example.com',
                password: 'AnotherPass456',
                confirmPassword: 'AnotherPass456',
            });

            expect(user1.id).toBeDefined();
            expect(user2.id).toBeDefined();
            expect(user1.id).not.toBe(user2.id);

            const login1 = AuthService.login('user1@example.com', 'Password123');

            expect(login1.email).toBe('user1@example.com');
            expect(login1.id).toBe(user1.id);

            const login2 = AuthService.login('user2@example.com', 'AnotherPass456');

            expect(login2.email).toBe('user2@example.com');
            expect(login2.id).toBe(user2.id);

            expect(login1.token).not.toBe(login2.token);
        });

        it('should persist user data across operations', () => {
            UserService.create({
                name: 'Persist User',
                email: 'persist@example.com',
                password: 'MyPassword789',
                confirmPassword: 'MyPassword789',
            });

            const login1 = AuthService.login('persist@example.com', 'MyPassword789');
            const login2 = AuthService.login('persist@example.com', 'MyPassword789');

            expect(login1.email).toBe('persist@example.com');
            expect(login2.email).toBe('persist@example.com');
            expect(login1.id).toBe(login2.id);
        });

        it('should require exact email match during login', () => {
            const user = UserService.create({
                name: 'Case Test',
                email: 'casetest@example.com',
                password: 'TestPass123',
                confirmPassword: 'TestPass123',
            });

            const loginResult = AuthService.login('casetest@example.com', 'TestPass123');

            expect(loginResult.id).toBe(user.id);
            expect(loginResult.email).toBe('casetest@example.com');

            expect(() => {
                AuthService.login('CASETEST@EXAMPLE.COM', 'TestPass123');
            }).toThrow('Usuário ou senha inválidos');
        });
    });

    describe('Logging in with incorrect password', () => {
        beforeEach(() => {
            UserService.create({
                name: 'Test User',
                email: 'testuser@example.com',
                password: 'CorrectPassword123',
                confirmPassword: 'CorrectPassword123',
            });
        });

        it('should throw error when logging in with wrong password', () => {
            expect(() => {
                AuthService.login('testuser@example.com', 'WrongPassword123');
            }).toThrow('Senha incorreta');
        });

        it('should throw error with completely different password', () => {
            expect(() => {
                AuthService.login('testuser@example.com', 'TotallyDifferent');
            }).toThrow('Senha incorreta');
        });

        it('should throw error with empty password', () => {
            expect(() => {
                AuthService.login('testuser@example.com', '');
            }).toThrow('Usuário ou senha inválidos');
        });

        it('should throw error with password containing only whitespace', () => {
            expect(() => {
                AuthService.login('testuser@example.com', '     ');
            }).toThrow('Usuário ou senha inválidos');
        });

        it('should throw error when password is almost correct', () => {
            expect(() => {
                AuthService.login('testuser@example.com', 'CorrectPassword12');
            }).toThrow('Senha incorreta');
        });

        it('should throw error with correct password but wrong case', () => {
            expect(() => {
                AuthService.login('testuser@example.com', 'correctpassword123');
            }).toThrow('Senha incorreta');
        });

        it('should not allow login attempts for non-existent users', () => {
            expect(() => {
                AuthService.login('nonexistent@example.com', 'SomePassword123');
            }).toThrow('Usuário ou senha inválidos');
        });

        it('should maintain correct user data after failed login attempt', () => {
            try {
                AuthService.login('testuser@example.com', 'WrongPassword');
            } catch (error) {
            }

            const loginResult = AuthService.login('testuser@example.com', 'CorrectPassword123');

            expect(loginResult.email).toBe('testuser@example.com');
            expect(loginResult.token).toBeDefined();
        });
    });

    describe('Edge cases and error scenarios', () => {
        it('should not allow creating duplicate users', () => {
            UserService.create({
                name: 'Duplicate User',
                email: 'duplicate@example.com',
                password: 'Password123',
                confirmPassword: 'Password123',
            });

            expect(() => {
                UserService.create({
                    name: 'Another User',
                    email: 'duplicate@example.com',
                    password: 'DifferentPassword456',
                    confirmPassword: 'DifferentPassword456',
                });
            }).toThrow('E-mail já cadastrado');
        });

        it('should not allow login with invalid email format', () => {
            expect(() => {
                AuthService.login('invalid-email', 'Password123');
            }).toThrow('Usuário ou senha inválidos');
        });

        it('should handle special characters in password correctly', () => {
            const user = UserService.create({
                name: 'Special User',
                email: 'special@example.com',
                password: 'P@ssw0rd!#$%',
                confirmPassword: 'P@ssw0rd!#$%',
            });

            const loginResult = AuthService.login('special@example.com', 'P@ssw0rd!#$%');

            expect(loginResult.id).toBe(user.id);
        });

        it('should handle very long passwords', () => {
            const longPassword = 'A'.repeat(500);
            const user = UserService.create({
                name: 'Long Pass User',
                email: 'longpass@example.com',
                password: longPassword,
                confirmPassword: longPassword,
            });

            const loginResult = AuthService.login('longpass@example.com', longPassword);

            expect(loginResult.id).toBe(user.id);
        });
    });

    describe('System validation - Empty characters while creating user', () => {
        it('should not allow creating user with empty name', () => {
            expect(() => {
                UserService.create({
                    name: '',
                    email: 'test@example.com',
                    password: 'Password123',
                    confirmPassword: 'Password123',
                });
            }).toThrow('Todos os campos são obrigatórios');
        });

        it('should not allow creating user with whitespace-only name', () => {
            expect(() => {
                UserService.create({
                    name: '     ',
                    email: 'test@example.com',
                    password: 'Password123',
                    confirmPassword: 'Password123',
                });
            }).toThrow('Todos os campos são obrigatórios');
        });

        it('should not allow creating user with empty email', () => {
            expect(() => {
                UserService.create({
                    name: 'Test User',
                    email: '',
                    password: 'Password123',
                    confirmPassword: 'Password123',
                });
            }).toThrow('Todos os campos são obrigatórios');
        });

        it('should not allow creating user with whitespace-only email', () => {
            expect(() => {
                UserService.create({
                    name: 'Test User',
                    email: '   ',
                    password: 'Password123',
                    confirmPassword: 'Password123',
                });
            }).toThrow('Todos os campos são obrigatórios');
        });

        it('should not allow creating user with empty password', () => {
            expect(() => {
                UserService.create({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: '',
                    confirmPassword: '',
                });
            }).toThrow('Todos os campos são obrigatórios');
        });

        it('should not allow creating user with whitespace-only password', () => {
            expect(() => {
                UserService.create({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: '    ',
                    confirmPassword: '    ',
                });
            }).toThrow('Todos os campos são obrigatórios');
        });

        it('should not allow creating user with empty confirmPassword', () => {
            expect(() => {
                UserService.create({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'Password123',
                    confirmPassword: '',
                });
            }).toThrow('Todos os campos são obrigatórios');
        });

        it('should not allow creating user with whitespace-only confirmPassword', () => {
            expect(() => {
                UserService.create({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'Password123',
                    confirmPassword: '     ',
                });
            }).toThrow('Todos os campos são obrigatórios');
        });

        it('should not allow creating user with all empty fields', () => {
            expect(() => {
                UserService.create({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                });
            }).toThrow('Todos os campos são obrigatórios');
        });

        it('should not allow creating user with all whitespace-only fields', () => {
            expect(() => {
                UserService.create({
                    name: '   ',
                    email: '  ',
                    password: '    ',
                    confirmPassword: '     ',
                });
            }).toThrow('Todos os campos são obrigatórios');
        });
    });
});