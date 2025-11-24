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
                // Получаем множитель количества спецификации
                const specQuantity = parseFloat(s.quantity) || 1;
                s.items.forEach(item => {
                    if (!item.isCustom && item.itemId) {
                        // Умножаем количество товара на количество спецификации для резерва
                        const finalQty = item.qty * specQuantity;
                        reservesCache[item.itemId] = (reservesCache[item.itemId] || 0) + finalQty;
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
    
    openModal('quickMoveModal');
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

