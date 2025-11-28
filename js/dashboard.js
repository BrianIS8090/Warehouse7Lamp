// --- DASHBOARD ---
function renderDashboard() {
    if(!db.items) return;
    let totalMoney = db.items.reduce((acc, i) => acc + (i.cost * i.qty), 0);
    document.getElementById('dashTotalMoney').innerText = formatCurrency(totalMoney);
    
    let activeProj = (db.projects || []).filter(p => p.status === 'active');
    document.getElementById('dashActiveProj').innerText = formatNumber(activeProj.length);
    
    let budget = activeProj.reduce((acc, p) => acc + (parseFloat(p.cost) || 0), 0);
    const budgetEl = document.getElementById('dashActiveBudget');
    if(budgetEl) budgetEl.innerText = formatCurrency(budget);
    
    // Расчет товара с низким стоком
    const lowStockItems = (db.items || []).map(item => {
        const free = item.qty - getReserve(item.id);
        return {...item, free};
    }).filter(item => item.free < 0);
    
    const lsTable = document.getElementById('dashLowStockTable');
    if(lsTable) {
        lsTable.innerHTML = lowStockItems
            .map(i => `<tr class="border-b dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onclick="openItemCard(${i.id})" title="Открыть карточку товара">
                <td class="py-2 font-medium text-slate-700 dark:text-slate-300">${i.name}</td>
                <td class="py-2 text-right font-bold text-red-600 dark:text-red-400">${formatNumber(i.free)} ${i.unit}</td>
            </tr>`).join('') || '<tr><td colspan="2" class="py-4 text-center text-slate-400 text-sm">Все в порядке</td></tr>';
    }
    
    // Расчет предстоящих сроков проектов
    const today = new Date();
    const upcomingDeadlines = (db.projects || []).filter(p => {
        if (p.status !== 'active' || !p.end) return false;
        const deadline = new Date(p.end);
        const diffTime = deadline - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7; 
    }).sort((a, b) => new Date(a.end) - new Date(b.end));

    const dlTable = document.getElementById('dashDeadlineTable');
    if(dlTable) {
        dlTable.innerHTML = upcomingDeadlines.map(p => {
            const deadline = new Date(p.end);
            const diffTime = deadline - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const daysValue = formatNumber(Math.abs(diffDays));
            const daysText = diffDays < 0 ? `Просрочен на ${daysValue} дн.` : (diffDays === 0 ? 'Сегодня' : `${daysValue} дн.`);
            const colorClass = diffDays < 0 ? 'text-red-600 dark:text-red-400' : 'text-orange-500 dark:text-orange-400';
            
            return `<tr class="border-b dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onclick="openProjectCard(${p.id})" title="Открыть карточку проекта"><td class="py-2 font-medium text-slate-700 dark:text-slate-300 text-sm truncate max-w-[150px]">${p.name}</td><td class="py-2 text-right font-bold ${colorClass} text-sm">${daysText}</td></tr>`;
        }).join('') || '<tr><td colspan="2" class="py-4 text-center text-slate-400 text-sm">Нет срочных</td></tr>';
    }

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
    
    // Рендеринг диаграммы Ганта
    renderGanttChart();
    
    // Рендеринг новых графиков
    renderCategoryChart();
    renderTopItemsChart();
}

// Функция для парсинга даты из разных форматов
function parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Формат YYYY-MM-DD
    if (dateStr.includes('-')) {
        return new Date(dateStr);
    }
    // Формат DD.MM.YYYY
    if (dateStr.includes('.')) {
        const [day, month, year] = dateStr.split('.');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return new Date(dateStr);
}

// Функция для форматирования даты
function formatDateShort(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
}

// Функция для рендеринга диаграммы Ганта (собственная реализация)
function renderGanttChart() {
    const container = document.getElementById('ganttContainer');
    if (!container) return;
    
    // Фильтруем только активные проекты с датами начала и окончания
    const activeProjects = (db.projects || []).filter(p => 
        p.status === 'active' && p.start && p.end
    );
    
    if (!activeProjects.length) {
        container.innerHTML = '<p class="text-slate-400 text-center py-4 text-sm">Нет активных проектов с указанными датами</p>';
        return;
    }

    // Находим общий диапазон дат
    let minDate = null;
    let maxDate = null;
    
    const projectsData = activeProjects.map(p => {
        const startDate = parseDate(p.start);
        const endDate = parseDate(p.end);
        
        if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return null;
        }
        
        if (!minDate || startDate < minDate) minDate = new Date(startDate);
        if (!maxDate || endDate > maxDate) maxDate = new Date(endDate);
        
        // Вычисляем дату окончания проектирования (40% от длительности)
        const duration = endDate - startDate;
        const designEndDate = new Date(startDate.getTime() + duration * 0.4);
        
        return {
            id: p.id,
            name: p.name,
            num: p.num || '—',
            start: startDate,
            end: endDate,
            designEnd: designEndDate
        };
    }).filter(p => p !== null);
    
    if (projectsData.length === 0 || !minDate || !maxDate) {
        container.innerHTML = '<p class="text-slate-400 text-center py-4 text-sm">Нет проектов с корректными датами</p>';
        return;
    }
    
    // Расширяем диапазон до начала первого месяца и конца последнего
    minDate.setDate(1);
    maxDate.setMonth(maxDate.getMonth() + 1);
    maxDate.setDate(0);
    
    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Собираем информацию о месяцах для шкалы и линий
    const monthsInfo = [];
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    let tempDate = new Date(minDate);
    
    while (tempDate <= maxDate) {
        const monthStart = new Date(tempDate);
        const monthEnd = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0);
        const daysInMonth = (Math.min(monthEnd, maxDate) - monthStart) / (1000 * 60 * 60 * 24) + 1;
        const startOffset = (monthStart - minDate) / (1000 * 60 * 60 * 24);
        
        monthsInfo.push({
            name: months[tempDate.getMonth()],
            year: tempDate.getFullYear(),
            startPercent: (startOffset / totalDays) * 100,
            widthPercent: (daysInMonth / totalDays) * 100
        });
        
        tempDate.setMonth(tempDate.getMonth() + 1);
        tempDate.setDate(1);
    }
    
    // Создаем HTML для диаграммы
    let html = '<div class="gantt-wrapper">';
    
    // Таблица с фиксированной структурой
    html += '<table class="gantt-table"><tbody>';
    
    // Шкала времени (заголовок)
    html += '<tr class="gantt-header-row">';
    html += '<td class="gantt-label-cell"></td>';
    html += '<td class="gantt-bars-cell">';
    html += '<div class="gantt-timeline">';
    monthsInfo.forEach(m => {
        html += `<div class="gantt-month" style="left: ${m.startPercent}%; width: ${m.widthPercent}%;">${m.name} ${m.year}</div>`;
    });
    html += '</div>';
    html += '</td></tr>';
    
    // Строки проектов
    projectsData.forEach(p => {
        const startOffset = Math.max(0, (p.start - minDate) / (1000 * 60 * 60 * 24));
        const projectWidth = Math.max(1, (p.end - p.start) / (1000 * 60 * 60 * 24));
        const designWidth = Math.max(1, (p.designEnd - p.start) / (1000 * 60 * 60 * 24));
        
        const startPercent = (startOffset / totalDays) * 100;
        const projectPercent = (projectWidth / totalDays) * 100;
        const designPercent = (designWidth / totalDays) * 100;
        
        const tooltipText = `${p.name}\nПроектирование до: ${formatDateShort(p.designEnd)}\nЗавершение: ${formatDateShort(p.end)}`;
        
        // Линии разделения месяцев
        let gridLines = '';
        monthsInfo.forEach((m, idx) => {
            if (idx > 0) {
                gridLines += `<div class="gantt-grid-line" style="left: ${m.startPercent}%;"></div>`;
            }
        });
        
        html += `<tr class="gantt-row" onclick="openProjectCard(${p.id})" title="${tooltipText}">`;
        html += `<td class="gantt-label-cell"><span class="gantt-label-num">${p.num}</span> <span class="gantt-label-name">${p.name}</span></td>`;
        html += `<td class="gantt-bars-cell">`;
        html += `<div class="gantt-bars-container">`;
        html += gridLines;
        html += `<div class="gantt-bar gantt-bar-project" style="left: ${startPercent}%; width: ${projectPercent}%;"></div>`;
        html += `<div class="gantt-bar gantt-bar-design" style="left: ${startPercent}%; width: ${designPercent}%;"></div>`;
        html += `</div></td></tr>`;
    });
    
    html += '</tbody></table>';
    html += '</div>';
    
    // Легенда
    html += `
        <div class="gantt-legend">
            <span class="gantt-legend-item"><span class="gantt-legend-color gantt-legend-project"></span> Проект</span>
            <span class="gantt-legend-item"><span class="gantt-legend-color gantt-legend-design"></span> Проектирование (40%)</span>
        </div>
    `;
    
    container.innerHTML = html;
}

// --- CHARTS RENDERING ---

// Хранилище для Chart.js графиков
let categoryChartInstance = null;
let topItemsChartInstance = null;

// Функция для отрисовки круговой диаграммы по стоимости товара в категориях
function renderCategoryChart() {
    const chartCanvas = document.getElementById('categoryChart');
    if (!chartCanvas || !db.items) return;
    
    // Расчет стоимости по категориям
    const categoryTotals = {};
    db.items.forEach(item => {
        const category = item.cat || 'Без категории';
        const itemCost = (item.cost || 0) * (item.qty || 0);
        categoryTotals[category] = (categoryTotals[category] || 0) + itemCost;
    });
    
    // Сортируем по стоимости и берем только первые 20
    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);
    
    const fullLabels = sortedCategories.map(([cat]) => cat);
    const labels = fullLabels.map(cat => {
        // Обрезаем длинные названия для графика
        return cat.length > 20 ? cat.substring(0, 17) + '...' : cat;
    });
    const data = sortedCategories.map(([, total]) => Math.round(total));
    
    // Генерируем цвета для 20 позиций
    const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
        '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4',
        '#f43f5e', '#7c3aed', '#0891b2', '#ea580c', '#4f46e5',
        '#16a34a', '#7c2d12', '#0369a1', '#6b21a8', '#3b82f6'
    ];
    
    const backgroundColors = colors.slice(0, labels.length);
    const borderColors = backgroundColors.map(c => adjustBrightness(c, -20));
    
    // Уничтожаем старый график, если он существует
    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }
    
    // Создаем новый график
    const ctx = chartCanvas.getContext('2d');
    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
    
    // Рендерим кастомную легенду
    renderCustomLegend('categoryLegend', fullLabels, data, backgroundColors);
}

// Функция для отрисовки кастомной легенды
function renderCustomLegend(elementId, labels, data, colors) {
    const legendContainer = document.getElementById(elementId);
    if (!legendContainer) return;
    
    let html = '';
    labels.forEach((label, index) => {
        const value = data[index] || 0;
        const color = colors[index] || '#666';
        
        html += `
            <div class="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer group">
                <div class="w-3 h-3 rounded-full flex-shrink-0 mt-1" style="background-color: ${color}; border: 1px solid ${adjustBrightness(color, -20)};"></div>
                <div class="flex-1 min-w-0">
                    <div class="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-normal break-words" title="${label}">${label}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">${formatCurrency(value)}</div>
                </div>
            </div>
        `;
    });
    
    legendContainer.innerHTML = html;
}

// Функция для отрисовки круговой диаграммы топ 10 товаров по стоимости
function renderTopItemsChart() {
    const chartCanvas = document.getElementById('topItemsChart');
    if (!chartCanvas || !db.items) return;
    
    // Расчет стоимости товара: количество * цена
    const itemTotals = db.items.map(item => ({
        name: item.name,
        total: (item.cost || 0) * (item.qty || 0)
    }))
    .filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);
    
    const fullNames = itemTotals.map(item => item.name);
    const labels = fullNames.map(name => {
        // Обрезаем длинные названия для графика
        return name.length > 20 ? name.substring(0, 17) + '...' : name;
    });
    const data = itemTotals.map(item => Math.round(item.total));
    
    // Генерируем цвета для 20 позиций в оттенках синего и зеленого
    const colors = [
        '#0ea5e9', '#06b6d4', '#10b981', '#14b8a6', '#1d4ed8',
        '#3b82f6', '#60a5fa', '#34d399', '#6ee7b7', '#a7f3d0',
        '#0891b2', '#059669', '#0d9488', '#15803d', '#2563eb',
        '#0284c7', '#00d9ff', '#10b981', '#7ee8b7', '#22c55e'
    ];
    
    const backgroundColors = colors.slice(0, labels.length);
    const borderColors = backgroundColors.map(c => adjustBrightness(c, -20));
    
    // Уничтожаем старый график, если он существует
    if (topItemsChartInstance) {
        topItemsChartInstance.destroy();
    }
    
    // Создаем новый график
    const ctx = chartCanvas.getContext('2d');
    topItemsChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
    
    // Рендерим кастомную легенду
    renderCustomLegend('topItemsLegend', fullNames, data, backgroundColors);
}

// Вспомогательная функция для изменения яркости цвета
function adjustBrightness(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
}
