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
        activityLogs: [],
        commercialRequests: [],
        calculations: [],
        companySettings: {}
    };
    
    // Преобразуем items: объект {id: item} -> массив [item, item, ...]
    if (cloudData.items) {
        if (Array.isArray(cloudData.items)) {
            normalized.items = cloudData.items.filter(Boolean);
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
    
    // Преобразуем activityLogs
    if (cloudData.activityLogs) {
        if (Array.isArray(cloudData.activityLogs)) {
            normalized.activityLogs = cloudData.activityLogs.filter(Boolean);
        } else {
            normalized.activityLogs = Object.values(cloudData.activityLogs).filter(Boolean);
        }
    }
    
    // Преобразуем commercialRequests
    if (cloudData.commercialRequests) {
        if (Array.isArray(cloudData.commercialRequests)) {
            normalized.commercialRequests = cloudData.commercialRequests.filter(Boolean);
        } else {
            normalized.commercialRequests = Object.values(cloudData.commercialRequests).filter(Boolean);
        }
    }
    
    // Преобразуем calculations
    if (cloudData.calculations) {
        if (Array.isArray(cloudData.calculations)) {
            normalized.calculations = cloudData.calculations.filter(Boolean);
        } else {
            normalized.calculations = Object.values(cloudData.calculations).filter(Boolean);
        }
    }
    
    // companySettings остаётся объектом
    if (cloudData.companySettings && typeof cloudData.companySettings === 'object' && !Array.isArray(cloudData.companySettings)) {
        normalized.companySettings = cloudData.companySettings;
    }
    
    return normalized;
}

// Преобразует массив в объект с ключами-ID для Firebase
function arrayToObject(arr) {
    const obj = {};
    if (Array.isArray(arr)) {
        arr.forEach(item => {
            if (item && item.id) {
                obj[item.id] = item;
            }
        });
    }
    return obj;
}

// Преобразует объект/массив из Firebase в объект с ключами-ID
function toObjectById(data) {
    if (!data) return {};
    if (Array.isArray(data)) {
        const obj = {};
        data.filter(Boolean).forEach(item => {
            if (item && item.id) obj[item.id] = item;
        });
        return obj;
    }
    return { ...data };
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
                if (hasUnsavedChanges || hasPendingChanges()) {
                    console.warn('Локальные изменения перезаписаны облачными данными');
                }
                db = normalizeCloudData(cloudData); 
                localStorage.setItem('wms_v4_data', JSON.stringify(db)); 
                hasUnsavedChanges = false;
                clearPendingChanges();
                
                // Обновляем данные текущего пользователя
                if (typeof currentUser !== 'undefined' && currentUser && currentUser.id && db.users && db.users[currentUser.id]) {
                    currentUser = { id: currentUser.id, ...db.users[currentUser.id] };
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
                if(!db.commercialRequests) db.commercialRequests = [];
                if(!db.calculations) db.calculations = [];
                if(!db.companySettings) db.companySettings = {};
            } else {
                seedData(); 
            }
        } 
        
        if(db.movements && db.movements.length > 0 && !db.movements[0].id) {
            db.movements.forEach((m, idx) => { if(!m.id) m.id = 'mig_' + Date.now() + '_' + idx; });
        }
        
        migrateAddUpdatedAt();

        const savedPerPage = localStorage.getItem('warehouseItemsPerPage');
        if (savedPerPage === 'all') {
            itemsPerPage = null;
        } else if (savedPerPage) {
            itemsPerPage = parseInt(savedPerPage) || 20;
        }
        
        const savedMassSel = localStorage.getItem('settings_massSelection');
        massSelectionEnabled = savedMassSel === 'true';
        
        const savedDeleteProjects = localStorage.getItem('settings_deleteProjects');
        deleteProjectsEnabled = savedDeleteProjects === 'true';

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
            if(!db.commercialRequests) db.commercialRequests = [];
            if(!db.calculations) db.calculations = [];
            if(!db.companySettings) db.companySettings = {};
            showToast("Оффлайн режим (ошибка сети)");
        }
        
        const savedPerPage = localStorage.getItem('warehouseItemsPerPage');
        if (savedPerPage === 'all') {
            itemsPerPage = null;
        } else if (savedPerPage) {
            itemsPerPage = parseInt(savedPerPage) || 20;
        }

        const savedMassSel = localStorage.getItem('settings_massSelection');
        massSelectionEnabled = savedMassSel === 'true';
        
        const savedDeleteProjects = localStorage.getItem('settings_deleteProjects');
        deleteProjectsEnabled = savedDeleteProjects === 'true';

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
        if (!confirm("Изменений не было. Принудительно синхронизировать?")) return;
    }
    
    showLoader(true); 
    
    try { 
        // ШАГ 1: Загружаем актуальные данные из Firebase
        const snapshot = await dbRef.get();
        let cloudData = {};
        
        if (snapshot.exists()) {
            cloudData = snapshot.val();
        }
        
        // Преобразуем облачные данные в объекты по ID (для удобства слияния)
        let mergedItems = toObjectById(cloudData.items);
        let mergedProjects = toObjectById(cloudData.projects);
        let mergedMovements = toObjectById(cloudData.movements);
        let mergedSpecs = cloudData.specs || {};
        let mergedUsers = cloudData.users || {};
        let mergedRolePermissions = cloudData.rolePermissions || {};
        let mergedCommercialRequests = toObjectById(cloudData.commercialRequests);
        let mergedCalculations = toObjectById(cloudData.calculations);
        let mergedActivityLogs = toObjectById(cloudData.activityLogs);
        let mergedCompanySettings = cloudData.companySettings || {};
        
        let changesCount = 0;
        
        // ШАГ 2: Применяем локальные изменения поверх облачных данных
        
        // --- ITEMS ---
        // Применяем обновления
        for (const id of pendingChanges.items.updated) {
            const localItem = db.items.find(i => String(i.id) === id);
            if (localItem) {
                mergedItems[id] = localItem;
                changesCount++;
            }
        }
        // Применяем удаления
        for (const id of pendingChanges.items.deleted) {
            delete mergedItems[id];
            changesCount++;
        }
        
        // --- PROJECTS ---
        for (const id of pendingChanges.projects.updated) {
            const localItem = db.projects.find(i => String(i.id) === id);
            if (localItem) {
                mergedProjects[id] = localItem;
                changesCount++;
            }
        }
        for (const id of pendingChanges.projects.deleted) {
            delete mergedProjects[id];
            changesCount++;
        }
        
        // --- MOVEMENTS ---
        for (const id of pendingChanges.movements.updated) {
            const localItem = db.movements.find(i => String(i.id) === id);
            if (localItem) {
                mergedMovements[id] = localItem;
                changesCount++;
            }
        }
        for (const id of pendingChanges.movements.deleted) {
            delete mergedMovements[id];
            changesCount++;
        }
        
        // --- SPECS ---
        for (const id of pendingChanges.specs.updated) {
            if (db.specs[id]) {
                mergedSpecs[id] = db.specs[id];
                changesCount++;
            }
        }
        for (const id of pendingChanges.specs.deleted) {
            delete mergedSpecs[id];
            changesCount++;
        }
        
        // --- COMMERCIAL REQUESTS ---
        if (pendingChanges.commercialRequests) {
            for (const id of pendingChanges.commercialRequests.updated) {
                const localItem = db.commercialRequests.find(i => String(i.id) === id);
                if (localItem) {
                    mergedCommercialRequests[id] = localItem;
                    changesCount++;
                }
            }
            for (const id of pendingChanges.commercialRequests.deleted) {
                delete mergedCommercialRequests[id];
                changesCount++;
            }
        }
        
        // --- CALCULATIONS ---
        if (pendingChanges.calculations) {
            for (const id of pendingChanges.calculations.updated) {
                const localItem = db.calculations.find(i => String(i.id) === id);
                if (localItem) {
                    mergedCalculations[id] = localItem;
                    changesCount++;
                }
            }
            for (const id of pendingChanges.calculations.deleted) {
                delete mergedCalculations[id];
                changesCount++;
            }
        }
        
        // --- USERS ---
        if (pendingChanges.users && (pendingChanges.users.updated.size > 0 || pendingChanges.users.deleted.size > 0)) {
            // Для users применяем изменения по ID
            for (const id of pendingChanges.users.updated) {
                if (db.users && db.users[id]) {
                    mergedUsers[id] = db.users[id];
                    changesCount++;
                }
            }
            for (const id of pendingChanges.users.deleted) {
                delete mergedUsers[id];
                changesCount++;
            }
        }
        
        // --- ROLE PERMISSIONS ---
        if (pendingChanges.rolePermissions === true && db.rolePermissions) {
            mergedRolePermissions = db.rolePermissions;
            changesCount++;
        }
        
        // --- COMPANY SETTINGS ---
        if (pendingChanges.companySettings === true && db.companySettings) {
            mergedCompanySettings = db.companySettings;
            changesCount++;
        }
        
        // --- ACTIVITY LOGS ---
        if (pendingChanges.activityLogs === true && db.activityLogs) {
            // Добавляем новые логи к существующим
            db.activityLogs.forEach(log => {
                if (log && log.id) {
                    mergedActivityLogs[log.id] = log;
                }
            });
            changesCount++;
        }
        
        // ШАГ 3: Формируем итоговые данные для сохранения
        const dataToSync = {
            items: mergedItems,
            projects: mergedProjects,
            movements: mergedMovements,
            specs: mergedSpecs,
            users: mergedUsers,
            rolePermissions: mergedRolePermissions,
            commercialRequests: mergedCommercialRequests,
            calculations: mergedCalculations,
            activityLogs: mergedActivityLogs,
            companySettings: mergedCompanySettings
        };
        
        console.log('Syncing merged data. Changes count:', changesCount);
        
        // ШАГ 4: Сохраняем в Firebase
        await dbRef.set(dataToSync);
        
        // ШАГ 5: Обновляем локальную базу актуальными данными
        db = normalizeCloudData(dataToSync);
        localStorage.setItem('wms_v4_data', JSON.stringify(db));
        
        clearPendingChanges();
        hasUnsavedChanges = false;
        updateSyncUI();
        refreshAll();
        
        showToast(`Синхронизировано! (${changesCount} изменений)`);
        
    } catch(e) { 
        console.error('Sync error:', e);
        alert("Ошибка сохранения: " + e.message); 
    } finally { 
        showLoader(false); 
    } 
}

function save(updateUI = true) { 
    localStorage.setItem('wms_v4_data', JSON.stringify(db)); 
    hasUnsavedChanges = true; 
    reservesCacheTimestamp = 0;
    updateSyncUI(); 
    if (updateUI) {
        requestAnimationFrame(() => {
            refreshAll();
        });
    }
}

function updateSyncUI() { 
    const btn = document.getElementById('syncBtn'); 
    const txt = document.getElementById('syncText');
    
    let changesCount = 0;
    if (typeof pendingChanges !== 'undefined') {
        for (const collection of Object.values(pendingChanges)) {
            if (collection && typeof collection === 'object' && collection.updated instanceof Set && collection.deleted instanceof Set) {
                changesCount += collection.updated.size + collection.deleted.size;
            } else if (collection === true) {
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
        movements: [],
        commercialRequests: [],
        calculations: [],
        companySettings: {
            name: '',
            address: '',
            phone: '',
            email: '',
            inn: '',
            kpp: '',
            ogrn: '',
            bank: '',
            bik: '',
            account: '',
            corrAccount: '',
            logo: ''
        }
    }; 
}

function migrateAddUpdatedAt() {
    const now = Date.now();
    let migrated = false;
    
    if (db.items && db.items.length > 0) {
        db.items.forEach(item => {
            if (!item.updatedAt) {
                item.updatedAt = item.id || now;
                migrated = true;
            }
        });
    }
    
    if (db.projects && db.projects.length > 0) {
        db.projects.forEach(project => {
            if (!project.updatedAt) {
                project.updatedAt = project.id || now;
                migrated = true;
            }
        });
    }
    
    if (db.movements && db.movements.length > 0) {
        db.movements.forEach(movement => {
            if (!movement.updatedAt) {
                const numericId = typeof movement.id === 'string' 
                    ? parseInt(movement.id.replace(/\D/g, '')) 
                    : movement.id;
                movement.updatedAt = numericId || now;
                migrated = true;
            }
        });
    }
    
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
    if(typeof renderCommercialRequestsList === 'function') {
        renderCommercialRequestsList();
    }
}
