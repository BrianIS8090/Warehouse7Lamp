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




