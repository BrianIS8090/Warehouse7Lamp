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

// Optimization: Pagination Variables
let currentPage = 1;
const itemsPerPage = 20;
let totalPages = 1;

let sortState = {
    warehouse: { key: 'id', dir: 'desc' },
    projects: { key: 'id', dir: 'desc' }
};

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

function save() { 
    localStorage.setItem('wms_v4_data', JSON.stringify(db)); 
    hasUnsavedChanges = true; 
    updateSyncUI(); 
    refreshAll(); 
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
    if(t==='warehouse') {renderCategoryList(); renderWarehouse();} 
    if(t==='movements') renderHistoryTable(); 
    if(t==='dashboard') renderDashboard(); 
}

// --- WAREHOUSE LOGIC ---
function getReserve(itemId) { 
    let r = 0; 
    const specs = db.specs || {}; 
    Object.values(specs).flat().forEach(s => { 
        if(s.status === 'draft') { 
            const l = s.items.find(x => x.itemId === itemId); 
            if(l) r += l.qty; 
        } 
    }); 
    return r; 
}

function renderCategoryList() { 
    if (!db || !db.items) return; 
    const cats = [...new Set(db.items.map(i => i.cat))].sort(); 
    const list = document.getElementById('categoryList'); 
    list.innerHTML = ''; 
    const allClass = currentFilterCat === 'all' ? 'bg-blue-100 text-blue-700 font-bold shadow-sm border-l-4 border-blue-600 dark:bg-slate-700 dark:text-blue-400 dark:border-blue-400' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-blue-400'; 
    list.innerHTML += `<div onclick="filterCat('all')" class="p-2 rounded cursor-pointer transition mb-1 text-sm ${allClass}">Все категории</div>`; 
    cats.forEach(c => { 
        const activeClass = currentFilterCat === c ? 'bg-blue-100 text-blue-700 font-bold shadow-sm border-l-4 border-blue-600 dark:bg-slate-700 dark:text-blue-400 dark:border-blue-400' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-blue-400'; 
        list.innerHTML += `<div onclick="filterCat('${c}')" class="p-2 rounded cursor-pointer transition mb-1 text-sm ${activeClass}">${c}</div>`; 
    }); 
    const dl = document.getElementById('catDataList'); 
    if (dl) { 
        dl.innerHTML = ''; 
        cats.forEach(c => dl.innerHTML += `<option value="${c}">`); 
    } 
}

function filterCat(cat) { 
    currentFilterCat = cat; 
    currentPage = 1; // Reset to first page on filter change
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

// Pagination Functions
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

function renderWarehouse() { 
    const tbody = document.getElementById('warehouseTableBody'); 
    const q = document.getElementById('warehouseSearch').value.toLowerCase(); 
    const items = db.items || []; 
    
    let filtered = items.filter(i => { 
        const matchCat = currentFilterCat === 'all' || i.cat === currentFilterCat; 
        const matchSearch = i.name.toLowerCase().includes(q) || i.manuf.toLowerCase().includes(q); 
        return matchCat && matchSearch; 
    }); 

    const key = sortState.warehouse.key;
    const dir = sortState.warehouse.dir;
    
    filtered.sort((a, b) => {
        let va = a[key];
        let vb = b[key];
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va < vb) return dir === 'asc' ? -1 : 1;
        if (va > vb) return dir === 'asc' ? 1 : -1;
        return 0;
    });

    // Pagination Logic
    totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (totalPages === 0) totalPages = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    document.getElementById('pageIndicator').textContent = `Стр. ${currentPage} из ${totalPages} (${filtered.length} поз.)`;
    document.getElementById('btnPrevPage').disabled = currentPage === 1;
    document.getElementById('btnNextPage').disabled = currentPage === totalPages;

    const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    
    const htmlRows = paginatedItems.map(i => { 
        const img = i.img ? `<img src="${i.img}" class="w-10 h-10 object-cover rounded border border-slate-300 mx-auto" alt="фото" onerror="this.src='https://placehold.co/40'">` : '<span class="text-slate-300">-</span>'; 
        const res = getReserve(i.id); 
        const free = i.qty - res; 
        const freeColor = free < 0 ? 'text-red-600 dark:text-red-400' : (free < 5 ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'); 
        const fileIcon = i.file ? `<a href="${i.file}" target="_blank" onclick="event.stopPropagation()" class="ml-2 text-slate-400 hover:text-blue-600" title="Скачать файл"><i class="fas fa-file-alt"></i></a>` : ''; 
        
        const quickActions = `
            <div class="flex gap-1 justify-center">
                <button onclick="event.stopPropagation(); openQuickMove(${i.id}, 'in')" class="w-7 h-7 rounded bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 flex items-center justify-center" title="Приход">
                    <i class="fas fa-arrow-down text-xs"></i>
                </button>
                <button onclick="event.stopPropagation(); openQuickMove(${i.id}, 'out')" class="w-7 h-7 rounded bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 flex items-center justify-center" title="Списание">
                    <i class="fas fa-arrow-up text-xs"></i>
                </button>
            </div>
        `;

        return `<tr onclick="openItemCard(${i.id})" class="border-b dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer transition h-14 group">
            <td class="px-2 py-3 text-center">${quickActions}</td>
            <td class="px-4 py-3 text-center">${img}</td>
            <td class="px-4 py-3 font-medium text-blue-700 dark:text-blue-400 group-hover:underline">${i.name}${fileIcon}</td>
            <td class="px-4 py-3 text-slate-500 dark:text-slate-400 hidden md:table-cell">${i.manuf}</td>
            <td class="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">${i.qty}</td>
            <td class="px-4 py-3 text-center text-orange-600 dark:text-orange-400 hidden sm:table-cell" title="Резерв">${res > 0 ? res : '-'}</td>
            <td class="px-4 py-3 text-center font-bold ${freeColor}">${free}</td>
            <td class="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">${i.cost.toLocaleString()} ₽</td>
        </tr>`; 
    }).join(''); 
    tbody.innerHTML = htmlRows || '<tr><td colspan="8" class="p-8 text-center text-slate-400">Ничего не найдено</td></tr>'; 

    document.querySelectorAll('.sortable-header').forEach(el => el.classList.remove('active'));
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
        t.innerHTML += `<tr class="border-b dark:border-slate-700">
            <td class="p-2 text-slate-500 dark:text-slate-400">${m.date}</td>
            <td class="p-2">${m.itemName}</td>
            <td class="p-2 text-right font-bold ${m.type==='in'?'text-green-600 dark:text-green-400':'text-red-600 dark:text-red-400'}">${m.type==='in'?'+':'-'}${m.qty}</td>
            <td class="p-2 text-right">
                    <button onclick="undoMovement('${m.id}')" class="text-red-400 hover:text-red-600 p-1" title="Отменить"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }); 
}

function renderDatalists() { 
    const dl = document.getElementById('itemList'); 
    dl.innerHTML = ''; 
    (db.items || []).forEach(i => dl.innerHTML += `<option value="${i.name}">Ост: ${i.qty}</option>`); 
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
        tbody.innerHTML += `<tr onclick="openProjectCard(${p.id})" class="border-b dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer transition h-16 ${isClosed ? 'opacity-60 bg-slate-50 dark:bg-slate-800' : ''}">
            <td class="px-4 py-3">${p.year}</td>
            <td class="px-4 py-3"><div class="font-bold">${p.num}</div><div class="text-xs text-slate-500 dark:text-slate-400">${p.client}</div></td>
            <td class="px-4 py-3"><div class="font-bold text-blue-800 dark:text-blue-400 hover:underline">${p.name}</div><div class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">${p.desc || '-'}</div></td>
            <td class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 hidden md:table-cell">${p.start} <br> ${p.end}</td>
            <td class="px-4 py-3 text-right">${p.cost.toLocaleString()}</td>
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
        c.innerHTML += `<div onclick="loadSpec('${s.id}')" class="p-3 border dark:border-slate-600 rounded mb-2 cursor-pointer bg-white dark:bg-slate-700 hover:shadow ${selectedSpecId === s.id ? 'ring-2 ring-blue-400' : ''}"><div class="flex justify-between font-bold text-sm"><span>${s.name}</span><span>${ic}</span></div><div class="text-xs text-slate-500 dark:text-slate-400">Позиций: ${s.items.length}</div></div>`; 
    }); 
}

function addNewSpecToProject() { 
    try { 
        if(!selectedProjectId) { 
            alert("Сначала выберите проект из списка слева!"); 
            return; 
        } 
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
    
    s.items.forEach((r, idx) => { 
        let name, unit, cost, rowClass = "";
        
        if(r.isCustom) {
            name = `<span class="text-yellow-700 dark:text-yellow-400 font-medium">${r.name}</span>`;
            unit = r.unit;
            cost = r.cost;
            rowClass = "bg-yellow-50 dark:bg-yellow-900/20";
        } else {
            const i = db.items.find(x => x.id === r.itemId);
            if(!i) return; 
            name = i.name;
            unit = i.unit;
            cost = i.cost;
        }

        tot += cost * r.qty; 
        const del = s.status==='draft' ? `<button onclick="remSpecItem(${idx})" class="text-red-400"><i class="fas fa-trash"></i></button>` : ''; 
        tb.innerHTML += `<tr class="border-b dark:border-slate-700 ${rowClass}"><td class="px-4 py-2 text-sm">${name}</td><td class="text-center text-sm">${r.qty} ${unit}</td><td class="text-right text-sm">${(cost*r.qty).toLocaleString()}</td><td class="text-right">${del}</td></tr>`; 
    });
    document.getElementById('specTotalCost').textContent = tot.toLocaleString() + ' ₽';
}

function remSpecItem(idx) {
    if(!confirm("Удалить позицию?")) return;
    const s = db.specs[selectedProjectId].find(x => x.id === selectedSpecId);
    s.items.splice(idx, 1);
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

function printSpec() {
    if(!selectedProjectId || !selectedSpecId) return;
    const project = db.projects.find(p => p.id === selectedProjectId);
    const spec = db.specs[selectedProjectId].find(s => s.id === selectedSpecId);
    if(!project || !spec) return;
    let rows = ''; let total = 0;

    spec.items.forEach((item, index) => {
        let name, unit, cost, sum;
        if (item.isCustom) {
            name = item.name + " (Заказ)";
            unit = item.unit;
            cost = item.cost;
        } else {
            const dbItem = db.items.find(i => i.id === item.itemId);
            if(!dbItem) return;
            name = dbItem.name;
            unit = dbItem.unit;
            cost = dbItem.cost;
        }
        sum = cost * item.qty;
        total += sum;
        rows += `<tr class="border-b"><td class="p-2 text-center">${index + 1}</td><td class="p-2">${name}</td><td class="p-2 text-center">${unit}</td><td class="p-2 text-center">${item.qty}</td><td class="p-2 text-right">${cost}</td><td class="p-2 text-right font-bold">${sum}</td></tr>`;
    });
    
    const statusText = spec.status === 'committed' ? '<div class="font-bold text-lg mt-2">Статус: Списано</div>' : '';

    const html = `<div class="max-w-4xl mx-auto"><div class="flex justify-between items-end border-b-2 border-black pb-4 mb-6"><div><h1 class="text-2xl font-bold uppercase">Спецификация на материалы</h1><div class="mt-2 text-sm"><div><strong>Проект:</strong> ${project.name}</div><div><strong>Заказчик:</strong> ${project.client}</div><div><strong>Спецификация:</strong> ${spec.name}</div></div></div><div class="text-right text-sm"><div>Дата: ${new Date().toLocaleDateString()}</div>${statusText}</div></div><table class="w-full text-sm mb-8"><thead><tr class="border-b-2 border-black"><th class="p-2 text-center w-10">№</th><th class="p-2 text-left">Наименование</th><th class="p-2 text-center w-16">Ед.</th><th class="p-2 text-center w-20">Кол-во</th><th class="p-2 text-right w-24">Цена</th><th class="p-2 text-right w-28">Сумма</th></tr></thead><tbody>${rows}</tbody><tfoot><tr class="border-t-2 border-black"><td colspan="5" class="p-2 text-right font-bold text-lg">ИТОГО:</td><td class="p-2 text-right font-bold text-lg">${total.toLocaleString()} ₽</td></tr></tfoot></table><div class="flex justify-between mt-12 text-sm"><div><div class="border-t border-black w-48 pt-1">Сдал (Кладовщик)</div></div><div><div class="border-t border-black w-48 pt-1">Принял (Монтажник)</div></div></div></div>`;
    const printArea = document.getElementById('printArea'); 
    printArea.innerHTML = html; 
    window.print();
}

function renderDashboard() {
    if(!db.items) return;
    let totalMoney = db.items.reduce((acc, i) => acc + (i.cost * i.qty), 0);
    document.getElementById('dashTotalMoney').innerText = totalMoney.toLocaleString() + ' ₽';
    
    let activeProj = (db.projects || []).filter(p => p.status === 'active');
    document.getElementById('dashActiveProj').innerText = activeProj.length;
    
    let budget = activeProj.reduce((acc, p) => acc + (parseFloat(p.cost) || 0), 0);
    const budgetEl = document.getElementById('dashActiveBudget');
    if(budgetEl) budgetEl.innerText = budget.toLocaleString();
    
    let lowStock = db.items.filter(i => i.qty < 5);
    document.getElementById('dashLowStockCount').innerText = lowStock.length;
    
    const lsTable = document.getElementById('dashLowStockTable');
    lsTable.innerHTML = lowStock.slice(0, 5).map(i => `<tr class="border-b dark:border-slate-700"><td class="py-2 font-medium text-slate-700 dark:text-slate-300">${i.name}</td><td class="py-2 text-right font-bold text-red-600 dark:text-red-400">${i.qty} ${i.unit}</td></tr>`).join('') || '<tr><td colspan="2" class="py-4 text-center text-slate-400 text-sm">Все в порядке</td></tr>';
    
    const today = new Date();
    const upcomingDeadlines = (db.projects || []).filter(p => {
        if (p.status !== 'active' || !p.end) return false;
        const deadline = new Date(p.end);
        const diffTime = deadline - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7; 
    }).sort((a, b) => new Date(a.end) - new Date(b.end));

    document.getElementById('dashDeadlineCount').innerText = upcomingDeadlines.length;

    const dlTable = document.getElementById('dashDeadlineTable');
    dlTable.innerHTML = upcomingDeadlines.slice(0, 5).map(p => {
        const deadline = new Date(p.end);
        const diffTime = deadline - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const daysText = diffDays < 0 ? `Просрочен на ${Math.abs(diffDays)} дн.` : (diffDays === 0 ? 'Сегодня' : `${diffDays} дн.`);
        const colorClass = diffDays < 0 ? 'text-red-600 dark:text-red-400' : 'text-orange-500 dark:text-orange-400';
        
        return `<tr class="border-b dark:border-slate-700"><td class="py-2 font-medium text-slate-700 dark:text-slate-300 text-sm truncate max-w-[150px]">${p.name}</td><td class="py-2 text-right font-bold ${colorClass} text-sm">${daysText}</td></tr>`;
    }).join('') || '<tr><td colspan="2" class="py-4 text-center text-slate-400 text-sm">Нет срочных</td></tr>';

    const movTable = document.getElementById('dashLastMovTable');
    movTable.innerHTML = (db.movements || []).slice(0, 5).map(m => {
            return `<tr class="border-b dark:border-slate-700">
            <td class="py-2 text-slate-500 dark:text-slate-400 text-xs">${m.date.split(',')[0]}</td>
            <td class="py-2 font-medium text-slate-700 dark:text-slate-300 text-sm truncate max-w-[150px]">${m.itemName}</td>
            <td class="py-2 text-right font-bold ${m.type==='in'?'text-green-600 dark:text-green-400':'text-red-600 dark:text-red-400'} text-sm">${m.type==='in'?'+':'-'}${m.qty}</td>
                <td class="py-2 text-right">
                    <button onclick="undoMovement('${m.id}')" class="text-red-400 hover:text-red-600 p-1" title="Отменить"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`
    }).join('') || '<tr><td colspan="3" class="py-4 text-center text-slate-400 text-sm">Нет операций</td></tr>';
}

function filterSpecSearch() { 
    const v = document.getElementById('specSearchInput').value.toLowerCase();
    const r = document.getElementById('specSearchResults'); 
    
    if(v.length<1) { 
        r.classList.add('hidden'); 
        return; 
    } 
    
    const m = db.items.filter(i => i.name.toLowerCase().includes(v)); 
    r.innerHTML = ''; 
    
    if(m.length) { 
        r.classList.remove('hidden'); 
        m.forEach(x => { 
            const d = document.createElement('div'); 
            d.className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer text-sm border-b dark:border-slate-600"; 
            d.innerHTML=`${x.name} <span class="text-slate-400 text-xs">Ост: ${x.qty}</span>`; 
            d.onclick=()=>{
                document.getElementById('specSearchInput').value=x.name; 
                document.getElementById('specSearchInput').dataset.sid=x.id; 
                r.classList.add('hidden');
            }; 
            r.appendChild(d); 
        }); 
    } else {
        r.classList.add('hidden'); 
    }
}

function addToSpec() { 
    if(!selectedSpecId) return; 
    const iid = document.getElementById('specSearchInput').dataset.sid;
    const qty = parseFloat(document.getElementById('specAddQty').value); 
    
    if(!iid||!qty) return; 
    
    const s = db.specs[selectedProjectId].find(x => x.id === selectedSpecId); 
    const ex = s.items.find(x => x.itemId == iid); 
    
    if(ex) {
        ex.qty += qty; 
    } else {
        s.items.push({itemId:parseInt(iid), qty:qty}); 
    }
    
    save(); 
    document.getElementById('specSearchInput').value = '';
    loadSpec(selectedSpecId); 
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
    const i = { 
        id:Date.now(), 
        name:document.getElementById('newItemName').value, 
        manuf:document.getElementById('newItemManuf').value, 
        cat:document.getElementById('newItemCat').value||'Разное', 
        qty:parseFloat(document.getElementById('newItemQty').value)||0, 
        unit:document.getElementById('newItemUnit').value, 
        cost:parseFloat(document.getElementById('newItemCost').value)||0, 
        chars:document.getElementById('newItemChars').value, 
        img:document.getElementById('newItemImg').value, 
        file:document.getElementById('newItemFile').value 
    }; 
    
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

function openItemCard(id) { 
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

function saveItemFromCard() { 
    const i = db.items.find(x => x.id == document.getElementById('cardId').value); 
    i.name=document.getElementById('cardName').value; 
    i.manuf=document.getElementById('cardManuf').value; 
    i.cat=document.getElementById('cardCat').value; 
    i.unit=document.getElementById('cardUnit').value; 
    i.cost=parseFloat(document.getElementById('cardCost').value); 
    i.chars=document.getElementById('cardChars').value; 
    i.img=document.getElementById('cardImg').value; 
    i.file=document.getElementById('cardFile').value; 
    save(); 
    closeModal('itemCardModal'); 
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
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function openSettings() { openModal('settingsModal'); }

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
            const statusBadge = s.status === 'committed' ? '<span class="text-red-500 font-bold text-xs">Списана</span>' : '<span class="text-green-600 font-bold text-xs">В работе</span>'; 
            tbody.innerHTML += `<tr class="border-b dark:border-slate-700 last:border-0">
                <td class="px-4 py-2 font-medium">${s.name}</td>
                <td class="px-4 py-2 text-center">${statusBadge}</td>
                <td class="px-4 py-2 text-center">${s.items.length}</td>
                <td class="px-4 py-2 text-right">${specSum.toLocaleString()} ₽</td>
            </tr>`; 
        }); 
    } 
    document.getElementById('pcTotalSpecsCost').textContent = totalProjectSum.toLocaleString() + ' ₽'; 
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
