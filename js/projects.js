// --- PROJECTS ---
let projectSearchQuery = '';
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
    let filtered = [...(db.projects || [])];

    // Фильтрация по поисковому запросу
    if (projectSearchQuery) {
        filtered = filtered.filter(p => {
            const searchFields = [
                p.name || '',
                p.client || '',
                p.desc || '',
                p.num || '',
                String(p.year || ''),
                p.status || ''
            ].join(' ').toLowerCase();
            return searchFields.includes(projectSearchQuery);
        });
    }

    // Обновляем счетчик результатов
    const resultsCounter = document.getElementById('projectSearchResults');
    if (resultsCounter) {
        const totalCount = (db.projects || []).length;
        const filteredCount = filtered.length;
        if (projectSearchQuery) {
            resultsCounter.textContent = `Найдено: ${filteredCount} из ${totalCount} проектов`;
        } else {
            resultsCounter.textContent = `Всего: ${totalCount} проектов`;
        }
    }

    let sorted = [...filtered];

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
        const specsCount = ((db.specs || {})[p.id] || []).length;
        const specsCountClass = specsCount > 0 ? 'text-green-600 dark:text-green-400 font-bold' : '';
        const fileUrl = p.file ? escapeAttr(p.file) : '';
        const fileIcon = p.file ? `<button data-file-url="${fileUrl}" class="project-file-btn text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 z-10 relative cursor-pointer" title="Открыть файл"><i class="fas fa-file"></i></button>` : '<span class="text-slate-300 dark:text-slate-600"><i class="fas fa-file"></i></span>';
        tbody.innerHTML += `<tr class="border-b dark:border-slate-700 transition h-16 ${isClosed ? 'opacity-60 bg-slate-50 dark:bg-slate-800' : ''}">
            <td class="px-4 py-3">${projectYear}</td>
            <td class="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">${projectNum}</td>
            <td class="px-4 py-3 text-slate-600 dark:text-slate-300">${projectClient}</td>
            <td class="px-4 py-3 text-center">${fileIcon}</td>
            <td class="px-4 py-3">
                <div onclick="openProjectCard(${p.id})" class="font-bold text-blue-800 dark:text-blue-400 hover:underline cursor-pointer inline-block">${p.name}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">${p.desc || '-'}</div>
            </td>
            <td class="px-4 py-3 text-center ${specsCountClass}">${specsCount}</td>
            <td class="px-4 py-3 text-center">${statusHtml}</td>
            <td class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 hidden md:table-cell">${startDate} <br> ${endDate}</td>
            <td class="px-4 py-3 text-right">${formattedProjectCost}</td>
            <td class="px-4 py-3 text-right">${actionBtn}</td>
        </tr>`; 
    }); 
}

function closeProject(pid) { 
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('projects', 'close')) {
        showToast('Нет прав на закрытие проектов');
        return;
    }
    
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
    
    const now = Date.now();
    let movCounter = 0;
    
    drafts.forEach(s => { 
        s.items.forEach(r => { 
            if(!r.isCustom) { 
                const i = db.items.find(x => x.id === r.itemId); 
                i.qty -= r.qty;
                i.updatedAt = now;
                markChanged('items', i.id);
                
                const movId = 'mov_' + now + '_' + movCounter++;
                db.movements.unshift({
                    id: movId, 
                    date: new Date().toLocaleString(), 
                    type: 'out', 
                    itemId: i.id, 
                    itemName: `${i.name} (Закрытие)`, 
                    qty: r.qty,
                    updatedAt: now
                });
                markChanged('movements', movId);
            } 
        }); 
        s.status = 'committed'; 
        s.date = new Date().toLocaleDateString();
        s.updatedAt = now;
    });
    markChanged('specs', pid);
    
    p.status = 'closed';
    p.updatedAt = now;
    markChanged('projects', pid); 
    
    // Логирование
    if (typeof logActivity === 'function') {
        logActivity('project_close', 'project', p.id, p.name, {
            specsCommitted: drafts.length
        });
    }
    
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

function duplicateProject(pid) {
    const p = db.projects.find(x => x.id === pid);
    if(!p) return;
    
    if(!confirm(`Создать копию проекта "${p.name}"?`)) return;
    
    const now = Date.now();
    const newProject = {
        ...p,
        id: now,
        name: p.name + " (Копия)",
        status: 'active',
        updatedAt: now
    };
    
    const oldSpecs = (db.specs || {})[pid] || [];
    const newSpecs = oldSpecs.map(s => ({
        ...s,
        id: 's_' + Math.random().toString(36).substr(2, 9),
        status: 'draft', 
        date: new Date().toLocaleDateString(),
        items: s.items.map(i => ({...i})),
        updatedAt: now
    }));
    
    db.projects.push(newProject);
    markChanged('projects', now);
    if(!db.specs) db.specs = {};
    db.specs[now] = newSpecs;
    markChanged('specs', now);
    
    save();
    closeModal('projectCardModal');
    renderProjects();
    showToast("Проект скопирован");
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
    document.getElementById('pcFile').value = p.file || ''; 
    
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
                <td class="px-4 py-2 font-medium"><span onclick="openSpecFromProject(${p.id}, '${s.id}')" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer hover:underline">${s.name}</span></td>
                <td class="px-4 py-2 text-center">${statusBadge}</td>
                <td class="px-4 py-2 text-center">${s.items.length}</td>
                <td class="px-4 py-2 text-right">${specSumDisplay}</td>
            </tr>`; 
        }); 
    } 
    document.getElementById('pcTotalSpecsCost').textContent = formatCurrency(totalProjectSum); 
    
    // Показываем/скрываем кнопки в зависимости от статуса проекта
    const isClosed = p.status === 'closed';

    const deleteBtn = document.getElementById('btnDeleteProject');
    if (deleteBtn) {
        deleteBtn.classList.toggle('hidden', !deleteProjectsEnabled);
    }

    const saveBtn = document.getElementById('btnSaveProject');
    if (saveBtn) {
        saveBtn.classList.toggle('hidden', isClosed);
    }

    const createSpecBtn = document.getElementById('btnCreateSpec');
    if (createSpecBtn) {
        createSpecBtn.classList.toggle('hidden', isClosed);
    }

    switchProjectTab('info');
    openModal('projectCardModal'); 
}

function saveProjectFromCard() { 
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('projects', 'edit')) {
        showToast('Нет прав на редактирование проектов');
        return;
    }
    
    const id = parseInt(document.getElementById('pcId').value); 
    const p = db.projects.find(x => x.id === id); 
    if(p) { 
        // Сохраняем старые значения для логирования
        const oldProject = { ...p };
        
        p.year = document.getElementById('pcYear').value; 
        p.num = document.getElementById('pcNum').value; 
        p.name = document.getElementById('pcName').value; 
        p.desc = document.getElementById('pcDesc').value; 
        p.client = document.getElementById('pcClient').value; 
        p.start = document.getElementById('pcStart').value; 
        p.end = document.getElementById('pcEnd').value; 
        p.cost = parseFloat(document.getElementById('pcCost').value) || 0; 
        p.file = document.getElementById('pcFile').value || '';
        p.updatedAt = Date.now();
        markChanged('projects', p.id);
        
        // Логирование
        if (typeof logActivity === 'function' && typeof trackChanges === 'function') {
            const changes = trackChanges(oldProject, p, ['name', 'client', 'cost', 'start', 'end', 'status']);
            if (changes) {
                logActivity('project_edit', 'project', p.id, p.name, changes);
            }
        }
        
        save(); 
        renderProjects(); 
        closeModal('projectCardModal'); 
        showToast('Проект обновлен'); 
    } 
}

function deleteProjectFromCard() {
    // Проверка прав
    if (typeof hasPermission === 'function' && !hasPermission('projects', 'delete')) {
        return showToast("Нет прав на удаление проектов");
    }
    
    if (!deleteProjectsEnabled) {
        return showToast("Удаление проектов отключено в настройках");
    }

    const id = parseInt(document.getElementById('pcId').value);
    const p = db.projects.find(x => x.id === id);
    if(!p) return;

    const projectName = p.name || `Проект #${p.id}`;
    const specs = (db.specs || {})[p.id] || [];
    const hasCommittedSpecs = specs.some(s => s.status === 'committed');
    
    let message = `Вы точно хотите удалить проект "${projectName}"?`;
    if (specs.length > 0) {
        message += `\n\nВ проекте ${specs.length} спецификаций.`;
        if (hasCommittedSpecs) {
            message += `\nВнимание! Есть списанные спецификации. Удаление приведет к потере истории.`;
        }
    }
    message += `\n\nЭто действие нельзя отменить.`;

    if(!confirm(message)) return;

    // Логирование перед удалением
    if (typeof logActivity === 'function') {
        logActivity('project_delete', 'project', p.id, projectName, {
            specsCount: specs.length
        });
    }

    // Удаляем проект из массива
    const projectIndex = db.projects.findIndex(x => x.id === id);
    if(projectIndex !== -1) {
        db.projects.splice(projectIndex, 1);
        markDeleted('projects', id);
    }

    // Удаляем спецификации проекта
    if(db.specs && db.specs[p.id]) {
        delete db.specs[p.id];
        markDeleted('specs', p.id);
    }

    // Если это был выбранный проект, сбрасываем выбор
    if(selectedProjectId === id) {
        selectedProjectId = null;
        selectedSpecId = null;
    }

    save();
    renderProjects();
    closeModal('projectCardModal');
    
    // Обновляем спецификации если открыта вкладка спецификаций
    if(typeof renderSpecProjectList === 'function') {
        renderSpecProjectList();
    }
    
    showToast('Проект удален');
}

function createNewSpec() {
    const projectId = parseInt(document.getElementById('pcId').value);
    if (!projectId) return;

    // Устанавливаем текущий проект как выбранный
    if (typeof selectedProjectId !== 'undefined') {
        selectedProjectId = projectId;
    }

    // Открываем модальное окно создания спецификации
    if (typeof openModal === 'function') {
        openModal('addSpecModal');
    }
}

function openSpecFromProject(projectId, specId) {
    // Закрываем карточку проекта
    closeModal('projectCardModal');

    // Переключаемся на вкладку спецификаций
    switchTab('specs');

    // Выбираем проект и спецификацию
    if (typeof selectSpecAndLoad === 'function') {
        selectSpecAndLoad(projectId, specId);
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

function filterProjects() {
    const searchInput = document.getElementById('projectSearchInput');
    projectSearchQuery = searchInput.value.toLowerCase().trim();
    renderProjects();
}

function updateProjectSearchResults() {
    const resultsCounter = document.getElementById('projectSearchResults');
    if (resultsCounter) {
        const totalCount = (db.projects || []).length;
        resultsCounter.textContent = `Всего: ${totalCount} проектов`;
    }
}






