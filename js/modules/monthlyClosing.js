// موديول الإقفال الشهري

window.renderMonthlyClosing = function() {
    const container = document.getElementById('monthlyClosing');
    if (!container) return;
    const closings = db.monthlyClosings || [];
    container.innerHTML = `
    <div class="space-y-5">
      <div class="card p-5">
        <div class="section-title-bar">
          <h3 class="text-lg font-bold">الإقفال الشهري</h3>
          <button onclick="performMonthlyClosing()" class="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm hover:bg-indigo-700 flex items-center gap-2"><i data-lucide="lock" size="17"></i> إقفال الشهر الحالي</button>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="stat-card"><p class="text-xs text-gray-500">عدد الإقفالات</p><h4 class="text-xl font-bold">${closings.length}</h4></div>
          <div class="stat-card"><p class="text-xs text-gray-500">آخر إقفال</p><h4 class="text-xl font-bold">${closings.length>0?closings[closings.length-1].period:'-'}</h4></div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-right">
            <thead><tr><th class="p-3">الفترة</th><th class="p-3">الإيرادات</th><th class="p-3">المصروفات</th><th class="p-3">صافي الربح</th><th class="p-3">تاريخ الإقفال</th><th class="p-3">إجراءات</th></tr></thead>
            <tbody>
              ${closings.length===0?'<tr><td colspan="6" class="p-4 text-center text-gray-400">لا توجد إقفالات</td></tr>':
              closings.slice().reverse().map((c,i)=>{
                const ri=closings.length-1-i;
                return `<tr class="border-b hover:bg-gray-50">
                  <td class="p-3 font-semibold">${c.period}</td>
                  <td class="p-3 text-green-600">${(c.revenue||0).toFixed(2)}</td>
                  <td class="p-3 text-red-600">${(c.expenses||0).toFixed(2)}</td>
                  <td class="p-3 font-bold ${(c.netIncome||0)>=0?'text-green-600':'text-red-600'}">${(c.netIncome||0).toFixed(2)}</td>
                  <td class="p-3 text-sm">${c.closedAt||'-'}</td>
                  <td class="p-3 flex gap-1">
                    <button onclick="viewClosingReport(${ri})" class="text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded"><i data-lucide="eye" size="14"></i></button>
                    <button onclick="exportClosingToExcel(${ri})" class="text-green-600 text-xs bg-green-50 px-2 py-1 rounded"><i data-lucide="download" size="14"></i></button>
                    <button onclick="deleteClosing(${ri})" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" size="16"></i></button>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ${closings.length>0?`<div class="card p-5"><h3 class="text-lg font-bold mb-4">الرسم البياني للإقفالات</h3><div class="chart-container"><canvas id="closingChart"></canvas></div></div>`:''}
    </div>`;
    lucide.createIcons();
    if (closings.length > 0) setTimeout(drawClosingChart, 300);
};

function drawClosingChart() {
    const canvas = document.getElementById('closingChart');
    if (!canvas) return;
    const closings = db.monthlyClosings || [];
    const ctx = canvas.getContext('2d');
    if (canvas._chart) canvas._chart.destroy();
    canvas._chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: closings.map(c => c.period),
            datasets: [
                { label: 'الإيرادات', data: closings.map(c => c.revenue || 0), backgroundColor: 'rgba(5,150,105,0.6)', borderColor: '#059669', borderWidth: 1 },
                { label: 'المصروفات', data: closings.map(c => c.expenses || 0), backgroundColor: 'rgba(220,38,38,0.6)', borderColor: '#dc2626', borderWidth: 1 },
                { label: 'صافي الربح', data: closings.map(c => c.netIncome || 0), backgroundColor: 'rgba(26,115,232,0.6)', borderColor: '#1a73e8', borderWidth: 1 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { font: { family: 'Cairo' } } } }, scales: { y: { beginAtZero: true } } }
    });
}

function performMonthlyClosing() {
    const now = new Date();
    const period = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const totalRevenue = db.entries.filter(e => e.creditAccount === 'المبيعات' || e.type === 'customer').reduce((s, e) => s + (e.creditAmount || 0), 0);
    const totalExpenses = db.costs.reduce((s, c) => s + (c.amount || 0), 0);
    const netIncome = totalRevenue - totalExpenses;
    const closing = {
        period,
        revenue: totalRevenue,
        expenses: totalExpenses,
        netIncome,
        closedAt: new Date().toISOString(),
        customerBalance: db.customers.reduce((s, c) => s + (c.balance || 0), 0),
        supplierBalance: db.suppliers.reduce((s, s2) => s + (s2.balance || 0), 0),
        invValue: db.inventory.reduce((s, i) => s + ((i.costPrice || 0) * (i.quantity || 0)), 0),
        entryCount: db.entries.length,
        invoiceCount: db.invoices.length
    };
    db.monthlyClosings.push(closing);
    saveData();
    alert('تم الإقفال الشهري للفترة: ' + period);
    renderMonthlyClosing();
}

function viewClosingReport(index) {
    const c = db.monthlyClosings[index];
    if (!c) return;
    const overlay = document.getElementById('statement-overlay');
    const body = document.getElementById('statement-body');
    document.getElementById('statement-title').innerText = 'تقرير الإقفال: ' + c.period;
    body.innerHTML = `
    <div class="space-y-4">
      <div class="grid grid-cols-3 gap-3">
        <div class="stat-card text-center"><p class="text-xs">الإيرادات</p><h4 class="font-bold text-green-600">${(c.revenue||0).toFixed(2)}</h4></div>
        <div class="stat-card text-center"><p class="text-xs">المصروفات</p><h4 class="font-bold text-red-600">${(c.expenses||0).toFixed(2)}</h4></div>
        <div class="stat-card text-center"><p class="text-xs">صافي الربح</p><h4 class="font-bold">${(c.netIncome||0).toFixed(2)}</h4></div>
      </div>
      <table class="w-full text-right border">
        <thead><tr><th class="p-2">البند</th><th class="p-2">القيمة</th></tr></thead>
        <tbody>
          <tr><td>رصيد العملاء</td><td>${(c.customerBalance||0).toFixed(2)}</td></tr>
          <tr><td>رصيد الموردين</td><td>${(c.supplierBalance||0).toFixed(2)}</td></tr>
          <tr><td>قيمة المخزون</td><td>${(c.invValue||0).toFixed(2)}</td></tr>
          <tr><td>عدد القيود</td><td>${c.entryCount||0}</td></tr>
          <tr><td>عدد الفواتير</td><td>${c.invoiceCount||0}</td></tr>
          <tr><td>تاريخ الإقفال</td><td>${c.closedAt||'-'}</td></tr>
        </tbody>
      </table>
    </div>`;
    overlay.classList.remove('hidden');
    lucide.createIcons();
}

function exportClosingToExcel(index) {
    const c = db.monthlyClosings[index];
    if (!c) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
        "الفترة": c.period, "الإيرادات": c.revenue, "المصروفات": c.expenses, "صافي الربح": c.netIncome,
        "رصيد العملاء": c.customerBalance, "رصيد الموردين": c.supplierBalance, "قيمة المخزون": c.invValue, "تاريخ الإقفال": c.closedAt
    }]), "الإقفال الشهري");
    XLSX.writeFile(wb, "closing_report_" + c.period + ".xlsx");
}

function deleteClosing(index) {
    if (!confirm('هل أنت متأكد من حذف هذا الإقفال؟')) return;
    db.monthlyClosings.splice(index, 1);
    saveData();
    renderMonthlyClosing();
}