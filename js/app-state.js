// --- APP VARIABLES & STATE ---
let db = { items: [], projects: [], specs: {}, movements: [] };
let currentFilterCat = 'all', selectedProjectId = null, selectedSpecId = null, hasUnsavedChanges = false;
let selectedItems = new Set(); // Множество выбранных товаров для массового удаления
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

// --- PERFORMANCE OPTIMIZATION ---
// Cache for reserves to avoid recalculating on every render
let reservesCache = {};
let reservesCacheTimestamp = 0;
const RESERVES_CACHE_TTL = 1000; // 1 second cache

