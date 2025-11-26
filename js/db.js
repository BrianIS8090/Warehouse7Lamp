// --- DATA LOADING & SYNC ---

// Преобразует данные из Firebase (объекты с ключами) обратно в массивы
function normalizeCloudData(cloudData) {
    const normalized = {
        items: [],
        projects: [],
        movements: [],
        specs: {},
        users: {},
        rolePermissions: {},
        activityLogs: []
    };
    
    // Преобразуем items: объект {id: item} -> массив [item, item, ...]
    if (cloudData.items) {
        if (Array.isArray(cloudData.items)) {
            normalized.items = cloudData.items.filter(Boolean); // Убираем null/undefined
        } else {
            normalized.items = Object.values(cloudData.items).filter(Boolean);
        }
    }
    
    // Преобразуем projects
    if (cloudData.projects) {
        if (Array.isArray(cloudData.projects)) {
            normalized.projects = cloudData.projects.filter(Boolean);
        } else {
            normalized.projects = Object.values(cloudData.projects).filter(Boolean);
        }
    }
    
    // Преобразуем movements
    if (cloudData.movements) {
        if (Array.isArray(cloudData.movements)) {
            normalized.movements = cloudData.movements.filter(Boolean);
        } else {
            normalized.movements = Object.values(cloudData.movements).filter(Boolean);
        }
    }
    
    // specs остаётся объектом
    if (cloudData.specs && !Array.isArray(cloudData.specs)) {
        normalized.specs = cloudData.specs;
    }
    
    // users остаётся объектом
    if (cloudData.users && typeof cloudData.users === 'object' && !Array.isArray(cloudData.users)) {
        normalized.users = cloudData.users;
    }
    
    // rolePermissions остаётся объектом
    if (cloudData.rolePermissions && typeof cloudData.rolePermissions === 'object' && !Array.isArray(cloudData.rolePermissions)) {
        normalized.rolePermissions = cloudData.rolePermissions;
    }
    
    // activityLogs остаётся массивом
    if (cloudData.activityLogs && Array.isArray(cloudData.activityLogs)) {
        normalized.activityLogs = cloudData.activityLogs.filter(Boolean);
    }
    
    return normalized;
}

async function init(force = false) { 
    showLoader(true); 
    return new Promise(async (resolve) => {
    try { 
        if (!isDemoMode && dbRef) { 
            const snapshot = await dbRef.get(); 
            if (snapshot.exists()) { 
                const cloudData = snapshot.val();
                // Всегда загружаем актуальные данные из облака
                // Если были несохранённые изменения — они теряются (приоритет у облачных данных)
                if (hasUnsavedChanges || hasPendingChanges()) {
                    console.warn('Локальные изменения перезаписаны облачными данными');
                }
                db = normalizeCloudData(cloudData); 
                localStorage.setItem('wms_v4_data', JSON.stringify(db)); 
                hasUnsavedChanges = false;
                clearPendingChanges(); // Очищаем pending при загрузке из облака
                
                // Обновляем данные текущего пользователя, если он авторизован
                if (typeof currentUser !== 'undefined' && currentUser && currentUser.id && db.users && db.users[currentUser.id]) {
                    // Обновляем текущего пользователя актуальными данными из облака
                    currentUser = { id: currentUser.id, ...db.users[currentUser.id] };
                    // Обновляем права, если они изменились
                    if (typeof initUserPermissions === 'function' && typeof firebase?.auth === 'object') {
                        const auth = firebase.auth();
                        if (auth && auth.currentUser) {
                            initUserPermissions(auth.currentUser);
                        }
                    }
                }
            } else { 
                seedData(); 
            } 
        } else { 
            const saved = localStorage.getItem('wms_v4_data'); 
            if(saved) { 
                db = JSON.parse(saved); 
                if(!db.items) db.items = []; 
                if(!db.projects) db.projects = []; 
                if(!db.movements) db.movements = []; 
                if(!db.specs || Array.isArray(db.specs)) db.specs = {}; 
            } else {
                seedData(); 
            }
        } 
        
        if(db.movements && db.movements.length > 0 && !db.movements[0].id) {
            db.movements.forEach((m, idx) => { if(!m.id) m.id = 'mig_' + Date.now() + '_' + idx; });
        }
        
        // Миграция: добавляем updatedAt к существующим записям без этого поля
        migrateAddUpdatedAt();

        // Восстанавливаем выбранный режим пагинации из localStorage
        const savedPerPage = localStorage.getItem('warehouseItemsPerPage');
        if (savedPerPage === 'all') {
            itemsPerPage = null;
        } else if (savedPerPage) {
            itemsPerPage = parseInt(savedPerPage) || 20;
        }
        
        // Восстанавливаем настройку массового выбора
        const savedMassSel = localStorage.getItem('settings_massSelection');
        massSelectionEnabled = savedMassSel === 'true';
        
        // Восстанавливаем настройку удаления проектов
        const savedDeleteProjects = localStorage.getItem('settings_deleteProjects');
        deleteProjectsEnabled = savedDeleteProjects === 'true';

        // Загружаем и применяем настройки UI
        if (typeof loadUISettings === 'function') {
            loadUISettings();
        }
        if (typeof applyUISettings === 'function') {
            applyUISettings();
        }

        updatePaginationButtons();
        
        refreshAll(); 
        updateSyncUI(); 
    } catch(e) { 
        console.error(e); 
        const saved = localStorage.getItem('wms_v4_data'); 
        if(saved) { 
            db = JSON.parse(saved); 
            if(!db.items) db.items = []; 
            if(!db.projects) db.projects = []; 
            if(!db.movements) db.movements = []; 
            if(!db.specs || Array.isArray(db.specs)) db.specs = {}; 
            showToast("Оффлайн режим (ошибка сети)");
            // В оффлайн режиме не очищаем pendingChanges - они синхронизируются позже
        }
        
        // Восстанавливаем выбранный режим пагинации из localStorage
        const savedPerPage = localStorage.getItem('warehouseItemsPerPage');
        if (savedPerPage === 'all') {
            itemsPerPage = null;
        } else if (savedPerPage) {
            itemsPerPage = parseInt(savedPerPage) || 20;
        }

        // Восстанавливаем настройку массового выбора
        const savedMassSel = localStorage.getItem('settings_massSelection');
        massSelectionEnabled = savedMassSel === 'true';
        
        // Восстанавливаем настройку удаления проектов
        const savedDeleteProjects = localStorage.getItem('settings_deleteProjects');
        deleteProjectsEnabled = savedDeleteProjects === 'true';

        // Загружаем и применяем настройки UI (catch block)
        if (typeof loadUISettings === 'function') {
            loadUISettings();
        }
        if (typeof applyUISettings === 'function') {
            applyUISettings();
        }

        updatePaginationButtons();
        
        refreshAll(); 
    } finally { 
        showLoader(false); 
        resolve();
    } 
    });
}

async function syncWithCloud() { 
    if (isDemoMode) { 
        alert("В демо-режиме сохранение в облако недоступно."); 
        return; 
    } 
    
    const hasPending = hasPendingChanges();
    if (!hasPending && !hasUnsavedChanges) {
        if (!confirm("Изменений не было. Перезаписать облако текущими данными?")) return;
        // Если пользователь подтвердил — делаем полную синхронизацию
        showLoader(true);
        try {
            await dbRef.set(db);
            hasUnsavedChanges = false;
            updateSyncUI();
            showToast("Данные полностью перезаписаны в облаке!");
        } catch(e) {
            alert("Ошибка сохранения! " + e.message);
        } finally {
            showLoader(false);
        }
        return;
    }
    
    showLoader(true); 
    try { 
        // Собираем все изменения в один объект для batch-обновления
        const updates = {};
        let changesCount = 0;
        
        // Обрабатываем items
        for (const id of pendingChanges.items.updated) {
            const item = db.items.find(i => String(i.id) === id);
            if (item) {
                updates['items/' + id] = item;
                changesCount++;
            }
        }
        for (const id of pendingChanges.items.deleted) {
            updates['items/' + id] = null; // null = удаление в Firebase
            changesCount++;
        }
        
        // Обрабатываем projects
        for (const id of pendingChanges.projects.updated) {
            const project = db.projects.find(p => String(p.id) === id);
            if (project) {
                updates['projects/' + id] = project;
                changesCount++;
            }
        }
        for (const id of pendingChanges.projects.deleted) {
            updates['projects/' + id] = null;
            changesCount++;
        }
        
        // Обрабатываем specs (объект, не массив)
        for (const id of pendingChanges.specs.updated) {
            if (db.specs[id]) {
                updates['specs/' + id] = db.specs[id];
                changesCount++;
            }
        }
        for (const id of pendingChanges.specs.deleted) {
            updates['specs/' + id] = null;
            changesCount++;
        }
        
        // Обрабатываем movements
        for (const id of pendingChanges.movements.updated) {
            const movement = db.movements.find(m => String(m.id) === id);
            if (movement) {
                updates['movements/' + id] = movement;
                changesCount++;
            }
        }
        for (const id of pendingChanges.movements.deleted) {
            updates['movements/' + id] = null;
            changesCount++;
        }
        
        // Обрабатываем users (объект)
        if (pendingChanges.users && (pendingChanges.users.updated.size > 0 || pendingChanges.users.deleted.size > 0)) {
            // Синхронизируем весь объект users, т.к. это объект с ключами-ID
            if (db.users && Object.keys(db.users).length > 0) {
                updates['users'] = db.users;
                changesCount++;
            }
        }
        
        // Обрабатываем rolePermissions (синхронизируем целиком)
        if (pendingChanges.rolePermissions === true) {
            if (db.rolePermissions && Object.keys(db.rolePermissions).length > 0) {
                updates['rolePermissions'] = db.rolePermissions;
                changesCount++;
            }
        }
        
        // Обрабатываем activityLogs (всегда синхронизируем, т.к. логи добавляются часто)
        if (db.activityLogs && Array.isArray(db.activityLogs) && db.activityLogs.length > 0) {
            updates['activityLogs'] = db.activityLogs;
            changesCount++;
        }
        
        if (changesCount > 0) {
            // Инкрементальное обновление через Firebase update()
            await dbRef.update(updates);
            clearPendingChanges();
            hasUnsavedChanges = false;
            updateSyncUI();
            showToast(`Синхронизировано ${changesCount} изменений!`);
        } else if (hasUnsavedChanges) {
            // Fallback: если есть флаг изменений, но нет конкретных — полная синхронизация
            await dbRef.set(db);
            hasUnsavedChanges = false;
            updateSyncUI();
            showToast("Данные сохранены в облаке!");
        }
    } catch(e) { 
        alert("Ошибка сохранения! " + e.message); 
    } finally { 
        showLoader(false); 
    } 
}

function save(updateUI = true) { 
    localStorage.setItem('wms_v4_data', JSON.stringify(db)); 
    hasUnsavedChanges = true; 
    // Invalidate reserves cache when data changes
    reservesCacheTimestamp = 0;
    updateSyncUI(); 
    // Only refresh UI if explicitly requested (for performance)
    if (updateUI) {
        // Use requestAnimationFrame to batch DOM updates
        requestAnimationFrame(() => {
            refreshAll();
        });
    }
}

function updateSyncUI() { 
    const btn = document.getElementById('syncBtn'); 
    const txt = document.getElementById('syncText');
    
    // Подсчитываем количество ожидающих изменений
    let changesCount = 0;
    if (typeof pendingChanges !== 'undefined') {
        for (const collection of Object.values(pendingChanges)) {
            if (
                collection &&
                typeof collection === 'object' &&
                collection.updated instanceof Set &&
                collection.deleted instanceof Set
            ) {
                changesCount += collection.updated.size + collection.deleted.size;
            } else if (collection === true) {
                // Булевы флаги (rolePermissions, activityLogs) считаем как одно изменение
                changesCount += 1;
            }
        }
    }
    
    if(hasUnsavedChanges || changesCount > 0) { 
        btn.className = "sync-fab sync-dirty";
        if (changesCount > 0) {
            txt.textContent = `${changesCount} изменений`;
        } else {
            txt.textContent = "Нажмите для сохранения";
        }
    } else { 
        btn.className = "sync-fab sync-clean"; 
        txt.textContent = "Синхронизировано"; 
    } 
}

function seedData(){ 
    const now = Date.now();
    db = { 
        items: [ 
            {id: 1, name: "Кабель ВВГнг 3х1.5", manuf: "Севкабель", cat: "Электрика", qty: 100, unit: "м", cost: 45, img: "", updatedAt: now}, 
            {id: 2, name: "Розетка Schneider Atlas", manuf: "Schneider", cat: "Электрика", qty: 50, unit: "шт", cost: 250, img: "", updatedAt: now} 
        ], 
        projects: [], 
        specs: {}, 
        movements: [] 
    }; 
}

// Миграция: добавляет updatedAt к существующим записям для инкрементальной синхронизации
function migrateAddUpdatedAt() {
    const now = Date.now();
    let migrated = false;
    
    // Миграция items
    if (db.items && db.items.length > 0) {
        db.items.forEach(item => {
            if (!item.updatedAt) {
                item.updatedAt = item.id || now; // Используем id как timestamp, т.к. id = Date.now()
                migrated = true;
            }
        });
    }
    
    // Миграция projects
    if (db.projects && db.projects.length > 0) {
        db.projects.forEach(project => {
            if (!project.updatedAt) {
                project.updatedAt = project.id || now;
                migrated = true;
            }
        });
    }
    
    // Миграция movements
    if (db.movements && db.movements.length > 0) {
        db.movements.forEach(movement => {
            if (!movement.updatedAt) {
                // Для movements id может быть строкой типа 'mov_1234567890'
                const numericId = typeof movement.id === 'string' 
                    ? parseInt(movement.id.replace(/\D/g, '')) 
                    : movement.id;
                movement.updatedAt = numericId || now;
                migrated = true;
            }
        });
    }
    
    // Миграция specs (объект)
    if (db.specs && typeof db.specs === 'object') {
        Object.values(db.specs).forEach(specList => {
            if (Array.isArray(specList)) {
                specList.forEach(spec => {
                    if (!spec.updatedAt) {
                        const numericId = typeof spec.id === 'string'
                            ? parseInt(spec.id.replace(/\D/g, ''))
                            : spec.id;
                        spec.updatedAt = numericId || now;
                        migrated = true;
                    }
                });
            }
        });
    }
    
    // Сохраняем если была миграция
    if (migrated) {
        localStorage.setItem('wms_v4_data', JSON.stringify(db));
        console.log('Migration: updatedAt added to existing records');
    }
}

function refreshAll(){ 
        renderCategoryList(); 
        renderWarehouse(); 
        renderDatalists(); 
        renderProjects(); 
        if(selectedProjectId){
            renderSpecProjectList();
        } 
        if(selectedSpecId) loadSpec(selectedSpecId);
    renderHistoryTable(); 
    renderDashboard(); 
}

