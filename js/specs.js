// --- SPECIFICATIONS ---
function renderSpecProjectList() { 
    const container = document.getElementById('specTreeContainer'); 
    if (!container) return;
    
    container.innerHTML = ''; 
    
    // Сортировка по номеру заявки от большего к меньшему
    const activeProjects = (db.projects || []).filter(p => p.status === 'active').sort((a, b) => {
        let va = a.num || '';
        let vb = b.num || '';
        const na = parseFloat(va);
        const nb = parseFloat(vb);
        if (!Number.isNaN(na) && !Number.isNaN(nb)) {
            va = na;
            vb = nb;
        }
        // Сортировка от большего к меньшему
        if (va < vb) return 1;
        if (va > vb) return -1;
        return 0;
    });
    
    if (activeProjects.length === 0) {
        container.innerHTML = '<div class="text-center text-slate-400 mt-10 text-xs">Нет активных проектов</div>';
        return;
    }
    
    activeProjects.forEach(p => { 
        const specs = ((db.specs || {})[p.id]||[]);
        const specCount = specs.length;
        const isExpanded = expandedProjects.has(p.id);
        const isProjectSelected = selectedProjectId === p.id;
        
        // Стили для проекта
        const projectClasses = isProjectSelected
            ? 'bg-blue-100 dark:bg-slate-700 border-l-4 border-l-blue-600'
            : 'hover:bg-blue-50 dark:hover:bg-slate-700';
        
        // Иконка раскрытия/сворачивания
        const expandIcon = isExpanded 
            ? '<i class="fas fa-chevron-down text-xs text-slate-500"></i>' 
            : '<i class="fas fa-chevron-right text-xs text-slate-500"></i>';
        
        // Кнопка добавления спецификации (показывается только для выбранного проекта и при наличии прав)
        const canCreateSpec = typeof hasPermission === 'function' ? hasPermission('specs', 'create') : true;
        const addButton = (isProjectSelected && canCreateSpec)
            ? `<button onclick="event.stopPropagation(); addNewSpecToProject()" class="w-6 h-6 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors flex-shrink-0" title="Добавить спецификацию">
                <i class="fas fa-plus"></i>
            </button>`
            : '';
        
        // Определяем классы для числа спецификаций (зеленый, если не 0)
        const specCountClasses = specCount > 0
            ? 'bg-green-200 dark:bg-green-600 text-green-700 dark:text-green-300'
            : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300';
        
        // HTML проекта
        const projectHtml = `
            <div class="border-b dark:border-slate-600 ${projectClasses}">
                <div class="p-3 flex items-center gap-2">
                    <span onclick="toggleProjectExpand(${p.id})" class="w-4 flex items-center justify-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 flex-shrink-0">${expandIcon}</span>
                    <div class="flex-1 min-w-0 cursor-pointer" onclick="selectSpecProject(${p.id})">
                        <div class="font-bold text-sm flex items-center gap-2">
                            <span class="truncate min-w-0 flex-1">${p.name}</span>
                            <div class="flex items-center gap-2 flex-shrink-0">
                                <span class="${specCountClasses} px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap">${specCount}</span>
                                ${addButton}
                            </div>
                        </div>
                        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">${p.num || '—'}</div>
                    </div>
                </div>
                ${isExpanded ? renderProjectSpecs(p.id, specs) : ''}
            </div>
        `;
        
        container.innerHTML += projectHtml;
    });
}

function renderProjectSpecs(projectId, specs) {
    if (!specs || specs.length === 0) {
        return `
            <div class="pl-7 pr-3 py-2 text-xs text-slate-400 dark:text-slate-500 italic">
                Нет спецификаций
            </div>
        `;
    }
    
    // Проверяем права на удаление спецификаций
    const canDeleteSpec = typeof hasPermission === 'function' ? hasPermission('specs', 'delete') : true;
    
    let html = '<div class="pl-7 pr-3 py-2 space-y-1">';
    
    specs.forEach(s => {
        const ic = s.status === 'committed' 
            ? '<i class="fas fa-lock text-red-500 text-xs"></i>' 
            : '<i class="fas fa-pen text-green-500 text-xs"></i>';
        const isSelected = selectedSpecId === s.id;
        const specClasses = isSelected
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-500'
            : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:shadow';
        
        const deleteBtn = canDeleteSpec 
            ? `<button onclick="event.stopPropagation(); deleteSpec('${s.id}')" class="text-slate-400 hover:text-red-500 flex-shrink-0" title="Удалить спецификацию">
                        <i class="fas fa-trash text-xs"></i>
                    </button>`
            : '';
        
        html += `
            <div onclick="selectSpecAndLoad('${projectId}', '${s.id}')" class="p-2 border rounded cursor-pointer transition-colors ${specClasses}">
                <div class="flex justify-between items-center gap-2">
                    <div class="flex items-center gap-2 flex-1 min-w-0">
                        ${ic}
                        <span class="text-sm font-medium truncate">${s.name}</span>
                    </div>
                    ${deleteBtn}
                </div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-1 ml-5">Позиций: ${s.items.length}</div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function toggleProjectExpand(projectId) {
    if (expandedProjects.has(projectId)) {
        expandedProjects.delete(projectId);
    } else {
        expandedProjects.add(projectId);
    }
    renderSpecProjectList();
}

function selectSpecProject(pid) { 
    selectedProjectId = pid; 
    selectedSpecId = null; 
    
    // Автоматически раскрываем проект при выборе, если он не раскрыт
    if (!expandedProjects.has(pid)) {
        expandedProjects.add(pid);
    }
    
    renderSpecProjectList(); 
    document.getElementById('specEditor').classList.add('hidden'); 
    document.getElementById('specContentPlaceholder').classList.remove('hidden'); 
}

function selectSpecAndLoad(projectId, specId) {
    // Сначала выбираем проект
    selectedProjectId = parseInt(projectId);
    selectedSpecId = specId;
    
    // Автоматически раскрываем проект при выборе спецификации
    if (!expandedProjects.has(selectedProjectId)) {
        expandedProjects.add(selectedProjectId);
    }
    
    // Обновляем дерево проектов, чтобы визуально выделить выбранный проект
    renderSpecProjectList();
    
    // Затем загружаем спецификацию
    loadSpec(specId);
}

function addNewSpecToProject() { 
    if(!selectedProjectId) { 
        alert("Сначала выберите проект из дерева!"); 
        return; 
    }
    openModal('addSpecModal');
}

function openCreateNewSpec() {
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('specs', 'create')) {
        showToast('Нет прав на создание спецификаций');
        return;
    }
    
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
            quantity: 1,  // Количество единиц продукции по умолчанию
            items: [] 
        }; 
        
        db.specs[selectedProjectId].push(newSpec); 
        selectedSpecId = newSpec.id; 
        // Раскрываем проект при создании спецификации
        expandedProjects.add(selectedProjectId);
        
        // Логирование
        const project = db.projects.find(p => p.id === selectedProjectId);
        if (typeof logActivity === 'function') {
            logActivity('spec_create', 'spec', newSpec.id, n, {
                project: project ? project.name : ''
            });
        }
        
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
            quantity: sourceSpec.quantity || 1,  // Копируем количество или ставим 1 по умолчанию
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
        // Раскрываем проект при копировании спецификации
        expandedProjects.add(selectedProjectId);
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
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('specs', 'delete')) {
        showToast('Нет прав на удаление спецификаций');
        return;
    }
    
    if(!selectedProjectId) return;
    const specs = (db.specs || {})[selectedProjectId] || [];
    const idx = specs.findIndex(s => s.id === specId);
    if(idx === -1) return;
    
    const spec = specs[idx];
    const message = spec.status === 'committed'
        ? `Спецификация "${spec.name}" уже списана.\nУдаление приведет к потере истории.\nУдалить?`
        : `Удалить спецификацию "${spec.name}"?`;
    
    if(!confirm(message)) return;
    
    // Логирование перед удалением
    const project = db.projects.find(p => p.id === selectedProjectId);
    if (typeof logActivity === 'function') {
        logActivity('spec_delete', 'spec', specId, spec.name, {
            project: project ? project.name : '',
            itemsCount: spec.items.length
        });
    }
    
    specs.splice(idx, 1);
    
    if(selectedSpecId === specId) {
        selectedSpecId = null;
        document.getElementById('specEditor').classList.add('hidden');
        document.getElementById('specContentPlaceholder').classList.remove('hidden');
    }
    
    save();
    renderSpecProjectList();
    showToast("Спецификация удалена");
}

// --- CUSTOM ITEMS ---
function openAddCustomItemModal() {
    document.getElementById('customName').value = '';
    document.getElementById('customUnit').value = 'шт.';
    document.getElementById('customQty').value = '1';
    document.getElementById('customCost').value = '0';
    openModal('addCustomItemModal');
}

function closeAddCustomItemModal() {
    closeModal('addCustomItemModal');
}

function addCustomItem() {
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('specs', 'edit')) {
        showToast('Нет прав на редактирование спецификаций');
        return;
    }
    
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
    
    // Логирование
    if (typeof logActivity === 'function') {
        logActivity('spec_edit', 'spec', selectedSpecId, s.name, {
            action: 'add_custom_item',
            itemName: name,
            qty: qty,
            cost: cost
        });
    }
    
    save();
    closeModal('addCustomItemModal');
    loadSpec(selectedSpecId);
    showToast("Позиция добавлена");
}

function loadSpec(sid) {
    selectedSpecId = sid; 
    
    // Находим проект для этой спецификации
    if (!selectedProjectId) {
        Object.keys(db.specs || {}).forEach(pid => {
            const specs = db.specs[pid] || [];
            if (specs.find(s => s.id === sid)) {
                selectedProjectId = parseInt(pid);
                expandedProjects.add(selectedProjectId);
            }
        });
    } else {
        // Раскрываем проект при загрузке спецификации
        expandedProjects.add(selectedProjectId);
    }
    
    renderSpecProjectList(); 
    const s = db.specs[selectedProjectId].find(x => x.id === sid);
    document.getElementById('specEditor').classList.remove('hidden'); 
    document.getElementById('specContentPlaceholder').classList.add('hidden');
    
    // Проверяем права на редактирование
    const canEditSpec = typeof hasPermission === 'function' ? hasPermission('specs', 'edit') : true;
    const canCommitSpec = typeof hasPermission === 'function' ? hasPermission('specs', 'commit') : true;
    
    // Определяем, можно ли редактировать (права + не закрыта)
    const isEditable = canEditSpec && s.status !== 'committed';
    
    // Устанавливаем название спецификации в поле ввода
    const specTitleInput = document.getElementById('specTitle');
    if (specTitleInput) {
        specTitleInput.value = s.name || '';
        // Если спецификация закрыта или нет прав, делаем поле только для чтения
        if (!isEditable) {
            specTitleInput.disabled = true;
            specTitleInput.classList.add('cursor-not-allowed', 'opacity-75');
        } else {
            specTitleInput.disabled = false;
            specTitleInput.classList.remove('cursor-not-allowed', 'opacity-75');
        }
    }
    
    document.getElementById('specSubtitle').textContent = s.status==='committed'?'ЗАКРЫТА':''; 
    
    // Устанавливаем количество спецификации (по умолчанию 1 для старых спецификаций)
    if (!s.hasOwnProperty('quantity') || s.quantity === undefined || s.quantity === null) {
        s.quantity = 1;
        save(false); // Сохраняем без обновления UI чтобы не было лишних перерисовок
    }
    
    const specQuantityInput = document.getElementById('specQuantity');
    if (specQuantityInput) {
        specQuantityInput.value = s.quantity || 1;
        // Если спецификация закрыта или нет прав, делаем поле только для чтения
        if (!isEditable) {
            specQuantityInput.disabled = true;
            specQuantityInput.classList.add('bg-slate-100', 'dark:bg-slate-600');
        } else {
            specQuantityInput.disabled = false;
            specQuantityInput.classList.remove('bg-slate-100', 'dark:bg-slate-600');
        }
    }
    
    // Управление видимостью кнопки списания и панели добавления
    const btnCommit = document.getElementById('btnCommitSpec');
    const addPanel = document.getElementById('specAddPanel');
    
    if(s.status==='committed') { 
        if(btnCommit) btnCommit.classList.add('hidden'); 
        if(addPanel) addPanel.classList.add('hidden'); 
    } else { 
        // Показываем кнопку списания только если есть право на commit
        if(btnCommit) {
            btnCommit.classList.toggle('hidden', !canCommitSpec);
        }
        // Показываем панель добавления только если есть право на редактирование
        if(addPanel) {
            addPanel.classList.toggle('hidden', !canEditSpec);
        }
    }
    
    const tb = document.getElementById('specTableBody'); 
    tb.innerHTML = ''; 
    let tot = 0;
    
    // Получаем множитель количества спецификации
    const specQuantity = parseFloat(s.quantity) || 1;
    
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
            // Случай 1: Нестандартные изделия всегда внизу (если один нестандартный, а другой нет)
            if (a.category === 'Нестандартные изделия' && b.category !== 'Нестандартные изделия') return 1;
            if (b.category === 'Нестандартные изделия' && a.category !== 'Нестандартные изделия') return -1;
            
            // Случай 2: Если обе категории "Нестандартные изделия", сортируем по алфавиту по названию
            if (a.category === 'Нестандартные изделия' && b.category === 'Нестандартные изделия') {
                const nameA = (a.name || '').trim();
                const nameB = (b.name || '').trim();
                return nameA.localeCompare(nameB, 'ru', { sensitivity: 'base' });
            }
            
            // Случай 3: Обычные товары - сортируем по категории, затем по названию
            const catDiff = a.category.localeCompare(b.category, 'ru', { sensitivity: 'base' });
            if (catDiff !== 0) return catDiff;
            const nameA = (a.name || '').trim();
            const nameB = (b.name || '').trim();
            return nameA.localeCompare(nameB, 'ru', { sensitivity: 'base' });
        });

    let currentCategory = null;

    const isDraft = s.status === 'draft';
    // Можно редактировать позиции только если есть права и спецификация не закрыта
    const canEditItems = isEditable;

    itemsWithMeta.forEach((entry, idx) => { 
        const { name, unit, qty, cost, category, rowClass, originalIndex, isCustom } = entry;
        // Умножаем количество товара на количество спецификации
        const finalQty = qty * specQuantity;
        const rowTotal = cost * finalQty;
        tot += rowTotal; 
        // Показываем поле ввода только если можно редактировать, иначе просто текст
        const qtyCell = canEditItems
            ? `<input type="number" min="0" step="0.01" value="${formatNumber(qty)}" class="spec-qty-input w-20 text-center border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400" onchange="updateSpecItemQty(${originalIndex}, this.value)" onclick="event.stopPropagation()" title="На единицу продукции">`
            : formatNumber(qty);
        const rowTotalDisplay = formatCurrency(rowTotal);

        if (category !== currentCategory) {
            currentCategory = category;
            tb.innerHTML += `<tr class="bg-slate-100 dark:bg-slate-800/60">
                <td colspan="7" class="px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">${category}</td>
            </tr>`;
        }
        
        // Кнопка удаления только если можно редактировать
        const del = canEditItems ? `<button onclick="event.stopPropagation(); remSpecItem(${originalIndex})" class="text-red-400"><i class="fas fa-trash"></i></button>` : ''; 
        const itemId = !isCustom ? s.items[originalIndex].itemId : null;
        // Обработчик клика только на название товара, а не на всю строку
        const itemNameClickHandler = itemId ? `onclick="openItemCardViewOnly(${itemId})" style="cursor: pointer;"` : '';
        const itemNameClass = itemId ? 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer' : 'font-medium';
        // Отображаем общее количество (с учетом множителя спецификации)
        const totalQtyDisplay = formatNumber(finalQty);
        
        // Для нестандартных изделий добавляем возможность редактирования стоимости (если есть права)
        const costCell = isCustom && canEditItems
            ? `<input type="number" min="0" step="0.01" value="${formatNumber(cost)}" class="spec-cost-input w-24 text-right border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400" onchange="updateSpecItemCost(${originalIndex}, this.value)" onclick="event.stopPropagation()" title="Цена за единицу">`
            : rowTotalDisplay;
        
        const costCellClass = isCustom && canEditItems ? 'text-right' : 'text-right text-sm';
        
        tb.innerHTML += `<tr class="border-b dark:border-slate-700 ${rowClass}">
            <td class="text-center text-sm px-2">${idx + 1}</td>
            <td class="px-4 py-2 text-sm">${isCustom ? `<span class="font-medium">${name}</span>` : `<span class="${itemNameClass}" ${itemNameClickHandler}>${name}</span>`}</td>
            <td class="text-center text-sm">${unit || '-'}</td>
            <td class="text-center text-sm">${qtyCell}</td>
            <td class="text-center text-sm font-medium text-blue-600 dark:text-blue-400">${totalQtyDisplay}</td>
            <td class="${costCellClass}">${costCell}</td>
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

function remSpecItem(idx) {
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('specs', 'edit')) {
        showToast('Нет прав на редактирование спецификаций');
        return;
    }
    
    if(!confirm("Удалить позицию?")) return;
    const s = db.specs[selectedProjectId].find(x => x.id === selectedSpecId);
    s.items.splice(idx, 1);
    save();
    loadSpec(selectedSpecId);
}

function updateSpecName(newName) {
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('specs', 'edit')) {
        showToast('Нет прав на редактирование спецификаций');
        loadSpec(selectedSpecId);
        return;
    }
    
    if(!selectedProjectId || !selectedSpecId) return;
    const trimmedName = (newName || '').trim();
    if(!trimmedName) {
        showToast("Название не может быть пустым");
        loadSpec(selectedSpecId);
        return;
    }
    const specList = (db.specs || {})[selectedProjectId] || [];
    const spec = specList.find(x => x.id === selectedSpecId);
    if(!spec) return;
    
    // Проверяем, не закрыта ли спецификация
    if(spec.status === 'committed') {
        showToast("Нельзя изменить название закрытой спецификации");
        loadSpec(selectedSpecId);
        return;
    }
    
    spec.name = trimmedName;
    save();
    renderSpecProjectList(); // Обновляем список проектов, чтобы отобразить новое название
    showToast("Название обновлено");
}

function updateSpecQuantity(rawValue) {
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('specs', 'edit')) {
        showToast('Нет прав на редактирование спецификаций');
        loadSpec(selectedSpecId);
        return;
    }
    
    if(!selectedProjectId || !selectedSpecId) return;
    const quantity = parseFloat(rawValue);
    if(isNaN(quantity) || quantity <= 0) {
        showToast("Введите корректное количество (больше 0)");
        loadSpec(selectedSpecId);
        return;
    }
    const specList = (db.specs || {})[selectedProjectId] || [];
    const spec = specList.find(x => x.id === selectedSpecId);
    if(!spec) return;
    spec.quantity = quantity;
    save();
    loadSpec(selectedSpecId);
}

function updateSpecItemQty(idx, rawValue) {
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('specs', 'edit')) {
        showToast('Нет прав на редактирование спецификаций');
        loadSpec(selectedSpecId);
        return;
    }
    
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

function updateSpecItemCost(idx, rawValue) {
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('specs', 'edit')) {
        showToast('Нет прав на редактирование спецификаций');
        loadSpec(selectedSpecId);
        return;
    }
    
    if(!selectedProjectId || !selectedSpecId) return;
    const cost = parseFloat(rawValue);
    if(isNaN(cost)) {
        showToast("Введите корректную стоимость");
        loadSpec(selectedSpecId);
        return;
    }
    if(cost < 0) {
        showToast("Стоимость не может быть отрицательной");
        loadSpec(selectedSpecId);
        return;
    }
    const specList = (db.specs || {})[selectedProjectId] || [];
    const spec = specList.find(x => x.id === selectedSpecId);
    if(!spec || !spec.items[idx]) return;
    
    // Обновляем стоимость только для нестандартных изделий
    if(spec.items[idx].isCustom) {
        spec.items[idx].cost = cost;
        save();
        loadSpec(selectedSpecId);
    } else {
        showToast("Редактирование стоимости доступно только для нестандартных изделий");
    }
}

function commitSpec() {
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('specs', 'commit')) {
        showToast('Нет прав на списание по спецификациям');
        return;
    }
    
    if(!confirm("Списать материалы со склада? Это действие необратимо.")) return;
    const s = db.specs[selectedProjectId].find(x => x.id === selectedSpecId);
    
    // Получаем множитель количества спецификации
    const specQuantity = parseFloat(s.quantity) || 1;
    
    let err = null;
    s.items.forEach(r => {
        if(!r.isCustom) {
            const i = db.items.find(x => x.id === r.itemId);
            // Рассчитываем итоговое количество с учетом количества спецификации
            const finalQty = r.qty * specQuantity;
            if(!i || i.qty < finalQty) err = `Нехватка товара: ${i ? i.name : 'Удаленный товар'} (требуется ${finalQty}, доступно ${i ? i.qty : 0})`;
        }
    });
    
    if(err) return alert(err);
    
    s.items.forEach(r => {
        if(!r.isCustom) {
            const i = db.items.find(x => x.id === r.itemId);
            // Рассчитываем итоговое количество с учетом количества спецификации
            const finalQty = r.qty * specQuantity;
            i.qty -= finalQty;
            db.movements.unshift({
                id: 'mov_' + Date.now(), 
                date: new Date().toLocaleString(), 
                type: 'out', 
                itemId: i.id, 
                itemName: `${i.name} (В проект ${db.projects.find(p=>p.id===selectedProjectId).name}, кол-во: ${specQuantity})`, 
                qty: finalQty
            }); 
        }
    });
    
    s.status = 'committed';
    
    // Логирование
    const project = db.projects.find(p => p.id === selectedProjectId);
    if (typeof logActivity === 'function') {
        logActivity('spec_commit', 'spec', s.id, s.name, {
            project: project ? project.name : '',
            itemsCount: s.items.length,
            quantity: specQuantity
        });
    }
    
    save();
    showToast("Материалы списаны");
    loadSpec(selectedSpecId);
}

function printSpec(includeCosts = true) {
    if(!selectedProjectId || !selectedSpecId) return;
    const project = db.projects.find(p => p.id === selectedProjectId);
    const spec = db.specs[selectedProjectId].find(s => s.id === selectedSpecId);
    if(!project || !spec) return;
    
    // Получаем множитель количества спецификации
    const specQuantity = parseFloat(spec.quantity) || 1;
    
    const itemsWithMeta = spec.items
        .map((item) => {
            if (item.isCustom) {
                const cost = parseFloat(item.cost) || 0;
                // Сохраняем базовое количество и рассчитываем итоговое
                const baseQty = item.qty;
                const finalQty = baseQty * specQuantity;
                return {
                    isCustom: true,
                    name: item.name || 'Нестандартная позиция',
                    unit: item.unit || '',
                    baseQty: baseQty,  // Количество на единицу продукции
                    qty: finalQty,      // Общее количество
                    cost,
                    sum: cost * finalQty,
                    category: 'Нестандартные изделия'
                };
            } else {
                const dbItem = db.items.find(i => i.id === item.itemId);
                if(!dbItem) return null;
                const cost = parseFloat(dbItem.cost) || 0;
                // Сохраняем базовое количество и рассчитываем итоговое
                const baseQty = item.qty;
                const finalQty = baseQty * specQuantity;
                return {
                    isCustom: false,
                    name: dbItem.name,
                    unit: dbItem.unit || '',
                    baseQty: baseQty,  // Количество на единицу продукции
                    qty: finalQty,      // Общее количество
                    cost,
                    sum: cost * finalQty,
                    category: dbItem.cat || 'Без категории'
                };
            }
        })
        .filter(Boolean)
        .sort((a, b) => {
            // Случай 1: Нестандартные изделия всегда внизу (если один нестандартный, а другой нет)
            if (a.category === 'Нестандартные изделия' && b.category !== 'Нестандартные изделия') return 1;
            if (b.category === 'Нестандартные изделия' && a.category !== 'Нестандартные изделия') return -1;
            
            // Случай 2: Если обе категории "Нестандартные изделия", сортируем по алфавиту по названию
            if (a.category === 'Нестандартные изделия' && b.category === 'Нестандартные изделия') {
                const nameA = (a.name || '').trim();
                const nameB = (b.name || '').trim();
                return nameA.localeCompare(nameB, 'ru', { sensitivity: 'base' });
            }
            
            // Случай 3: Обычные товары - сортируем по категории, затем по названию
            const catDiff = a.category.localeCompare(b.category, 'ru', { sensitivity: 'base' });
            if (catDiff !== 0) return catDiff;
            const nameA = (a.name || '').trim();
            const nameB = (b.name || '').trim();
            return nameA.localeCompare(nameB, 'ru', { sensitivity: 'base' });
        });
    
    let groupedRows = '';
    let currentCategory = null;
    let total = 0;
    
    const groupColSpan = includeCosts ? 7 : 5;
    itemsWithMeta.forEach((item, index) => {
        total += item.sum;
        const baseQtyDisplay = formatNumber(item.baseQty);
        const totalQtyDisplay = formatNumber(item.qty);
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
            <td class="p-2 text-center">${baseQtyDisplay}</td>
            <td class="p-2 text-center font-bold">${totalQtyDisplay}</td>
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
                        <th class="p-2 text-center w-20">Кол-во (на ед.)</th>
                        <th class="p-2 text-center w-20">Общее кол-во</th>
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
                        <div><strong>Количество:</strong> ${specQuantity}</div>
                    </div>
                </div>
                <div class="text-right text-sm">
                    <div>Дата: ${new Date().toLocaleDateString()}</div>
                    ${statusText}
                </div>
            </div>
            ${tableBlock}
            ${totalBlock}
            ${!includeCosts ? `
            <div class="flex justify-between mt-12 text-sm">
                <div>
                    <div class="border-t border-black w-48 pt-1">Сдал (Кладовщик)</div>
                </div>
                <div>
                    <div class="border-t border-black w-48 pt-1">Принял (Монтажник)</div>
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    const printArea = document.getElementById('printArea'); 
    printArea.innerHTML = html; 
    window.print();
}

function addToSpec() { 
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('specs', 'edit')) {
        showToast('Нет прав на редактирование спецификаций');
        return;
    }
    
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
    
    // Логирование
    if (typeof logActivity === 'function') {
        const item = db.items.find(i => i.id == iid);
        logActivity('spec_edit', 'spec', selectedSpecId, s.name, {
            action: 'add_item',
            itemName: item ? item.name : '',
            qty: qty
        });
    }
    
    save(); 
    resetSpecSearchInput();
    loadSpec(selectedSpecId); 
    showToast("Добавлено");
}

