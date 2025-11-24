// --- DATA LOADING & SYNC ---

async function init(force = false) { 
    showLoader(true); 
    try { 
        if (!isDemoMode && dbRef) { 
            const snapshot = await dbRef.get(); 
            if (snapshot.exists()) { 
                const cloudData = snapshot.val(); 
                if (!hasUnsavedChanges || force) { 
                    db = cloudData; 
                    if(!db.items) db.items = []; 
                    if(!db.projects) db.projects = []; 
                    if(!db.movements) db.movements = []; 
                    if(!db.specs || Array.isArray(db.specs)) db.specs = {}; 
                    localStorage.setItem('wms_v4_data', JSON.stringify(db)); 
                    hasUnsavedChanges = false; 
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

        updatePaginationButtons();
        
        refreshAll(); 
    } finally { 
        showLoader(false); 
    } 
}

async function syncWithCloud() { 
    if (isDemoMode) { 
        alert("В демо-режиме сохранение в облако недоступно."); 
        return; 
    } 
    if(!hasUnsavedChanges && !confirm("Изменений не было. Перезаписать облако текущими данными?")) return; 
    
    showLoader(true); 
    try { 
        await dbRef.set(db); 
        hasUnsavedChanges = false; 
        updateSyncUI(); 
        showToast("Данные сохранены в облаке!"); 
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
    if(hasUnsavedChanges) { 
        btn.className = "sync-fab sync-dirty"; 
        txt.textContent = "Нажмите для сохранения"; 
    } else { 
        btn.className = "sync-fab sync-clean"; 
        txt.textContent = "Синхронизировано"; 
    } 
}

function seedData(){ 
    db = { 
        items: [ 
            {id: 1, name: "Кабель ВВГнг 3х1.5", manuf: "Севкабель", cat: "Электрика", qty: 100, unit: "м", cost: 45, img: ""}, 
            {id: 2, name: "Розетка Schneider Atlas", manuf: "Schneider", cat: "Электрика", qty: 50, unit: "шт", cost: 250, img: ""} 
        ], 
        projects: [], 
        specs: {}, 
        movements: [] 
    }; 
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

