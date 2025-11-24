// --- 1. FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyChf2f13grceK8sjkPP7dKz6_1YP1RLkZE", 
    authDomain: "warehouse7lamp.firebaseapp.com", 
    databaseURL: "https://warehouse7lamp-default-rtdb.europe-west1.firebasedatabase.app", 
    projectId: "warehouse7lamp", 
    storageBucket: "warehouse7lamp.firebasestorage.app", 
    messagingSenderId: "349274471054", 
    appId: "1:349274471054:web:03302aeb9b42135ae5e7df", 
    measurementId: "G-9NLYY972T8"
};

let auth, dbRef, isDemoMode = false;

try { 
    firebase.initializeApp(firebaseConfig); 
    dbRef = firebase.database().ref('warehouse_v4'); 
    auth = firebase.auth(); 
    document.getElementById('techInfo').innerText = "SDK Loaded. AppID: " + firebaseConfig.appId.substring(0,15) + "..."; 
} catch (e) { 
    console.error("Firebase Init Error:", e); 
    document.getElementById('loginError').innerHTML = "Ошибка инициализации Firebase.<br>Проверьте консоль (F12).<br>" + e.message; 
    document.getElementById('loginError').classList.remove('hidden'); 
}

// --- 2. APP VARIABLES & SORT STATE ---
let db = { items: [], projects: [], specs: {}, movements: [] };
let currentFilterCat = 'all', selectedProjectId = null, selectedSpecId = null, hasUnsavedChanges = false;
let selectedItems = new Set(); // Множество выбранных товаров для массового удаления
let massSelectionEnabled = false;

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

// Debounce function for search input
let searchDebounceTimer = null;
function debounce(func, wait) {
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(searchDebounceTimer);
            func(...args);
        };
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(later, wait);
    };
}

// --- NEW: THEME LOGIC ---
function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        document.getElementById('themeIcon').className = 'fas fa-moon';
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        document.getElementById('themeIcon').className = 'fas fa-sun';
    }
}

function toggleMassSelectionSetting(checked) {
    massSelectionEnabled = checked;
    localStorage.setItem('settings_massSelection', checked);
    
    // Если выключили, очищаем выбор
    if (!checked) {
        selectedItems.clear();
        updateDeleteButton();
    }
    
    renderWarehouse();
    
    // Если открыта карточка товара, обновляем видимость кнопки удаления
    const itemCardModal = document.getElementById('itemCardModal');
    if (itemCardModal && !itemCardModal.classList.contains('hidden')) {
        const viewOnly = itemCardModal.dataset.viewOnly === 'true';
        setItemCardViewMode(viewOnly);
    }
}

// Init Theme
(function() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        // Wait for DOM to update icon
        window.addEventListener('DOMContentLoaded', () => {
            const icon = document.getElementById('themeIcon');
            if(icon) icon.className = 'fas fa-sun';
        });
    }
})();

// --- HELPER: Convert Google Drive Links ---
function getDirectImageUrl(url) {
    if (!url) return "";
    
    const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /id=([a-zA-Z0-9_-]+)/
    ];

    for (let pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return `https://drive.google.com/uc?export=view&id=${match[1]}`;
        }
    }
    return url;
}

// --- 3. AUTHENTICATION ---
if (auth) { 
    auth.onAuthStateChanged((user) => { 
        if (user) { 
            document.getElementById('loginScreen').classList.add('hidden'); 
            document.getElementById('connectionStatus').innerText = "Online (Cloud)"; 
            document.getElementById('connectionStatus').classList.add("text-green-600"); 
            
            const userEmailText = document.getElementById('userEmailText');
            if (userEmailText) {
                userEmailText.textContent = user.email;
                userEmailText.classList.remove('hidden');
            }

            init(false); 
        } else { 
            if(!isDemoMode) { 
                document.getElementById('loginScreen').classList.remove('hidden'); 
                document.getElementById('globalLoader').style.display = 'none'; 
            } 
        } 
    }); 
}

function login() { 
    const em = document.getElementById('loginEmail').value; 
    const pw = document.getElementById('loginPass').value; 
    const err = document.getElementById('loginError'); 
    
    if (!em || !pw) { 
        err.textContent = "Введите почту и пароль!"; 
        err.classList.remove('hidden'); 
        return; 
    } 
    if (!auth) { 
        err.innerHTML = "Firebase не инициализирован. Попробуйте <b>Демо вход</b>."; 
        err.classList.remove('hidden'); 
        return; 
    } 
    
    showLoader(true); 
    err.classList.add('hidden'); 
    
    auth.signInWithEmailAndPassword(em, pw)
        .then(() => { console.log("Вход выполнен успешно"); })
        .catch((error) => { 
            showLoader(false); 
            console.error("Ошибка входа:", error); 
            let msg = `Ошибка (${error.code}): ${error.message}`; 
            if (error.code === 'auth/invalid-email') msg = "Некорректный формат Email"; 
            if (error.code === 'auth/user-not-found') msg = "Пользователь не найден. Зарегистрируйте его в консоли Firebase."; 
            if (error.code === 'auth/wrong-password') msg = "Неверный пароль"; 
            if (error.code === 'auth/network-request-failed') msg = "Нет сети или доступ заблокирован (CORS/Firewall)."; 
            if (error.code === 'auth/operation-not-allowed') msg = "Вход по Email/Пароль отключен в консоли Firebase!"; 
            err.innerHTML = `<b>Ошибка входа:</b><br>${msg}`; 
            err.classList.remove('hidden'); 
        }); 
}

function demoLogin() { 
    isDemoMode = true; 
    document.getElementById('loginScreen').classList.add('hidden'); 
    document.getElementById('connectionStatus').innerText = "Demo (Local)"; 
    document.getElementById('connectionStatus').classList.add("text-orange-500"); 
    
    const userEmailText = document.getElementById('userEmailText');
    if (userEmailText) {
        userEmailText.textContent = "Demo User";
        userEmailText.classList.remove('hidden');
    }

    showToast("Демо режим: данные не сохраняются в облако"); 
    seedData(); 
    init(true); 
}

function logout() { 
    if(hasUnsavedChanges && !confirm("Есть несохраненные данные. Точно выйти?")) return; 
    if (isDemoMode) { 
        isDemoMode = false; 
        location.reload(); 
    } else if (auth) { 
        auth.signOut().then(() => location.reload()); 
    } 
}

// --- 4. DATA LOADING & SYNC ---
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

// --- HELPERS ---
function showLoader(v){
    const el = document.getElementById('globalLoader'); 
    if(el) el.style.display=v?'flex':'none';
}

function showToast(m){
    const t=document.getElementById('toast');
    document.getElementById('toastMsg').textContent=m;
    t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'),2000);
}

function formatNumber(value, decimals = 2) {
    const num = Number(value);
    if (Number.isNaN(num)) return '0';
    const rounded = Number(num.toFixed(decimals));
    let str = rounded.toFixed(decimals);
    if (str.includes('.')) {
        str = str.replace(/\.?0+$/, '');
    }
    return str === '' ? '0' : str;
}

function formatCurrency(value, decimals = 2) {
    return `${formatNumber(value, decimals)} ₽`;
}

function refreshAll(){ 
    renderCategoryList(); 
    renderWarehouse(); 
    renderDatalists(); 
    renderProjects(); 
    if(selectedProjectId){
        renderSpecProjectList();
        renderSpecList(selectedProjectId);
    } 
    if(selectedSpecId) loadSpec(selectedSpecId); 
    renderHistoryTable(); 
    renderDashboard(); 
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

// --- NAVIGATION ---
function switchTab(t) { 
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden')); 
    document.getElementById(`view-${t}`).classList.remove('hidden'); 
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active')); 
    const btn = document.getElementById(`tab-${t}`); 
    if(btn) btn.classList.add('active'); 
    
    if(t==='projects') renderProjects(); 
    if(t==='specs') renderSpecProjectList(); 
    if(t==='warehouse') {
        renderCategoryList(); 
        updatePaginationButtons(); // Обновляем кнопки при переключении на вкладку
        renderWarehouse();
    } 
    if(t==='movements') renderHistoryTable(); 
    if(t==='dashboard') renderDashboard(); 
}

// --- WAREHOUSE LOGIC ---
// Optimized getReserve with caching
function getReserve(itemId) {
    const now = Date.now();
    // Invalidate cache if too old or if specs changed
    if (now - reservesCacheTimestamp > RESERVES_CACHE_TTL || !reservesCache[itemId]) {
        // Recalculate all reserves at once
        reservesCache = {};
        const specs = db.specs || {}; 
        Object.values(specs).flat().forEach(s => { 
            if(s.status === 'draft') { 
                s.items.forEach(item => {
                    if (!item.isCustom && item.itemId) {
                        reservesCache[item.itemId] = (reservesCache[item.itemId] || 0) + item.qty;
                    }
                });
            } 
        });
        reservesCacheTimestamp = now;
    }
    return reservesCache[itemId] || 0;
}

function renderCategoryList() { 
    if (!db || !db.items) return; 
    
    const items = db.items; 
    const list = document.getElementById('categoryList'); 
    if (!list) return;

    const totalUnique = items.length;
    const totalUnits = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    const formattedTotalUnique = formatNumber(totalUnique);
    const formattedTotalUnits = formatNumber(totalUnits);
    
    const cats = [...new Set(items.map(i => i.cat))].sort((a, b) => {
        const labelA = (a || '').toLowerCase();
        const labelB = (b || '').toLowerCase();
        return labelA.localeCompare(labelB, 'ru');
    }); 

    const catCounts = items.reduce((acc, item) => {
        const key = item.cat;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    const baseClass = 'p-2 rounded cursor-pointer transition mb-1 text-sm flex items-center justify-between gap-2';
    const activeClass = 'bg-blue-100 text-blue-700 font-bold shadow-sm border-l-4 border-blue-600 dark:bg-slate-700 dark:text-blue-400 dark:border-blue-400';
    const inactiveClass = 'text-slate-600 hover:bg-slate-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-blue-400';
    const badgeClass = isActive => isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-300';

    let html = `
        <div class="p-3 mb-2 rounded-lg bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600">
            <div class="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-300 tracking-wide">Уникальных товаров</div>
            <div class="text-2xl font-extrabold text-slate-800 dark:text-white">${formattedTotalUnique}</div>
            <div class="text-[11px] text-slate-500 dark:text-slate-300 mt-1">Суммарный остаток: ${formattedTotalUnits}</div>
        </div>
    `;

    const allActive = currentFilterCat === 'all';
    html += `
        <div onclick="filterCat('all')" class="${baseClass} ${allActive ? activeClass : inactiveClass}">
            <span>Все категории</span>
            <span class="text-[11px] font-semibold ${badgeClass(allActive)}">${formattedTotalUnique}</span>
        </div>
    `;

    cats.forEach(c => { 
        const isActive = currentFilterCat === c;
        const displayName = c || 'Без категории';
        const count = catCounts[c] || 0;
        const handler = c === undefined ? 'filterCat()' : `filterCat(${JSON.stringify(c)})`;

        html += `
            <div onclick='${handler}' class="${baseClass} ${isActive ? activeClass : inactiveClass}">
                <span class="truncate">${displayName}</span>
                <span class="text-[11px] font-semibold ${badgeClass(isActive)}">${formatNumber(count)}</span>
            </div>
        `;
    }); 

    list.innerHTML = html;

    const dl = document.getElementById('catDataList'); 
    if (dl) { 
        dl.innerHTML = ''; 
        cats.forEach(c => dl.innerHTML += `<option value="${c}">`); 
    } 
}

function filterCat(cat) { 
    currentFilterCat = cat; 
    currentPage = 1; // Сбрасываем на первую страницу при смене категории
    selectedItems.clear(); // Сбрасываем выбор при смене категории
    renderCategoryList(); 
    renderWarehouse(); 
}

function setWarehouseSort(key) {
    if (sortState.warehouse.key === key) {
        sortState.warehouse.dir = sortState.warehouse.dir === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.warehouse.key = key;
        sortState.warehouse.dir = 'asc';
    }
    renderWarehouse();
}

// Debounced version of renderWarehouse for search input
const debouncedRenderWarehouse = debounce(() => {
    currentPage = 1; // Сбрасываем на первую страницу при поиске
    // Не сбрасываем выбор при поиске, чтобы пользователь мог выбрать товары на разных страницах
    renderWarehouse();
}, 300);

// Pagination Functions
function setItemsPerPage(count) {
    itemsPerPage = count;
    currentPage = 1; // Сбрасываем на первую страницу при смене режима
    // Сохраняем выбор в localStorage
    if (count === null) {
        localStorage.setItem('warehouseItemsPerPage', 'all');
    } else {
        localStorage.setItem('warehouseItemsPerPage', count.toString());
    }
    updatePaginationButtons();
    renderWarehouse();
}

function updatePaginationButtons() {
    // Обновляем стили кнопок выбора количества
    const btn20 = document.getElementById('btnPerPage20');
    const btn100 = document.getElementById('btnPerPage100');
    const btnAll = document.getElementById('btnPerPageAll');
    
    // Если элементы еще не загружены, выходим
    if (!btn20 || !btn100 || !btnAll) return;
    
    // Сбрасываем все кнопки к неактивному состоянию
    [btn20, btn100, btnAll].forEach(btn => {
        btn.className = 'px-3 py-1 bg-white dark:bg-slate-700 border dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-600 transition text-xs font-medium';
    });
    
    // Активируем выбранную кнопку
    if (itemsPerPage === 20) {
        btn20.className = 'px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-medium';
    } else if (itemsPerPage === 100) {
        btn100.className = 'px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-medium';
    } else if (itemsPerPage === null) {
        btnAll.className = 'px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-medium';
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderWarehouse();
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        renderWarehouse();
    }
}

// Optimized renderWarehouse with DocumentFragment and performance improvements
function renderWarehouse() { 
    const tbody = document.getElementById('warehouseTableBody'); 
    const q = document.getElementById('warehouseSearch').value.toLowerCase().trim(); 
    const items = db.items || []; 
    
    // Handle header visibility
    const headerCheckbox = document.getElementById('selectAllItems');
    if(headerCheckbox && headerCheckbox.parentElement) {
         if(massSelectionEnabled) {
             headerCheckbox.parentElement.classList.remove('hidden');
         } else {
             headerCheckbox.parentElement.classList.add('hidden');
         }
    }
    
    // Pre-filter items (more efficient than chaining)
    let filtered = [];
    const isAllCats = currentFilterCat === 'all';
    const hasSearch = q.length > 0;
    
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!isAllCats && item.cat !== currentFilterCat) continue;
        if (hasSearch && !item.name.toLowerCase().includes(q) && !item.manuf.toLowerCase().includes(q)) continue;
        filtered.push(item);
    }

    // Optimized sorting
    const key = sortState.warehouse.key;
    const dir = sortState.warehouse.dir;
    const isAsc = dir === 'asc';
    
    if (key === 'name' || key === 'manuf' || key === 'cat') {
        filtered.sort((a, b) => {
            const va = (a[key] || '').toLowerCase();
            const vb = (b[key] || '').toLowerCase();
            return isAsc ? va.localeCompare(vb) : vb.localeCompare(va);
        });
    } else {
        filtered.sort((a, b) => {
            const va = a[key] || 0;
            const vb = b[key] || 0;
            return isAsc ? va - vb : vb - va;
        });
    }

    // Pagination Logic
    const paginationNavEl = document.getElementById('warehousePaginationNav');
    const pageIndicator = document.getElementById('pageIndicator');
    const btnPrev = document.getElementById('btnPrevPage');
    const btnNext = document.getElementById('btnNextPage');
    
    // Вычисляем пагинацию
    if (itemsPerPage === null) {
        // Режим "Все" - показываем все товары, скрываем только навигацию по страницам
        totalPages = 1;
        currentPage = 1;
        if (paginationNavEl) paginationNavEl.classList.add('hidden');
    } else {
        // Режим с ограничением - показываем навигацию по страницам
        totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
        if (currentPage > totalPages) currentPage = totalPages;
        if (paginationNavEl) paginationNavEl.classList.remove('hidden');
        
        // Обновляем индикатор страницы
        if (pageIndicator) {
            pageIndicator.textContent = `Стр. ${currentPage} из ${totalPages}`;
        }
        
        // Обновляем состояние кнопок навигации
        if (btnPrev) {
            btnPrev.disabled = currentPage === 1;
        }
        if (btnNext) {
            btnNext.disabled = currentPage >= totalPages;
        }
    }

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    if (filtered.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="10" class="p-8 text-center text-slate-400">Ничего не найдено</td>';
        fragment.appendChild(emptyRow);
    } else {
        // Pre-calculate reserves for all items at once (cache optimization)
        getReserve(0); // This will populate the cache
        
        // Определяем диапазон товаров для отображения
        let startIndex = 0;
        let endIndex = filtered.length;
        
        if (itemsPerPage !== null) {
            startIndex = (currentPage - 1) * itemsPerPage;
            endIndex = Math.min(startIndex + itemsPerPage, filtered.length);
        }
        
        // Create rows using DocumentFragment
        for (let i = startIndex; i < endIndex; i++) {
            const item = filtered[i];
            const res = getReserve(item.id);
            const free = item.qty - res;
            const freeColor = free < 0 ? 'text-red-600 dark:text-red-400' : (free < 5 ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400');
            const qtyDisplay = formatNumber(item.qty);
            const resDisplay = res > 0 ? formatNumber(res) : '-';
            const freeDisplay = formatNumber(free);
            const costDisplay = formatCurrency(item.cost);
            
            const row = document.createElement('tr');
            row.className = 'border-b dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer transition h-14 group';
            row.onclick = () => openItemCard(item.id);
            
            const img = item.img ? `<img src="${item.img}" class="w-10 h-10 object-cover rounded border border-slate-300 mx-auto" alt="фото" onerror="this.src='https://placehold.co/40'">` : '<span class="text-slate-300">-</span>';
            const fileIcon = item.file ? `<a href="${item.file}" target="_blank" onclick="event.stopPropagation()" class="ml-2 text-slate-400 hover:text-blue-600" title="Скачать файл"><i class="fas fa-file-alt"></i></a>` : '';
            
            const isSelected = selectedItems.has(item.id);
            
            const checkboxCell = massSelectionEnabled ? `
                <td class="px-2 py-3 text-center" onclick="event.stopPropagation()">
                    <input type="checkbox" class="item-checkbox w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer" 
                           data-item-id="${item.id}" 
                           ${isSelected ? 'checked' : ''} 
                           onchange="toggleItemSelection(${item.id}, this.checked)">
                </td>
            ` : `<td class="hidden"></td>`;
            
            row.innerHTML = `
                ${checkboxCell}
                <td class="px-2 py-3 text-center">
                    <div class="flex gap-1 justify-center">
                        <button onclick="event.stopPropagation(); openQuickMove(${item.id}, 'in')" class="w-7 h-7 rounded bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 flex items-center justify-center" title="Приход">
                            <i class="fas fa-arrow-down text-xs"></i>
                        </button>
                        <button onclick="event.stopPropagation(); openQuickMove(${item.id}, 'out')" class="w-7 h-7 rounded bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 flex items-center justify-center" title="Списание">
                            <i class="fas fa-arrow-up text-xs"></i>
                        </button>
                    </div>
                </td>
                <td class="px-4 py-3 text-center">${img}</td>
                <td class="px-4 py-3 font-medium text-blue-700 dark:text-blue-400 group-hover:underline">${item.name}${fileIcon}</td>
                <td class="px-4 py-3 text-slate-500 dark:text-slate-400 hidden md:table-cell">${item.manuf || ''}</td>
                <td class="px-4 py-3 text-slate-500 dark:text-slate-400 hidden lg:table-cell">${item.cat || 'Разное'}</td>
                <td class="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">${qtyDisplay}</td>
                <td class="px-4 py-3 text-center text-orange-600 dark:text-orange-400 hidden sm:table-cell" title="Резерв">${resDisplay}</td>
                <td class="px-4 py-3 text-center font-bold ${freeColor}">${freeDisplay}</td>
                <td class="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">${costDisplay}</td>
            `;
            
            fragment.appendChild(row);
        }
    }
    
    // Single DOM update - much faster than innerHTML
    tbody.innerHTML = '';
    tbody.appendChild(fragment);

    // Update sort indicators
    document.querySelectorAll('.sortable-header').forEach(el => el.classList.remove('active'));
    const activeHeader = document.querySelector(`.sortable-header[onclick*="setWarehouseSort('${key}')"]`);
    if (activeHeader) activeHeader.classList.add('active');
    
    // Обновляем кнопки пагинации (на случай, если они еще не инициализированы)
    updatePaginationButtons();
    
    // Обновляем состояние кнопки удаления и счетчика выбранных
    updateDeleteButton();
    updateSelectAllCheckbox();
}

// --- MASS DELETE FUNCTIONS ---
function toggleItemSelection(itemId, checked) {
    if (checked) {
        selectedItems.add(itemId);
    } else {
        selectedItems.delete(itemId);
    }
    updateDeleteButton();
    updateSelectAllCheckbox();
}

function toggleSelectAll() {
    const checkbox = document.getElementById('selectAllItems');
    if (!checkbox) return;
    
    const q = document.getElementById('warehouseSearch').value.toLowerCase().trim();
    const items = db.items || [];
    
    // Получаем отфильтрованный список товаров
    let filtered = [];
    const isAllCats = currentFilterCat === 'all';
    const hasSearch = q.length > 0;
    
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!isAllCats && item.cat !== currentFilterCat) continue;
        if (hasSearch && !item.name.toLowerCase().includes(q) && !item.manuf.toLowerCase().includes(q)) continue;
        filtered.push(item);
    }
    
    // Определяем диапазон товаров для текущей страницы
    let startIndex = 0;
    let endIndex = filtered.length;
    
    if (itemsPerPage !== null) {
        startIndex = (currentPage - 1) * itemsPerPage;
        endIndex = Math.min(startIndex + itemsPerPage, filtered.length);
    }
    
    // Получаем товары на текущей странице
    const pageItems = filtered.slice(startIndex, endIndex);
    
    if (checkbox.checked) {
        // Выбираем все товары на текущей странице
        pageItems.forEach(item => selectedItems.add(item.id));
    } else {
        // Снимаем выбор со всех товаров на текущей странице
        pageItems.forEach(item => selectedItems.delete(item.id));
    }
    
    // Обновляем чекбоксы в таблице
    pageItems.forEach(item => {
        const itemCheckbox = document.querySelector(`.item-checkbox[data-item-id="${item.id}"]`);
        if (itemCheckbox) {
            itemCheckbox.checked = checkbox.checked;
        }
    });
    
    updateDeleteButton();
}

function updateSelectAllCheckbox() {
    const checkbox = document.getElementById('selectAllItems');
    if (!checkbox) return;
    
    const q = document.getElementById('warehouseSearch').value.toLowerCase().trim();
    const items = db.items || [];
    
    // Получаем отфильтрованный список товаров
    let filtered = [];
    const isAllCats = currentFilterCat === 'all';
    const hasSearch = q.length > 0;
    
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!isAllCats && item.cat !== currentFilterCat) continue;
        if (hasSearch && !item.name.toLowerCase().includes(q) && !item.manuf.toLowerCase().includes(q)) continue;
        filtered.push(item);
    }
    
    // Определяем диапазон товаров для текущей страницы
    let startIndex = 0;
    let endIndex = filtered.length;
    
    if (itemsPerPage !== null) {
        startIndex = (currentPage - 1) * itemsPerPage;
        endIndex = Math.min(startIndex + itemsPerPage, filtered.length);
    }
    
    // Получаем товары на текущей странице
    const pageItems = filtered.slice(startIndex, endIndex);
    
    // Проверяем, все ли товары на странице выбраны
    const allSelected = pageItems.length > 0 && pageItems.every(item => selectedItems.has(item.id));
    const someSelected = pageItems.some(item => selectedItems.has(item.id));
    
    checkbox.checked = allSelected;
    checkbox.indeterminate = someSelected && !allSelected;
}

function updateDeleteButton() {
    const btn = document.getElementById('btnDeleteSelected');
    const countEl = document.getElementById('selectedCount');
    
    if (!btn || !countEl) return;
    
    const count = selectedItems.size;
    
    if (count > 0) {
        btn.classList.remove('hidden');
        countEl.textContent = count;
    } else {
        btn.classList.add('hidden');
    }
}

function deleteSelectedItems() {
    if (selectedItems.size === 0) {
        showToast('Не выбрано ни одного товара');
        return;
    }
    
    const count = selectedItems.size;
    const itemNames = Array.from(selectedItems)
        .map(id => {
            const item = db.items.find(i => i.id === id);
            return item ? item.name : '';
        })
        .filter(name => name)
        .slice(0, 5)
        .join(', ');
    
    const moreText = count > 5 ? ` и еще ${count - 5}...` : '';
    const message = `Вы уверены, что хотите удалить ${count} товар(ов)?\n\n${itemNames}${moreText}\n\nЭто действие нельзя отменить.`;
    
    if (!confirm(message)) return;
    
    // Проверяем использование товаров в активных проектах
    let itemsInUse = [];
    Array.from(selectedItems).forEach(itemId => {
        const item = db.items.find(i => i.id === itemId);
        if (!item) return;
        
        (db.projects || []).forEach(p => {
            if (p.status === 'active') {
                ((db.specs || {})[p.id] || []).forEach(s => {
                    if (s.status === 'draft') {
                        if (s.items.find(i => i.itemId == item.id)) {
                            itemsInUse.push(item.name);
                        }
                    }
                });
            }
        });
    });
    
    if (itemsInUse.length > 0) {
        const uniqueItems = [...new Set(itemsInUse)];
        const warning = `Внимание! Некоторые товары используются в активных спецификациях:\n${uniqueItems.slice(0, 5).join(', ')}${uniqueItems.length > 5 ? '...' : ''}\n\nУдаление может привести к ошибкам в проектах.\n\nВсе равно удалить?`;
        if (!confirm(warning)) return;
    }
    
    // Удаляем товары
    let deletedCount = 0;
    Array.from(selectedItems).forEach(itemId => {
        const idx = db.items.findIndex(i => i.id === itemId);
        if (idx > -1) {
            db.items.splice(idx, 1);
            deletedCount++;
        }
    });
    
    // Очищаем выбор
    selectedItems.clear();
    
    // Сохраняем изменения
    save();
    
    // Обновляем интерфейс
    refreshAll();
    updateDeleteButton();
    updateSelectAllCheckbox();
    
    showToast(`Удалено товаров: ${deletedCount}`);
}

// --- QUICK MOVE LOGIC ---
function openQuickMove(id, type) {
    const item = db.items.find(i => i.id === id);
    if(!item) return;

    document.getElementById('quickMoveId').value = id;
    document.getElementById('quickMoveType').value = type;
    document.getElementById('quickMoveQty').value = '';
    
    const typeText = type === 'in' ? 'Приход' : 'Списание';
    const typeColor = type === 'in' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    
    document.getElementById('quickMoveTitle').innerHTML = `<span class="${typeColor}">${typeText}</span>`;
    document.getElementById('quickMoveItemName').textContent = item.name;
    
    document.getElementById('quickMoveModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('quickMoveQty').focus(), 100);
}

function saveQuickMove() {
    const id = parseInt(document.getElementById('quickMoveId').value);
    const type = document.getElementById('quickMoveType').value;
    const qty = parseFloat(document.getElementById('quickMoveQty').value);
    
    if (!qty || qty <= 0) return alert('Введите количество!');
    
    const item = db.items.find(i => i.id === id);
    if(!item) return;

    if (type === 'out') {
            if(item.qty < qty) return alert('Недостаточно товара на складе!');
            item.qty -= qty;
    } else {
            item.qty += qty;
    }

    db.movements.unshift({
        id: 'mov_' + Date.now(),
        date: new Date().toLocaleString(),
        type: type,
        itemId: item.id,
        itemName: item.name,
        qty: qty
    });
    
    save();
    closeModal('quickMoveModal');
    showToast('Операция выполнена');
}

// --- MOVEMENTS ---
function saveMovement() { 
    const name = document.getElementById('movItemInput').value;
    const qty = parseFloat(document.getElementById('movQty').value);
    const type = document.querySelector('input[name="movType"]:checked').value; 
    
    const item = db.items.find(i => i.name === name); 
    if (!item || !qty || qty <= 0) return showToast('Ошибка ввода'); 
    
    if (type === 'in') {
        item.qty += qty; 
    } else { 
        if(item.qty < qty) return alert('Мало товара!'); 
        item.qty -= qty; 
    } 
    
    db.movements.unshift({ 
        id: 'mov_' + Date.now(), 
        date: new Date().toLocaleString(), 
        type, 
        itemId: item.id, 
        itemName: item.name, 
        qty 
    }); 
    
    save(); 
    showToast('Проведено'); 
    document.getElementById('movItemInput').value = ''; 
}

function undoMovement(mid) {
    if(!confirm("Отменить эту операцию? Товар вернется на склад.")) return;
    
    const idx = db.movements.findIndex(m => m.id === mid);
    if (idx === -1) return alert("Ошибка: запись не найдена");
    
    const m = db.movements[idx];
    const item = db.items.find(i => i.id === m.itemId);
    
    if(item) {
        if (m.type === 'in') {
            if(item.qty < m.qty) {
                    if(!confirm("Внимание! При отмене прихода остаток станет отрицательным. Продолжить?")) return;
            }
            item.qty -= m.qty;
        } else {
            item.qty += m.qty;
        }
    }
    
    db.movements.splice(idx, 1);
    save();
    showToast("Операция отменена");
}

function renderHistoryTable() { 
    const t = document.getElementById('movementHistory'); 
    t.innerHTML = ''; 
    (db.movements || []).slice(0, 50).forEach(m => {
        const qtyDisplay = formatNumber(m.qty);
        t.innerHTML += `<tr class="border-b dark:border-slate-700">
            <td class="p-2 text-slate-500 dark:text-slate-400">${m.date}</td>
            <td class="p-2">${m.itemName}</td>
            <td class="p-2 text-right font-bold ${m.type==='in'?'text-green-600 dark:text-green-400':'text-red-600 dark:text-red-400'}">${m.type==='in'?'+':'-'}${qtyDisplay}</td>
            <td class="p-2 text-right">
                    <button onclick="undoMovement('${m.id}')" class="text-red-400 hover:text-red-600 p-1" title="Отменить"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }); 
}

function renderDatalists() { 
    const dl = document.getElementById('itemList'); 
    dl.innerHTML = ''; 
    (db.items || []).forEach(i => dl.innerHTML += `<option value="${i.name}">Ост: ${formatNumber(i.qty)}</option>`); 
}

// --- PROJECTS ---
function setProjectSort(key) {
    if (sortState.projects.key === key) {
        sortState.projects.dir = sortState.projects.dir === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.projects.key = key;
        sortState.projects.dir = 'asc';
    }
    renderProjects();
}

function renderProjects() { 
    const tbody = document.getElementById('projectsTableBody'); 
    tbody.innerHTML = ''; 
    let sorted = [...(db.projects || [])];
    
    const key = sortState.projects.key;
    const dir = sortState.projects.dir;
    
    sorted.sort((a, b) => {
        let va = a[key];
        let vb = b[key];
        if (key === 'num') {
            const na = parseFloat(va);
            const nb = parseFloat(vb);
            if (!Number.isNaN(na) && !Number.isNaN(nb)) {
                va = na;
                vb = nb;
            }
        }
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        
        if (va < vb) return dir === 'asc' ? -1 : 1;
        if (va > vb) return dir === 'asc' ? 1 : -1;
        return 0;
    });

    sorted.forEach(p => { 
        const isClosed = p.status === 'closed'; 
        const statusHtml = isClosed ? '<span class="px-2 py-1 rounded text-xs font-bold bg-slate-200 text-slate-500">Закрыт</span>' : '<span class="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-800">В работе</span>'; 
        const actionBtn = isClosed ? `<button onclick="event.stopPropagation(); viewClosedProject(${p.id})" class="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 z-10 relative"><i class="fas fa-eye"></i></button>` : `<button onclick="event.stopPropagation(); closeProject(${p.id})" class="text-red-400 hover:text-red-600 text-xs border border-red-200 dark:border-red-900 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900 z-10 relative">Закрыть</button>`; 
        const projectYear = p.year || '—';
        const projectNum = p.num || '—';
        const projectClient = p.client || '—';
        const projectCost = Number(p.cost) || 0;
        const startDate = p.start || '—';
        const endDate = p.end || '—';
        const formattedProjectCost = formatNumber(projectCost);
        tbody.innerHTML += `<tr onclick="openProjectCard(${p.id})" class="border-b dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer transition h-16 ${isClosed ? 'opacity-60 bg-slate-50 dark:bg-slate-800' : ''}">
            <td class="px-4 py-3">${projectYear}</td>
            <td class="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">${projectNum}</td>
            <td class="px-4 py-3 text-slate-600 dark:text-slate-300">${projectClient}</td>
            <td class="px-4 py-3">
                <div class="font-bold text-blue-800 dark:text-blue-400 hover:underline">${p.name}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">${p.desc || '-'}</div>
            </td>
            <td class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 hidden md:table-cell">${startDate} <br> ${endDate}</td>
            <td class="px-4 py-3 text-right">${formattedProjectCost}</td>
            <td class="px-4 py-3 text-center">${statusHtml}</td>
            <td class="px-4 py-3 text-right">${actionBtn}</td>
        </tr>`; 
    }); 
}

function closeProject(pid) { 
    const p = db.projects.find(x => x.id === pid); 
    if(!confirm(`Закрыть проект "${p.name}"?`)) return; 
    
    const drafts = ((db.specs || {})[pid]||[]).filter(s => s.status === 'draft'); 
    let err = null; 
    
    drafts.forEach(s => s.items.forEach(r => { 
        if(!r.isCustom) { 
            const i = db.items.find(x => x.id === r.itemId); 
            if(i && i.qty < r.qty) err = `Нехватка: ${i.name}`; 
        } 
    })); 
    
    if(err) return alert(err); 
    
    drafts.forEach(s => { 
        s.items.forEach(r => { 
            if(!r.isCustom) { 
                const i = db.items.find(x => x.id === r.itemId); 
                i.qty -= r.qty; 
                db.movements.unshift({
                    id: 'mov_' + Date.now(), 
                    date: new Date().toLocaleString(), 
                    type: 'out', 
                    itemId: i.id, 
                    itemName: `${i.name} (Закрытие)`, 
                    qty: r.qty
                }); 
            } 
        }); 
        s.status = 'committed'; 
        s.date = new Date().toLocaleDateString(); 
    }); 
    
    p.status = 'closed'; 
    save(); 
    showToast('Проект закрыт'); 
}

function viewClosedProject(pid) { 
    const p = db.projects.find(x => x.id === pid); 
    const sp = (db.specs || {})[pid] || []; 
    document.getElementById('pdTitle').textContent = p.name; 
    const c = document.getElementById('pdContent'); 
    c.innerHTML = ''; 
    
    if(!sp.length) c.innerHTML = 'Пусто'; 
    
    sp.forEach(s => { 
        let h = '', t = 0; 
        s.items.forEach(r => { 
            let name, cost; 
            if(r.isCustom) { 
                name = r.name + " (Нестандарт)"; 
                cost = r.cost; 
            } else { 
                const i = db.items.find(x => x.id === r.itemId); 
                name = i.name; 
                cost = i.cost; 
            } 
            t+=cost*r.qty; 
            h+=`<tr><td class="border dark:border-slate-600 p-1">${name}</td><td class="border dark:border-slate-600 p-1 text-center">${r.qty}</td><td class="border dark:border-slate-600 p-1 text-right">${cost*r.qty}</td></tr>`; 
        }); 
        c.innerHTML += `<div class="mb-4 border dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-700"><div class="font-bold mb-2">${s.name}</div><table class="w-full text-xs mb-2"><thead><tr><th>Товар</th><th>Кол-во</th><th>Сумма</th></tr></thead><tbody>${h}</tbody></table><div class="text-right font-bold">Итого: ${t}</div></div>`; 
    }); 
    openModal('projectDetailsModal'); 
}

// --- SPECIFICATIONS ---
function renderSpecProjectList() { 
    const l = document.getElementById('specProjectList'); 
    l.innerHTML = ''; 
    (db.projects || []).filter(p => p.status === 'active').sort((a,b) => b.id - a.id).forEach(p => { 
        const c = ((db.specs || {})[p.id]||[]).length; 
        l.innerHTML += `<div onclick="selectSpecProject(${p.id})" class="p-3 border-b dark:border-slate-600 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700 ${selectedProjectId === p.id ? 'bg-blue-100 dark:bg-slate-700 border-l-4 border-l-blue-600' : ''}"><div class="font-bold text-sm flex justify-between">${p.name}<span class="bg-slate-200 text-slate-600 px-1 rounded text-[10px]">[${c}]</span></div><div class="text-xs text-slate-500 dark:text-slate-400 mt-1">${p.num}</div></div>`; 
    }); 
}

function selectSpecProject(pid) { 
    selectedProjectId = pid; 
    selectedSpecId = null; 
    renderSpecProjectList(); 
    renderSpecList(pid); 
    document.getElementById('specEditor').classList.add('hidden'); 
    document.getElementById('specContentPlaceholder').classList.remove('hidden'); 
}

function renderSpecList(pid) { 
    const c = document.getElementById('specListContainer'); 
    c.innerHTML = ''; 
    c.classList.remove('hidden'); 
    document.getElementById('specListPlaceholder').classList.add('hidden'); 
    document.getElementById('btnAddSpec').classList.remove('hidden'); 
    
    ((db.specs || {})[pid]||[]).forEach(s => { 
        const ic = s.status === 'committed' ? '<i class="fas fa-lock text-red-500"></i>' : '<i class="fas fa-pen text-green-500"></i>'; 
        const isSelected = selectedSpecId === s.id;
        const cardClasses = isSelected
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-500'
            : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600';
        c.innerHTML += `<div onclick="loadSpec('${s.id}')" class="p-3 border rounded mb-2 cursor-pointer hover:shadow transition-colors ${cardClasses}">
            <div class="flex justify-between items-center font-bold text-sm gap-2">
                <span class="truncate">${s.name}</span>
                <span class="flex items-center gap-2">
                    ${ic}
                    <button onclick="event.stopPropagation(); deleteSpec('${s.id}')" class="text-slate-400 hover:text-red-500" title="Удалить спецификацию">
                        <i class="fas fa-trash"></i>
                    </button>
                </span>
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400">Позиций: ${s.items.length}</div>
        </div>`; 
    }); 
}

function addNewSpecToProject() { 
    if(!selectedProjectId) { 
        alert("Сначала выберите проект из списка слева!"); 
        return; 
    }
    openModal('addSpecModal');
}

function openCreateNewSpec() {
    closeModal('addSpecModal');
    try { 
        const n = prompt("Введите название спецификации (например: Электрика 1 этаж):"); 
        if(!n) return; 
        
        if(!db.specs || typeof db.specs !== 'object' || Array.isArray(db.specs)) { 
            db.specs = {}; 
        } 
        if(!db.specs[selectedProjectId]) { 
            db.specs[selectedProjectId] = []; 
        } 
        
        const newSpec = { 
            id: 's_' + Date.now(), 
            name: n, 
            status: 'draft', 
            date: new Date().toLocaleDateString(), 
            items: [] 
        }; 
        
        db.specs[selectedProjectId].push(newSpec); 
        selectedSpecId = newSpec.id; 
        save(); 
        showToast("Спецификация создана"); 
        loadSpec(newSpec.id); 
    } catch (e) { 
        console.error(e); 
        alert("Ошибка создания спецификации: " + e.message); 
    } 
}

function openSelectExistingSpec() {
    closeModal('addSpecModal');
    document.getElementById('existingSpecSearch').value = '';
    renderExistingSpecsList();
    openModal('selectSpecModal');
}

function renderExistingSpecsList(searchTerm = '') {
    const list = document.getElementById('existingSpecList');
    list.innerHTML = '';
    
    const search = searchTerm.toLowerCase().trim();
    const allSpecs = [];
    
    // Collect all specs from all projects (except current)
    Object.keys(db.specs || {}).forEach(projectId => {
        if (projectId == selectedProjectId) return; // Skip current project
        
        const project = db.projects.find(p => p.id == parseInt(projectId));
        if (!project) return;
        
        (db.specs[projectId] || []).forEach(spec => {
            allSpecs.push({
                spec: spec,
                projectId: parseInt(projectId),
                projectName: project.name,
                projectNum: project.num || ''
            });
        });
    });
    
    // Filter by search term
    let filtered = allSpecs;
    if (search) {
        filtered = allSpecs.filter(item => 
            item.spec.name.toLowerCase().includes(search) ||
            item.projectName.toLowerCase().includes(search) ||
            item.projectNum.toLowerCase().includes(search)
        );
    }
    
    // Sort by name
    filtered.sort((a, b) => a.spec.name.localeCompare(b.spec.name));
    
    if (filtered.length === 0) {
        list.innerHTML = '<div class="p-4 text-center text-slate-400 text-sm">Спецификации не найдены</div>';
        return;
    }
    
    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = 'p-3 border-b dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition';
        div.onclick = () => copySpecToProject(item.spec, item.projectId, item.projectName);
        div.innerHTML = `
            <div class="font-bold text-sm text-slate-800 dark:text-slate-200">${item.spec.name}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Проект: ${item.projectName} ${item.projectNum ? `(${item.projectNum})` : ''}
            </div>
            <div class="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Позиций: ${item.spec.items.length} | 
                Статус: ${item.spec.status === 'committed' ? 'Списана' : 'Черновик'}
            </div>
        `;
        list.appendChild(div);
    });
}

function filterExistingSpecs() {
    const searchTerm = document.getElementById('existingSpecSearch').value;
    renderExistingSpecsList(searchTerm);
}

function copySpecToProject(sourceSpec, sourceProjectId, sourceProjectName) {
    if (!confirm(`Скопировать спецификацию "${sourceSpec.name}" из проекта "${sourceProjectName}" в текущий проект?`)) {
        return;
    }
    
    try {
        if(!db.specs || typeof db.specs !== 'object' || Array.isArray(db.specs)) { 
            db.specs = {}; 
        } 
        if(!db.specs[selectedProjectId]) { 
            db.specs[selectedProjectId] = []; 
        }
        
        // Create a deep copy of the spec
        const newSpec = {
            id: 's_' + Date.now(),
            name: sourceSpec.name + ' (Копия)',
            status: 'draft', // Always create as draft
            date: new Date().toLocaleDateString(),
            items: sourceSpec.items.map(item => ({
                ...item,
                // Deep copy items
                itemId: item.itemId,
                qty: item.qty,
                isCustom: item.isCustom,
                name: item.name,
                unit: item.unit,
                cost: item.cost
            }))
        };
        
        db.specs[selectedProjectId].push(newSpec);
        selectedSpecId = newSpec.id;
        save();
        closeModal('selectSpecModal');
        showToast("Спецификация скопирована");
        loadSpec(newSpec.id);
    } catch (e) {
        console.error(e);
        alert("Ошибка копирования спецификации: " + e.message);
    }
}

function deleteSpec(specId) {
    if(!selectedProjectId) return;
    const specs = (db.specs || {})[selectedProjectId] || [];
    const idx = specs.findIndex(s => s.id === specId);
    if(idx === -1) return;
    
    const spec = specs[idx];
    const message = spec.status === 'committed'
        ? `Спецификация "${spec.name}" уже списана.\nУдаление приведет к потере истории.\nУдалить?`
        : `Удалить спецификацию "${spec.name}"?`;
    
    if(!confirm(message)) return;
    
    specs.splice(idx, 1);
    
    if(selectedSpecId === specId) {
        selectedSpecId = null;
        document.getElementById('specEditor').classList.add('hidden');
        document.getElementById('specContentPlaceholder').classList.remove('hidden');
    }
    
    save();
    renderSpecList(selectedProjectId);
    showToast("Спецификация удалена");
}

// --- CUSTOM ITEMS ---
function openAddCustomItemModal() {
    document.getElementById('customName').value = '';
    document.getElementById('customUnit').value = '';
    document.getElementById('customQty').value = '1';
    document.getElementById('customCost').value = '0';
    document.getElementById('addCustomItemModal').classList.remove('hidden');
}

function closeAddCustomItemModal() {
    document.getElementById('addCustomItemModal').classList.add('hidden');
}

function addCustomItem() {
    if(!selectedSpecId || !selectedProjectId) return;
    const name = document.getElementById('customName').value;
    const unit = document.getElementById('customUnit').value;
    const qty = parseFloat(document.getElementById('customQty').value) || 0;
    const cost = parseFloat(document.getElementById('customCost').value) || 0;

    if(!name) return alert("Введите название!");
    
    const s = db.specs[selectedProjectId].find(x => x.id === selectedSpecId);
    s.items.push({
        isCustom: true,
        name: name,
        unit: unit,
        qty: qty,
        cost: cost
    });
    
    save();
    closeModal('addCustomItemModal');
    loadSpec(selectedSpecId);
    showToast("Позиция добавлена");
}

function loadSpec(sid) {
    selectedSpecId = sid; 
    renderSpecList(selectedProjectId); 
    const s = db.specs[selectedProjectId].find(x => x.id === sid);
    document.getElementById('specEditor').classList.remove('hidden'); 
    document.getElementById('specContentPlaceholder').classList.add('hidden');
    document.getElementById('specTitle').textContent = s.name; 
    document.getElementById('specSubtitle').textContent = s.status==='committed'?'ЗАКРЫТА':''; 
    
    if(s.status==='committed') { 
        document.getElementById('btnCommitSpec').classList.add('hidden'); 
        document.getElementById('specAddPanel').classList.add('hidden'); 
    } else { 
        document.getElementById('btnCommitSpec').classList.remove('hidden'); 
        document.getElementById('specAddPanel').classList.remove('hidden'); 
    }
    
    const tb = document.getElementById('specTableBody'); 
    tb.innerHTML = ''; 
    let tot = 0;
    
    const itemsWithMeta = s.items
        .map((item, originalIndex) => {
            if(item.isCustom) {
                return {
                    isCustom: true,
                    originalIndex,
                    name: item.name || 'Нестандартная позиция',
                    unit: item.unit || '',
                    qty: item.qty,
                    cost: parseFloat(item.cost) || 0,
                    category: 'Нестандартные изделия',
                    rowClass: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-200"
                };
            } else {
                const baseItem = db.items.find(x => x.id === item.itemId);
                if(!baseItem) return null;
                return {
                    isCustom: false,
                    originalIndex,
                    name: baseItem.name || 'Товар',
                    unit: baseItem.unit || '',
                    qty: item.qty,
                    cost: parseFloat(baseItem.cost) || 0,
                    category: baseItem.cat || 'Без категории',
                    rowClass: ""
                };
            }
        })
        .filter(Boolean)
        .sort((a, b) => {
            const catDiff = a.category.localeCompare(b.category, 'ru', { sensitivity: 'base' });
            if (catDiff !== 0) return catDiff;
            return a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' });
        });

    let currentCategory = null;

    const isDraft = s.status === 'draft';

    itemsWithMeta.forEach((entry, idx) => { 
        const { name, unit, qty, cost, category, rowClass, originalIndex, isCustom } = entry;
        const rowTotal = cost * qty;
        tot += rowTotal; 
        const qtyCell = isDraft
            ? `<input type="number" min="0" step="0.01" value="${formatNumber(qty)}" class="spec-qty-input w-20 text-center border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400" onchange="updateSpecItemQty(${originalIndex}, this.value)" onclick="event.stopPropagation()">`
            : formatNumber(qty);
        const rowTotalDisplay = formatCurrency(rowTotal);

        if (category !== currentCategory) {
            currentCategory = category;
            tb.innerHTML += `<tr class="bg-slate-100 dark:bg-slate-800/60">
                <td colspan="6" class="px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">${category}</td>
            </tr>`;
        }
        
        const del = isDraft ? `<button onclick="event.stopPropagation(); remSpecItem(${originalIndex})" class="text-red-400"><i class="fas fa-trash"></i></button>` : ''; 
        const itemId = !isCustom ? s.items[originalIndex].itemId : null;
        const clickHandler = itemId ? `onclick="openItemCardViewOnly(${itemId})" style="cursor: pointer;"` : '';
        const hoverClass = itemId ? 'hover:bg-blue-50 dark:hover:bg-slate-700 transition' : '';
        tb.innerHTML += `<tr class="border-b dark:border-slate-700 ${rowClass} ${hoverClass}" ${clickHandler}>
            <td class="text-center text-sm px-2">${idx + 1}</td>
            <td class="px-4 py-2 text-sm">${isCustom ? `<span class="font-medium">${name}</span>` : `<span class="text-blue-600 dark:text-blue-400 hover:underline">${name}</span>`}</td>
            <td class="text-center text-sm">${unit || '-'}</td>
            <td class="text-center text-sm">${qtyCell}</td>
            <td class="text-right text-sm">${rowTotalDisplay}</td>
            <td class="text-right">${del}</td>
        </tr>`; 
    });
    const formattedTotal = formatCurrency(tot);
    const totalEl = document.getElementById('specTotalCost');
    if (totalEl) {
        totalEl.textContent = formattedTotal;
    }
    
    resetSpecSearchInput();
}

function resetSpecSearchInput() {
    const input = document.getElementById('specItemSearch');
    const results = document.getElementById('specSearchResults');
    if(input) {
        input.value = '';
        delete input.dataset.category;
        delete input.dataset.itemId;
    }
    if(results) {
        results.classList.add('hidden');
        results.innerHTML = '';
    }
}

function handleSpecSearch(isTyping = false) {
    const input = document.getElementById('specItemSearch');
    const results = document.getElementById('specSearchResults');
    if(!input || !results) return;
    
    if(isTyping) {
        delete input.dataset.itemId;
    }
    
    let rawValue = input.value;
    let trimmed = rawValue.trim();
    
    // If field is empty -> show categories
    if(trimmed.length === 0 && !input.dataset.category) {
        delete input.dataset.itemId;
        renderSpecCategoryList(results);
        return;
    }
    
    const arrowIdx = rawValue.indexOf('→');
    if(arrowIdx === -1 && trimmed.length === 0) {
        delete input.dataset.category;
        delete input.dataset.itemId;
        renderSpecCategoryList(results);
        return;
    }
    
    let selectedCategory = input.dataset.category || '';
    let searchTerm = '';
    let items = db.items || [];
    
    if(selectedCategory) {
        items = items.filter(i => i.cat === selectedCategory);
        searchTerm = arrowIdx >= 0 ? rawValue.slice(arrowIdx + 1).trim().toLowerCase() : trimmed.toLowerCase();
    } else {
        searchTerm = trimmed.toLowerCase();
    }
    
    if(searchTerm && !selectedCategory) {
        items = items.filter(i => (`${i.cat} ${i.name}`).toLowerCase().includes(searchTerm));
    } else if(searchTerm && selectedCategory) {
        items = items.filter(i => i.name.toLowerCase().includes(searchTerm));
    }
    
    items.sort((a, b) => {
        if(a.cat === b.cat) return a.name.localeCompare(b.name);
        return a.cat.localeCompare(b.cat);
    });
    
    const maxResults = 80;
    renderSpecItemResults(results, items.slice(0, maxResults), !!selectedCategory);
}

function renderSpecCategoryList(resultsEl) {
    const cats = [...new Set((db.items || []).map(i => i.cat || 'Без категории'))].sort();
    if(!cats.length) {
        resultsEl.innerHTML = '<div class="px-3 py-2 text-slate-400 text-sm">Нет категорий</div>';
        resultsEl.classList.remove('hidden');
        return;
    }
    let html = `<div class="px-3 py-2 text-blue-600 hover:bg-blue-50 cursor-pointer text-sm font-medium border-b dark:border-slate-600" onclick="clearSpecCategory()">Все категории</div>`;
    cats.forEach(cat => {
        html += `<div class="px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-600 cursor-pointer text-sm text-slate-700 dark:text-slate-100 border-b dark:border-slate-600 last:border-0" data-cat="${escapeAttr(cat)}" onclick="selectSpecCategory(this.dataset.cat)">${cat}</div>`;
    });
    resultsEl.innerHTML = html;
    resultsEl.classList.remove('hidden');
}

function renderSpecItemResults(resultsEl, items, groupedByCategory) {
    if(!items.length) {
        resultsEl.innerHTML = '<div class="px-3 py-2 text-slate-400 text-sm">Ничего не найдено</div>';
        resultsEl.classList.remove('hidden');
        return;
    }
    let html = '';
    let currentCat = '';
    items.forEach(item => {
        if(!groupedByCategory) {
            if(item.cat !== currentCat) {
                currentCat = item.cat;
                html += `<div class="px-3 py-1 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-600 dark:text-slate-300">${currentCat}</div>`;
            }
        }
        html += `<div class="px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-600 cursor-pointer flex justify-between items-center text-sm" onclick="selectSpecSearchItem(${item.id})">
            <span class="text-slate-700 dark:text-slate-100">${item.name}</span>
            <span class="text-xs text-slate-400">Ост: ${item.qty}</span>
        </div>`;
    });
    resultsEl.innerHTML = html;
    resultsEl.classList.remove('hidden');
}

function selectSpecSearchItem(itemId) {
    const input = document.getElementById('specItemSearch');
    const results = document.getElementById('specSearchResults');
    const item = db.items.find(i => i.id == itemId);
    if(!input || !item) return;
    
    input.value = `${item.cat} → ${item.name}`;
    input.dataset.itemId = item.id;
    input.dataset.category = item.cat;
    if(results) results.classList.add('hidden');
}

function selectSpecCategory(cat) {
    const input = document.getElementById('specItemSearch');
    if(!input) return;
    input.dataset.category = cat;
    input.value = `${cat} → `;
    delete input.dataset.itemId;
    handleSpecSearch();
}

function clearSpecCategory() {
    const input = document.getElementById('specItemSearch');
    if(!input) return;
    delete input.dataset.category;
    delete input.dataset.itemId;
    input.value = '';
    handleSpecSearch();
}

function escapeAttr(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

document.addEventListener('click', (event) => {
    const panel = document.getElementById('specAddPanel');
    const results = document.getElementById('specSearchResults');
    if(!panel || !results) return;
    if(!panel.contains(event.target)) {
        results.classList.add('hidden');
    }
});

function remSpecItem(idx) {
    if(!confirm("Удалить позицию?")) return;
    const s = db.specs[selectedProjectId].find(x => x.id === selectedSpecId);
    s.items.splice(idx, 1);
    save();
    loadSpec(selectedSpecId);
}

function updateSpecItemQty(idx, rawValue) {
    if(!selectedProjectId || !selectedSpecId) return;
    const qty = parseFloat(rawValue);
    if(isNaN(qty)) {
        showToast("Введите корректное количество");
        loadSpec(selectedSpecId);
        return;
    }
    if(qty < 0) {
        showToast("Количество не может быть отрицательным");
        loadSpec(selectedSpecId);
        return;
    }
    const specList = (db.specs || {})[selectedProjectId] || [];
    const spec = specList.find(x => x.id === selectedSpecId);
    if(!spec || !spec.items[idx]) return;
    spec.items[idx].qty = qty;
    save();
    loadSpec(selectedSpecId);
}

function commitSpec() {
    if(!confirm("Списать материалы со склада? Это действие необратимо.")) return;
    const s = db.specs[selectedProjectId].find(x => x.id === selectedSpecId);
    
    let err = null;
    s.items.forEach(r => {
        if(!r.isCustom) {
            const i = db.items.find(x => x.id === r.itemId);
            if(!i || i.qty < r.qty) err = `Нехватка товара: ${i ? i.name : 'Удаленный товар'}`;
        }
    });
    
    if(err) return alert(err);
    
    s.items.forEach(r => {
        if(!r.isCustom) {
            const i = db.items.find(x => x.id === r.itemId);
            i.qty -= r.qty;
            db.movements.unshift({
                id: 'mov_' + Date.now(), 
                date: new Date().toLocaleString(), 
                type: 'out', 
                itemId: i.id, 
                itemName: `${i.name} (В проект ${db.projects.find(p=>p.id===selectedProjectId).name})`, 
                qty: r.qty
            }); 
        }
    });
    
    s.status = 'committed';
    save();
    showToast("Материалы списаны");
    loadSpec(selectedSpecId);
}

function printSpec(includeCosts = true) {
    if(!selectedProjectId || !selectedSpecId) return;
    const project = db.projects.find(p => p.id === selectedProjectId);
    const spec = db.specs[selectedProjectId].find(s => s.id === selectedSpecId);
    if(!project || !spec) return;
    
    const itemsWithMeta = spec.items
        .map((item) => {
            if (item.isCustom) {
                const cost = parseFloat(item.cost) || 0;
                return {
                    isCustom: true,
                    name: item.name || 'Нестандартная позиция',
                    unit: item.unit || '',
                    qty: item.qty,
                    cost,
                    sum: cost * item.qty,
                    category: 'Нестандартные изделия'
                };
            } else {
                const dbItem = db.items.find(i => i.id === item.itemId);
                if(!dbItem) return null;
                const cost = parseFloat(dbItem.cost) || 0;
                return {
                    isCustom: false,
                    name: dbItem.name,
                    unit: dbItem.unit || '',
                    qty: item.qty,
                    cost,
                    sum: cost * item.qty,
                    category: dbItem.cat || 'Без категории'
                };
            }
        })
        .filter(Boolean)
        .sort((a, b) => {
            const catDiff = a.category.localeCompare(b.category, 'ru', { sensitivity: 'base' });
            if (catDiff !== 0) return catDiff;
            return a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' });
        });
    
    let groupedRows = '';
    let currentCategory = null;
    let total = 0;
    
    const groupColSpan = includeCosts ? 6 : 4;
    itemsWithMeta.forEach((item, index) => {
        total += item.sum;
        const qtyDisplay = formatNumber(item.qty);
        const priceDisplay = formatNumber(item.cost);
        const sumDisplay = formatNumber(item.sum);
        const priceCell = includeCosts ? `<td class="p-2 text-right">${priceDisplay}</td>` : '';
        const sumCell = includeCosts ? `<td class="p-2 text-right font-bold">${sumDisplay}</td>` : '';
        if(item.category !== currentCategory) {
            currentCategory = item.category;
            groupedRows += `<tr class="bg-slate-50">
                <td colspan="${groupColSpan}" class="p-2 text-xs font-bold uppercase tracking-widest">${currentCategory}</td>
            </tr>`;
        }
        groupedRows += `<tr class="border-b">
            <td class="p-2 text-center">${index + 1}</td>
            <td class="p-2">${item.isCustom ? `${item.name} (нестандарт)` : item.name}</td>
            <td class="p-2 text-center">${item.unit || '-'}</td>
            <td class="p-2 text-center">${qtyDisplay}</td>
            ${priceCell}
            ${sumCell}
        </tr>`;
    });
    
    const statusText = spec.status === 'committed' ? '<div class="font-bold text-lg mt-2">Статус: Списано</div>' : '';
    
    const totalDisplay = includeCosts ? formatCurrency(total) : '';
    const priceHeader = includeCosts ? '<th class="p-2 text-right w-24">Цена</th>' : '';
    const sumHeader = includeCosts ? '<th class="p-2 text-right w-28">Сумма</th>' : '';
    const totalBlock = includeCosts ? `
            <div class="border-t-2 border-black pt-4 mb-8">
                <div class="text-right">
                    <div class="text-xl font-bold">ОБЩИЙ ИТОГО: ${totalDisplay}</div>
                </div>
            </div>` : '';
    const tableBlock = `
        <div class="mb-6">
            <h2 class="text-lg font-bold mb-3">Состав спецификации</h2>
            <table class="w-full text-sm">
                <thead>
                    <tr class="border-b-2 border-black">
                        <th class="p-2 text-center w-10">№</th>
                        <th class="p-2 text-left">Наименование</th>
                        <th class="p-2 text-center w-16">Ед.</th>
                        <th class="p-2 text-center w-20">Кол-во</th>
                        ${priceHeader}
                        ${sumHeader}
                    </tr>
                </thead>
                <tbody>${groupedRows}</tbody>
            </table>
        </div>
    `;
    
    const html = `
        <div class="max-w-4xl mx-auto">
            <div class="flex justify-between items-end border-b-2 border-black pb-4 mb-6">
                <div>
                    <h1 class="text-2xl font-bold uppercase">Спецификация на материалы</h1>
                    <div class="mt-2 text-sm">
                        <div><strong>Проект:</strong> ${project.name}</div>
                        <div><strong>Заявка:</strong> ${project.num || '—'}</div>
                        <div><strong>Заказчик:</strong> ${project.client}</div>
                        <div><strong>Спецификация:</strong> ${spec.name}</div>
                    </div>
                </div>
                <div class="text-right text-sm">
                    <div>Дата: ${new Date().toLocaleDateString()}</div>
                    ${statusText}
                </div>
            </div>
            ${tableBlock}
            ${totalBlock}
            <div class="flex justify-between mt-12 text-sm">
                <div>
                    <div class="border-t border-black w-48 pt-1">Сдал (Кладовщик)</div>
                </div>
                <div>
                    <div class="border-t border-black w-48 pt-1">Принял (Монтажник)</div>
                </div>
            </div>
        </div>
    `;
    
    const printArea = document.getElementById('printArea'); 
    printArea.innerHTML = html; 
    window.print();
}

function renderDashboard() {
    if(!db.items) return;
    let totalMoney = db.items.reduce((acc, i) => acc + (i.cost * i.qty), 0);
    document.getElementById('dashTotalMoney').innerText = formatCurrency(totalMoney);
    
    let activeProj = (db.projects || []).filter(p => p.status === 'active');
    document.getElementById('dashActiveProj').innerText = formatNumber(activeProj.length);
    
    let budget = activeProj.reduce((acc, p) => acc + (parseFloat(p.cost) || 0), 0);
    const budgetEl = document.getElementById('dashActiveBudget');
    if(budgetEl) budgetEl.innerText = formatCurrency(budget);
    
    const lowStockItems = (db.items || []).map(item => {
        const free = item.qty - getReserve(item.id);
        return {...item, free};
    }).filter(item => item.free < 0);
    document.getElementById('dashLowStockCount').innerText = formatNumber(lowStockItems.length);
    
    const lsTable = document.getElementById('dashLowStockTable');
    lsTable.innerHTML = lowStockItems.slice(0, 5)
        .map(i => `<tr class="border-b dark:border-slate-700">
            <td class="py-2 font-medium text-slate-700 dark:text-slate-300">${i.name}</td>
            <td class="py-2 text-right font-bold text-red-600 dark:text-red-400">${formatNumber(i.free)} ${i.unit}</td>
        </tr>`).join('') || '<tr><td colspan="2" class="py-4 text-center text-slate-400 text-sm">Все в порядке</td></tr>';
    
    const today = new Date();
    const upcomingDeadlines = (db.projects || []).filter(p => {
        if (p.status !== 'active' || !p.end) return false;
        const deadline = new Date(p.end);
        const diffTime = deadline - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7; 
    }).sort((a, b) => new Date(a.end) - new Date(b.end));

    document.getElementById('dashDeadlineCount').innerText = formatNumber(upcomingDeadlines.length);

    const dlTable = document.getElementById('dashDeadlineTable');
    dlTable.innerHTML = upcomingDeadlines.slice(0, 5).map(p => {
        const deadline = new Date(p.end);
        const diffTime = deadline - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const daysValue = formatNumber(Math.abs(diffDays));
        const daysText = diffDays < 0 ? `Просрочен на ${daysValue} дн.` : (diffDays === 0 ? 'Сегодня' : `${daysValue} дн.`);
        const colorClass = diffDays < 0 ? 'text-red-600 dark:text-red-400' : 'text-orange-500 dark:text-orange-400';
        
        return `<tr class="border-b dark:border-slate-700"><td class="py-2 font-medium text-slate-700 dark:text-slate-300 text-sm truncate max-w-[150px]">${p.name}</td><td class="py-2 text-right font-bold ${colorClass} text-sm">${daysText}</td></tr>`;
    }).join('') || '<tr><td colspan="2" class="py-4 text-center text-slate-400 text-sm">Нет срочных</td></tr>';

    const movTable = document.getElementById('dashLastMovTable');
    movTable.innerHTML = (db.movements || []).slice(0, 5).map(m => {
            return `<tr class="border-b dark:border-slate-700">
            <td class="py-2 text-slate-500 dark:text-slate-400 text-xs">${m.date.split(',')[0]}</td>
            <td class="py-2 font-medium text-slate-700 dark:text-slate-300 text-sm truncate max-w-[150px]">${m.itemName}</td>
            <td class="py-2 text-right font-bold ${m.type==='in'?'text-green-600 dark:text-green-400':'text-red-600 dark:text-red-400'} text-sm">${m.type==='in'?'+':'-'}${formatNumber(m.qty)}</td>
                <td class="py-2 text-right">
                    <button onclick="undoMovement('${m.id}')" class="text-red-400 hover:text-red-600 p-1" title="Отменить"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`
    }).join('') || '<tr><td colspan="3" class="py-4 text-center text-slate-400 text-sm">Нет операций</td></tr>';
}

function addToSpec() { 
    if(!selectedSpecId) return; 
    const itemInput = document.getElementById('specItemSearch');
    const iid = itemInput ? itemInput.dataset.itemId : null;
    const qty = parseFloat(document.getElementById('specAddQty').value); 
    
    if(!iid || !qty) return showToast("Выберите товар и количество"); 
    
    const s = db.specs[selectedProjectId].find(x => x.id === selectedSpecId); 
    const ex = s.items.find(x => x.itemId == iid); 
    
    if(ex) {
        ex.qty += qty; 
    } else {
        s.items.push({itemId:parseInt(iid), qty:qty}); 
    }
    
    save(); 
    resetSpecSearchInput();
    loadSpec(selectedSpecId); 
    showToast("Добавлено");
}

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
                closeModal('settingsModal');
                showToast("База успешно загружена");
            }
        } catch (err) {
            alert("Ошибка чтения файла: " + err.message);
        }
    };
    reader.readAsText(file);
    input.value = ''; 
}

// --- LEGACY IMPORT (CSV) ---
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

                // Generate a numeric ID to be compatible with new system, 
                // but we can store the old ID in a hidden field if needed. 
                // Using Date.now() + loop index to ensure uniqueness during fast import
                const cost = parseFloat(costStr) || 0;
                const newItem = {
                    id: Date.now() + i, 
                    name: row[1] || 'Без названия',
                    manuf: row[2] || '',
                    cat: row[3] || 'Разное',
                    qty: parseFloat(qtyStr) || 0,
                    unit: row[5] || 'шт.',
                    cost: cost,
                    chars: row[10] || '',
                    img: imgPath, 
                    file: row[14] || ''
                };
                
                // Устанавливаем дату последнего изменения цены при импорте, если цена больше 0
                if (cost > 0) {
                    newItem.lastPriceChangeDate = new Date().toISOString();
                }

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
            closeModal('settingsModal');
            showToast(`Импортировано ${importedCount} товаров`);
            
        } catch (err) {
            console.error(err);
            alert("Ошибка при разборе CSV: " + err.message);
        }
    };
    // Read as Windows-1251 if it's an old Russian Excel file, otherwise UTF-8. 
    // Usually modern CSVs are UTF-8, but Excel often exports CP1251.
    // Let's try UTF-8 first. If garbage, user might need to convert file.
    reader.readAsText(file, 'UTF-8'); 
    input.value = '';
}

// Robust CSV Parser that handles quoted strings containing commas
function parseCSV(str) {
    const arr = [];
    let quote = false;  // 'true' means we're inside a quoted field
    let col = 0, c = 0;

    for (; c < str.length; c++) {
        let cc = str[c], nc = str[c+1];        // Current character, next character
        arr[col] = arr[col] || [];             // Create a new row if necessary
        arr[col].push(cc);                     // Push current character to the current column

        // If the current character is a quote
        if (cc == '"' && quote && nc == '"') { // Skip double quotes inside quotes
            arr[col].pop(); 
            arr[col].push(cc); 
            c++; 
            continue; 
        }
        if (cc == '"') { 
            quote = !quote; 
            if (quote) arr[col].pop(); // Don't include the opening quote
            if (!quote) arr[col].pop(); // Don't include the closing quote
            continue; 
        }

        // If it's a comma and we're not in a quote, move to next column
        if (cc == ',' && !quote) { 
            arr[col].pop(); // remove the comma
            continue; 
        }

        // If it's a newline and we're not in a quote, move to next row
        if (cc == '\r' && nc == '\n' && !quote) { 
            arr[col].pop(); 
            c++; 
            col++; 
            continue; 
        }
        if (cc == '\n' && !quote) { 
            arr[col].pop(); 
            col++; 
            continue; 
        }
    }
    
    // Join the characters back into strings
    return arr.map(row => {
        // Split logic above pushed chars, now we need to join them based on comma separation logic
        // Actually the loop above is a bit simplistic for direct array-of-arrays. 
        // Let's use a cleaner regex approach which is often more reliable for standard CSV.
        return [];
    });
}

// Overwriting parseCSV with a better Regex implementation
parseCSV = function(text) {
    let p = '', row = [''], ret = [row], i = 0, r = 0, s = !0, l;
    for (l of text) {
        if ('"' === l) {
            if (s && l === p) row[i] += l;
            s = !s;
        } else if (',' === l && s) l = row[++i] = '';
        else if ('\n' === l && s) {
            if ('\r' === p) row[i] = row[i].slice(0, -1);
            row = ret[++r] = ['']; i = 0;
        } else row[i] += l;
        p = l;
    }
    return ret;
};

function exportData() {
    const dataStr = JSON.stringify(db);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'warehouse_backup_'+new Date().toISOString().slice(0,10)+'.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function exportToExcel() {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID,Название,Производитель,Категория,Остаток,Ед.изм,Цена\r\n";
        
        db.items.forEach(function(rowArray) {
            let row = `${rowArray.id},"${rowArray.name}","${rowArray.manuf}","${rowArray.cat}",${rowArray.qty},"${rowArray.unit}",${rowArray.cost}`;
            csvContent += row + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "warehouse_items.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
}

function duplicateProject(pid) {
    const p = db.projects.find(x => x.id === pid);
    if(!p) return;
    
    if(!confirm(`Создать копию проекта "${p.name}"?`)) return;
    
    const newId = Date.now();
    const newProject = {
        ...p,
        id: newId,
        name: p.name + " (Копия)",
        status: 'active'
    };
    
    const oldSpecs = (db.specs || {})[pid] || [];
    const newSpecs = oldSpecs.map(s => ({
        ...s,
        id: 's_' + Math.random().toString(36).substr(2, 9),
        status: 'draft', 
        date: new Date().toLocaleDateString(),
        items: s.items.map(i => ({...i})) 
    }));
    
    db.projects.push(newProject);
    if(!db.specs) db.specs = {};
    db.specs[newId] = newSpecs;
    
    save();
    closeModal('projectCardModal');
    renderProjects();
    showToast("Проект скопирован");
}

// --- MODALS & DIALOGS ---
function openCreateItemModal() { document.getElementById('newItemName').value=''; document.getElementById('createItemModal').classList.remove('hidden'); }

function createNewItem() { 
    const cost = parseFloat(document.getElementById('newItemCost').value) || 0;
    const i = { 
        id:Date.now(), 
        name:document.getElementById('newItemName').value, 
        manuf:document.getElementById('newItemManuf').value, 
        cat:document.getElementById('newItemCat').value||'Разное', 
        qty:parseFloat(document.getElementById('newItemQty').value)||0, 
        unit:document.getElementById('newItemUnit').value, 
        cost: cost,
        chars:document.getElementById('newItemChars').value, 
        img:document.getElementById('newItemImg').value, 
        file:document.getElementById('newItemFile').value 
    };
    
    // Устанавливаем дату последнего изменения цены при создании товара с ценой
    if (cost > 0) {
        i.lastPriceChangeDate = new Date().toISOString();
    } 
    
    if(!i.name)return; 
    db.items.push(i); 
    
    if(i.qty>0) {
        db.movements.unshift({
            id: 'mov_' + Date.now(), 
            date:new Date().toLocaleString(), 
            type:'in', 
            itemId:i.id, 
            itemName:i.name, 
            qty:i.qty
        }); 
    }
    
    save(); 
    closeModal('createItemModal'); 
}

function openCreateProjectModal() { document.getElementById('newPrName').value=''; document.getElementById('createProjectModal').classList.remove('hidden'); }

function createNewProject() { 
    const p = {
        id:Date.now(), 
        year:document.getElementById('newPrYear').value, 
        num:document.getElementById('newPrNum').value, 
        name:document.getElementById('newPrName').value, 
        desc:document.getElementById('newPrDesc').value, 
        client:document.getElementById('newPrClient').value, 
        start:document.getElementById('newPrStart').value, 
        end:document.getElementById('newPrEnd').value, 
        cost:parseFloat(document.getElementById('newPrCost').value)||0, 
        status:'active'
    }; 
    
    if(!p.name)return; 
    db.projects.push(p); 
    db.specs[p.id]=[]; 
    save(); 
    closeModal('createProjectModal'); 
}

function openItemCard(id, viewOnly = false) { 
    const i = db.items.find(x => x.id === id); 
    if(!i) return; 
    
    document.getElementById('cardId').value = i.id; 
    document.getElementById('cardName').value = i.name; 
    document.getElementById('cardManuf').value = i.manuf; 
    document.getElementById('cardCat').value = i.cat; 
    document.getElementById('cardQty').value = i.qty; 
    document.getElementById('cardUnit').value = i.unit; 
    document.getElementById('cardCost').value = i.cost; 
    document.getElementById('cardChars').value = i.chars; 
    document.getElementById('cardImg').value = i.img || ''; 
    document.getElementById('cardFile').value = i.file || '';
    
    // Отображаем дату последнего изменения цены
    const priceDateEl = document.getElementById('cardPriceChangeDate');
    if (priceDateEl) {
        if (i.lastPriceChangeDate) {
            const date = new Date(i.lastPriceChangeDate);
            priceDateEl.textContent = `Изменена: ${date.toLocaleDateString('ru-RU')}`;
            priceDateEl.title = `Дата изменения цены: ${date.toLocaleString('ru-RU')}`;
        } else {
            priceDateEl.textContent = '';
            priceDateEl.title = '';
        }
    } 
    
    // Устанавливаем режим просмотра
    setItemCardViewMode(viewOnly);
    
    updateCardPreview(); 
    
    document.getElementById('cardMovHistory').innerHTML = (db.movements || [])
        .filter(m => m.itemId === i.id)
        .slice(0, 10)
        .map(m => `<tr class="border-b dark:border-slate-700 last:border-0">
            <td class="p-2 text-slate-500 dark:text-slate-400">${m.date.split(',')[0]}</td>
            <td class="p-2 font-bold ${m.type==='in'?'text-green-600 dark:text-green-400':'text-red-600 dark:text-red-400'}">${m.type==='in'?'Приход':'Списание'}</td>
            <td class="p-2 text-right">${m.qty}</td>
        </tr>`).join('') || '<tr><td colspan="3" class="p-2 text-center text-slate-400">Нет операций</td></tr>'; 
        
    const specs = []; 
    (db.projects || []).forEach(p => { 
        ((db.specs || {})[p.id]||[]).forEach(s => { 
            const r = s.items.find(x => x.itemId === i.id); 
            if (r) specs.push({p:p.name, s:s.name, st:s.status, q:r.qty}) 
        }) 
    }); 
    
    document.getElementById('cardSpecHistory').innerHTML = specs.map(x => `<tr class="border-b dark:border-slate-700 last:border-0">
        <td class="p-2 font-medium text-slate-700 dark:text-slate-300">${x.p}<div class="text-[10px] text-slate-400">${x.s}</div></td>
        <td class="p-2 text-center">${x.st==='draft'?'<span class="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-[10px]">План</span>':'<span class="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px]">Списан</span>'}</td>
        <td class="p-2 text-right font-bold">${x.q}</td>
    </tr>`).join('') || '<tr><td colspan="3" class="p-2 text-center text-slate-400">Нет проектов</td></tr>'; 
    
    switchModalTab('info'); 
    openModal('itemCardModal'); 
}

function openItemCardViewOnly(id) {
    openItemCard(id, true);
}

function setItemCardViewMode(viewOnly) {
    const inputs = ['cardName', 'cardManuf', 'cardCat', 'cardUnit', 'cardCost', 'cardChars', 'cardImg', 'cardFile'];
    const saveBtn = document.querySelector('#itemCardModal button[onclick*="saveItemFromCard"]');
    const deleteBtn = document.querySelector('#itemCardModal button[onclick*="deleteItemFromCard"]');
    
    inputs.forEach(inputId => {
        const el = document.getElementById(inputId);
        if (el) {
            if (viewOnly) {
                el.setAttribute('readonly', 'readonly');
                el.classList.add('bg-slate-100', 'dark:bg-slate-700');
                el.classList.remove('dark:bg-slate-600');
                el.style.cursor = 'default';
            } else {
                el.removeAttribute('readonly');
                el.classList.remove('bg-slate-100');
                if (!el.classList.contains('bg-slate-100')) {
                    // Восстанавливаем оригинальные классы для редактируемых полей
                    if (inputId === 'cardQty') {
                        el.classList.add('bg-slate-100', 'text-slate-500', 'dark:bg-slate-600', 'dark:text-slate-400', 'dark:border-slate-600');
                    } else {
                        el.classList.add('dark:bg-slate-700', 'dark:border-slate-600', 'dark:text-white');
                    }
                }
                el.style.cursor = '';
            }
        }
    });
    
    // Скрываем/показываем кнопки сохранения и удаления
    if (saveBtn) {
        saveBtn.style.display = viewOnly ? 'none' : '';
    }
    if (deleteBtn) {
        // Кнопка удаления скрывается если включен режим просмотра ИЛИ отключена настройка удаления
        deleteBtn.style.display = (viewOnly || !massSelectionEnabled) ? 'none' : '';
    }
    
    // Сохраняем режим просмотра в data-атрибуте модального окна
    const modal = document.getElementById('itemCardModal');
    if (modal) {
        modal.dataset.viewOnly = viewOnly ? 'true' : 'false';
    }
}

function updateCardPreview() { 
    const url = document.getElementById('cardImg').value; 
    const imgEl = document.getElementById('cardImgPreview'); 
    if (url && url.length > 5) { 
        imgEl.src = url; 
        imgEl.classList.remove('hidden'); 
        imgEl.onerror = function() { this.classList.add('hidden'); }; 
    } else { 
        imgEl.classList.add('hidden'); 
    } 
}

function deleteItemFromCard() {
    if (!massSelectionEnabled) {
        return showToast("Удаление отключено в настройках");
    }

    const idVal = document.getElementById('cardId').value;
    // ID can be int (old data) or string (imported data potentially, though we convert to int/date in import).
    // Let's handle both, `cardId` value is string from input.
    
    const item = db.items.find(x => x.id == idVal);
    if(!item) return;

    if(!confirm(`Вы точно хотите удалить товар "${item.name}"?\nЭто действие нельзя отменить.`)) return;

    // Check for usage in active projects (draft specs)
    let inUse = false;
    (db.projects || []).forEach(p => {
        if(p.status === 'active') {
            ((db.specs || {})[p.id] || []).forEach(s => {
                 if(s.status === 'draft') {
                     if(s.items.find(i => i.itemId == item.id)) inUse = true;
                 }
            });
        }
    });

    if(inUse) {
        if(!confirm("Внимание! Этот товар используется в активных спецификациях проектов. Удаление может привести к ошибкам в проектах.\n\nВсе равно удалить?")) return;
    }

    const idx = db.items.indexOf(item);
    if (idx > -1) {
        db.items.splice(idx, 1);
        // Удаляем товар из выбранных, если он был выбран
        selectedItems.delete(item.id);
        save();
        closeModal('itemCardModal');
        refreshAll();
        showToast("Товар удален");
    }
}

function saveItemFromCard() { 
    const itemId = parseInt(document.getElementById('cardId').value);
    const i = db.items.find(x => x.id == itemId); 
    if (!i) return;
    
    // Show saving indicator - find button in modal
    const modal = document.getElementById('itemCardModal');
    const saveBtn = modal ? modal.querySelector('button[onclick*="saveItemFromCard"]') : null;
    const originalHTML = saveBtn ? saveBtn.innerHTML : '';
    
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Сохранение...';
    }
    
    // Проверяем, изменилась ли цена
    const newCost = parseFloat(document.getElementById('cardCost').value) || 0;
    const oldCost = i.cost || 0;
    const priceChanged = Math.abs(newCost - oldCost) > 0.01; // Учитываем возможные ошибки округления
    
    // Update item data
    i.name = document.getElementById('cardName').value; 
    i.manuf = document.getElementById('cardManuf').value; 
    i.cat = document.getElementById('cardCat').value; 
    i.unit = document.getElementById('cardUnit').value; 
    i.cost = newCost;
    
    // Обновляем дату последнего изменения цены, если цена изменилась
    if (priceChanged) {
        i.lastPriceChangeDate = new Date().toISOString();
    }
    
    i.chars = document.getElementById('cardChars').value; 
    i.img = document.getElementById('cardImg').value; 
    i.file = document.getElementById('cardFile').value; 
    
    // Save without full refresh
    save(false);
    
    // Update only necessary parts (async to not block UI)
    setTimeout(() => {
        renderCategoryList();
        renderWarehouse();
        renderDatalists();
        // Update dashboard if it's visible
        const dashboardView = document.getElementById('view-dashboard');
        if (dashboardView && !dashboardView.classList.contains('hidden')) {
            renderDashboard();
        }
        
        // Restore button and close modal
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalHTML;
        }
        
        closeModal('itemCardModal');
        showToast('Товар сохранен');
    }, 50); // Small delay to show spinner
}

function switchModalTab(t) { 
    document.getElementById('mview-info').classList.add('hidden'); 
    document.getElementById('mview-history').classList.add('hidden'); 
    document.getElementById('mtab-info').classList.remove('active'); 
    document.getElementById('mtab-history').classList.remove('active'); 
    document.getElementById(`mview-${t}`).classList.remove('hidden'); 
    document.getElementById(`mtab-${t}`).classList.add('active'); 
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { 
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('hidden');
        // Сбрасываем режим просмотра для карточки товара
        if (id === 'itemCardModal') {
            setItemCardViewMode(false);
        }
    }
}
function openSettings() { 
    const user = auth ? auth.currentUser : null;
    if (!user || user.email !== 'is8090@mail.ru') {
        alert("Доступ к настройкам разрешен только для администратора (is8090@mail.ru)");
        return;
    }

    const checkbox = document.getElementById('settingMassSelect');
    if (checkbox) {
        checkbox.checked = massSelectionEnabled;
    }
    openModal('settingsModal'); 
}

function openProjectCard(id) { 
    const p = db.projects.find(x => x.id === id); 
    if(!p) return; 
    
    document.getElementById('pcId').value = p.id; 
    document.getElementById('pcYear').value = p.year; 
    document.getElementById('pcNum').value = p.num; 
    document.getElementById('pcName').value = p.name; 
    document.getElementById('pcDesc').value = p.desc || ''; 
    document.getElementById('pcClient').value = p.client; 
    document.getElementById('pcStart').value = p.start; 
    document.getElementById('pcEnd').value = p.end; 
    document.getElementById('pcCost').value = p.cost; 
    
    const stEl = document.getElementById('pcStatus'); 
    if(p.status === 'active') { 
        stEl.textContent = 'В РАБОТЕ'; 
        stEl.className = 'font-bold px-2 py-1 rounded text-sm bg-green-100 text-green-700'; 
    } else { 
        stEl.textContent = 'ЗАКРЫТ'; 
        stEl.className = 'font-bold px-2 py-1 rounded text-sm bg-slate-200 text-slate-600'; 
    } 
    
    const specs = (db.specs || {})[p.id] || []; 
    const tbody = document.getElementById('pcSpecsBody'); 
    tbody.innerHTML = ''; 
    let totalProjectSum = 0; 
    
    if(specs.length === 0) { 
        tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-slate-400">Нет спецификаций</td></tr>'; 
    } else { 
        specs.forEach(s => { 
            let specSum = 0; 
            s.items.forEach(r => { 
                if(r.isCustom) { 
                    specSum += r.cost * r.qty; 
                } else { 
                    const item = db.items.find(i => i.id === r.itemId); 
                    if(item) specSum += item.cost * r.qty; 
                } 
            }); 
            totalProjectSum += specSum; 
            const specSumDisplay = formatCurrency(specSum);
            const statusBadge = s.status === 'committed' ? '<span class="text-red-500 font-bold text-xs">Списана</span>' : '<span class="text-green-600 font-bold text-xs">В работе</span>'; 
            tbody.innerHTML += `<tr class="border-b dark:border-slate-700 last:border-0">
                <td class="px-4 py-2 font-medium">${s.name}</td>
                <td class="px-4 py-2 text-center">${statusBadge}</td>
                <td class="px-4 py-2 text-center">${s.items.length}</td>
                <td class="px-4 py-2 text-right">${specSumDisplay}</td>
            </tr>`; 
        }); 
    } 
    document.getElementById('pcTotalSpecsCost').textContent = formatCurrency(totalProjectSum); 
    switchProjectTab('info'); 
    openModal('projectCardModal'); 
}

function saveProjectFromCard() { 
    const id = parseInt(document.getElementById('pcId').value); 
    const p = db.projects.find(x => x.id === id); 
    if(p) { 
        p.year = document.getElementById('pcYear').value; 
        p.num = document.getElementById('pcNum').value; 
        p.name = document.getElementById('pcName').value; 
        p.desc = document.getElementById('pcDesc').value; 
        p.client = document.getElementById('pcClient').value; 
        p.start = document.getElementById('pcStart').value; 
        p.end = document.getElementById('pcEnd').value; 
        p.cost = parseFloat(document.getElementById('pcCost').value) || 0; 
        save(); 
        renderProjects(); 
        closeModal('projectCardModal'); 
        showToast('Проект обновлен'); 
    } 
}

function switchProjectTab(tab) { 
    document.getElementById('pview-info').classList.add('hidden'); 
    document.getElementById('pview-specs').classList.add('hidden'); 
    document.getElementById('ptab-info').className = "modal-tab px-2 py-1 text-slate-500 cursor-pointer"; 
    document.getElementById('ptab-specs').className = "modal-tab px-2 py-1 text-slate-500 cursor-pointer"; 
    document.getElementById(`pview-${tab}`).classList.remove('hidden'); 
    document.getElementById(`ptab-${tab}`).className = "modal-tab active px-2 py-1 text-blue-600 border-b-2 border-blue-600 font-bold cursor-pointer"; 
}
