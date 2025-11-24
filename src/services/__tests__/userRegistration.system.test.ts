import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import { Options, ServiceBuilder } from 'selenium-webdriver/chrome';
import * as path from 'path';

describe('User Registration System Tests', () => {
    let driver: WebDriver;
    const BASE_URL = 'http://localhost:3000';

    beforeEach(async () => {
        try {
            const chromeOptions = new Options();
            // chromeOptions.addArguments('--headless'); // Run in headless mode - DISABLED for visible browser
            chromeOptions.addArguments('--no-sandbox');
            chromeOptions.addArguments('--disable-dev-shm-usage');
            chromeOptions.addArguments('--window-size=1920,1080');
            chromeOptions.addArguments('--start-maximized');
            chromeOptions.addArguments('--disable-blink-features=AutomationControlled');

            // Set up chromedriver service with explicit path
            const chromedriverPath = require('chromedriver').path;
            const service = new ServiceBuilder(chromedriverPath);

            driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(chromeOptions)
                .setChromeService(service)
                .build();

            console.log('Browser started successfully');
        } catch (error) {
            console.error('Error starting browser:', error);
            throw error;
        }
    }, 60000); // Increase timeout for browser startup

    afterEach(async () => {
        try {
            if (driver) {
                console.log('Closing browser');
                await driver.quit();
            }
        } catch (error) {
            console.error('Error closing browser:', error);
        }
    }, 60000); // Increase timeout for browser cleanup

    describe('Test 1: Create new user and validate successful registration', () => {
        it('should be able to open browser and access the page', async () => {
            console.log('Attempting to navigate to:', BASE_URL);
            await driver.get(BASE_URL);
            console.log('Page loaded successfully');

            const title = await driver.getTitle();
            console.log('Page title:', title);
            expect(title).toBe('TaskFlow - Gerenciador de Tarefas');
        });

        it('should access the page, fill registration form, submit, and validate user is registered', async () => {
            // Step 1: Access the page to create a new user
            await driver.get(BASE_URL);

            // Wait for page to load
            await driver.wait(until.elementLocated(By.id('auth-section')), 10000);

            // Step 2: Click on the "Cadastrar" tab to show registration form
            const registerTab = await driver.findElement(By.xpath('//button[contains(text(), "Cadastrar")]'));
            await registerTab.click();

            // Wait for register form to be visible
            await driver.wait(until.elementLocated(By.id('register-form')), 5000);

            // Step 3: Fill name
            const nameInput = await driver.findElement(By.id('register-name'));
            await nameInput.clear();
            await nameInput.sendKeys('Test User Selenium');

            // Step 4: Fill email
            const emailInput = await driver.findElement(By.id('register-email'));
            await emailInput.clear();
            const timestamp = Date.now();
            await emailInput.sendKeys(`selenium.test${timestamp}@example.com`);

            // Step 5: Fill password
            const passwordInput = await driver.findElement(By.id('register-password'));
            await passwordInput.clear();
            await passwordInput.sendKeys('TestPass123');

            // Step 6: Fill password confirmation
            const confirmPasswordInput = await driver.findElement(By.id('register-confirm-password'));
            await confirmPasswordInput.clear();
            await confirmPasswordInput.sendKeys('TestPass123');

            // Step 7: Click on the "Cadastrar" button
            const submitButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Cadastrar")]'));
            await submitButton.click();

            // Step 8: Validate if the user is successfully registered
            // After successful registration, the app should redirect to the main app section
            await driver.wait(until.elementLocated(By.id('app-section')), 10000);

            // Verify that auth section is hidden
            const authSection = await driver.findElement(By.id('auth-section'));
            const authDisplay = await authSection.getCssValue('display');
            expect(authDisplay).toBe('none');

            // Verify that app section is visible
            const appSection = await driver.findElement(By.id('app-section'));
            const appDisplay = await appSection.getCssValue('display');
            expect(appDisplay).not.toBe('none');

            // Verify user name is displayed in the header
            const userNameElement = await driver.findElement(By.id('user-name'));
            const displayedName = await userNameElement.getText();
            expect(displayedName).toBe('Test User Selenium');

            // Verify that the tasks board is visible (user is logged in)
            const tasksBoard = await driver.findElement(By.className('tasks-board'));
            expect(await tasksBoard.isDisplayed()).toBe(true);

            // Verify logout button is visible
            const logoutButton = await driver.findElement(By.xpath('//button[contains(text(), "Sair")]'));
            expect(await logoutButton.isDisplayed()).toBe(true);
        });

        it('should show user registration with all fields filled correctly', async () => {
            await driver.get(BASE_URL);

            // Switch to register tab
            const registerTab = await driver.findElement(By.xpath('//button[contains(text(), "Cadastrar")]'));
            await registerTab.click();

            await driver.wait(until.elementLocated(By.id('register-form')), 5000);

            // Fill form
            await driver.findElement(By.id('register-name')).sendKeys('John Doe');
            await driver.findElement(By.id('register-email')).sendKeys(`john.doe.${Date.now()}@test.com`);
            await driver.findElement(By.id('register-password')).sendKeys('SecurePass456');
            await driver.findElement(By.id('register-confirm-password')).sendKeys('SecurePass456');

            // Submit
            const submitButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Cadastrar")]'));
            await submitButton.click();

            // Validate registration
            await driver.wait(until.elementLocated(By.id('app-section')), 10000);

            const userName = await driver.findElement(By.id('user-name')).getText();
            expect(userName).toBe('John Doe');
        });

        it('should validate that registration form has all required fields', async () => {
            await driver.get(BASE_URL);

            // Switch to register tab
            const registerTab = await driver.findElement(By.xpath('//button[contains(text(), "Cadastrar")]'));
            await registerTab.click();

            await driver.wait(until.elementLocated(By.id('register-form')), 5000);

            // Verify all input fields exist
            const nameInput = await driver.findElement(By.id('register-name'));
            expect(await nameInput.isDisplayed()).toBe(true);

            const emailInput = await driver.findElement(By.id('register-email'));
            expect(await emailInput.isDisplayed()).toBe(true);

            const passwordInput = await driver.findElement(By.id('register-password'));
            expect(await passwordInput.isDisplayed()).toBe(true);

            const confirmPasswordInput = await driver.findElement(By.id('register-confirm-password'));
            expect(await confirmPasswordInput.isDisplayed()).toBe(true);

            const submitButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Cadastrar")]'));
            expect(await submitButton.isDisplayed()).toBe(true);
        });

        it('should successfully register user with minimum password length', async () => {
            await driver.get(BASE_URL);

            const registerTab = await driver.findElement(By.xpath('//button[contains(text(), "Cadastrar")]'));
            await registerTab.click();

            await driver.wait(until.elementLocated(By.id('register-form')), 5000);

            await driver.findElement(By.id('register-name')).sendKeys('Min Pass User');
            await driver.findElement(By.id('register-email')).sendKeys(`minpass.${Date.now()}@test.com`);
            await driver.findElement(By.id('register-password')).sendKeys('123456'); // Minimum 6 characters
            await driver.findElement(By.id('register-confirm-password')).sendKeys('123456');

            const submitButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Cadastrar")]'));
            await submitButton.click();

            // Should successfully register
            await driver.wait(until.elementLocated(By.id('app-section')), 10000);

            const userName = await driver.findElement(By.id('user-name')).getText();
            expect(userName).toBe('Min Pass User');
        });

        it('should successfully register user with special characters in name', async () => {
            await driver.get(BASE_URL);

            const registerTab = await driver.findElement(By.xpath('//button[contains(text(), "Cadastrar")]'));
            await registerTab.click();

            await driver.wait(until.elementLocated(By.id('register-form')), 5000);

            await driver.findElement(By.id('register-name')).sendKeys('José da Silva-Souza');
            await driver.findElement(By.id('register-email')).sendKeys(`special.name.${Date.now()}@test.com`);
            await driver.findElement(By.id('register-password')).sendKeys('Password789');
            await driver.findElement(By.id('register-confirm-password')).sendKeys('Password789');

            const submitButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Cadastrar")]'));
            await submitButton.click();

            await driver.wait(until.elementLocated(By.id('app-section')), 10000);

            const userName = await driver.findElement(By.id('user-name')).getText();
            expect(userName).toBe('José da Silva-Souza');
        });
    });

    describe('CT02: Verify system does not allow login with empty inputs', () => {
        it('should not allow login with empty email and password', async () => {
            await driver.get(BASE_URL);

            // Wait for login form to be visible
            await driver.wait(until.elementLocated(By.id('login-form')), 5000);

            // Click login button without filling any fields
            const loginButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Entrar")]'));
            await loginButton.click();

            // Should remain on login page (auth section still visible)
            const authSection = await driver.findElement(By.id('auth-section'));
            const authDisplay = await authSection.getCssValue('display');
            expect(authDisplay).not.toBe('none');

            // App section should still be hidden
            const appSection = await driver.findElement(By.id('app-section'));
            const appDisplay = await appSection.getCssValue('display');
            expect(appDisplay).toBe('none');
        });

        it('should not allow login with empty email only', async () => {
            await driver.get(BASE_URL);

            await driver.wait(until.elementLocated(By.id('login-form')), 5000);

            // Fill only password, leave email empty
            const passwordInput = await driver.findElement(By.id('login-password'));
            await passwordInput.sendKeys('SomePassword123');

            const loginButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Entrar")]'));
            await loginButton.click();

            // Should remain on login page
            const authSection = await driver.findElement(By.id('auth-section'));
            const authDisplay = await authSection.getCssValue('display');
            expect(authDisplay).not.toBe('none');
        });

        it('should not allow login with empty password only', async () => {
            await driver.get(BASE_URL);

            await driver.wait(until.elementLocated(By.id('login-form')), 5000);

            // Fill only email, leave password empty
            const emailInput = await driver.findElement(By.id('login-email'));
            await emailInput.sendKeys('test@example.com');

            const loginButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Entrar")]'));
            await loginButton.click();

            // Should remain on login page
            const authSection = await driver.findElement(By.id('auth-section'));
            const authDisplay = await authSection.getCssValue('display');
            expect(authDisplay).not.toBe('none');
        });

        it('should not allow login with whitespace-only email', async () => {
            await driver.get(BASE_URL);

            await driver.wait(until.elementLocated(By.id('login-form')), 5000);

            const emailInput = await driver.findElement(By.id('login-email'));
            await emailInput.sendKeys('     ');

            const passwordInput = await driver.findElement(By.id('login-password'));
            await passwordInput.sendKeys('Password123');

            const loginButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Entrar")]'));
            await loginButton.click();

            // Wait a moment for potential error message
            await driver.sleep(1000);

            // Should remain on login page or show error
            const authSection = await driver.findElement(By.id('auth-section'));
            const authDisplay = await authSection.getCssValue('display');
            expect(authDisplay).not.toBe('none');
        });

        it('should not allow login with whitespace-only password', async () => {
            await driver.get(BASE_URL);

            await driver.wait(until.elementLocated(By.id('login-form')), 5000);

            const emailInput = await driver.findElement(By.id('login-email'));
            await emailInput.sendKeys('test@example.com');

            const passwordInput = await driver.findElement(By.id('login-password'));
            await passwordInput.sendKeys('     ');

            const loginButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Entrar")]'));
            await loginButton.click();

            // Wait a moment for potential error message
            await driver.sleep(1000);

            // Should remain on login page or show error
            const authSection = await driver.findElement(By.id('auth-section'));
            const authDisplay = await authSection.getCssValue('display');
            expect(authDisplay).not.toBe('none');
        });

        it('should show error message when login fails with empty inputs', async () => {
            await driver.get(BASE_URL);

            await driver.wait(until.elementLocated(By.id('login-form')), 5000);

            // Try to login with some invalid data
            const emailInput = await driver.findElement(By.id('login-email'));
            await emailInput.sendKeys('nonexistent@example.com');

            const passwordInput = await driver.findElement(By.id('login-password'));
            await passwordInput.sendKeys('WrongPassword');

            const loginButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Entrar")]'));
            await loginButton.click();

            // Wait for error message to appear
            await driver.sleep(1000);

            // Check if error message element exists or is visible
            const errorElement = await driver.findElement(By.id('login-error'));
            const errorText = await errorElement.getText();

            // Error message should not be empty
            expect(errorText.length).toBeGreaterThan(0);
        });
    });

    describe('CT03: Verify system does not allow sign up with duplicate email', () => {
        const duplicateEmail = `duplicate.test.${Date.now()}@example.com`;

        it('should successfully register first user with email', async () => {
            await driver.get(BASE_URL);

            // Switch to register tab
            const registerTab = await driver.findElement(By.xpath('//button[contains(text(), "Cadastrar")]'));
            await registerTab.click();

            await driver.wait(until.elementLocated(By.id('register-form')), 5000);

            // Register first user
            await driver.findElement(By.id('register-name')).sendKeys('First User');
            await driver.findElement(By.id('register-email')).sendKeys(duplicateEmail);
            await driver.findElement(By.id('register-password')).sendKeys('Password123');
            await driver.findElement(By.id('register-confirm-password')).sendKeys('Password123');

            const submitButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Cadastrar")]'));
            await submitButton.click();

            // Should successfully register
            await driver.wait(until.elementLocated(By.id('app-section')), 10000);

            const userName = await driver.findElement(By.id('user-name')).getText();
            expect(userName).toBe('First User');

            // Logout
            const logoutButton = await driver.findElement(By.xpath('//button[contains(text(), "Sair")]'));
            await logoutButton.click();

            // Wait for return to auth section
            await driver.wait(until.elementLocated(By.id('auth-section')), 5000);
        });

        it('should not allow registering second user with same email', async () => {
            await driver.get(BASE_URL);

            // Switch to register tab
            const registerTab = await driver.findElement(By.xpath('//button[contains(text(), "Cadastrar")]'));
            await registerTab.click();

            await driver.wait(until.elementLocated(By.id('register-form')), 5000);

            // Try to register with duplicate email
            await driver.findElement(By.id('register-name')).sendKeys('Second User');
            await driver.findElement(By.id('register-email')).sendKeys(duplicateEmail);
            await driver.findElement(By.id('register-password')).sendKeys('DifferentPass456');
            await driver.findElement(By.id('register-confirm-password')).sendKeys('DifferentPass456');

            const submitButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Cadastrar")]'));
            await submitButton.click();

            // Wait for error message
            await driver.sleep(1000);

            // Should remain on registration page
            const authSection = await driver.findElement(By.id('auth-section'));
            const authDisplay = await authSection.getCssValue('display');
            expect(authDisplay).not.toBe('none');

            // Should show error message
            const errorElement = await driver.findElement(By.id('register-error'));
            const errorText = await errorElement.getText();
            expect(errorText).toContain('já cadastrado');
        });

        it('should show appropriate error message for duplicate email', async () => {
            await driver.get(BASE_URL);

            const registerTab = await driver.findElement(By.xpath('//button[contains(text(), "Cadastrar")]'));
            await registerTab.click();

            await driver.wait(until.elementLocated(By.id('register-form')), 5000);

            // Try to register with the same duplicate email again
            await driver.findElement(By.id('register-name')).sendKeys('Third User');
            await driver.findElement(By.id('register-email')).sendKeys(duplicateEmail);
            await driver.findElement(By.id('register-password')).sendKeys('AnotherPass789');
            await driver.findElement(By.id('register-confirm-password')).sendKeys('AnotherPass789');

            const submitButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Cadastrar")]'));
            await submitButton.click();

            await driver.sleep(1000);

            // Verify error message is displayed
            const errorElement = await driver.findElement(By.id('register-error'));
            const isErrorVisible = await errorElement.isDisplayed();
            expect(isErrorVisible).toBe(true);

            const errorText = await errorElement.getText();
            expect(errorText.length).toBeGreaterThan(0);
        });

        it('should allow registration with different email after duplicate attempt', async () => {
            await driver.get(BASE_URL);

            const registerTab = await driver.findElement(By.xpath('//button[contains(text(), "Cadastrar")]'));
            await registerTab.click();

            await driver.wait(until.elementLocated(By.id('register-form')), 5000);

            // Register with a new unique email
            const newEmail = `new.unique.${Date.now()}@example.com`;
            await driver.findElement(By.id('register-name')).sendKeys('New User');
            await driver.findElement(By.id('register-email')).sendKeys(newEmail);
            await driver.findElement(By.id('register-password')).sendKeys('ValidPass123');
            await driver.findElement(By.id('register-confirm-password')).sendKeys('ValidPass123');

            const submitButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Cadastrar")]'));
            await submitButton.click();

            // Should successfully register with new email
            await driver.wait(until.elementLocated(By.id('app-section')), 10000);

            const userName = await driver.findElement(By.id('user-name')).getText();
            expect(userName).toBe('New User');
        });
    });

    describe('CT04: Create task - Login, create new task, and try empty title', () => {
        const testEmail = `task.test.${Date.now()}@example.com`;
        const testPassword = 'TaskTest123';
        let isUserRegistered = false;

        beforeEach(async () => {
            // Register user only once for the first test
            if (!isUserRegistered) {
                await driver.get(BASE_URL);

                const registerTab = await driver.findElement(By.xpath('//button[contains(text(), "Cadastrar")]'));
                await registerTab.click();

                await driver.wait(until.elementLocated(By.id('register-form')), 5000);

                await driver.findElement(By.id('register-name')).sendKeys('Task Test User');
                await driver.findElement(By.id('register-email')).sendKeys(testEmail);
                await driver.findElement(By.id('register-password')).sendKeys(testPassword);
                await driver.findElement(By.id('register-confirm-password')).sendKeys(testPassword);

                const submitButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Cadastrar")]'));
                await submitButton.click();

                await driver.wait(until.elementLocated(By.id('app-section')), 10000);

                // Logout to prepare for login test
                const logoutButton = await driver.findElement(By.xpath('//button[contains(text(), "Sair")]'));
                await logoutButton.click();

                await driver.wait(until.elementLocated(By.id('auth-section')), 5000);

                isUserRegistered = true;
            }
        }, 60000);

        it('should login with registered user', async () => {
            await driver.get(BASE_URL);

            // Wait for login form
            await driver.wait(until.elementLocated(By.id('login-form')), 5000);

            // Fill login credentials
            const emailInput = await driver.findElement(By.id('login-email'));
            await emailInput.sendKeys(testEmail);

            const passwordInput = await driver.findElement(By.id('login-password'));
            await passwordInput.sendKeys(testPassword);

            // Click login button
            const loginButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Entrar")]'));
            await loginButton.click();

            // Wait for successful login
            await driver.wait(until.elementLocated(By.id('app-section')), 10000);

            // Verify user is logged in
            const appSection = await driver.findElement(By.id('app-section'));
            const appDisplay = await appSection.getCssValue('display');
            expect(appDisplay).not.toBe('none');

            const userName = await driver.findElement(By.id('user-name')).getText();
            expect(userName).toBe('Task Test User');
        });

        it('should create a new task after login', async () => {
            // Login first
            await driver.get(BASE_URL);
            await driver.wait(until.elementLocated(By.id('login-form')), 5000);
            await driver.findElement(By.id('login-email')).sendKeys(testEmail);
            await driver.findElement(By.id('login-password')).sendKeys(testPassword);
            const loginButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Entrar")]'));
            await loginButton.click();
            await driver.wait(until.elementLocated(By.id('app-section')), 10000);

            await driver.wait(until.elementLocated(By.id('create-task-form')), 5000);

            // Fill task title
            const titleInput = await driver.findElement(By.id('task-title'));
            await titleInput.clear();
            await titleInput.sendKeys('My First Task');

            // Fill task description
            const descriptionInput = await driver.findElement(By.id('task-description'));
            await descriptionInput.clear();
            await descriptionInput.sendKeys('This is a test task created by Selenium');

            // Submit task
            const submitButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Adicionar Tarefa")]'));
            await submitButton.click();

            // Wait for task to appear in the board
            await driver.sleep(1000);

            // Verify task appears in "A Fazer" column
            const todoColumn = await driver.findElement(By.id('todo-tasks'));
            const taskCards = await todoColumn.findElements(By.className('task-card'));

            expect(taskCards.length).toBeGreaterThan(0);

            // Verify task content
            const taskTitle = await taskCards[0].findElement(By.className('task-title')).getText();
            expect(taskTitle).toBe('My First Task');

            const taskDescription = await taskCards[0].findElement(By.className('task-description')).getText();
            expect(taskDescription).toBe('This is a test task created by Selenium');
        });

        it('should create multiple tasks successfully', async () => {
            // Login first
            await driver.get(BASE_URL);
            await driver.wait(until.elementLocated(By.id('login-form')), 5000);
            await driver.findElement(By.id('login-email')).sendKeys(testEmail);
            await driver.findElement(By.id('login-password')).sendKeys(testPassword);
            const loginButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Entrar")]'));
            await loginButton.click();
            await driver.wait(until.elementLocated(By.id('app-section')), 10000);

            await driver.wait(until.elementLocated(By.id('create-task-form')), 5000);

            // Create second task
            const titleInput = await driver.findElement(By.id('task-title'));
            await titleInput.clear();
            await titleInput.sendKeys('Second Task');

            const descriptionInput = await driver.findElement(By.id('task-description'));
            await descriptionInput.clear();
            await descriptionInput.sendKeys('Another test task');

            const submitButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Adicionar Tarefa")]'));
            await submitButton.click();

            await driver.sleep(1000);

            // Verify multiple tasks exist
            const todoColumn = await driver.findElement(By.id('todo-tasks'));
            const taskCards = await todoColumn.findElements(By.className('task-card'));

            expect(taskCards.length).toBeGreaterThanOrEqual(2);
        });

        it('should not create task with empty title', async () => {
            // Login first
            await driver.get(BASE_URL);
            await driver.wait(until.elementLocated(By.id('login-form')), 5000);
            await driver.findElement(By.id('login-email')).sendKeys(testEmail);
            await driver.findElement(By.id('login-password')).sendKeys(testPassword);
            const loginButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Entrar")]'));
            await loginButton.click();
            await driver.wait(until.elementLocated(By.id('app-section')), 10000);

            await driver.wait(until.elementLocated(By.id('create-task-form')), 5000);

            // Get current number of tasks
            const todoColumn = await driver.findElement(By.id('todo-tasks'));
            const tasksBefore = await todoColumn.findElements(By.className('task-card'));
            const countBefore = tasksBefore.length;

            // Try to create task with empty title
            const titleInput = await driver.findElement(By.id('task-title'));
            await titleInput.clear();
            // Leave title empty

            const descriptionInput = await driver.findElement(By.id('task-description'));
            await descriptionInput.clear();
            await descriptionInput.sendKeys('Task with empty title');

            const submitButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Adicionar Tarefa")]'));
            await submitButton.click();

            // Wait for potential error
            await driver.sleep(1000);

            // Verify task was not created
            const tasksAfter = await todoColumn.findElements(By.className('task-card'));
            const countAfter = tasksAfter.length;

            expect(countAfter).toBe(countBefore);
        });

        it('should not create task with whitespace-only title', async () => {
            // Login first
            await driver.get(BASE_URL);
            await driver.wait(until.elementLocated(By.id('login-form')), 5000);
            await driver.findElement(By.id('login-email')).sendKeys(testEmail);
            await driver.findElement(By.id('login-password')).sendKeys(testPassword);
            const loginButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Entrar")]'));
            await loginButton.click();
            await driver.wait(until.elementLocated(By.id('app-section')), 10000);

            await driver.wait(until.elementLocated(By.id('create-task-form')), 5000);

            // Get current number of tasks
            const todoColumn = await driver.findElement(By.id('todo-tasks'));
            const tasksBefore = await todoColumn.findElements(By.className('task-card'));
            const countBefore = tasksBefore.length;

            // Try to create task with whitespace-only title
            const titleInput = await driver.findElement(By.id('task-title'));
            await titleInput.clear();
            await titleInput.sendKeys('     '); // Only spaces

            const descriptionInput = await driver.findElement(By.id('task-description'));
            await descriptionInput.clear();
            await descriptionInput.sendKeys('Description here');

            const submitButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Adicionar Tarefa")]'));
            await submitButton.click();

            await driver.sleep(1000);

            // Verify task was not created
            const tasksAfter = await todoColumn.findElements(By.className('task-card'));
            const countAfter = tasksAfter.length;

            expect(countAfter).toBe(countBefore);
        });

        it('should show error message when creating task with empty title', async () => {
            // Login first
            await driver.get(BASE_URL);
            await driver.wait(until.elementLocated(By.id('login-form')), 5000);
            await driver.findElement(By.id('login-email')).sendKeys(testEmail);
            await driver.findElement(By.id('login-password')).sendKeys(testPassword);
            const loginButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Entrar")]'));
            await loginButton.click();
            await driver.wait(until.elementLocated(By.id('app-section')), 10000);

            await driver.wait(until.elementLocated(By.id('create-task-form')), 5000);

            // Try to create task with empty title by removing the required attribute and submitting
            const titleInput = await driver.findElement(By.id('task-title'));
            await titleInput.clear();

            // Remove required attribute to bypass HTML5 validation
            await driver.executeScript('document.getElementById("task-title").removeAttribute("required")');

            const submitButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Adicionar Tarefa")]'));
            await submitButton.click();

            await driver.sleep(1000);

            // Check for error message
            const errorElement = await driver.findElement(By.id('create-task-error'));
            const errorText = await errorElement.getText();

            // Error should contain message about required title
            expect(errorText.length).toBeGreaterThan(0);
            expect(errorText).toContain('obrigatório');
        });

        it('should allow creating task after empty title attempt', async () => {
            // Login first
            await driver.get(BASE_URL);
            await driver.wait(until.elementLocated(By.id('login-form')), 5000);
            await driver.findElement(By.id('login-email')).sendKeys(testEmail);
            await driver.findElement(By.id('login-password')).sendKeys(testPassword);
            const loginButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Entrar")]'));
            await loginButton.click();
            await driver.wait(until.elementLocated(By.id('app-section')), 10000);

            await driver.wait(until.elementLocated(By.id('create-task-form')), 5000);

            // Try empty title first
            const titleInput = await driver.findElement(By.id('task-title'));
            await titleInput.clear();

            let submitButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Adicionar Tarefa")]'));
            await submitButton.click();

            await driver.sleep(500);

            // Now create with valid title
            await titleInput.clear();
            await titleInput.sendKeys('Valid Task After Error');

            const descriptionInput = await driver.findElement(By.id('task-description'));
            await descriptionInput.clear();
            await descriptionInput.sendKeys('This should work');

            submitButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Adicionar Tarefa")]'));
            await submitButton.click();

            await driver.sleep(1000);

            // Verify task was created
            const todoColumn = await driver.findElement(By.id('todo-tasks'));
            const taskCards = await todoColumn.findElements(By.className('task-card'));

            // Find the task we just created
            let found = false;
            for (const card of taskCards) {
                const title = await card.findElement(By.className('task-title')).getText();
                if (title === 'Valid Task After Error') {
                    found = true;
                    break;
                }
            }

            expect(found).toBe(true);
        });

        it('should create task without description', async () => {
            // Login first
            await driver.get(BASE_URL);
            await driver.wait(until.elementLocated(By.id('login-form')), 5000);
            await driver.findElement(By.id('login-email')).sendKeys(testEmail);
            await driver.findElement(By.id('login-password')).sendKeys(testPassword);
            const loginButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Entrar")]'));
            await loginButton.click();
            await driver.wait(until.elementLocated(By.id('app-section')), 10000);

            await driver.wait(until.elementLocated(By.id('create-task-form')), 5000);

            // Create task with only title
            const titleInput = await driver.findElement(By.id('task-title'));
            await titleInput.clear();
            await titleInput.sendKeys('Task Without Description');

            const descriptionInput = await driver.findElement(By.id('task-description'));
            await descriptionInput.clear();
            // Leave description empty

            const submitButton = await driver.findElement(By.xpath('//button[@type="submit" and contains(text(), "Adicionar Tarefa")]'));
            await submitButton.click();

            await driver.sleep(1000);

            // Verify task was created
            const todoColumn = await driver.findElement(By.id('todo-tasks'));
            const taskCards = await todoColumn.findElements(By.className('task-card'));

            // Find the task
            let found = false;
            for (const card of taskCards) {
                const title = await card.findElement(By.className('task-title')).getText();
                if (title === 'Task Without Description') {
                    found = true;
                    break;
                }
            }

            expect(found).toBe(true);
        });
    });
});
