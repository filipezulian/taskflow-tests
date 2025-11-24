const API_URL = 'http://localhost:3000';
let currentUser = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showApp();
        loadTasks();
    }

    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('create-task-form').addEventListener('submit', handleCreateTask);
    document.getElementById('edit-task-form').addEventListener('submit', handleEditTask);
});

function showTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabs = document.querySelectorAll('.tab-btn');

    tabs.forEach(t => t.classList.remove('active'));

    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        tabs[0].classList.add('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        tabs[1].classList.add('active');
    }

    clearErrors();
}

async function handleLogin(e) {
    e.preventDefault();
    clearErrors();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showError('login-error', data.error);
            return;
        }

        currentUser = data;
        localStorage.setItem('user', JSON.stringify(data));
        showApp();
        loadTasks();
    } catch (error) {
        showError('login-error', 'Erro ao fazer login. Tente novamente.');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    clearErrors();

    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, confirmPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            showError('register-error', data.error);
            return;
        }

        document.getElementById('login-email').value = email;
        document.getElementById('login-password').value = password;
        showTab('login');
        handleLogin(new Event('submit'));
    } catch (error) {
        showError('register-error', 'Erro ao criar conta. Tente novamente.');
    }
}

async function handleCreateTask(e) {
    e.preventDefault();
    clearErrors();

    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;

    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': currentUser.id
            },
            body: JSON.stringify({ title, description })
        });

        const data = await response.json();

        if (!response.ok) {
            showError('create-task-error', data.error);
            return;
        }

        document.getElementById('task-title').value = '';
        document.getElementById('task-description').value = '';
        loadTasks();
    } catch (error) {
        showError('create-task-error', 'Erro ao criar tarefa. Tente novamente.');
    }
}

async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            headers: { 'x-user-id': currentUser.id }
        });

        const tasks = await response.json();
        renderTasks(tasks);
    } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
    }
}

function renderTasks(tasks) {
    const todoList = document.getElementById('todo-tasks');
    const doingList = document.getElementById('doing-tasks');
    const doneList = document.getElementById('done-tasks');

    todoList.innerHTML = '';
    doingList.innerHTML = '';
    doneList.innerHTML = '';

    const todoTasks = tasks.filter(t => t.status === 'todo');
    const doingTasks = tasks.filter(t => t.status === 'doing');
    const doneTasks = tasks.filter(t => t.status === 'done');

    document.getElementById('todo-count').textContent = todoTasks.length;
    document.getElementById('doing-count').textContent = doingTasks.length;
    document.getElementById('done-count').textContent = doneTasks.length;

    todoTasks.forEach(task => todoList.appendChild(createTaskCard(task)));
    doingTasks.forEach(task => doingList.appendChild(createTaskCard(task)));
    doneTasks.forEach(task => doneList.appendChild(createTaskCard(task)));

    if (todoTasks.length === 0) todoList.innerHTML = '<div class="empty-state"><p>Nenhuma tarefa</p></div>';
    if (doingTasks.length === 0) doingList.innerHTML = '<div class="empty-state"><p>Nenhuma tarefa</p></div>';
    if (doneTasks.length === 0) doneList.innerHTML = '<div class="empty-state"><p>Nenhuma tarefa</p></div>';
}

function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';

    const date = new Date(task.created_at).toLocaleDateString('pt-BR');

    card.innerHTML = `
        <div class="task-card-header">
            <div class="task-title">${escapeHtml(task.title)}</div>
            <div class="task-actions">
                <button class="task-btn" onclick="openEditModal(${task.id})" title="Editar">✏️</button>
                <button class="task-btn" onclick="deleteTask(${task.id})" title="Excluir">🗑️</button>
            </div>
        </div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-footer">
            ${task.status === 'todo' ? `<button class="move-btn to-doing" onclick="moveTask(${task.id}, 'doing')">→ Em Progresso</button>` : ''}
            ${task.status === 'doing' ? `
                <button class="move-btn to-todo" onclick="moveTask(${task.id}, 'todo')">← A Fazer</button>
                <button class="move-btn to-done" onclick="moveTask(${task.id}, 'done')">→ Concluído</button>
            ` : ''}
            ${task.status === 'done' ? `<button class="move-btn to-doing" onclick="moveTask(${task.id}, 'doing')">← Em Progresso</button>` : ''}
        </div>
        <div class="task-date">Criada em ${date}</div>
    `;

    return card;
}

async function moveTask(taskId, newStatus) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': currentUser.id
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) loadTasks();
    } catch (error) {
        console.error('Erro ao mover tarefa:', error);
    }
}

async function deleteTask(taskId) {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: { 'x-user-id': currentUser.id }
        });

        if (response.ok) loadTasks();
    } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
    }
}

async function openEditModal(taskId) {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            headers: { 'x-user-id': currentUser.id }
        });

        const tasks = await response.json();
        const task = tasks.find(t => t.id === taskId);

        if (task) {
            document.getElementById('edit-task-id').value = task.id;
            document.getElementById('edit-task-title').value = task.title;
            document.getElementById('edit-task-description').value = task.description || '';
            document.getElementById('edit-modal').classList.add('show');
        }
    } catch (error) {
        console.error('Erro ao carregar tarefa:', error);
    }
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('show');
    clearErrors();
}

async function handleEditTask(e) {
    e.preventDefault();
    clearErrors();

    const taskId = document.getElementById('edit-task-id').value;
    const title = document.getElementById('edit-task-title').value;
    const description = document.getElementById('edit-task-description').value;

    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': currentUser.id
            },
            body: JSON.stringify({ title, description })
        });

        const data = await response.json();

        if (!response.ok) {
            showError('edit-task-error', data.error);
            return;
        }

        closeEditModal();
        loadTasks();
    } catch (error) {
        showError('edit-task-error', 'Erro ao editar tarefa. Tente novamente.');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('user');
    document.getElementById('app-section').style.display = 'none';
    document.getElementById('auth-section').style.display = 'flex';
    showTab('login');
}

function showApp() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'block';
    document.getElementById('user-name').textContent = currentUser.name;
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.getElementById('edit-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'edit-modal') closeEditModal();
});