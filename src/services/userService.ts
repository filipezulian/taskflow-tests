import { db } from '../db';
import { CreateUserInput } from './dtos/CreateUserInput';

export class UserService {
    static create(input: CreateUserInput) {
        const { name, email, password, confirmPassword } = input;

        if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            throw new Error('Todos os campos são obrigatórios');
        }

        const valid = UserService.validateEmail(email);
        if (valid) {
            UserService.getEmail(email);
        }

        UserService.validatePassword(password, confirmPassword);

        const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
        const info = stmt.run(name.trim(), email.trim(), password);

        return { id: Number(info.lastInsertRowid), name, email };
    }

    static validateEmail(email: string) {
        if (!email.includes('@') || !email.includes('.')) {
            throw new Error('E-mail inválido');
        } else {
            return true;
        }
    }

    static getEmail(email: string) {
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            throw new Error('E-mail já cadastrado');
        }
        return true;
    }
    
    static validatePassword(password: string, confirmPassword: string) {
         if (password !== confirmPassword) {
            throw new Error('As senhas não conferem');
        }

        if (password.length < 6) {
            throw new Error('Senha inválida');
        }

        return true;
    }

}
