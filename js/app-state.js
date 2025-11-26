// --- APP VARIABLES & STATE ---
let db = { items: [], projects: [], specs: {}, movements: [], commercialRequests: [], calculations: [], companySettings: {} };
let currentFilterCat = 'all', selectedProjectId = null, selectedSpecId = null, hasUnsavedChanges = false;
let selectedItems = new Set(); // Множество выбранных товаров для массового удаления

// --- COMMERCIAL MODULE STATE ---
let selectedCommercialRequestId = null;
let selectedProposalId = null;
let expandedCommercialRequests = new Set(); // Раскрытые запросы в дереве

// --- INCREMENTAL SYNC: Отслеживание изменений для инкрементальной синхронизации ---
let pendingChanges = {
    items: { updated: new Set(), deleted: new Set() },
    projects: { updated: new Set(), deleted: new Set() },
    specs: { updated: new Set(), deleted: new Set() },
    movements: { updated: new Set(), deleted: new Set() },
    users: { updated: new Set(), deleted: new Set() }, // Для синхронизации пользователей
    rolePermissions: false, // true = нужно синхронизировать всю структуру
    activityLogs: false, // true = нужно синхронизировать весь массив
    commercialRequests: { updated: new Set(), deleted: new Set() },
    calculations: { updated: new Set(), deleted: new Set() },
    companySettings: false // true = нужно синхронизировать настройки компании
};

// Вспомогательные функции для отслеживания изменений
function markChanged(collection, id) {
    if (pendingChanges[collection]) {
        pendingChanges[collection].updated.add(String(id));
        // Если элемент был ранее удалён, убираем из deleted
        pendingChanges[collection].deleted.delete(String(id));
    }
}

function markDeleted(collection, id) {
    if (pendingChanges[collection]) {
        pendingChanges[collection].deleted.add(String(id));
        // Убираем из updated, т.к. элемент удалён
        pendingChanges[collection].updated.delete(String(id));
    }
}

function clearPendingChanges() {
    pendingChanges = {
        items: { updated: new Set(), deleted: new Set() },
        projects: { updated: new Set(), deleted: new Set() },
        specs: { updated: new Set(), deleted: new Set() },
        movements: { updated: new Set(), deleted: new Set() },
        users: { updated: new Set(), deleted: new Set() },
        rolePermissions: false,
        activityLogs: false,
        commercialRequests: { updated: new Set(), deleted: new Set() },
        calculations: { updated: new Set(), deleted: new Set() },
        companySettings: false
    };
}

function hasPendingChanges() {
    for (const [key, collection] of Object.entries(pendingChanges)) {
        if (key === 'rolePermissions' || key === 'activityLogs' || key === 'companySettings') {
            if (collection === true) return true;
        } else if (collection.updated && (collection.updated.size > 0 || collection.deleted.size > 0)) {
            return true;
        }
    }
    return false;
}
let massSelectionEnabled = false;
let deleteProjectsEnabled = false;
let expandedProjects = new Set(); // Множество раскрытых проектов в дереве спецификаций

// Pagination Variables
let currentPage = 1;
let itemsPerPage = 20; // Может быть 20, 100 или null (все)
let totalPages = 1;

let sortState = {
    warehouse: { key: 'id', dir: 'desc' },
    projects: { key: 'num', dir: 'desc' }
};

// --- UI CUSTOMIZATION SETTINGS ---
// Object to store user UI preferences (persisted to localStorage)
let userUISettings = {
    categoryPanelPosition: 'left' // 'left' or 'right'
    // Future settings can be added here:
    // compactMode: false,
    // tableColumnOrder: [],
    // etc.
};

// --- PERFORMANCE OPTIMIZATION ---
// Cache for reserves to avoid recalculating on every render
let reservesCache = {};
let reservesCacheTimestamp = 0;
const RESERVES_CACHE_TTL = 1000; // 1 second cache

