import { db } from '../db';

export class AuthService {
    static login(email: string, password: string) {
        AuthService.validateCredentials(email, password);

        const user = AuthService.getUserByEmail(email);

        AuthService.validateUserExists(user);
        AuthService.validatePassword(user, password);

        return AuthService.generateAuthResponse(user);
    }

    static validateCredentials(email: string, password: string) {
        if (!email.trim() || !password.trim()) {
            throw new Error('Usuário ou senha inválidos');
        }
        return true;
    }

    static getUserByEmail(email: string) {
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        return user;
    }

    static validateUserExists(user: any) {
        if (!user) {
            throw new Error('Usuário ou senha inválidos');
        }
        return true;
    }

    static validatePassword(user: any, password: string) {
        if (user.password !== password) {
            throw new Error('Senha incorreta');
        }
        return true;
    }

    static generateAuthResponse(user: any) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            token: `fake-token-${user.id}`
        };
    }
}
