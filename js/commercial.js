// --- COMMERCIAL DEPARTMENT MODULE ---

// Закрытие результатов поиска калькуляции при клике вне
document.addEventListener('click', function(e) {
    const calcSearchResults = document.getElementById('calcSearchResults');
    const calcItemSearch = document.getElementById('calcItemSearch');
    if (calcSearchResults && calcItemSearch) {
        if (!calcSearchResults.contains(e.target) && e.target !== calcItemSearch) {
            calcSearchResults.classList.add('hidden');
        }
    }
});

// === RENDER COMMERCIAL REQUESTS TREE ===
function renderCommercialRequestsList() {
    const container = document.getElementById('commercialTreeContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Группируем запросы по годам и сортируем
    const requests = (db.commercialRequests || []).filter(r => r.status !== 'deleted');
    
    // Группировка по годам
    const byYear = {};
    requests.forEach(r => {
        const year = r.year || new Date().getFullYear();
        if (!byYear[year]) byYear[year] = [];
        byYear[year].push(r);
    });
    
    // Сортируем года от большего к меньшему
    const years = Object.keys(byYear).sort((a, b) => b - a);
    
    if (years.length === 0) {
        container.innerHTML = '<div class="text-center text-slate-400 mt-10 text-xs">Нет запросов</div>';
        return;
    }
    
    years.forEach(year => {
        // Сортируем запросы внутри года по номеру от большего к меньшему
        const yearRequests = byYear[year].sort((a, b) => {
            const numA = parseInt(a.number) || 0;
            const numB = parseInt(b.number) || 0;
            return numB - numA;
        });
        
        // Заголовок года
        const yearHtml = `
            <div class="bg-slate-100 dark:bg-slate-700 px-3 py-2 font-bold text-sm text-slate-600 dark:text-slate-300 sticky top-0">
                ${year} год <span class="text-xs font-normal text-slate-400">(${yearRequests.length})</span>
            </div>
        `;
        container.innerHTML += yearHtml;
        
        // Запросы года
        yearRequests.forEach(request => {
            const isExpanded = expandedCommercialRequests.has(request.id);
            const isSelected = selectedCommercialRequestId === request.id;
            const proposalsCount = (request.proposals || []).length;
            
            const requestClasses = isSelected
                ? 'bg-blue-100 dark:bg-slate-600 border-l-4 border-l-blue-600'
                : 'hover:bg-blue-50 dark:hover:bg-slate-700';
            
            const expandIcon = isExpanded
                ? '<i class="fas fa-chevron-down text-xs text-slate-500"></i>'
                : '<i class="fas fa-chevron-right text-xs text-slate-500"></i>';
            
            const statusBadge = request.status === 'converted'
                ? '<span class="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded text-[10px]">В проекте</span>'
                : '';
            
            const requestHtml = `
                <div class="border-b dark:border-slate-600 ${requestClasses}">
                    <div class="p-3 flex items-center gap-2">
                        <span onclick="toggleCommercialRequestExpand('${request.id}')" class="w-4 flex items-center justify-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 flex-shrink-0">${expandIcon}</span>
                        <div class="flex-1 min-w-0 cursor-pointer" onclick="selectCommercialRequest('${request.id}')">
                            <div class="font-bold text-sm flex items-center gap-2">
                                <span class="text-blue-600 dark:text-blue-400">${request.number || '—'}</span>
                                <span class="truncate min-w-0 flex-1">${request.name || 'Без названия'}</span>
                                ${statusBadge}
                            </div>
                            <div class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">${request.client || '—'}</div>
                            <div class="text-[10px] text-slate-400 mt-1">КП: ${proposalsCount}</div>
                        </div>
                    </div>
                    ${isExpanded ? renderCommercialProposals(request) : ''}
                </div>
            `;
            container.innerHTML += requestHtml;
        });
    });
}

function renderCommercialProposals(request) {
    const proposals = request.proposals || [];
    
    if (proposals.length === 0) {
        return `
            <div class="pl-7 pr-3 py-2 text-xs text-slate-400 dark:text-slate-500 italic">
                Нет коммерческих предложений
            </div>
        `;
    }
    
    let html = '<div class="pl-7 pr-3 py-2 space-y-1">';
    
    proposals.forEach(p => {
        const isSelected = selectedProposalId === p.id;
        const lightsCount = (p.lights || []).length;
        const proposalClasses = isSelected
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-500'
            : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:shadow';
        
        html += `
            <div onclick="selectCommercialProposal('${request.id}', '${p.id}')" class="p-2 border rounded cursor-pointer transition-colors ${proposalClasses}">
                <div class="flex justify-between items-center gap-2">
                    <div class="flex items-center gap-2 flex-1 min-w-0">
                        <i class="fas fa-file-invoice text-blue-500 text-xs"></i>
                        <span class="text-sm font-medium truncate">${p.name || 'КП'}</span>
                    </div>
                    <button onclick="event.stopPropagation(); deleteCommercialProposal('${request.id}', '${p.id}')" class="text-slate-400 hover:text-red-500 flex-shrink-0" title="Удалить КП">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-1 ml-5">Светильников: ${lightsCount}</div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// === NAVIGATION ===
function toggleCommercialRequestExpand(requestId) {
    if (expandedCommercialRequests.has(requestId)) {
        expandedCommercialRequests.delete(requestId);
    } else {
        expandedCommercialRequests.add(requestId);
    }
    renderCommercialRequestsList();
}

function selectCommercialRequest(requestId) {
    selectedCommercialRequestId = requestId;
    selectedProposalId = null;
    
    if (!expandedCommercialRequests.has(requestId)) {
        expandedCommercialRequests.add(requestId);
    }
    
    renderCommercialRequestsList();
    loadCommercialRequestEditor(requestId);
}

function selectCommercialProposal(requestId, proposalId) {
    selectedCommercialRequestId = requestId;
    selectedProposalId = proposalId;
    
    if (!expandedCommercialRequests.has(requestId)) {
        expandedCommercialRequests.add(requestId);
    }
    
    renderCommercialRequestsList();
    loadCommercialProposalEditor(requestId, proposalId);
}

// === LOAD EDITORS ===
function loadCommercialRequestEditor(requestId) {
    const request = (db.commercialRequests || []).find(r => r.id === requestId);
    if (!request) return;
    
    const editor = document.getElementById('commercialEditor');
    const placeholder = document.getElementById('commercialPlaceholder');
    const proposalEditor = document.getElementById('proposalEditor');
    
    if (editor) editor.classList.remove('hidden');
    if (placeholder) placeholder.classList.add('hidden');
    if (proposalEditor) proposalEditor.classList.add('hidden');
    
    // Заполняем поля
    document.getElementById('crId').value = request.id;
    document.getElementById('crYear').value = request.year || new Date().getFullYear();
    document.getElementById('crNumber').value = request.number || '';
    document.getElementById('crName').value = request.name || '';
    document.getElementById('crClient').value = request.client || '';
    document.getElementById('crDescription').value = request.description || '';
    
    // Статус
    const statusEl = document.getElementById('crStatus');
    if (statusEl) {
        if (request.status === 'converted') {
            statusEl.innerHTML = '<span class="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded text-sm">Преобразован в проект</span>';
            document.getElementById('btnConvertToProject').classList.add('hidden');
        } else {
            statusEl.innerHTML = '<span class="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-sm">Активный</span>';
            document.getElementById('btnConvertToProject').classList.remove('hidden');
        }
    }
    
    // Рендерим список КП
    renderProposalsList(request);
}

function loadCommercialProposalEditor(requestId, proposalId) {
    const request = (db.commercialRequests || []).find(r => r.id === requestId);
    if (!request) return;
    
    const proposal = (request.proposals || []).find(p => p.id === proposalId);
    if (!proposal) return;
    
    const editor = document.getElementById('commercialEditor');
    const placeholder = document.getElementById('commercialPlaceholder');
    const proposalEditor = document.getElementById('proposalEditor');
    
    if (editor) editor.classList.add('hidden');
    if (placeholder) placeholder.classList.add('hidden');
    if (proposalEditor) proposalEditor.classList.remove('hidden');
    
    // Заголовок
    document.getElementById('proposalTitle').textContent = `${request.number || '—'} / ${proposal.name || 'КП'}`;
    document.getElementById('proposalRequestId').value = requestId;
    document.getElementById('proposalId').value = proposalId;
    
    // Рендерим светильники
    renderLightsTable(request, proposal);
}

// === PROPOSALS LIST ===
function renderProposalsList(request) {
    const container = document.getElementById('proposalsListContainer');
    if (!container) return;
    
    const proposals = request.proposals || [];
    
    if (proposals.length === 0) {
        container.innerHTML = '<div class="text-center text-slate-400 py-4 text-sm">Нет коммерческих предложений</div>';
        return;
    }
    
    let html = '';
    proposals.forEach((p, idx) => {
        const lightsCount = (p.lights || []).length;
        const totalPrice = calculateProposalTotal(p);
        
        html += `
            <div class="p-3 border dark:border-slate-600 rounded-lg mb-2 hover:shadow transition-shadow cursor-pointer" onclick="selectCommercialProposal('${request.id}', '${p.id}')">
                <div class="flex justify-between items-center">
                    <div>
                        <div class="font-bold text-slate-800 dark:text-white">${p.name || `КП ${idx + 1}`}</div>
                        <div class="text-xs text-slate-500 mt-1">Светильников: ${lightsCount}</div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-blue-600 dark:text-blue-400">${formatCurrency(totalPrice)}</div>
                        <div class="flex gap-1 mt-1">
                            <button onclick="event.stopPropagation(); printCommercialProposal('${request.id}', '${p.id}')" class="text-xs text-slate-500 hover:text-blue-600 px-2 py-1" title="Печать">
                                <i class="fas fa-print"></i>
                            </button>
                            <button onclick="event.stopPropagation(); deleteCommercialProposal('${request.id}', '${p.id}')" class="text-xs text-slate-500 hover:text-red-600 px-2 py-1" title="Удалить">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function calculateProposalTotal(proposal) {
    let total = 0;
    (proposal.lights || []).forEach(light => {
        const calc = (db.calculations || []).find(c => c.id === light.calculationId);
        if (calc) {
            total += (calc.finalPrice || 0) * (light.qty || 1);
        }
    });
    return total;
}

// === LIGHTS TABLE ===
function renderLightsTable(request, proposal) {
    const tbody = document.getElementById('lightsTableBody');
    if (!tbody) return;
    
    const lights = proposal.lights || [];
    
    if (lights.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-slate-400 py-8">Добавьте светильники</td></tr>';
        updateProposalTotalDisplay(0);
        return;
    }
    
    let html = '';
    let grandTotal = 0;
    
    lights.forEach((light, idx) => {
        const calc = (db.calculations || []).find(c => c.id === light.calculationId);
        const unitPrice = calc ? (calc.finalPrice || 0) : 0;
        const lineTotal = unitPrice * (light.qty || 1);
        grandTotal += lineTotal;
        
        const hasCalc = !!calc;
        const calcStatus = hasCalc 
            ? '<span class="text-green-500"><i class="fas fa-check-circle"></i></span>' 
            : '<span class="text-orange-500"><i class="fas fa-exclamation-circle"></i></span>';
        
        // Описание светильника
        const description = light.description || generateLightDescription(light);
        
        html += `
            <tr class="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                <td class="px-2 py-3 text-center text-sm">${idx + 1}</td>
                <td class="px-4 py-3">
                    <div class="font-medium text-slate-800 dark:text-white">${light.name || 'Без названия'}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">${description || ''}</div>
                </td>
                <td class="px-4 py-3 text-center">
                    <input type="number" min="1" value="${light.qty || 1}" 
                        class="w-20 text-center border dark:border-slate-600 rounded px-2 py-1 text-sm bg-white dark:bg-slate-700 dark:text-white"
                        onchange="updateLightQty('${request.id}', '${proposal.id}', ${idx}, this.value)">
                </td>
                <td class="px-4 py-3 text-right text-sm">${formatCurrency(unitPrice)}</td>
                <td class="px-4 py-3 text-right font-bold text-sm text-blue-600 dark:text-blue-400">${formatCurrency(lineTotal)}</td>
                <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                        ${calcStatus}
                        <button onclick="openAddLightModal(${idx})" 
                            class="text-slate-500 hover:text-slate-700 px-1" title="Редактировать светильник">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="openCalculationEditor('${request.id}', '${proposal.id}', ${idx})" 
                            class="text-blue-500 hover:text-blue-700 px-1" title="Калькуляция">
                            <i class="fas fa-calculator"></i>
                        </button>
                        <button onclick="deleteLight('${request.id}', '${proposal.id}', ${idx})" 
                            class="text-red-400 hover:text-red-600 px-1" title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    updateProposalTotalDisplay(grandTotal);
}

function updateProposalTotalDisplay(total) {
    const el = document.getElementById('proposalTotalPrice');
    if (el) {
        el.textContent = formatCurrency(total);
    }
}

// === CRUD: COMMERCIAL REQUESTS ===
function openCreateCommercialRequestModal() {
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('commercial', 'create')) {
        showToast('Нет прав на создание запросов');
        return;
    }
    
    // Генерируем номер запроса
    const year = new Date().getFullYear();
    const yearRequests = (db.commercialRequests || []).filter(r => r.year === year);
    const nextNumber = yearRequests.length + 1;
    
    document.getElementById('newCrYear').value = year;
    document.getElementById('newCrNumber').value = `Д25-${String(nextNumber).padStart(3, '0')}`;
    document.getElementById('newCrName').value = '';
    document.getElementById('newCrClient').value = '';
    document.getElementById('newCrDescription').value = '';
    
    openModal('createCommercialRequestModal');
}

function createCommercialRequest() {
    const year = parseInt(document.getElementById('newCrYear').value) || new Date().getFullYear();
    const number = document.getElementById('newCrNumber').value.trim();
    const name = document.getElementById('newCrName').value.trim();
    const client = document.getElementById('newCrClient').value.trim();
    const description = document.getElementById('newCrDescription').value.trim();
    
    if (!name) {
        showToast('Введите название запроса');
        return;
    }
    
    if (!db.commercialRequests) db.commercialRequests = [];
    
    const now = Date.now();
    const newRequest = {
        id: 'cr_' + now,
        year: year,
        number: number,
        name: name,
        client: client,
        description: description,
        status: 'active',
        projectId: null,
        proposals: [],
        createdAt: now,
        updatedAt: now
    };
    
    db.commercialRequests.push(newRequest);
    markChanged('commercialRequests', newRequest.id);
    
    // Логирование
    if (typeof logActivity === 'function') {
        logActivity('commercial_request_create', 'commercial_request', newRequest.id, name, {
            year: year,
            number: number,
            client: client
        });
    }
    
    save();
    closeModal('createCommercialRequestModal');
    showToast('Запрос создан');
    
    selectedCommercialRequestId = newRequest.id;
    expandedCommercialRequests.add(newRequest.id);
    renderCommercialRequestsList();
    loadCommercialRequestEditor(newRequest.id);
}

function autoSaveCommercialRequest() {
    const id = document.getElementById('crId').value;
    const request = (db.commercialRequests || []).find(r => r.id === id);
    if (!request) return;
    
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('commercial', 'edit')) {
        return;
    }
    
    request.year = parseInt(document.getElementById('crYear').value) || new Date().getFullYear();
    request.number = document.getElementById('crNumber').value.trim();
    request.name = document.getElementById('crName').value.trim();
    request.client = document.getElementById('crClient').value.trim();
    request.description = document.getElementById('crDescription').value.trim();
    request.updatedAt = Date.now();
    
    markChanged('commercialRequests', id);
    save();
    renderCommercialRequestsList();
}

function deleteCommercialRequest() {
    const id = document.getElementById('crId').value;
    const request = (db.commercialRequests || []).find(r => r.id === id);
    if (!request) return;
    
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('commercial', 'delete')) {
        showToast('Нет прав на удаление запросов');
        return;
    }
    
    if (!confirm(`Удалить запрос "${request.name}"? Все КП и калькуляции будут удалены.`)) return;
    
    const idx = db.commercialRequests.findIndex(r => r.id === id);
    if (idx !== -1) {
        db.commercialRequests.splice(idx, 1);
        markDeleted('commercialRequests', id);
        
        // Логирование
        if (typeof logActivity === 'function') {
            logActivity('commercial_request_delete', 'commercial_request', id, request.name, null);
        }
        
        save();
        showToast('Запрос удалён');
        
        selectedCommercialRequestId = null;
        selectedProposalId = null;
        
        document.getElementById('commercialEditor').classList.add('hidden');
        document.getElementById('commercialPlaceholder').classList.remove('hidden');
        
        renderCommercialRequestsList();
    }
}

// === CRUD: COMMERCIAL PROPOSALS ===
function openAddProposalModal() {
    const requestId = document.getElementById('crId').value;
    if (!requestId) {
        showToast('Сначала выберите запрос');
        return;
    }
    
    const request = (db.commercialRequests || []).find(r => r.id === requestId);
    if (!request) return;
    
    const proposalsCount = (request.proposals || []).length;
    document.getElementById('newProposalName').value = `КП-${proposalsCount + 1}`;
    document.getElementById('newProposalRequestId').value = requestId;
    
    openModal('addProposalModal');
}

function createCommercialProposal() {
    const requestId = document.getElementById('newProposalRequestId').value;
    const name = document.getElementById('newProposalName').value.trim();
    
    const request = (db.commercialRequests || []).find(r => r.id === requestId);
    if (!request) return;
    
    if (!request.proposals) request.proposals = [];
    
    const now = Date.now();
    const newProposal = {
        id: 'prop_' + now,
        name: name || `КП-${request.proposals.length + 1}`,
        lights: [],
        createdAt: now,
        updatedAt: now
    };
    
    request.proposals.push(newProposal);
    request.updatedAt = now;
    markChanged('commercialRequests', requestId);
    
    save();
    closeModal('addProposalModal');
    showToast('КП создано');
    
    renderCommercialRequestsList();
    loadCommercialRequestEditor(requestId);
}

function deleteCommercialProposal(requestId, proposalId) {
    const request = (db.commercialRequests || []).find(r => r.id === requestId);
    if (!request) return;
    
    const proposal = (request.proposals || []).find(p => p.id === proposalId);
    if (!proposal) return;
    
    if (!confirm(`Удалить "${proposal.name}"?`)) return;
    
    const idx = request.proposals.findIndex(p => p.id === proposalId);
    if (idx !== -1) {
        request.proposals.splice(idx, 1);
        request.updatedAt = Date.now();
        markChanged('commercialRequests', requestId);
        
        save();
        showToast('КП удалено');
        
        if (selectedProposalId === proposalId) {
            selectedProposalId = null;
            document.getElementById('proposalEditor').classList.add('hidden');
            loadCommercialRequestEditor(requestId);
        }
        
        renderCommercialRequestsList();
    }
}

// === CRUD: LIGHTS ===
function openAddLightModal(editIdx = -1) {
    const requestId = document.getElementById('proposalRequestId').value;
    const proposalId = document.getElementById('proposalId').value;
    
    if (!requestId || !proposalId) {
        showToast('Ошибка: КП не выбрано');
        return;
    }
    
    document.getElementById('newLightRequestId').value = requestId;
    document.getElementById('newLightProposalId').value = proposalId;
    document.getElementById('editLightIdx').value = editIdx;
    
    // Если редактируем существующий светильник
    if (editIdx >= 0) {
        const request = (db.commercialRequests || []).find(r => r.id === requestId);
        const proposal = request?.proposals?.find(p => p.id === proposalId);
        const light = proposal?.lights?.[editIdx];
        
        if (light) {
            document.getElementById('newLightName').value = light.name || '';
            document.getElementById('newLightQty').value = light.qty || 1;
            document.getElementById('newLightDimensions').value = light.dimensions || '';
            document.getElementById('newLightPower').value = light.power || '';
            document.getElementById('newLightColorTemp').value = light.colorTemp || '4000К';
            document.getElementById('newLightMountType').value = light.mountType || '';
            document.getElementById('newLightCableLength').value = light.cableLength || '';
            document.getElementById('newLightWireLength').value = light.wireLength || '';
            document.getElementById('newLightBodyColor').value = light.bodyColor || '';
            document.getElementById('newLightWireColor').value = light.wireColor || '';
        }
    } else {
        // Новый светильник - сброс полей
        document.getElementById('newLightName').value = '';
        document.getElementById('newLightQty').value = '1';
        document.getElementById('newLightDimensions').value = '';
        document.getElementById('newLightPower').value = '';
        document.getElementById('newLightColorTemp').value = '4000К';
        document.getElementById('newLightMountType').value = '';
        document.getElementById('newLightCableLength').value = '';
        document.getElementById('newLightWireLength').value = '';
        document.getElementById('newLightBodyColor').value = '';
        document.getElementById('newLightWireColor').value = '';
    }
    
    updateLightDescriptionPreview();
    openModal('addLightModal');
}

function getLightDataFromForm() {
    return {
        name: document.getElementById('newLightName').value.trim(),
        qty: parseInt(document.getElementById('newLightQty').value) || 1,
        dimensions: document.getElementById('newLightDimensions').value.trim(),
        power: document.getElementById('newLightPower').value.trim(),
        colorTemp: document.getElementById('newLightColorTemp').value.trim(),
        mountType: document.getElementById('newLightMountType').value,
        cableLength: document.getElementById('newLightCableLength').value.trim(),
        wireLength: document.getElementById('newLightWireLength').value.trim(),
        bodyColor: document.getElementById('newLightBodyColor').value.trim(),
        wireColor: document.getElementById('newLightWireColor').value.trim()
    };
}

function generateLightDescription(light) {
    const parts = [];
    
    if (light.name) parts.push(light.name);
    if (light.dimensions) parts.push(`габариты ${light.dimensions} мм`);
    if (light.power) parts.push(`${light.power} Вт`);
    if (light.colorTemp) parts.push(light.colorTemp);
    if (light.mountType) parts.push(`монтаж: ${light.mountType}`);
    if (light.cableLength) parts.push(`тросы ${light.cableLength} мм`);
    if (light.wireLength) parts.push(`провод ${light.wireLength} мм`);
    if (light.bodyColor) parts.push(`корпус: ${light.bodyColor}`);
    if (light.wireColor) parts.push(`провод питания: ${light.wireColor}`);
    
    return parts.join(', ');
}

function updateLightDescriptionPreview() {
    const data = getLightDataFromForm();
    const description = generateLightDescription(data);
    const previewEl = document.getElementById('lightDescriptionPreview');
    if (previewEl) {
        previewEl.textContent = description || '—';
    }
}

function saveLightToProposal() {
    const requestId = document.getElementById('newLightRequestId').value;
    const proposalId = document.getElementById('newLightProposalId').value;
    const editIdx = parseInt(document.getElementById('editLightIdx').value);
    const data = getLightDataFromForm();
    
    if (!data.name) {
        showToast('Введите название светильника');
        return;
    }
    
    const request = (db.commercialRequests || []).find(r => r.id === requestId);
    if (!request) return;
    
    const proposal = (request.proposals || []).find(p => p.id === proposalId);
    if (!proposal) return;
    
    if (!proposal.lights) proposal.lights = [];
    
    // Генерируем описание
    const description = generateLightDescription(data);
    
    if (editIdx >= 0 && proposal.lights[editIdx]) {
        // Редактирование существующего
        const light = proposal.lights[editIdx];
        light.name = data.name;
        light.qty = data.qty;
        light.dimensions = data.dimensions;
        light.power = data.power;
        light.colorTemp = data.colorTemp;
        light.mountType = data.mountType;
        light.cableLength = data.cableLength;
        light.wireLength = data.wireLength;
        light.bodyColor = data.bodyColor;
        light.wireColor = data.wireColor;
        light.description = description;
    } else {
        // Новый светильник
        const newLight = {
            id: 'light_' + Date.now(),
            name: data.name,
            qty: data.qty,
            dimensions: data.dimensions,
            power: data.power,
            colorTemp: data.colorTemp,
            mountType: data.mountType,
            cableLength: data.cableLength,
            wireLength: data.wireLength,
            bodyColor: data.bodyColor,
            wireColor: data.wireColor,
            description: description,
            calculationId: null
        };
        proposal.lights.push(newLight);
    }
    
    proposal.updatedAt = Date.now();
    request.updatedAt = Date.now();
    markChanged('commercialRequests', requestId);
    
    save();
    closeModal('addLightModal');
    showToast(editIdx >= 0 ? 'Светильник обновлён' : 'Светильник добавлен');
    
    renderLightsTable(request, proposal);
    renderCommercialRequestsList();
}

// Для обратной совместимости
function addLightToProposal() {
    saveLightToProposal();
}

function updateLightQty(requestId, proposalId, lightIdx, value) {
    const request = (db.commercialRequests || []).find(r => r.id === requestId);
    if (!request) return;
    
    const proposal = (request.proposals || []).find(p => p.id === proposalId);
    if (!proposal || !proposal.lights[lightIdx]) return;
    
    proposal.lights[lightIdx].qty = parseInt(value) || 1;
    proposal.updatedAt = Date.now();
    request.updatedAt = Date.now();
    markChanged('commercialRequests', requestId);
    
    save();
    renderLightsTable(request, proposal);
}

function deleteLight(requestId, proposalId, lightIdx) {
    if (!confirm('Удалить светильник?')) return;
    
    const request = (db.commercialRequests || []).find(r => r.id === requestId);
    if (!request) return;
    
    const proposal = (request.proposals || []).find(p => p.id === proposalId);
    if (!proposal || !proposal.lights[lightIdx]) return;
    
    proposal.lights.splice(lightIdx, 1);
    proposal.updatedAt = Date.now();
    request.updatedAt = Date.now();
    markChanged('commercialRequests', requestId);
    
    save();
    showToast('Светильник удалён');
    renderLightsTable(request, proposal);
    renderCommercialRequestsList();
}

// === CALCULATION EDITOR ===

// Временное хранилище для items калькуляции
let calcEditorItems = [];

function openCalculationEditor(requestId, proposalId, lightIdx) {
    const request = (db.commercialRequests || []).find(r => r.id === requestId);
    if (!request) return;
    
    const proposal = (request.proposals || []).find(p => p.id === proposalId);
    if (!proposal || !proposal.lights[lightIdx]) return;
    
    const light = proposal.lights[lightIdx];
    
    // Сохраняем контекст
    document.getElementById('calcRequestId').value = requestId;
    document.getElementById('calcProposalId').value = proposalId;
    document.getElementById('calcLightIdx').value = lightIdx;
    document.getElementById('calcLightName').textContent = light.name;
    
    // Описание светильника
    const lightDescription = light.description || generateLightDescription(light);
    document.getElementById('calcLightDescription').textContent = lightDescription || '';
    
    // Загружаем калькуляцию, если есть
    let calc = null;
    if (light.calculationId) {
        calc = (db.calculations || []).find(c => c.id === light.calculationId);
    }
    
    if (calc) {
        document.getElementById('calcId').value = calc.id;
        document.getElementById('calcName').value = calc.name || '';
        document.getElementById('calcCoefficient').value = calc.coefficient || 1.5;
        // Глубокое копирование items
        calcEditorItems = JSON.parse(JSON.stringify(calc.items || []));
    } else {
        document.getElementById('calcId').value = '';
        document.getElementById('calcName').value = light.name;
        document.getElementById('calcCoefficient').value = 1.5;
        calcEditorItems = [];
    }
    
    // Сбрасываем поле поиска
    resetCalcSearchInput();
    
    renderCalculationItems();
    openModal('calculationEditorModal');
}

function renderCalculationItems() {
    const tbody = document.getElementById('calcItemsTableBody');
    if (!tbody) return;
    
    if (calcEditorItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-slate-400 py-4">Добавьте компоненты</td></tr>';
        updateCalculationTotals(0, 0);
        return;
    }
    
    // Подготавливаем данные с категориями и сортировкой
    const itemsWithData = calcEditorItems.map((item, idx) => {
        let name, unit, cost, itemId = null, category = 'Нестандартные';
        
        if (item.isCustom) {
            name = item.name || 'Нестандартная позиция';
            unit = item.unit || 'шт.';
            cost = parseFloat(item.cost) || 0;
        } else {
            itemId = item.itemId;
            const baseItem = (db.items || []).find(i => i.id === item.itemId);
            if (!baseItem) {
                name = `[Удалённый товар #${item.itemId}]`;
                unit = '—';
                cost = 0;
                itemId = null;
            } else {
                name = baseItem.name;
                unit = baseItem.unit || 'шт.';
                cost = parseFloat(baseItem.cost) || 0;
                category = baseItem.cat || 'Без категории';
            }
        }
        
        return { idx, name, unit, cost, itemId, category, qty: item.qty || 0, isCustom: item.isCustom };
    });
    
    // Сортируем по категории, затем по алфавиту
    itemsWithData.sort((a, b) => {
        // Нестандартные в конец
        if (a.isCustom && !b.isCustom) return 1;
        if (!a.isCustom && b.isCustom) return -1;
        // По категории
        if (a.category !== b.category) return a.category.localeCompare(b.category, 'ru');
        // По имени
        return a.name.localeCompare(b.name, 'ru');
    });
    
    let html = '';
    let totalCost = 0;
    let currentCategory = '';
    let rowNum = 0;
    
    itemsWithData.forEach(item => {
        // Заголовок категории
        if (item.category !== currentCategory) {
            currentCategory = item.category;
            html += `
                <tr class="bg-slate-100 dark:bg-slate-600">
                    <td colspan="6" class="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-200 uppercase tracking-wider">
                        ${currentCategory}
                    </td>
                </tr>
            `;
        }
        
        rowNum++;
        const lineTotal = item.cost * item.qty;
        totalCost += lineTotal;
        
        const rowClass = item.isCustom ? 'bg-yellow-50 dark:bg-yellow-900/20' : '';
        
        // Для стандартных товаров - кликабельное название и кнопка просмотра
        const nameHtml = item.itemId 
            ? `<span class="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onclick="openItemCardFromCalc(${item.itemId})">${item.name}</span>`
            : `<span class="font-medium">${item.name}</span>`;
        
        const viewBtn = item.itemId 
            ? `<button onclick="openItemCardFromCalc(${item.itemId})" class="text-blue-500 hover:text-blue-700 mr-1" title="Карточка товара"><i class="fas fa-eye"></i></button>`
            : '';
        
        html += `
            <tr class="border-b dark:border-slate-700 ${rowClass}">
                <td class="px-2 py-2 text-center text-xs text-slate-400">${rowNum}</td>
                <td class="px-2 py-2 text-sm">${nameHtml}</td>
                <td class="px-2 py-2 text-center text-sm">${item.unit}</td>
                <td class="px-2 py-2 text-center">
                    <input type="number" min="0" step="0.01" value="${item.qty}" 
                        class="w-16 text-center border dark:border-slate-600 rounded px-1 py-0.5 text-sm bg-white dark:bg-slate-700 dark:text-white"
                        onchange="updateCalcItemQty(${item.idx}, this.value)">
                </td>
                <td class="px-2 py-2 text-right text-sm">${formatCurrency(item.cost)}</td>
                <td class="px-2 py-2 text-center">
                    ${viewBtn}
                    <button onclick="removeCalcItem(${item.idx})" class="text-red-400 hover:text-red-600">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    const coefficient = parseFloat(document.getElementById('calcCoefficient').value) || 1;
    updateCalculationTotals(totalCost, coefficient);
}

function updateCalculationTotals(totalCost, coefficient) {
    const finalPrice = totalCost * coefficient;
    document.getElementById('calcTotalCost').textContent = formatCurrency(totalCost);
    document.getElementById('calcFinalPrice').textContent = formatCurrency(finalPrice);
}

// Открыть карточку товара из калькуляции
function openItemCardFromCalc(itemId) {
    if (typeof openItemCardViewOnly === 'function') {
        openItemCardViewOnly(itemId);
    } else if (typeof openItemCard === 'function') {
        openItemCard(itemId, true);
    }
}

// === ПОИСК ТОВАРОВ ДЛЯ КАЛЬКУЛЯЦИИ (аналогично спецификациям) ===

function resetCalcSearchInput() {
    const input = document.getElementById('calcItemSearch');
    const results = document.getElementById('calcSearchResults');
    if (input) {
        input.value = '';
        delete input.dataset.category;
        delete input.dataset.itemId;
    }
    if (results) {
        results.classList.add('hidden');
        results.innerHTML = '';
    }
}

function handleCalcItemSearch(isTyping = false) {
    const input = document.getElementById('calcItemSearch');
    const results = document.getElementById('calcSearchResults');
    if (!input || !results) return;
    
    if (isTyping) {
        delete input.dataset.itemId;
    }
    
    let rawValue = input.value;
    let trimmed = rawValue.trim();
    
    // Если поле пустое - показываем категории
    if (trimmed.length === 0 && !input.dataset.category) {
        delete input.dataset.itemId;
        renderCalcCategoryList(results);
        return;
    }
    
    const arrowIdx = rawValue.indexOf('→');
    if (arrowIdx === -1 && trimmed.length === 0) {
        delete input.dataset.category;
        delete input.dataset.itemId;
        renderCalcCategoryList(results);
        return;
    }
    
    let selectedCategory = input.dataset.category || '';
    let searchTerm = '';
    let items = db.items || [];
    
    if (selectedCategory) {
        items = items.filter(i => i.cat === selectedCategory);
        searchTerm = arrowIdx >= 0 ? rawValue.slice(arrowIdx + 1).trim().toLowerCase() : trimmed.toLowerCase();
    } else {
        searchTerm = trimmed.toLowerCase();
    }
    
    if (searchTerm && !selectedCategory) {
        items = items.filter(i => (`${i.cat} ${i.name}`).toLowerCase().includes(searchTerm));
    } else if (searchTerm && selectedCategory) {
        items = items.filter(i => i.name.toLowerCase().includes(searchTerm));
    }
    
    items.sort((a, b) => {
        if (a.cat === b.cat) return a.name.localeCompare(b.name);
        return a.cat.localeCompare(b.cat);
    });
    
    const maxResults = 80;
    renderCalcItemResults(results, items.slice(0, maxResults), !!selectedCategory);
}

function renderCalcCategoryList(resultsEl) {
    const cats = [...new Set((db.items || []).map(i => i.cat || 'Без категории'))].sort();
    if (!cats.length) {
        resultsEl.innerHTML = '<div class="px-3 py-2 text-slate-400 text-sm">Нет категорий</div>';
        resultsEl.classList.remove('hidden');
        return;
    }
    let html = `<div class="px-3 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-600 cursor-pointer text-sm font-medium border-b dark:border-slate-600" onclick="clearCalcCategory()">Все категории</div>`;
    cats.forEach(cat => {
        const escapedCat = typeof escapeAttr === 'function' ? escapeAttr(cat) : cat.replace(/'/g, "\\'");
        html += `<div class="px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-600 cursor-pointer text-sm text-slate-700 dark:text-slate-100 border-b dark:border-slate-600 last:border-0" onclick="selectCalcCategory('${escapedCat}')">${cat}</div>`;
    });
    resultsEl.innerHTML = html;
    resultsEl.classList.remove('hidden');
}

function renderCalcItemResults(resultsEl, items, groupedByCategory) {
    if (!items.length) {
        resultsEl.innerHTML = '<div class="px-3 py-2 text-slate-400 text-sm">Ничего не найдено</div>';
        resultsEl.classList.remove('hidden');
        return;
    }
    let html = '';
    let currentCat = '';
    items.forEach(item => {
        if (!groupedByCategory) {
            if (item.cat !== currentCat) {
                currentCat = item.cat;
                html += `<div class="px-3 py-1 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-600 dark:text-slate-300">${currentCat}</div>`;
            }
        }
        // Количество на складе
        const stockQty = item.qty || 0;
        const stockClass = stockQty > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400';
        const stockText = stockQty > 0 ? stockQty : '0';
        
        html += `<div class="px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-600 cursor-pointer text-sm" onclick="selectCalcSearchItem(${item.id})">
            <div class="flex justify-between items-center">
                <span class="text-slate-700 dark:text-slate-100">${item.name}</span>
                <span class="text-xs text-slate-400">${formatCurrency(item.cost || 0)}</span>
            </div>
            <div class="flex justify-between items-center mt-0.5">
                <span class="text-xs text-slate-400">${item.unit || 'шт.'}</span>
                <span class="text-xs ${stockClass}">На складе: ${stockText}</span>
            </div>
        </div>`;
    });
    resultsEl.innerHTML = html;
    resultsEl.classList.remove('hidden');
}

function selectCalcSearchItem(itemId) {
    const input = document.getElementById('calcItemSearch');
    const results = document.getElementById('calcSearchResults');
    const item = (db.items || []).find(i => i.id == itemId);
    if (!input || !item) return;
    
    // Добавляем товар в калькуляцию
    addItemToCalculation(itemId);
    
    // Сбрасываем поиск
    resetCalcSearchInput();
}

function selectCalcCategory(cat) {
    const input = document.getElementById('calcItemSearch');
    if (!input) return;
    input.dataset.category = cat;
    input.value = `${cat} → `;
    delete input.dataset.itemId;
    handleCalcItemSearch();
}

function clearCalcCategory() {
    const input = document.getElementById('calcItemSearch');
    if (!input) return;
    delete input.dataset.category;
    delete input.dataset.itemId;
    input.value = '';
    handleCalcItemSearch();
}

function addItemToCalculation(itemId) {
    // Проверяем, есть ли уже этот товар
    const existingIdx = calcEditorItems.findIndex(i => !i.isCustom && i.itemId === itemId);
    if (existingIdx !== -1) {
        calcEditorItems[existingIdx].qty = (calcEditorItems[existingIdx].qty || 0) + 1;
    } else {
        calcEditorItems.push({
            itemId: itemId,
            qty: 1,
            isCustom: false
        });
    }
    
    renderCalculationItems();
}

// === НЕСТАНДАРТНЫЕ ИЗДЕЛИЯ ===

function openAddCalcCustomItemModal() {
    document.getElementById('calcCustomName').value = '';
    document.getElementById('calcCustomUnit').value = 'шт.';
    document.getElementById('calcCustomQty').value = '1';
    document.getElementById('calcCustomCost').value = '0';
    openModal('calcCustomItemModal');
}

function addCalcCustomItem() {
    const name = document.getElementById('calcCustomName').value.trim();
    const unit = document.getElementById('calcCustomUnit').value;
    const qty = parseFloat(document.getElementById('calcCustomQty').value) || 1;
    const cost = parseFloat(document.getElementById('calcCustomCost').value) || 0;
    
    if (!name) {
        showToast('Введите название');
        return;
    }
    
    calcEditorItems.push({
        isCustom: true,
        name: name,
        unit: unit,
        cost: cost,
        qty: qty
    });
    
    closeModal('calcCustomItemModal');
    renderCalculationItems();
}

function updateCalcItemQty(idx, value) {
    if (calcEditorItems[idx]) {
        calcEditorItems[idx].qty = parseFloat(value) || 0;
        renderCalculationItems();
    }
}

function removeCalcItem(idx) {
    calcEditorItems.splice(idx, 1);
    renderCalculationItems();
}

function updateCalcCoefficient() {
    renderCalculationItems();
}

// Экспорт калькуляции в Excel
function exportCalculationToExcel() {
    const name = document.getElementById('calcName').value.trim() || 'Калькуляция';
    const coefficient = parseFloat(document.getElementById('calcCoefficient').value) || 1.5;
    
    // Подготавливаем данные с категориями и сортировкой
    const itemsWithData = calcEditorItems.map((item, idx) => {
        let name, unit, cost, itemId = null, category = 'Нестандартные';
        
        if (item.isCustom) {
            name = item.name || 'Нестандартная позиция';
            unit = item.unit || 'шт.';
            cost = parseFloat(item.cost) || 0;
        } else {
            itemId = item.itemId;
            const baseItem = (db.items || []).find(i => i.id === item.itemId);
            if (!baseItem) {
                name = `[Удалённый товар #${item.itemId}]`;
                unit = '—';
                cost = 0;
                itemId = null;
            } else {
                name = baseItem.name;
                unit = baseItem.unit || 'шт.';
                cost = parseFloat(baseItem.cost) || 0;
                category = baseItem.cat || 'Без категории';
            }
        }
        
        return { idx, name, unit, cost, itemId, category, qty: item.qty || 0, isCustom: item.isCustom };
    });
    
    // Сортируем по категории, затем по алфавиту
    itemsWithData.sort((a, b) => {
        if (a.isCustom && !b.isCustom) return 1;
        if (!a.isCustom && b.isCustom) return -1;
        if (a.category !== b.category) return a.category.localeCompare(b.category, 'ru');
        return a.name.localeCompare(b.name, 'ru');
    });
    
    // Формируем CSV
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM для правильной кодировки в Excel
    csvContent += "№,Категория,Наименование,Ед.изм,Кол-во,Цена,Сумма\r\n";
    
    let rowNum = 0;
    let totalCost = 0;
    let currentCategory = '';
    
    itemsWithData.forEach(item => {
        if (item.category !== currentCategory) {
            currentCategory = item.category;
            csvContent += `,"${currentCategory}",,,,,\r\n`;
        }
        
        rowNum++;
        const lineTotal = item.cost * item.qty;
        totalCost += lineTotal;
        
        const qtyDisplay = (item.qty || 0).toString().replace('.', ',');
        const priceDisplay = (item.cost || 0).toString().replace('.', ',');
        const sumDisplay = lineTotal.toString().replace('.', ',');
        
        csvContent += `${rowNum},"${item.category}","${item.name}","${item.unit}","${qtyDisplay}","${priceDisplay}","${sumDisplay}"\r\n`;
    });
    
    const finalPrice = totalCost * coefficient;
    csvContent += `,"","ИТОГО (себестоимость)",,,,"${totalCost.toString().replace('.', ',')}"\r\n`;
    csvContent += `,"","Коэффициент наценки: ${coefficient}",,,,\r\n`;
    csvContent += `,"","ИТОГО (цена с наценкой)",,,,"${finalPrice.toString().replace('.', ',')}"\r\n`;
    
    // Скачиваем файл
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const fileName = `Калькуляция_${name.replace(/[^a-zа-яё0-9]/gi, '_')}_${new Date().toISOString().slice(0,10)}.csv`;
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    showToast('Калькуляция экспортирована в Excel');
}

// Печать калькуляции
function printCalculation() {
    const name = document.getElementById('calcName').value.trim() || 'Калькуляция';
    const coefficient = parseFloat(document.getElementById('calcCoefficient').value) || 1.5;
    const lightName = document.getElementById('calcLightName').textContent || '';
    const lightDescription = document.getElementById('calcLightDescription').textContent || '';
    
    // Подготавливаем данные с категориями и сортировкой
    const itemsWithData = calcEditorItems.map((item, idx) => {
        let name, unit, cost, itemId = null, category = 'Нестандартные';
        
        if (item.isCustom) {
            name = item.name || 'Нестандартная позиция';
            unit = item.unit || 'шт.';
            cost = parseFloat(item.cost) || 0;
        } else {
            itemId = item.itemId;
            const baseItem = (db.items || []).find(i => i.id === item.itemId);
            if (!baseItem) {
                name = `[Удалённый товар #${item.itemId}]`;
                unit = '—';
                cost = 0;
                itemId = null;
            } else {
                name = baseItem.name;
                unit = baseItem.unit || 'шт.';
                cost = parseFloat(baseItem.cost) || 0;
                category = baseItem.cat || 'Без категории';
            }
        }
        
        return { idx, name, unit, cost, itemId, category, qty: item.qty || 0, isCustom: item.isCustom };
    });
    
    // Сортируем по категории, затем по алфавиту
    itemsWithData.sort((a, b) => {
        if (a.isCustom && !b.isCustom) return 1;
        if (!a.isCustom && b.isCustom) return -1;
        if (a.category !== b.category) return a.category.localeCompare(b.category, 'ru');
        return a.name.localeCompare(b.name, 'ru');
    });
    
    let html = '';
    let totalCost = 0;
    let currentCategory = '';
    let rowNum = 0;
    
    itemsWithData.forEach(item => {
        // Заголовок категории
        if (item.category !== currentCategory) {
            currentCategory = item.category;
            html += `
                <tr class="bg-slate-100 dark:bg-slate-600">
                    <td colspan="6" class="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-200 uppercase tracking-wider">
                        ${currentCategory}
                    </td>
                </tr>
            `;
        }
        
        rowNum++;
        const lineTotal = item.cost * item.qty;
        totalCost += lineTotal;
        
        html += `
            <tr class="border-b">
                <td class="px-2 py-2 text-center text-xs">${rowNum}</td>
                <td class="px-2 py-2 text-sm">${item.name}</td>
                <td class="px-2 py-2 text-center text-sm">${item.unit}</td>
                <td class="px-2 py-2 text-center text-sm">${formatNumber(item.qty)}</td>
                <td class="px-2 py-2 text-right text-sm">${formatCurrency(item.cost)}</td>
                <td class="px-2 py-2 text-right text-sm font-bold">${formatCurrency(lineTotal)}</td>
            </tr>
        `;
    });
    
    const finalPrice = totalCost * coefficient;
    
    const printHtml = `
        <div class="max-w-4xl mx-auto">
            <div class="flex justify-between items-end border-b-2 border-black pb-4 mb-6">
                <div>
                    <h1 class="text-2xl font-bold uppercase">Калькуляция</h1>
                    <div class="mt-2 text-sm">
                        <div><strong>Название:</strong> ${name}</div>
                        ${lightName ? `<div><strong>Светильник:</strong> ${lightName}</div>` : ''}
                        ${lightDescription ? `<div><strong>Описание:</strong> ${lightDescription}</div>` : ''}
                    </div>
                </div>
                <div class="text-right text-sm">
                    <div>Дата: ${new Date().toLocaleDateString('ru-RU')}</div>
                </div>
            </div>
            
            <div class="mb-6">
                <h2 class="text-lg font-bold mb-3">Состав калькуляции</h2>
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b-2 border-black">
                            <th class="p-2 text-center w-10">№</th>
                            <th class="p-2 text-left">Наименование</th>
                            <th class="p-2 text-center w-16">Ед.</th>
                            <th class="p-2 text-center w-20">Кол-во</th>
                            <th class="p-2 text-right w-24">Цена</th>
                            <th class="p-2 text-right w-28">Сумма</th>
                        </tr>
                    </thead>
                    <tbody>${html}</tbody>
                </table>
            </div>
            
            <div class="border-t-2 border-black pt-4 mb-8">
                <div class="text-right space-y-2">
                    <div class="text-lg">Себестоимость: <strong>${formatCurrency(totalCost)}</strong></div>
                    <div class="text-sm">Коэффициент наценки: <strong>${coefficient}</strong></div>
                    <div class="text-xl font-bold">ИТОГО: ${formatCurrency(finalPrice)}</div>
                </div>
            </div>
        </div>
    `;
    
    const printArea = document.getElementById('printArea');
    printArea.innerHTML = printHtml;
    window.print();
}

function saveCalculation() {
    const requestId = document.getElementById('calcRequestId').value;
    const proposalId = document.getElementById('calcProposalId').value;
    const lightIdx = parseInt(document.getElementById('calcLightIdx').value);
    const calcId = document.getElementById('calcId').value;
    const name = document.getElementById('calcName').value.trim();
    const coefficient = parseFloat(document.getElementById('calcCoefficient').value) || 1.5;
    
    const request = (db.commercialRequests || []).find(r => r.id === requestId);
    if (!request) return;
    
    const proposal = (request.proposals || []).find(p => p.id === proposalId);
    if (!proposal || !proposal.lights[lightIdx]) return;
    
    // Используем calcEditorItems
    const items = JSON.parse(JSON.stringify(calcEditorItems));
    
    // Вычисляем стоимость
    let totalCost = 0;
    items.forEach(item => {
        if (item.isCustom) {
            totalCost += (parseFloat(item.cost) || 0) * (item.qty || 0);
        } else {
            const baseItem = (db.items || []).find(i => i.id === item.itemId);
            if (baseItem) {
                totalCost += (parseFloat(baseItem.cost) || 0) * (item.qty || 0);
            }
        }
    });
    
    const finalPrice = totalCost * coefficient;
    const now = Date.now();
    
    if (!db.calculations) db.calculations = [];
    
    let calc;
    if (calcId) {
        // Обновляем существующую
        calc = db.calculations.find(c => c.id === calcId);
        if (calc) {
            calc.name = name;
            calc.coefficient = coefficient;
            calc.items = items;
            calc.totalCost = totalCost;
            calc.finalPrice = finalPrice;
            calc.updatedAt = now;
        }
    }
    
    if (!calc) {
        // Создаём новую
        calc = {
            id: 'calc_' + now,
            name: name,
            coefficient: coefficient,
            items: items,
            totalCost: totalCost,
            finalPrice: finalPrice,
            createdAt: now,
            updatedAt: now
        };
        db.calculations.push(calc);
    }
    
    markChanged('calculations', calc.id);
    
    // Привязываем к светильнику
    proposal.lights[lightIdx].calculationId = calc.id;
    proposal.updatedAt = now;
    request.updatedAt = now;
    markChanged('commercialRequests', requestId);
    
    save();
    closeModal('calculationEditorModal');
    showToast('Калькуляция сохранена');
    
    renderLightsTable(request, proposal);
}

// === GLOBAL CALCULATION SEARCH ===
function openGlobalCalculationSearch() {
    document.getElementById('globalCalcSearch').value = '';
    renderGlobalCalculationsList('');
    openModal('globalCalcSearchModal');
}

function renderGlobalCalculationsList(searchTerm) {
    const container = document.getElementById('globalCalcList');
    if (!container) return;
    
    const search = (searchTerm || '').toLowerCase().trim();
    let calcs = db.calculations || [];
    
    if (search) {
        calcs = calcs.filter(c => 
            (c.name || '').toLowerCase().includes(search)
        );
    }
    
    if (calcs.length === 0) {
        container.innerHTML = '<div class="text-center text-slate-400 py-8">Калькуляции не найдены</div>';
        return;
    }
    
    let html = '';
    calcs.forEach(calc => {
        html += `
            <div class="p-3 border-b dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer" onclick="selectGlobalCalculation('${calc.id}')">
                <div class="font-bold text-sm text-slate-800 dark:text-white">${calc.name || 'Без названия'}</div>
                <div class="text-xs text-slate-500 mt-1">
                    Коэффициент: ${calc.coefficient || 1} | Цена: ${formatCurrency(calc.finalPrice || 0)}
                </div>
                <div class="text-[10px] text-slate-400 mt-1">
                    Компонентов: ${(calc.items || []).length}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function filterGlobalCalculations() {
    const search = document.getElementById('globalCalcSearch').value;
    renderGlobalCalculationsList(search);
}

function selectGlobalCalculation(calcId) {
    const calc = (db.calculations || []).find(c => c.id === calcId);
    if (!calc) return;
    
    // Копируем данные в редактор калькуляции
    document.getElementById('calcId').value = ''; // Создаём копию, а не редактируем оригинал
    document.getElementById('calcName').value = calc.name + ' (Копия)';
    document.getElementById('calcCoefficient').value = calc.coefficient || 1.5;
    
    // Глубокое копирование items
    calcEditorItems = JSON.parse(JSON.stringify(calc.items || []));
    
    closeModal('globalCalcSearchModal');
    renderCalculationItems();
}

// === CONVERT TO PROJECT ===
function convertRequestToProject() {
    const requestId = document.getElementById('crId').value;
    const request = (db.commercialRequests || []).find(r => r.id === requestId);
    if (!request) return;
    
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('commercial', 'convert')) {
        showToast('Нет прав на преобразование запросов');
        return;
    }
    
    if (request.status === 'converted') {
        showToast('Запрос уже преобразован в проект');
        return;
    }
    
    // Открываем модальное окно выбора
    document.getElementById('convertRequestId').value = requestId;
    
    // Заполняем список КП
    const proposalSelect = document.getElementById('convertProposalSelect');
    proposalSelect.innerHTML = '<option value="">— выберите КП —</option>';
    
    (request.proposals || []).forEach(p => {
        const lightsCount = (p.lights || []).length;
        proposalSelect.innerHTML += `<option value="${p.id}">${p.name || 'КП'} (${lightsCount} светильников)</option>`;
    });
    
    // Если есть только одно КП — выбираем его
    if (request.proposals && request.proposals.length === 1) {
        proposalSelect.value = request.proposals[0].id;
    }
    
    renderConvertLightsList();
    openModal('convertToProjectModal');
}

function renderConvertLightsList() {
    const requestId = document.getElementById('convertRequestId').value;
    const proposalId = document.getElementById('convertProposalSelect').value;
    const container = document.getElementById('convertLightsList');
    
    if (!proposalId) {
        container.innerHTML = '<div class="p-4 text-center text-slate-400 text-sm">Выберите КП</div>';
        return;
    }
    
    const request = (db.commercialRequests || []).find(r => r.id === requestId);
    if (!request) return;
    
    const proposal = (request.proposals || []).find(p => p.id === proposalId);
    if (!proposal) return;
    
    const lights = proposal.lights || [];
    
    if (lights.length === 0) {
        container.innerHTML = '<div class="p-4 text-center text-slate-400 text-sm">Нет светильников в этом КП</div>';
        return;
    }
    
    let html = '';
    lights.forEach((light, idx) => {
        const calc = (db.calculations || []).find(c => c.id === light.calculationId);
        const hasCalc = !!calc;
        const calcInfo = hasCalc 
            ? `<span class="text-green-500 text-xs"><i class="fas fa-check-circle"></i> есть калькуляция</span>`
            : `<span class="text-orange-500 text-xs"><i class="fas fa-exclamation-circle"></i> нет калькуляции</span>`;
        
        const description = light.description || generateLightDescription(light);
        
        html += `
            <div class="p-3 border-b dark:border-slate-600 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700">
                <label class="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" class="convert-light-checkbox w-4 h-4 mt-1" data-idx="${idx}" ${hasCalc ? 'checked' : ''}>
                    <div class="flex-1">
                        <div class="font-medium text-slate-800 dark:text-white">${light.name || 'Без названия'}</div>
                        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">${description || ''}</div>
                        <div class="mt-1">${calcInfo}</div>
                        <div class="text-xs text-slate-400 mt-1">Кол-во: ${light.qty || 1}</div>
                    </div>
                </label>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function toggleConvertSelectAll() {
    const selectAll = document.getElementById('convertSelectAll').checked;
    document.querySelectorAll('.convert-light-checkbox').forEach(cb => {
        cb.checked = selectAll;
    });
}

function executeConvertToProject() {
    const requestId = document.getElementById('convertRequestId').value;
    const proposalId = document.getElementById('convertProposalSelect').value;
    
    const request = (db.commercialRequests || []).find(r => r.id === requestId);
    if (!request) return;
    
    const now = Date.now();
    
    // Создаём проект
    const newProject = {
        id: now,
        year: request.year,
        num: request.number,
        name: request.name,
        desc: request.description,
        client: request.client,
        start: new Date().toISOString().split('T')[0],
        end: '',
        cost: 0,
        status: 'active',
        file: '',
        updatedAt: now
    };
    
    if (!db.projects) db.projects = [];
    db.projects.push(newProject);
    markChanged('projects', newProject.id);
    
    // Создаём отдельную спецификацию для каждого выбранного светильника
    let specsCreated = 0;
    
    if (proposalId) {
        const proposal = (request.proposals || []).find(p => p.id === proposalId);
        if (proposal) {
            const selectedCheckboxes = document.querySelectorAll('.convert-light-checkbox:checked');
            const selectedIndices = Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.idx));
            
            if (!db.specs) db.specs = {};
            if (!db.specs[newProject.id]) db.specs[newProject.id] = [];
            
            selectedIndices.forEach((idx, specIdx) => {
                const light = proposal.lights[idx];
                if (!light) return;
                
                const calc = (db.calculations || []).find(c => c.id === light.calculationId);
                if (!calc || !calc.items || calc.items.length === 0) return;
                
                // Собираем items для этого светильника
                const specItems = [];
                
                calc.items.forEach(item => {
                    if (item.isCustom) {
                        specItems.push({
                            isCustom: true,
                            name: item.name,
                            unit: item.unit || 'шт.',
                            qty: item.qty || 0,
                            cost: item.cost || 0
                        });
                    } else {
                        specItems.push({
                            itemId: item.itemId,
                            qty: item.qty || 0,
                            isCustom: false
                        });
                    }
                });
                
                // Создаём спецификацию с названием светильника
                const newSpec = {
                    id: 's_' + now + '_' + specIdx,
                    name: light.name || `Светильник ${specIdx + 1}`,
                    status: 'draft',
                    date: new Date().toLocaleDateString(),
                    quantity: light.qty || 1, // Количество светильников = количество спецификации
                    items: specItems,
                    updatedAt: now
                };
                
                db.specs[newProject.id].push(newSpec);
                specsCreated++;
            });
            
            if (specsCreated > 0) {
                markChanged('specs', newProject.id);
            }
        }
    }
    
    // Обновляем запрос
    request.status = 'converted';
    request.projectId = newProject.id;
    request.updatedAt = now;
    markChanged('commercialRequests', requestId);
    
    // Логирование
    if (typeof logActivity === 'function') {
        logActivity('commercial_request_convert', 'commercial_request', requestId, request.name, {
            projectId: newProject.id,
            specsCreated: specsCreated
        });
    }
    
    save();
    closeModal('convertToProjectModal');
    showToast(`Создан проект с ${specsCreated} спецификациями`);
    
    renderCommercialRequestsList();
    loadCommercialRequestEditor(requestId);
}

// === PRINT COMMERCIAL PROPOSAL ===
function printCommercialProposal(requestId, proposalId) {
    const request = (db.commercialRequests || []).find(r => r.id === requestId);
    if (!request) return;
    
    const proposal = (request.proposals || []).find(p => p.id === proposalId);
    if (!proposal) return;
    
    const company = db.companySettings || {};
    const lights = proposal.lights || [];
    
    let itemsHtml = '';
    let grandTotal = 0;
    
    lights.forEach((light, idx) => {
        const calc = (db.calculations || []).find(c => c.id === light.calculationId);
        const unitPrice = calc ? (calc.finalPrice || 0) : 0;
        const lineTotal = unitPrice * (light.qty || 1);
        grandTotal += lineTotal;
        
        // Описание светильника
        const description = light.description || generateLightDescription(light);
        const descriptionHtml = description ? `<div class="text-xs text-slate-600 mt-1">${description}</div>` : '';
        
        itemsHtml += `
            <tr class="border-b">
                <td class="p-2 text-center align-top">${idx + 1}</td>
                <td class="p-2">
                    <div class="font-medium">${light.name || '—'}</div>
                    ${descriptionHtml}
                </td>
                <td class="p-2 text-center align-top">${light.qty || 1}</td>
                <td class="p-2 text-right align-top">${formatNumber(unitPrice)}</td>
                <td class="p-2 text-right font-bold align-top">${formatNumber(lineTotal)}</td>
            </tr>
        `;
    });
    
    const logoHtml = company.logo 
        ? `<img src="${company.logo}" alt="Logo" class="h-16 object-contain mb-2">` 
        : '';
    
    const html = `
        <div class="max-w-4xl mx-auto p-8">
            <div class="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                <div>
                    ${logoHtml}
                    <h1 class="text-2xl font-bold">КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h1>
                    <div class="text-sm mt-2">
                        <div><strong>№:</strong> ${request.number || '—'} / ${proposal.name}</div>
                        <div><strong>Дата:</strong> ${new Date().toLocaleDateString('ru-RU')}</div>
                    </div>
                </div>
                <div class="text-right text-sm">
                    ${company.name ? `<div class="font-bold">${company.name}</div>` : ''}
                    ${company.address ? `<div>${company.address}</div>` : ''}
                    ${company.phone ? `<div>Тел: ${company.phone}</div>` : ''}
                    ${company.email ? `<div>Email: ${company.email}</div>` : ''}
                    ${company.inn ? `<div>ИНН: ${company.inn}</div>` : ''}
                </div>
            </div>
            
            <div class="mb-6">
                <h2 class="font-bold mb-2">Заказчик:</h2>
                <div class="text-lg">${request.client || '—'}</div>
                ${request.description ? `<div class="text-sm text-slate-600 mt-2">${request.description}</div>` : ''}
            </div>
            
            <table class="w-full text-sm mb-6">
                <thead>
                    <tr class="border-b-2 border-black">
                        <th class="p-2 text-center w-10">№</th>
                        <th class="p-2 text-left">Наименование</th>
                        <th class="p-2 text-center w-20">Кол-во</th>
                        <th class="p-2 text-right w-28">Цена, ₽</th>
                        <th class="p-2 text-right w-28">Сумма, ₽</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            
            <div class="border-t-2 border-black pt-4 text-right">
                <div class="text-xl font-bold">ИТОГО: ${formatNumber(grandTotal)} ₽</div>
            </div>
            
            ${company.bank ? `
            <div class="mt-8 pt-4 border-t text-sm">
                <h3 class="font-bold mb-2">Реквизиты для оплаты:</h3>
                <div>Банк: ${company.bank}</div>
                <div>БИК: ${company.bik || '—'}</div>
                <div>Р/с: ${company.account || '—'}</div>
                <div>К/с: ${company.corrAccount || '—'}</div>
            </div>
            ` : ''}
            
            <div class="mt-8 pt-4 border-t text-xs text-slate-500">
                <p>Настоящее коммерческое предложение действительно в течение 30 дней с даты выставления.</p>
            </div>
        </div>
    `;
    
    const printArea = document.getElementById('printArea');
    printArea.innerHTML = html;
    window.print();
}

// === COMPANY SETTINGS ===
function openCompanySettingsModal() {
    const settings = db.companySettings || {};
    
    document.getElementById('companyName').value = settings.name || '';
    document.getElementById('companyAddress').value = settings.address || '';
    document.getElementById('companyPhone').value = settings.phone || '';
    document.getElementById('companyEmail').value = settings.email || '';
    document.getElementById('companyInn').value = settings.inn || '';
    document.getElementById('companyKpp').value = settings.kpp || '';
    document.getElementById('companyOgrn').value = settings.ogrn || '';
    document.getElementById('companyBank').value = settings.bank || '';
    document.getElementById('companyBik').value = settings.bik || '';
    document.getElementById('companyAccount').value = settings.account || '';
    document.getElementById('companyCorrAccount').value = settings.corrAccount || '';
    document.getElementById('companyLogo').value = settings.logo || '';
    
    openModal('companySettingsModal');
}

function saveCompanySettings() {
    if (!db.companySettings) db.companySettings = {};
    
    db.companySettings.name = document.getElementById('companyName').value.trim();
    db.companySettings.address = document.getElementById('companyAddress').value.trim();
    db.companySettings.phone = document.getElementById('companyPhone').value.trim();
    db.companySettings.email = document.getElementById('companyEmail').value.trim();
    db.companySettings.inn = document.getElementById('companyInn').value.trim();
    db.companySettings.kpp = document.getElementById('companyKpp').value.trim();
    db.companySettings.ogrn = document.getElementById('companyOgrn').value.trim();
    db.companySettings.bank = document.getElementById('companyBank').value.trim();
    db.companySettings.bik = document.getElementById('companyBik').value.trim();
    db.companySettings.account = document.getElementById('companyAccount').value.trim();
    db.companySettings.corrAccount = document.getElementById('companyCorrAccount').value.trim();
    db.companySettings.logo = document.getElementById('companyLogo').value.trim();
    
    pendingChanges.companySettings = true;
    save();
    closeModal('companySettingsModal');
    showToast('Реквизиты сохранены');
}

