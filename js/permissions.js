// --- PERMISSIONS & ROLES SYSTEM ---

// Названия ролей на русском
const ROLE_NAMES = {
    admin: 'Администратор',
    director: 'Директор компании',
    sales_director: 'Коммерческий директор',
    sales_manager: 'Менеджер продаж',
    engineer: 'Инженер',
    production_head: 'Начальник производства',
    warehouse_head: 'Начальник склада',
    guest: 'Гость'
};

// Названия действий на русском (для логов)
const ACTION_NAMES = {
    item_create: 'Создание товара',
    item_edit: 'Редактирование товара',
    item_delete: 'Удаление товара',
    project_create: 'Создание проекта',
    project_edit: 'Редактирование проекта',
    project_delete: 'Удаление проекта',
    project_close: 'Закрытие проекта',
    spec_create: 'Создание спецификации',
    spec_edit: 'Редактирование спецификации',
    spec_delete: 'Удаление спецификации',
    spec_commit: 'Списание по спецификации',
    movement_in: 'Приход товара',
    movement_out: 'Списание товара',
    movement_undo: 'Отмена операции',
    user_login: 'Вход в систему',
    user_logout: 'Выход из системы',
    settings_change: 'Изменение настроек',
    role_change: 'Изменение прав роли',
    user_create: 'Создание пользователя',
    user_edit: 'Редактирование пользователя',
    user_delete: 'Удаление пользователя',
    user_profile_update: 'Изменение профиля',
    commercial_request_create: 'Создание запроса',
    commercial_request_edit: 'Редактирование запроса',
    commercial_request_delete: 'Удаление запроса',
    commercial_request_convert: 'Преобразование в проект',
    commercial_proposal_create: 'Создание КП',
    commercial_proposal_delete: 'Удаление КП',
    calculation_create: 'Создание калькуляции',
    calculation_edit: 'Редактирование калькуляции'
};

// Названия вкладок
const TAB_NAMES = {
    dashboard: 'Дашборд',
    warehouse: 'Склад',
    movements: 'Работа со складом',
    projects: 'Проекты',
    specs: 'Спецификации',
    commercial: 'Коммерческий отдел',
    help: 'Помощь'
};

// Email администратора (захардкоженный для безопасности)
const ADMIN_EMAIL = 'admin@7lamp.ru';

// Текущий пользователь и его права
let currentUser = null;
let currentPermissions = null;

// Права по умолчанию для каждой роли
const DEFAULT_ROLE_PERMISSIONS = {
    admin: {
        tabs: ['dashboard', 'warehouse', 'movements', 'projects', 'specs', 'commercial', 'help'],
        settings: true,
        manageUsers: true,
        manageRoles: true,
        items: { create: true, edit: true, delete: true, movement_in: true, movement_out: true },
        projects: { create: true, edit: true, delete: true, close: true },
        specs: { create: true, edit: true, delete: true, commit: true },
        movements: { in: true, out: true, undo: true },
        commercial: { create: true, edit: true, delete: true, convert: true }
    },
    director: {
        tabs: ['dashboard', 'warehouse', 'movements', 'projects', 'specs', 'commercial', 'help'],
        settings: false,
        manageUsers: false,
        manageRoles: false,
        items: { create: true, edit: true, delete: false, movement_in: true, movement_out: true },
        projects: { create: true, edit: true, delete: false, close: true },
        specs: { create: true, edit: true, delete: false, commit: true },
        movements: { in: true, out: true, undo: false },
        commercial: { create: true, edit: true, delete: false, convert: true }
    },
    sales_director: {
        tabs: ['dashboard', 'warehouse', 'projects', 'specs', 'commercial', 'help'],
        settings: false,
        manageUsers: false,
        manageRoles: false,
        items: { create: false, edit: false, delete: false, movement_in: false, movement_out: false },
        projects: { create: true, edit: true, delete: false, close: true },
        specs: { create: true, edit: true, delete: false, commit: false },
        movements: { in: false, out: false, undo: false },
        commercial: { create: true, edit: true, delete: true, convert: true }
    },
    sales_manager: {
        tabs: ['dashboard', 'projects', 'specs', 'commercial', 'help'],
        settings: false,
        manageUsers: false,
        manageRoles: false,
        items: { create: false, edit: false, delete: false, movement_in: false, movement_out: false },
        projects: { create: true, edit: true, delete: false, close: false },
        specs: { create: true, edit: true, delete: false, commit: false },
        movements: { in: false, out: false, undo: false },
        commercial: { create: true, edit: true, delete: false, convert: false }
    },
    engineer: {
        tabs: ['dashboard', 'warehouse', 'specs', 'help'],
        settings: false,
        manageUsers: false,
        manageRoles: false,
        items: { create: false, edit: true, delete: false, movement_in: false, movement_out: false },
        projects: { create: false, edit: false, delete: false, close: false },
        specs: { create: true, edit: true, delete: false, commit: false },
        movements: { in: false, out: false, undo: false },
        commercial: { create: false, edit: false, delete: false, convert: false }
    },
    production_head: {
        tabs: ['dashboard', 'warehouse', 'movements', 'projects', 'specs', 'help'],
        settings: false,
        manageUsers: false,
        manageRoles: false,
        items: { create: true, edit: true, delete: false, movement_in: true, movement_out: true },
        projects: { create: false, edit: false, delete: false, close: false },
        specs: { create: true, edit: true, delete: false, commit: true },
        movements: { in: true, out: true, undo: false },
        commercial: { create: false, edit: false, delete: false, convert: false }
    },
    warehouse_head: {
        tabs: ['dashboard', 'warehouse', 'movements', 'help'],
        settings: false,
        manageUsers: false,
        manageRoles: false,
        items: { create: true, edit: true, delete: true, movement_in: true, movement_out: true },
        projects: { create: false, edit: false, delete: false, close: false },
        specs: { create: false, edit: false, delete: false, commit: false },
        movements: { in: true, out: true, undo: true },
        commercial: { create: false, edit: false, delete: false, convert: false }
    },
    guest: {
        tabs: ['dashboard', 'warehouse', 'projects', 'specs', 'help'],
        settings: false,
        manageUsers: false,
        manageRoles: false,
        items: { create: false, edit: false, delete: false, movement_in: false, movement_out: false },
        projects: { create: false, edit: false, delete: false, close: false },
        specs: { create: false, edit: false, delete: false, commit: false },
        movements: { in: false, out: false, undo: false },
        commercial: { create: false, edit: false, delete: false, convert: false }
    }
};

// Права для неавторизованного/неактивного пользователя
function getGuestPermissions() {
    return {
        tabs: ['help'],
        settings: false,
        manageUsers: false,
        manageRoles: false,
        items: { create: false, edit: false, delete: false },
        projects: { create: false, edit: false, delete: false, close: false },
        specs: { create: false, edit: false, delete: false, commit: false },
        movements: { in: false, out: false, undo: false },
        commercial: { create: false, edit: false, delete: false, convert: false }
    };
}

// Инициализация данных ролей и пользователей в БД
function initRolesData() {
    if (!db.users) {
        db.users = {};
    }
    if (!db.rolePermissions) {
        db.rolePermissions = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
    }
    if (!db.activityLogs) {
        db.activityLogs = [];
    }
}

// Инициализация прав после авторизации
function initUserPermissions(firebaseUser) {
    if (!firebaseUser) {
        currentUser = null;
        currentPermissions = null;
        return;
    }
    
    initRolesData();
    
    // Поиск пользователя по email
    const users = db.users || {};
    const userEntry = Object.entries(users).find(([id, u]) => u.email === firebaseUser.email);
    
    if (userEntry) {
        currentUser = { id: userEntry[0], ...userEntry[1] };
    } else if (firebaseUser.email === ADMIN_EMAIL) {
        // Автоматически создаём админа, если его нет
        const adminId = 'user_admin_' + Date.now();
        db.users[adminId] = {
            email: ADMIN_EMAIL,
            name: 'Администратор',
            role: 'admin',
            isActive: true,
            createdAt: new Date().toISOString()
        };
        currentUser = { id: adminId, ...db.users[adminId] };
        markChanged('users', adminId); // Помечаем для синхронизации
        save(false);
    } else {
        // Новый пользователь без роли - нужно добавить в систему
        currentUser = {
            id: null,
            email: firebaseUser.email,
            name: firebaseUser.email,
            role: null,
            isActive: false
        };
    }
    
    // Загрузка прав роли
    if (currentUser.role && currentUser.isActive) {
        currentPermissions = db.rolePermissions?.[currentUser.role] || DEFAULT_ROLE_PERMISSIONS[currentUser.role] || getGuestPermissions();
    } else {
        currentPermissions = getGuestPermissions();
    }
    
    console.log('User initialized:', currentUser);
    console.log('Permissions:', currentPermissions);
    
    applyPermissions();
    
    // Обновляем аватар пользователя
    if (typeof updateUserAvatar === 'function') {
        updateUserAvatar();
    }
    
    // Перерисовываем склад, если он активен, чтобы кнопки приход/списание отобразились с правильными правами
    const warehouseView = document.getElementById('view-warehouse');
    if (warehouseView && !warehouseView.classList.contains('hidden')) {
        if (typeof renderWarehouse === 'function') {
            renderWarehouse();
        }
    }
}

// Проверка конкретного права
function hasPermission(category, action = null) {
    // В демо-режиме даём полный доступ
    if (isDemoMode) return true;
    
    // Админ имеет полный доступ (проверяем до проверки currentPermissions)
    if (currentUser?.role === 'admin') return true;
    
    if (!currentPermissions) return false;
    
    if (action) {
        // Для движения товаров также проверяем права в items
        if (category === 'movements' && (action === 'in' || action === 'out')) {
            const movementKey = action === 'in' ? 'movement_in' : 'movement_out';
            return currentPermissions[category]?.[action] === true || 
                   currentPermissions.items?.[movementKey] === true;
        }
        return currentPermissions[category]?.[action] === true;
    }
    return currentPermissions[category] === true;
}

// Проверка доступа к вкладке
function canAccessTab(tabName) {
    // В демо-режиме даём полный доступ
    if (isDemoMode) return true;
    
    if (!currentPermissions) return false;
    if (currentUser?.role === 'admin') return true;
    return currentPermissions.tabs?.includes(tabName) || false;
}

// Применение прав к интерфейсу
function applyPermissions() {
    // В демо-режиме показываем всё
    if (isDemoMode) {
        showAllUIElements();
        return;
    }
    
    if (!currentPermissions) return;
    
    // === ВКЛАДКИ ===
    const allTabs = ['dashboard', 'warehouse', 'movements', 'projects', 'specs', 'commercial', 'help'];
    allTabs.forEach(tab => {
        const tabBtn = document.getElementById(`tab-${tab}`);
        if (tabBtn) {
            tabBtn.style.display = canAccessTab(tab) ? '' : 'none';
        }
    });
    
    // Управление видимостью пунктов в выпадающем меню
    const menuTabs = ['dashboard', 'warehouse', 'movements', 'projects', 'specs', 'commercial', 'help'];
    let hasAnyAccess = false;
    menuTabs.forEach(tab => {
        const menuItem = document.getElementById(`menu-tab-${tab}`);
        if (menuItem) {
            const hasAccess = canAccessTab(tab);
            menuItem.style.display = hasAccess ? '' : 'none';
            if (hasAccess) hasAnyAccess = true;
        }
    });
    
    // Показываем кнопку меню, если есть хотя бы один доступный пункт
    const dropdownMenuBtn = document.getElementById('dropdownMenuBtn');
    if (dropdownMenuBtn) {
        dropdownMenuBtn.style.display = hasAnyAccess ? '' : 'none';
    }
    
    // Mobile navigation icons
    const mobileNavBtns = document.querySelectorAll('nav.md\\:hidden button');
    const mobileTabMap = {
        'fa-chart-pie': 'dashboard',
        'fa-boxes': 'warehouse',
        'fa-file-invoice': 'specs',
        'fa-briefcase': 'commercial',
        'fa-question-circle': 'help'
    };
    mobileNavBtns.forEach(btn => {
        const icon = btn.querySelector('i');
        if (icon) {
            for (const [iconClass, tabName] of Object.entries(mobileTabMap)) {
                if (icon.classList.contains(iconClass)) {
                    btn.style.display = canAccessTab(tabName) ? '' : 'none';
                    break;
                }
            }
        }
    });
    
    // === НАСТРОЙКИ ===
    // Настройки доступны только админу
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        const isAdmin = isDemoMode || (currentUser?.role === 'admin');
        settingsBtn.style.display = isAdmin ? '' : 'none';
    }
    
    // Админ-раздел в настройках
    const adminSection = document.getElementById('adminSection');
    if (adminSection) {
        adminSection.classList.toggle('hidden', !hasPermission('manageUsers'));
    }
    
    // === ТОВАРЫ ===
    const addItemBtn = document.querySelector('[onclick="openCreateItemModal()"]');
    if (addItemBtn) {
        addItemBtn.style.display = hasPermission('items', 'create') ? '' : 'none';
    }
    
    // === ПРОЕКТЫ ===
    const addProjectBtn = document.querySelector('[onclick="openCreateProjectModal()"]');
    if (addProjectBtn) {
        addProjectBtn.style.display = hasPermission('projects', 'create') ? '' : 'none';
    }
    
    // === ДВИЖЕНИЕ ТОВАРОВ ===
    const movInBtn = document.querySelector('[onclick="saveMovementIn()"]');
    const movOutBtn = document.querySelector('[onclick="saveMovementOut()"]');
    if (movInBtn) {
        movInBtn.style.display = hasPermission('movements', 'in') ? '' : 'none';
    }
    if (movOutBtn) {
        movOutBtn.style.display = hasPermission('movements', 'out') ? '' : 'none';
    }
    
    // === СПЕЦИФИКАЦИИ ===
    const commitSpecBtn = document.getElementById('btnCommitSpec');
    if (commitSpecBtn) {
        commitSpecBtn.style.display = hasPermission('specs', 'commit') ? '' : 'none';
    }
    
    const specAddPanel = document.getElementById('specAddPanel');
    if (specAddPanel) {
        specAddPanel.style.display = hasPermission('specs', 'edit') ? '' : 'none';
    }
    
    // Показать сообщение для неактивированных пользователей
    if (currentUser && !currentUser.isActive && currentUser.role === null) {
        showPendingAccessMessage();
    }
    
    // Перерисовываем склад, если он активен, чтобы кнопки приход/списание отобразились с правильными правами
    const warehouseView = document.getElementById('view-warehouse');
    if (warehouseView && !warehouseView.classList.contains('hidden')) {
        if (typeof renderWarehouse === 'function') {
            renderWarehouse();
        }
    }
}

// Показать все элементы UI (для демо-режима)
function showAllUIElements() {
    const allTabs = ['dashboard', 'warehouse', 'movements', 'projects', 'specs', 'commercial', 'help'];
    allTabs.forEach(tab => {
        const tabBtn = document.getElementById(`tab-${tab}`);
        if (tabBtn) tabBtn.style.display = '';
    });
    
    // Показываем админ-раздел в демо
    const adminSection = document.getElementById('adminSection');
    if (adminSection) adminSection.classList.remove('hidden');
    
    // Показываем кнопку настроек в демо
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) settingsBtn.style.display = '';
    
    // Обновляем аватар в демо
    if (typeof updateUserAvatar === 'function') {
        updateUserAvatar();
    }
    
    // Перерисовываем склад, если он активен, чтобы кнопки приход/списание отобразились
    const warehouseView = document.getElementById('view-warehouse');
    if (warehouseView && !warehouseView.classList.contains('hidden')) {
        if (typeof renderWarehouse === 'function') {
            renderWarehouse();
        }
    }
}

// Показать сообщение о том, что доступ ожидает подтверждения
function showPendingAccessMessage() {
    const main = document.querySelector('main');
    if (!main) return;
    
    document.querySelectorAll('.view-section').forEach(el => {
        if (el.id !== 'view-help') {
            el.classList.add('hidden');
        }
    });
    
    let pendingDiv = document.getElementById('pendingAccessMessage');
    if (!pendingDiv) {
        pendingDiv = document.createElement('div');
        pendingDiv.id = 'pendingAccessMessage';
        pendingDiv.className = 'view-section h-full flex items-center justify-center p-4';
        pendingDiv.innerHTML = `
            <div class="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl text-center max-w-md">
                <div class="mb-4"><i class="fas fa-user-clock text-5xl text-orange-500"></i></div>
                <h2 class="text-xl font-bold text-slate-800 dark:text-white mb-2">Ожидание доступа</h2>
                <p class="text-slate-600 dark:text-slate-400 mb-4">
                    Ваша учетная запись <strong>${currentUser.email}</strong> зарегистрирована, но ещё не активирована администратором.
                </p>
                <p class="text-sm text-slate-500 dark:text-slate-500">
                    Обратитесь к администратору для назначения роли и активации доступа.
                </p>
            </div>
        `;
        main.appendChild(pendingDiv);
    }
    pendingDiv.classList.remove('hidden');
}

// === ЛОГИРОВАНИЕ ДЕЙСТВИЙ ===

function logActivity(action, entityType, entityId, entityName, changes = null) {
    // В демо-режиме используем фейкового пользователя
    const userInfo = isDemoMode ? { id: 'demo', email: 'demo@demo.ru', name: 'Demo User' } : currentUser;
    if (!userInfo) return;
    
    initRolesData();
    
    const log = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        timestamp: new Date().toISOString(),
        userId: userInfo.id,
        userEmail: userInfo.email,
        userName: userInfo.name || userInfo.email,
        action: action,
        entityType: entityType,
        entityId: entityId,
        entityName: entityName || '',
        changes: changes
    };
    
    db.activityLogs.unshift(log);
    
    // Ограничиваем размер логов (последние 5000 записей)
    if (db.activityLogs.length > 5000) {
        db.activityLogs = db.activityLogs.slice(0, 5000);
    }
    
    // Помечаем для синхронизации
    if (typeof pendingChanges !== 'undefined') {
        pendingChanges.activityLogs = true;
    }
    
    console.log('Activity logged:', log);
}

// Вспомогательная функция для отслеживания изменений
function trackChanges(oldObj, newObj, fields) {
    const changes = {};
    let hasChanges = false;
    
    fields.forEach(field => {
        const oldVal = oldObj[field];
        const newVal = newObj[field];
        if (oldVal !== newVal) {
            changes[field] = { from: oldVal, to: newVal };
            hasChanges = true;
        }
    });
    
    return hasChanges ? changes : null;
}

// === УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ===

function openUsersModal() {
    renderUsersList();
    openModal('usersModal');
}

function renderUsersList() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    initRolesData();
    const users = db.users || {};
    
    let html = '';
    Object.entries(users).forEach(([id, user]) => {
        const roleName = ROLE_NAMES[user.role] || 'Не назначена';
        const statusClass = user.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
        const statusText = user.isActive ? 'Активен' : 'Неактивен';
        const isAdmin = user.email === ADMIN_EMAIL;
        
        html += `
            <tr class="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                <td class="px-4 py-3">
                    <div class="font-medium text-slate-800 dark:text-white">${user.name || user.email}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">${user.email}</div>
                </td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}">
                        ${roleName}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded text-xs font-medium ${statusClass}">${statusText}</span>
                </td>
                <td class="px-4 py-3 text-right">
                    ${!isAdmin ? `
                        <button onclick="editUser('${id}')" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 p-2" title="Редактировать">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteUser('${id}')" class="text-red-600 hover:text-red-800 dark:text-red-400 p-2" title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : '<span class="text-slate-400 text-xs">Системный</span>'}
                </td>
            </tr>
        `;
    });
    
    if (!html) {
        html = '<tr><td colspan="4" class="px-4 py-8 text-center text-slate-500">Нет пользователей</td></tr>';
    }
    
    tbody.innerHTML = html;
}

function openAddUserModal() {
    document.getElementById('editUserId').value = '';
    document.getElementById('editUserEmail').value = '';
    document.getElementById('editUserEmail').readOnly = false;
    document.getElementById('editUserName').value = '';
    document.getElementById('editUserRole').value = 'sales_manager';
    document.getElementById('editUserActive').checked = true;
    document.getElementById('editUserModalTitle').textContent = 'Добавить пользователя';
    openModal('editUserModal');
}

function editUser(userId) {
    const user = db.users[userId];
    if (!user) return;
    
    document.getElementById('editUserId').value = userId;
    document.getElementById('editUserEmail').value = user.email;
    document.getElementById('editUserEmail').readOnly = true;
    document.getElementById('editUserName').value = user.name || '';
    document.getElementById('editUserRole').value = user.role || 'sales_manager';
    document.getElementById('editUserActive').checked = user.isActive !== false;
    document.getElementById('editUserModalTitle').textContent = 'Редактировать пользователя';
    
    openModal('editUserModal');
}

function saveUserFromModal() {
    const userId = document.getElementById('editUserId').value;
    const email = document.getElementById('editUserEmail').value.trim();
    const name = document.getElementById('editUserName').value.trim();
    const role = document.getElementById('editUserRole').value;
    const isActive = document.getElementById('editUserActive').checked;
    
    if (!email) {
        showToast('Введите email пользователя');
        return;
    }
    
    initRolesData();
    
    if (userId) {
        // Редактирование
        const oldUser = { ...db.users[userId] };
        db.users[userId] = {
            ...db.users[userId],
            name: name || email,
            role: role,
            isActive: isActive,
            updatedAt: new Date().toISOString()
        };
        markChanged('users', userId); // Помечаем для синхронизации
        
        const changes = trackChanges(oldUser, db.users[userId], ['name', 'role', 'isActive']);
        logActivity('user_edit', 'user', userId, email, changes);
        showToast('Пользователь обновлён');
    } else {
        // Создание
        const exists = Object.values(db.users).some(u => u.email === email);
        if (exists) {
            showToast('Пользователь с таким email уже существует');
            return;
        }
        
        const newId = 'user_' + Date.now();
        db.users[newId] = {
            email: email,
            name: name || email,
            role: role,
            isActive: isActive,
            createdAt: new Date().toISOString()
        };
        markChanged('users', newId); // Помечаем для синхронизации
        
        logActivity('user_create', 'user', newId, email, null);
        showToast('Пользователь добавлен');
    }
    
    save(false);
    renderUsersList();
    
    // Очищаем поля формы перед закрытием
    document.getElementById('editUserId').value = '';
    document.getElementById('editUserEmail').value = '';
    document.getElementById('editUserEmail').readOnly = false;
    document.getElementById('editUserName').value = '';
    document.getElementById('editUserRole').value = 'sales_manager';
    document.getElementById('editUserActive').checked = true;
    
    // Закрываем модальное окно после небольшой задержки, чтобы UI успел обновиться
    setTimeout(() => {
        if (typeof closeModal === 'function') {
            closeModal('editUserModal');
        } else {
            // Fallback: прямая манипуляция DOM
            const modal = document.getElementById('editUserModal');
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.classList.add('hidden');
                }, 300);
            }
        }
    }, 100);
}

function deleteUser(userId) {
    const user = db.users[userId];
    if (!user) return;
    
    if (user.email === ADMIN_EMAIL) {
        showToast('Нельзя удалить администратора');
        return;
    }
    
    if (!confirm(`Удалить пользователя ${user.name || user.email}?`)) return;
    
    logActivity('user_delete', 'user', userId, user.email, null);
    delete db.users[userId];
    markDeleted('users', userId); // Помечаем для синхронизации
    save(false);
    renderUsersList();
    showToast('Пользователь удалён');
}

// === УПРАВЛЕНИЕ РОЛЯМИ ===

function openRolesModal() {
    renderRolePermissions();
    openModal('rolesModal');
}

function renderRolePermissions() {
    const roleSelector = document.getElementById('roleSelector');
    if (!roleSelector) return;
    
    const role = roleSelector.value;
    initRolesData();
    
    const permissions = db.rolePermissions[role] || DEFAULT_ROLE_PERMISSIONS[role];
    if (!permissions) return;
    
    // Вкладки
    const tabsContainer = document.getElementById('tabsPermissions');
    if (tabsContainer) {
        let tabsHtml = '';
        Object.entries(TAB_NAMES).forEach(([tab, name]) => {
            const checked = permissions.tabs?.includes(tab) ? 'checked' : '';
            tabsHtml += createToggle(`perm_tab_${tab}`, name, checked);
        });
        tabsContainer.innerHTML = tabsHtml;
    }
    
    // Товары
    const itemsContainer = document.getElementById('itemsPermissions');
    if (itemsContainer) {
        itemsContainer.innerHTML = `
            ${createToggle('perm_items_create', 'Создание', permissions.items?.create ? 'checked' : '')}
            ${createToggle('perm_items_edit', 'Редактирование', permissions.items?.edit ? 'checked' : '')}
            ${createToggle('perm_items_delete', 'Удаление', permissions.items?.delete ? 'checked' : '')}
            ${createToggle('perm_items_movement_in', 'Приход товара', permissions.movements?.in ? 'checked' : '')}
            ${createToggle('perm_items_movement_out', 'Списание товара', permissions.movements?.out ? 'checked' : '')}
        `;
    }
    
    // Проекты
    const projectsContainer = document.getElementById('projectsPermissions');
    if (projectsContainer) {
        projectsContainer.innerHTML = `
            ${createToggle('perm_projects_create', 'Создание', permissions.projects?.create ? 'checked' : '')}
            ${createToggle('perm_projects_edit', 'Редактирование', permissions.projects?.edit ? 'checked' : '')}
            ${createToggle('perm_projects_close', 'Закрытие', permissions.projects?.close ? 'checked' : '')}
            ${createToggle('perm_projects_delete', 'Удаление', permissions.projects?.delete ? 'checked' : '')}
        `;
    }
    
    // Спецификации
    const specsContainer = document.getElementById('specsPermissions');
    if (specsContainer) {
        specsContainer.innerHTML = `
            ${createToggle('perm_specs_create', 'Создание', permissions.specs?.create ? 'checked' : '')}
            ${createToggle('perm_specs_edit', 'Редактирование', permissions.specs?.edit ? 'checked' : '')}
            ${createToggle('perm_specs_commit', 'Списание', permissions.specs?.commit ? 'checked' : '')}
            ${createToggle('perm_specs_delete', 'Удаление', permissions.specs?.delete ? 'checked' : '')}
        `;
    }
    
    // Движение товаров
    const movementsContainer = document.getElementById('movementsPermissions');
    if (movementsContainer) {
        // Права на приход/списание берём из items или movements
        const canMoveIn = permissions.items?.movement_in || permissions.movements?.in;
        const canMoveOut = permissions.items?.movement_out || permissions.movements?.out;
        movementsContainer.innerHTML = `
            ${createToggle('perm_movements_in', 'Приход', canMoveIn ? 'checked' : '')}
            ${createToggle('perm_movements_out', 'Списание', canMoveOut ? 'checked' : '')}
            ${createToggle('perm_movements_undo', 'Отмена операций', permissions.movements?.undo ? 'checked' : '')}
        `;
    }
    
    // Коммерческий отдел
    const commercialContainer = document.getElementById('commercialPermissions');
    if (commercialContainer) {
        commercialContainer.innerHTML = `
            ${createToggle('perm_commercial_create', 'Создание запросов', permissions.commercial?.create ? 'checked' : '')}
            ${createToggle('perm_commercial_edit', 'Редактирование', permissions.commercial?.edit ? 'checked' : '')}
            ${createToggle('perm_commercial_delete', 'Удаление', permissions.commercial?.delete ? 'checked' : '')}
            ${createToggle('perm_commercial_convert', 'Преобразование в проект', permissions.commercial?.convert ? 'checked' : '')}
        `;
    }
}

function createToggle(id, label, checked) {
    return `
        <div class="flex items-center justify-between p-2 bg-white dark:bg-slate-600 rounded border dark:border-slate-500">
            <span class="text-sm text-slate-700 dark:text-slate-200">${label}</span>
            <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="${id}" class="sr-only peer" ${checked}>
                <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
        </div>
    `;
}

function saveRolePermissions() {
    const role = document.getElementById('roleSelector').value;
    if (!role || role === 'admin') {
        showToast('Нельзя изменить права администратора');
        return;
    }
    
    initRolesData();
    
    // Собираем вкладки
    const tabs = [];
    Object.keys(TAB_NAMES).forEach(tab => {
        const checkbox = document.getElementById(`perm_tab_${tab}`);
        if (checkbox?.checked) tabs.push(tab);
    });
    
    // Собираем права
    const permissions = {
        tabs: tabs,
        settings: false,
        manageUsers: false,
        manageRoles: false,
        items: {
            create: document.getElementById('perm_items_create')?.checked || false,
            edit: document.getElementById('perm_items_edit')?.checked || false,
            delete: document.getElementById('perm_items_delete')?.checked || false,
            movement_in: document.getElementById('perm_items_movement_in')?.checked || false,
            movement_out: document.getElementById('perm_items_movement_out')?.checked || false
        },
        projects: {
            create: document.getElementById('perm_projects_create')?.checked || false,
            edit: document.getElementById('perm_projects_edit')?.checked || false,
            close: document.getElementById('perm_projects_close')?.checked || false,
            delete: document.getElementById('perm_projects_delete')?.checked || false
        },
        specs: {
            create: document.getElementById('perm_specs_create')?.checked || false,
            edit: document.getElementById('perm_specs_edit')?.checked || false,
            commit: document.getElementById('perm_specs_commit')?.checked || false,
            delete: document.getElementById('perm_specs_delete')?.checked || false
        },
        movements: {
            // Синхронизируем с правами из раздела "Товары"
            in: document.getElementById('perm_items_movement_in')?.checked || document.getElementById('perm_movements_in')?.checked || false,
            out: document.getElementById('perm_items_movement_out')?.checked || document.getElementById('perm_movements_out')?.checked || false,
            undo: document.getElementById('perm_movements_undo')?.checked || false
        },
        commercial: {
            create: document.getElementById('perm_commercial_create')?.checked || false,
            edit: document.getElementById('perm_commercial_edit')?.checked || false,
            delete: document.getElementById('perm_commercial_delete')?.checked || false,
            convert: document.getElementById('perm_commercial_convert')?.checked || false
        }
    };
    
    db.rolePermissions[role] = permissions;
    pendingChanges.rolePermissions = true; // Помечаем для синхронизации
    
    logActivity('role_change', 'role', role, ROLE_NAMES[role], { permissions });
    save(false);
    showToast(`Права роли "${ROLE_NAMES[role]}" сохранены`);
    closeModal('rolesModal');
    
    // Обновляем права текущего пользователя, если он этой роли
    if (currentUser?.role === role) {
        currentPermissions = permissions;
        applyPermissions();
    }
}

function resetRolePermissions() {
    const role = document.getElementById('roleSelector').value;
    if (!role || role === 'admin') return;
    
    if (!confirm(`Сбросить права роли "${ROLE_NAMES[role]}" к значениям по умолчанию?`)) return;
    
    initRolesData();
    db.rolePermissions[role] = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS[role]));
    pendingChanges.rolePermissions = true; // Помечаем для синхронизации
    save(false);
    renderRolePermissions();
    showToast('Права сброшены к значениям по умолчанию');
}

// === ЖУРНАЛ ДЕЙСТВИЙ ===

function openLogsModal() {
    renderLogsTable();
    openModal('logsModal');
}

function renderLogsTable(filters = {}) {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;
    
    initRolesData();
    let logs = db.activityLogs || [];
    
    // Применяем фильтры
    if (filters.user) {
        const search = filters.user.toLowerCase();
        logs = logs.filter(l => 
            l.userEmail?.toLowerCase().includes(search) || 
            l.userName?.toLowerCase().includes(search)
        );
    }
    if (filters.action) {
        logs = logs.filter(l => l.action?.startsWith(filters.action));
    }
    if (filters.date) {
        logs = logs.filter(l => l.timestamp?.startsWith(filters.date));
    }
    
    // Ограничиваем до 200 записей для отображения
    logs = logs.slice(0, 200);
    
    let html = '';
    logs.forEach(log => {
        const date = new Date(log.timestamp);
        const dateStr = date.toLocaleDateString('ru-RU');
        const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const actionName = ACTION_NAMES[log.action] || log.action;
        
        let changesHtml = '';
        if (log.changes && typeof log.changes === 'object') {
            changesHtml = '<div class="text-xs mt-1">';
            Object.entries(log.changes).forEach(([field, change]) => {
                if (typeof change === 'object' && change.from !== undefined) {
                    changesHtml += `<span class="text-slate-400">${field}:</span> <span class="text-red-500 line-through">${change.from}</span> → <span class="text-green-500">${change.to}</span><br>`;
                }
            });
            changesHtml += '</div>';
        }
        
        html += `
            <tr class="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                <td class="px-4 py-3 whitespace-nowrap">
                    <div class="text-sm font-medium">${dateStr}</div>
                    <div class="text-xs text-slate-500">${timeStr}</div>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm">${log.userName || log.userEmail}</div>
                    <div class="text-xs text-slate-500">${log.userEmail}</div>
                </td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200">
                        ${actionName}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm">${log.entityName || '—'}</div>
                    <div class="text-xs text-slate-500">${log.entityType}: ${log.entityId || ''}</div>
                </td>
                <td class="px-4 py-3 text-xs max-w-xs">${changesHtml || '—'}</td>
            </tr>
        `;
    });
    
    if (!html) {
        html = '<tr><td colspan="5" class="px-4 py-8 text-center text-slate-500">Нет записей</td></tr>';
    }
    
    tbody.innerHTML = html;
}

function filterLogs() {
    const user = document.getElementById('logsSearchUser')?.value || '';
    const action = document.getElementById('logsFilterAction')?.value || '';
    const date = document.getElementById('logsFilterDate')?.value || '';
    
    renderLogsTable({ user, action, date });
}

function exportLogs() {
    initRolesData();
    const logs = db.activityLogs || [];
    
    if (logs.length === 0) {
        showToast('Нет логов для экспорта');
        return;
    }
    
    // Создаем CSV
    let csv = 'Дата,Время,Пользователь,Email,Действие,Тип объекта,ID объекта,Название объекта\n';
    logs.forEach(log => {
        const date = new Date(log.timestamp);
        csv += `"${date.toLocaleDateString('ru-RU')}","${date.toLocaleTimeString('ru-RU')}","${log.userName}","${log.userEmail}","${ACTION_NAMES[log.action] || log.action}","${log.entityType}","${log.entityId}","${log.entityName}"\n`;
    });
    
    // Скачиваем
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast('Логи экспортированы');
}

