// موديول التكاليف والتقارير

window.renderCosts = function() {
    const container = document.getElementById('costs');
    if (!container) return;
    const totalCosts = db.costs.reduce((s, c) => s + (c.amount || 0), 0);
    container.innerHTML = `
    <div class="space-y-5">
      <div class="card p-5">
        <div class="section-title-bar">
          <h3 class="text-lg font-bold">التكاليف والمصروفات</h3>
          <div class="flex gap-2 flex-wrap">
            <button onclick="openAddCostModal()" class="bg-purple-600 text-white px-4 py-2.5 rounded-xl text-sm hover:bg-purple-700"><i data-lucide="plus" size="17"></i> إضافة</button>
            <button onclick="downloadCostsTemplate()" class="bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm hover:bg-green-700"><i data-lucide="download" size="17"></i> Excel</button>
            <button onclick="document.getElementById('costs-excel-upload').click()" class="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm hover:bg-blue-700"><i data-lucide="upload" size="17"></i> رفع</button>
            <input type="file" id="costs-excel-upload" accept=".xlsx,.xls" class="hidden" onchange="handleCostsExcelUpload(event)">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-5">
          <div class="stat-card"><p class="text-xs text-gray-500">إجمالي التكاليف</p><h4 class="text-xl font-bold text-purple-600">${totalCosts.toFixed(2)}</h4></div>
          <div class="stat-card"><p class="text-xs text-gray-500">عدد البنود</p><h4 class="text-xl font-bold">${db.costs.length}</h4></div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-right">
            <thead><tr><th class="p-3">التاريخ</th><th class="p-3">البند</th><th class="p-3">الفئة</th><th class="p-3">المبلغ</th><th class="p-3">إجراءات</th></tr></thead>
            <tbody>
              ${db.costs.length===0?'<tr><td colspan="5" class="p-4 text-center text-gray-400">لا توجد تكاليف</td></tr>':
              db.costs.map((c,i)=>`<tr class="border-b hover:bg-gray-50"><td class="p-2 text-sm">${c.date}</td><td class="p-2">${c.productName||c.category||'-'}</td><td class="p-2 text-sm">${c.category||'عام'}</td><td class="p-2 font-bold text-red-600">${(c.amount||0).toFixed(2)}</td><td class="p-2"><button onclick="deleteCost(${i})" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" size="16"></i></button></td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
    lucide.createIcons();
};

function openAddCostModal() {
    document.getElementById('modal-title').innerText = 'تسجيل تكلفة';
    document.getElementById('modal-content').className = 'bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden';
    document.getElementById('modal-body').innerHTML = `
    <div class="space-y-3">
      <div><label>الفئة</label><input id="f-cat" class="w-full"></div>
      <div><label>المنتج</label><select id="f-prod-name" class="w-full"><option value="">-- عام --</option>${db.inventory.map(i=>`<option>${i.name}</option>`).join('')}</select></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label>المبلغ</label><input id="f-amount" class="w-full" type="number" value="0" step="0.01"></div>
        <div><label>التاريخ</label><input id="f-date" class="w-full" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
      </div>
      <div><label>ملاحظات</label><textarea id="f-notes" class="w-full" rows="2"></textarea></div>
    </div>`;
    document.getElementById('modal-save-btn').onclick = () => {
        const amount = parseFloat(document.getElementById('f-amount').value) || 0;
        if (amount <= 0) { alert('المبلغ مطلوب'); return; }
        db.costs.push({
            category: document.getElementById('f-cat').value.trim() || 'عام',
            productName: document.getElementById('f-prod-name').value,
            amount,
            date: document.getElementById('f-date').value,
            notes: document.getElementById('f-notes').value.trim()
        });
        saveData(); closeModal(); renderCosts();
    };
    document.getElementById('modal-overlay').classList.remove('hidden');
    lucide.createIcons();
}

function deleteCost(index) {
    if (!confirm('هل تريد حذف هذا البند؟')) return;
    db.costs.splice(index, 1);
    saveData(); renderCosts();
}

function downloadCostsTemplate() {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ "التاريخ": "2026-01-01", "الفئة": "مواد خام", "المنتج": "منتج أ", "المبلغ": 500, "ملاحظات": "تكلفة" }]), "التكاليف");
    XLSX.writeFile(wb, "costs_template.xlsx");
}

function handleCostsExcelUpload(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        let imported = 0;
        if (workbook.Sheets["التكاليف"]) {
            XLSX.utils.sheet_to_json(workbook.Sheets["التكاليف"]).forEach(row => {
                if (row["المبلغ"] && parseFloat(row["المبلغ"]) > 0) {
                    db.costs.push({
                        date: row["التاريخ"] || new Date().toISOString().split('T')[0],
                        category: row["الفئة"] || 'عام',
                        productName: row["المنتج"] || '',
                        amount: parseFloat(row["المبلغ"]) || 0,
                        notes: row["ملاحظات"] || ''
                    });
                    imported++;
                }
            });
        }
        if (imported > 0) { saveData(); alert('تم استيراد ' + imported + ' بند'); renderCosts(); }
        else alert('لم يتم العثور على بيانات.');
        event.target.value = '';
    };
    reader.readAsArrayBuffer(file);
}