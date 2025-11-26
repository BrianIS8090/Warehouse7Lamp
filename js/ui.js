// --- MODALS & DIALOGS ---
function openCreateItemModal() { 
    document.getElementById('newItemName').value=''; 
    openModal('createItemModal'); 
}

function createNewItem() { 
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('items', 'create')) {
        showToast('Нет прав на создание товаров');
        return;
    }
    
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
    
    // Логирование
    if (typeof logActivity === 'function') {
        logActivity('item_create', 'item', i.id, i.name, null);
    }
    
    save(); 
    closeModal('createItemModal'); 
}

function openCreateProjectModal() { 
    document.getElementById('newPrName').value=''; 
    openModal('createProjectModal'); 
}

function createNewProject() { 
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('projects', 'create')) {
        showToast('Нет прав на создание проектов');
        return;
    }
    
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
        file:document.getElementById('newPrFile').value || '',
        status:'active'
    }; 
    
    if(!p.name)return; 
    db.projects.push(p); 
    db.specs[p.id]=[]; 
    
    // Логирование
    if (typeof logActivity === 'function') {
        logActivity('project_create', 'project', p.id, p.name, null);
    }
    
    save(); 
    closeModal('createProjectModal'); 
    renderProjects(); 
    showToast('Проект создан'); 
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
        .map(m => {
            const invoiceDisplay = m.invoiceNumber ? `<span class="text-xs text-slate-600 dark:text-slate-400">${m.invoiceNumber}</span>` : '<span class="text-slate-300 dark:text-slate-600">—</span>';
            return `<tr class="border-b dark:border-slate-700 last:border-0">
                <td class="p-2 text-slate-500 dark:text-slate-400">${m.date.split(',')[0]}</td>
                <td class="p-2 font-bold ${m.type==='in'?'text-green-600 dark:text-green-400':'text-red-600 dark:text-red-400'}">${m.type==='in'?'Приход':'Списание'}</td>
                <td class="p-2 text-right">${formatNumber(m.qty)}</td>
                <td class="p-2">${invoiceDisplay}</td>
            </tr>`;
        }).join('') || '<tr><td colspan="4" class="p-2 text-center text-slate-400">Нет операций</td></tr>'; 
        
    const specs = []; 
    (db.projects || []).forEach(p => { 
        ((db.specs || {})[p.id]||[]).forEach(s => { 
            const r = s.items.find(x => x.itemId === i.id); 
            if (r) {
                // Получаем множитель количества спецификации
                const specQuantity = parseFloat(s.quantity) || 1;
                // Рассчитываем общее количество с учетом количества спецификации
                const totalQty = r.qty * specQuantity;
                specs.push({
                    p: p.name, 
                    s: s.name, 
                    st: s.status, 
                    baseQty: r.qty,  // Базовое количество на единицу
                    totalQty: totalQty  // Общее количество
                });
            }
        }) 
    }); 
    
    document.getElementById('cardSpecHistory').innerHTML = specs.map(x => {
        const baseQtyDisplay = formatNumber(x.baseQty);
        const totalQtyDisplay = formatNumber(x.totalQty);
        return `<tr class="border-b dark:border-slate-700 last:border-0">
            <td class="p-2 font-medium text-slate-700 dark:text-slate-300">${x.p}<div class="text-[10px] text-slate-400">${x.s}</div></td>
            <td class="p-2 text-center">${x.st==='draft'?'<span class="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-[10px]">План</span>':'<span class="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px]">Списан</span>'}</td>
            <td class="p-2 text-right font-bold" title="Базовое: ${baseQtyDisplay}, Общее: ${totalQtyDisplay}">${totalQtyDisplay}</td>
        </tr>`;
    }).join('') || '<tr><td colspan="3" class="p-2 text-center text-slate-400">Нет проектов</td></tr>'; 
    
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
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('items', 'delete')) {
        return showToast("Нет прав на удаление товаров");
    }
    
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
        // Логирование
        if (typeof logActivity === 'function') {
            logActivity('item_delete', 'item', item.id, item.name, null);
        }
        
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
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('items', 'edit')) {
        showToast('Нет прав на редактирование товаров');
        return;
    }
    
    const itemId = parseInt(document.getElementById('cardId').value);
    const i = db.items.find(x => x.id === itemId); 
    if (!i) return;
    
    // Сохраняем старые значения для логирования
    const oldItem = { ...i };
    
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
    
    // Логирование
    if (typeof logActivity === 'function' && typeof trackChanges === 'function') {
        const changes = trackChanges(oldItem, i, ['name', 'manuf', 'cat', 'cost', 'unit', 'chars']);
        if (changes) {
            logActivity('item_edit', 'item', i.id, i.name, changes);
        }
    }
    
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

function openModal(id) { 
    const modal = document.getElementById(id);
    if (!modal) return;
    
    // Убираем hidden и показываем модальное окно
    modal.classList.remove('hidden');
    
    // Добавляем класс show для анимации через небольшую задержку
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function closeModal(id) { 
    const modal = document.getElementById(id);
    if (!modal) return;
    
    // Убираем класс show для анимации закрытия
    modal.classList.remove('show');
    
    // Ждем завершения анимации перед скрытием
    setTimeout(() => {
        modal.classList.add('hidden');
        // Сбрасываем режим просмотра для карточки товара
        if (id === 'itemCardModal') {
            setItemCardViewMode(false);
        }
    }, 300); // Время анимации
}
function openSettings() { 
    const checkbox = document.getElementById('settingMassSelect');
    if (checkbox) {
        checkbox.checked = massSelectionEnabled;
    }
    
    const deleteProjectsCheckbox = document.getElementById('settingDeleteProjects');
    if (deleteProjectsCheckbox) {
        deleteProjectsCheckbox.checked = deleteProjectsEnabled;
    }
    
    // Показываем/скрываем админ-раздел в зависимости от прав
    const adminSection = document.getElementById('adminSection');
    if (adminSection) {
        const canManage = isDemoMode || (typeof hasPermission === 'function' && hasPermission('manageUsers'));
        adminSection.classList.toggle('hidden', !canManage);
    }
    
    openModal('settingsModal'); 
}

function openUserProfile() {
    if (!currentUser) {
        showToast('Пользователь не авторизован');
        return;
    }
    
    // Заполняем форму данными пользователя
    document.getElementById('profileEmail').value = currentUser.email || '';
    document.getElementById('profileName').value = currentUser.name || currentUser.email || '';
    
    // Отображаем роль
    const roleName = typeof ROLE_NAMES !== 'undefined' && currentUser.role ? ROLE_NAMES[currentUser.role] : 'Не назначена';
    document.getElementById('profileRole').value = roleName;
    
    // Обновляем аватар с инициалами
    updateUserAvatar();
    
    openModal('userProfileModal');
}

function saveUserProfile() {
    if (!currentUser || !currentUser.id) {
        showToast('Ошибка: пользователь не найден');
        return;
    }
    
    const newName = document.getElementById('profileName').value.trim();
    if (!newName) {
        showToast('Введите имя');
        return;
    }
    
    initRolesData();
    
    // Сохраняем старое имя для логирования
    const oldName = currentUser.name;
    
    // Обновляем имя в БД
    if (db.users && db.users[currentUser.id]) {
        db.users[currentUser.id].name = newName;
        db.users[currentUser.id].updatedAt = new Date().toISOString();
        
        // Обновляем текущего пользователя
        currentUser.name = newName;
        
        // Логируем изменение
        if (typeof logActivity === 'function') {
            logActivity('user_profile_update', 'user', currentUser.id, currentUser.email, {
                name: { from: oldName, to: newName }
            });
        }
        
        save(false);
        updateUserAvatar();
        closeModal('userProfileModal');
        showToast('Имя успешно обновлено');
    } else {
        showToast('Ошибка: пользователь не найден в базе данных');
    }
}

function updateUserAvatar() {
    if (!currentUser) return;
    
    // Получаем инициалы из имени или email
    const name = currentUser.name || currentUser.email || 'U';
    const initials = getInitials(name);
    
    // Обновляем аватар в header
    const avatarBtn = document.getElementById('userProfileBtn');
    const avatarInitials = document.getElementById('userAvatarInitials');
    if (avatarBtn && avatarInitials) {
        avatarInitials.textContent = initials;
    }
    
    // Обновляем аватар в модальном окне
    const profileAvatar = document.getElementById('profileAvatar');
    const profileInitials = document.getElementById('profileAvatarInitials');
    if (profileAvatar && profileInitials) {
        profileInitials.textContent = initials;
    }
}

function getInitials(name) {
    if (!name) return 'U';
    
    // Если это email, берем первую букву до @
    if (name.includes('@')) {
        return name.charAt(0).toUpperCase();
    }
    
    // Разбиваем имя на слова и берем первые буквы
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
        return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    } else if (words.length === 1) {
        return words[0].charAt(0).toUpperCase();
    }
    
    return 'U';
}

function openProjectFile(url) {
    try {
        if (!url || !url.trim()) {
            showToast('Ссылка на файл не указана');
            return;
        }
        
        console.log('openProjectFile вызвана с URL:', url);
        
        // Конвертируем ссылки Google Drive в прямые
        let directUrl = url.trim();
        const drivePatterns = [
            /\/file\/d\/([a-zA-Z0-9_-]+)/,
            /id=([a-zA-Z0-9_-]+)/
        ];
        
        let fileId = null;
        for (let pattern of drivePatterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                fileId = match[1];
                break;
            }
        }
        
        // Проверяем тип файла по расширению
        const urlLower = url.toLowerCase();
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
        const pdfExtensions = ['.pdf'];
        const documentExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
        
        const isImage = imageExtensions.some(ext => urlLower.includes(ext));
        const isPdf = pdfExtensions.some(ext => urlLower.includes(ext));
        const isDocument = documentExtensions.some(ext => urlLower.includes(ext));
        
        // Если это ссылка Google Drive, конвертируем в прямую ссылку
        if (fileId) {
            console.log('Найден Google Drive ID:', fileId);
            
            // Для PDF из Google Drive используем специальный формат для просмотра
            if (isPdf) {
                directUrl = `https://drive.google.com/file/d/${fileId}/preview`;
                console.log('Конвертированная ссылка для PDF (preview):', directUrl);
            }
            // Для изображений используем режим просмотра
            else if (isImage) {
                directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
                console.log('Конвертированная ссылка для изображения:', directUrl);
            } 
            // Для остальных файлов - скачивание
            else {
                directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
                console.log('Конвертированная ссылка для скачивания:', directUrl);
            }
        }
        
        // Если это изображение или PDF - открываем в новой вкладке
        if (isImage || isPdf) {
            console.log('Открываем изображение/PDF:', directUrl);
            const newWindow = window.open(directUrl, '_blank');
            if (!newWindow) {
                showToast('Браузер заблокировал открытие файла. Разрешите всплывающие окна.');
            }
        } 
        // Если это документ Office - пытаемся открыть через Google Docs Viewer
        else if (isDocument) {
            console.log('Открываем документ Office через Google Docs Viewer');
            const googleDocsViewer = `https://docs.google.com/viewer?url=${encodeURIComponent(directUrl)}&embedded=true`;
            const newWindow = window.open(googleDocsViewer, '_blank');
            if (!newWindow) {
                showToast('Браузер заблокировал открытие файла. Разрешите всплывающие окна.');
            }
        }
        // Для остальных файлов - скачиваем или открываем напрямую
        else {
            console.log('Скачиваем файл:', directUrl);
            const link = document.createElement('a');
            link.href = directUrl;
            link.download = '';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                document.body.removeChild(link);
            }, 100);
        }
    } catch (error) {
        console.error('Ошибка при открытии файла:', error);
        showToast('Ошибка при открытии файла: ' + error.message);
    }
}

// Делаем функцию доступной глобально
if (typeof window !== 'undefined') {
    window.openProjectFile = openProjectFile;
}

// Обработчик клика на кнопки файлов проектов
document.addEventListener('click', (event) => {
    // Обработка клика на кнопку файла проекта
    if (event.target.closest('.project-file-btn')) {
        const btn = event.target.closest('.project-file-btn');
        const fileUrl = btn.getAttribute('data-file-url');
        if (fileUrl) {
            event.stopPropagation();
            event.preventDefault();
            console.log('Клик на кнопку файла, URL:', fileUrl);
            if (typeof openProjectFile === 'function') {
                openProjectFile(fileUrl);
            } else {
                console.error('openProjectFile не найдена, открываем напрямую');
                window.open(fileUrl, '_blank');
            }
            return;
        }
    }
    
    const panel = document.getElementById('specAddPanel');
    const results = document.getElementById('specSearchResults');
    if(panel && results && !panel.contains(event.target)) {
        results.classList.add('hidden');
    }
    
    const movInput = document.getElementById('movItemInput');
    const movResults = document.getElementById('movSearchResults');
    if(movInput && movResults && !movInput.contains(event.target) && !movResults.contains(event.target)) {
        movResults.classList.add('hidden');
    }
});

// --- DATA IMPORT/EXPORT ---
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

