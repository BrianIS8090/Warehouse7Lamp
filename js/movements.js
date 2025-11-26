// --- MOVEMENTS ---
function handleMovSearch(isTyping = false) {
    const input = document.getElementById('movItemInput');
    const results = document.getElementById('movSearchResults');
    if(!input || !results) return;
    
    if(isTyping) {
        delete input.dataset.itemId;
    }
    
    let rawValue = input.value;
    let trimmed = rawValue.trim();
    
    // If field is empty -> show categories
    if(trimmed.length === 0 && !input.dataset.category) {
        delete input.dataset.itemId;
        renderMovCategoryList(results);
        return;
    }
    
    const arrowIdx = rawValue.indexOf('→');
    if(arrowIdx === -1 && trimmed.length === 0) {
        delete input.dataset.category;
        delete input.dataset.itemId;
        renderMovCategoryList(results);
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
    renderMovItemResults(results, items.slice(0, maxResults), !!selectedCategory);
}

function renderMovCategoryList(resultsEl) {
    const cats = [...new Set((db.items || []).map(i => i.cat || 'Без категории'))];
    cats.sort();
    if(cats.length === 0) {
        resultsEl.innerHTML = '<div class="px-3 py-2 text-slate-400 text-sm">Нет категорий</div>';
        resultsEl.classList.remove('hidden');
        return;
    }
    const html = cats.map(cat => `
        <div class="px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-600 cursor-pointer text-sm" onclick="selectMovCategory('${cat.replace(/'/g, "\\'")}')">
            ${cat}
        </div>
    `).join('');
    resultsEl.innerHTML = html;
    resultsEl.classList.remove('hidden');
}

function renderMovItemResults(resultsEl, items, groupedByCategory) {
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
        html += `<div class="px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-600 cursor-pointer flex justify-between items-center text-sm" onclick="selectMovSearchItem(${item.id})">
            <span class="text-slate-700 dark:text-slate-100">${item.name}</span>
            <span class="text-xs text-slate-400">Ост: ${formatNumber(item.qty)}</span>
        </div>`;
    });
    resultsEl.innerHTML = html;
    resultsEl.classList.remove('hidden');
}

function selectMovSearchItem(itemId) {
    const input = document.getElementById('movItemInput');
    const results = document.getElementById('movSearchResults');
    const item = db.items.find(i => i.id == itemId);
    if(!input || !item) return;
    
    input.value = `${item.cat} → ${item.name}`;
    input.dataset.itemId = item.id;
    input.dataset.category = item.cat;
    if(results) results.classList.add('hidden');
}

function selectMovCategory(cat) {
    const input = document.getElementById('movItemInput');
    const results = document.getElementById('movSearchResults');
    if(!input || !results) return;
    
    input.value = `${cat} → `;
    input.dataset.category = cat;
    delete input.dataset.itemId;
    input.focus();
    handleMovSearch();
}

function saveMovementIn() {
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('movements', 'in')) {
        showToast('Нет прав на проведение прихода');
        return;
    }
    
    const input = document.getElementById('movItemInput');
    const itemId = input?.dataset.itemId ? parseInt(input.dataset.itemId) : null;
    const qty = parseFloat(document.getElementById('movQty').value);
    const invoice = document.getElementById('movInvoice').value.trim();
    
    if (!itemId) {
        showToast('Выберите товар из списка');
        return;
    }
    
    const item = db.items.find(i => i.id === itemId);
    if (!item || !qty || qty <= 0) {
        showToast('Ошибка ввода');
        return;
    }
    
    const oldQty = item.qty;
    item.qty += qty;
    
    const movementId = 'mov_' + Date.now();
    db.movements.unshift({
        id: movementId, 
        date: new Date().toLocaleString(), 
        type: 'in', 
        itemId: item.id, 
        itemName: item.name, 
        qty,
        invoiceNumber: invoice || null
    }); 
    
    // Логирование
    if (typeof logActivity === 'function') {
        logActivity('movement_in', 'movement', movementId, item.name, {
            qty: { from: oldQty, to: item.qty },
            added: qty,
            invoice: invoice || null
        });
    }
    
    save(); 
    showToast('Приход проведен'); 
    document.getElementById('movItemInput').value = '';
    document.getElementById('movQty').value = '';
    document.getElementById('movInvoice').value = '';
    delete input.dataset.itemId;
    delete input.dataset.category;
    renderHistoryTable();
}

function saveMovementOut() {
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('movements', 'out')) {
        showToast('Нет прав на проведение списания');
        return;
    }
    
    const input = document.getElementById('movItemInput');
    const itemId = input?.dataset.itemId ? parseInt(input.dataset.itemId) : null;
    const qty = parseFloat(document.getElementById('movQty').value);
    
    if (!itemId) {
        showToast('Выберите товар из списка');
        return;
    }
    
    const item = db.items.find(i => i.id === itemId);
    if (!item || !qty || qty <= 0) {
        showToast('Ошибка ввода');
        return;
    }
    
    if(item.qty < qty) {
        alert('Недостаточно товара на складе!');
        return;
    }
    
    const oldQty = item.qty;
    item.qty -= qty;
    
    const movementId = 'mov_' + Date.now();
    db.movements.unshift({
        id: movementId, 
        date: new Date().toLocaleString(), 
        type: 'out', 
        itemId: item.id, 
        itemName: item.name, 
        qty
    }); 
    
    // Логирование
    if (typeof logActivity === 'function') {
        logActivity('movement_out', 'movement', movementId, item.name, {
            qty: { from: oldQty, to: item.qty },
            removed: qty
        });
    }
    
    save(); 
    showToast('Списание проведено'); 
    document.getElementById('movItemInput').value = '';
    document.getElementById('movQty').value = '';
    document.getElementById('movInvoice').value = '';
    delete input.dataset.itemId;
    delete input.dataset.category;
    renderHistoryTable();
}

function undoMovement(mid) {
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('movements', 'undo')) {
        showToast('Нет прав на отмену операций');
        return;
    }
    
    if(!confirm("Отменить эту операцию? Товар вернется на склад.")) return;
    
    const idx = db.movements.findIndex(m => m.id === mid);
    if (idx === -1) return alert("Ошибка: запись не найдена");
    
    const m = db.movements[idx];
    const item = db.items.find(i => i.id === m.itemId);
    
    if(item) {
        const oldQty = item.qty;
        if (m.type === 'in') {
            if(item.qty < m.qty) {
                    if(!confirm("Внимание! При отмене прихода остаток станет отрицательным. Продолжить?")) return;
            }
            item.qty -= m.qty;
        } else {
            item.qty += m.qty;
        }
        
        // Логирование
        if (typeof logActivity === 'function') {
            logActivity('movement_undo', 'movement', mid, m.itemName, {
                originalType: m.type,
                qty: { from: oldQty, to: item.qty },
                undoneQty: m.qty
            });
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
        const invoiceDisplay = m.invoiceNumber ? `<span class="text-xs text-slate-500 dark:text-slate-400">${m.invoiceNumber}</span>` : '<span class="text-slate-300 dark:text-slate-600">—</span>';
        t.innerHTML += `<tr class="border-b dark:border-slate-700">
            <td class="p-2 text-slate-500 dark:text-slate-400">${m.date}</td>
            <td class="p-2">${m.itemName}</td>
            <td class="p-2 text-right font-bold ${m.type==='in'?'text-green-600 dark:text-green-400':'text-red-600 dark:text-red-400'}">${m.type==='in'?'+':'-'}${qtyDisplay}</td>
            <td class="p-2">${invoiceDisplay}</td>
            <td class="p-2 text-right">
                    <button onclick="undoMovement('${m.id}')" class="text-red-400 hover:text-red-600 p-1" title="Отменить"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }); 
}

function renderDatalists() { 
    const dl = document.getElementById('itemList'); 
    if (!dl) {
        // Элемент не найден, возможно он не используется или был удален
        return;
    }
    dl.innerHTML = ''; 
    (db.items || []).forEach(i => dl.innerHTML += `<option value="${i.name}">Ост: ${formatNumber(i.qty)}</option>`); 
}




