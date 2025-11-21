// --- DATABASE MODULE ---
// Handles all data operations: CRUD, sync, import/export

// Database state
let db = { items: [], projects: [], specs: {}, movements: [] };
let hasUnsavedChanges = false;

// Initialize database
async function init(force = false) { 
    if (typeof showLoader === 'function') {
        showLoader(true); 
    }
    try { 
        const isDemoMode = window.isDemoMode || false;
        const dbRef = window.dbRef;
        
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
            db.movements.forEach((movement, idx) => { 
                if(!movement.id) movement.id = 'mig_' + Date.now() + '_' + idx; 
            });
        }

        // Восстанавливаем выбранный режим пагинации из localStorage
        const savedPerPage = localStorage.getItem('warehouseItemsPerPage');
        if (savedPerPage === 'all') {
            if (typeof window !== 'undefined') window.itemsPerPage = null;
        } else if (savedPerPage) {
            if (typeof window !== 'undefined') window.itemsPerPage = parseInt(savedPerPage) || 20;
        }
        
        // Wait a bit for app.js to load, then call refresh functions
        setTimeout(() => {
            if (typeof window !== 'undefined' && typeof window.updatePaginationButtons === 'function') {
                window.updatePaginationButtons();
            }
            if (typeof window !== 'undefined' && typeof window.refreshAll === 'function') {
                window.refreshAll(); 
            }
            if (typeof window !== 'undefined' && typeof window.updateSyncUI === 'function') {
                window.updateSyncUI(); 
            }
        }, 150);
    } catch(e) { 
        console.error(e); 
        const saved = localStorage.getItem('wms_v4_data'); 
        if(saved) { 
            db = JSON.parse(saved); 
            if(!db.items) db.items = []; 
            if(!db.projects) db.projects = []; 
            if(!db.movements) db.movements = []; 
            if(!db.specs || Array.isArray(db.specs)) db.specs = {}; 
            if (typeof showToast === 'function') {
                showToast("Оффлайн режим (ошибка сети)"); 
            }
        }
        
        // Восстанавливаем выбранный режим пагинации из localStorage
        const savedPerPage = localStorage.getItem('warehouseItemsPerPage');
        if (savedPerPage === 'all') {
            if (typeof window !== 'undefined') window.itemsPerPage = null;
        } else if (savedPerPage) {
            if (typeof window !== 'undefined') window.itemsPerPage = parseInt(savedPerPage) || 20;
        }
        
        // Wait a bit for app.js to load, then call refresh functions
        setTimeout(() => {
            if (typeof window !== 'undefined' && typeof window.updatePaginationButtons === 'function') {
                window.updatePaginationButtons();
            }
            if (typeof window !== 'undefined' && typeof window.refreshAll === 'function') {
                window.refreshAll(); 
            }
        }, 150);
    } finally { 
        if (typeof showLoader === 'function') {
            showLoader(false); 
        }
    } 
}

// Sync with cloud
async function syncWithCloud() { 
    const isDemoMode = window.isDemoMode || false;
    if (isDemoMode) { 
        alert("В демо-режиме сохранение в облако недоступно."); 
        return; 
    } 
    if(!hasUnsavedChanges && !confirm("Изменений не было. Перезаписать облако текущими данными?")) return; 
    
    if (typeof showLoader === 'function') {
        showLoader(true); 
    }
    try { 
        await window.dbRef.set(db); 
        hasUnsavedChanges = false; 
        if (typeof updateSyncUI === 'function') {
            updateSyncUI(); 
        }
        if (typeof showToast === 'function') {
            showToast("Данные сохранены в облаке!"); 
        }
    } catch(e) { 
        alert("Ошибка сохранения! " + e.message); 
    } finally { 
        if (typeof showLoader === 'function') {
            showLoader(false); 
        }
    } 
}

// Save to localStorage
function save(updateUI = true) { 
    localStorage.setItem('wms_v4_data', JSON.stringify(db)); 
    hasUnsavedChanges = true; 
    // Invalidate reserves cache when data changes
    if (typeof reservesCacheTimestamp !== 'undefined') {
        window.reservesCacheTimestamp = 0;
    }
    if (typeof updateSyncUI === 'function') {
        updateSyncUI(); 
    }
    // Only refresh UI if explicitly requested (for performance)
    if (updateUI && typeof refreshAll === 'function') {
        // Use requestAnimationFrame to batch DOM updates
        requestAnimationFrame(() => {
            refreshAll();
        });
    }
}

// Seed initial data
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

// Import JSON data
function importData(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedDb = JSON.parse(e.target.result);
            if (confirm("Внимание! Текущая база будет полностью заменена данными из файла. Продолжить?")) {
                db = importedDb;
                if(!db.items) db.items = []; 
                if(!db.projects) db.projects = []; 
                if(!db.movements) db.movements = []; 
                if(!db.specs || Array.isArray(db.specs)) db.specs = {}; 
                
                save();
                if (typeof closeModal === 'function') {
                    closeModal('settingsModal');
                }
                if (typeof showToast === 'function') {
                    showToast("База успешно загружена");
                }
            }
        } catch (err) {
            alert("Ошибка чтения файла: " + err.message);
        }
    };
    reader.readAsText(file);
    input.value = ''; 
}

// Import legacy CSV data
function importLegacyCSV(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        if (!confirm("Добавить данные из CSV к текущей базе? (Дубликаты могут быть созданы)")) return;

        try {
            const rows = parseCSV(text);
            let importedCount = 0;
            
            // Skip header row (index 0)
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (row.length < 2) continue; // Skip empty rows

                // Mapping based on "7LampData - Sklad.csv" structure:
                // 0:ItemID, 1:Наименование, 2:Производитель, 3:Категория, 4:Склад, 5:Ед.изм., 6:Стоимость, ... 10:Характеристики, ... 12:Изображение
                
                // Clean up cost string (remove spaces, commas to dots if needed)
                let costStr = row[6] ? row[6].toString().replace(/\s/g, '').replace(',', '.') : '0';
                let qtyStr = row[4] ? row[4].toString().replace(/\s/g, '').replace(',', '.') : '0';
                let imgPath = row[12] || '';

                // Generate a numeric ID to be compatible with new system
                const newItem = {
                    id: Date.now() + i, 
                    name: row[1] || 'Без названия',
                    manuf: row[2] || '',
                    cat: row[3] || 'Разное',
                    qty: parseFloat(qtyStr) || 0,
                    unit: row[5] || 'шт.',
                    cost: parseFloat(costStr) || 0,
                    chars: row[10] || '',
                    img: imgPath, 
                    file: row[14] || ''
                };

                db.items.push(newItem);
                
                // Add initial movement record
                if (newItem.qty > 0) {
                    db.movements.push({
                        id: 'mov_imp_' + newItem.id,
                        date: new Date().toLocaleString(),
                        type: 'in',
                        itemId: newItem.id,
                        itemName: newItem.name,
                        qty: newItem.qty
                    });
                }
                importedCount++;
            }

            save();
            if (typeof closeModal === 'function') {
                closeModal('settingsModal');
            }
            if (typeof showToast === 'function') {
                showToast(`Импортировано ${importedCount} товаров`);
            }
            
        } catch (err) {
            console.error(err);
            alert("Ошибка при разборе CSV: " + err.message);
        }
    };
    // Read as UTF-8
    reader.readAsText(file, 'UTF-8'); 
    input.value = '';
}

// Export functions are in utils.js, but we need to make db accessible
// Make db and functions global
if (typeof window !== 'undefined') {
    // Expose db for other modules - use getter/setter to keep in sync
    Object.defineProperty(window, 'db', {
        get: () => db,
        set: (value) => { 
            db = value; 
            // Ensure structure
            if(!db.items) db.items = [];
            if(!db.projects) db.projects = [];
            if(!db.movements) db.movements = [];
            if(!db.specs || Array.isArray(db.specs)) db.specs = {};
        },
        configurable: true
    });
    
    // Initialize db on window
    window.db = db;
    
    // Expose functions
    window.hasUnsavedChanges = () => hasUnsavedChanges;
    window.init = init;
    window.syncWithCloud = syncWithCloud;
    window.save = save;
    window.seedData = seedData;
    window.importData = importData;
    window.importLegacyCSV = importLegacyCSV;
}

