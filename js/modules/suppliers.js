// موديول الموردين

window.renderSuppliers = function() {
    const container = document.getElementById('suppliers');
    if (!container) return;
    container.innerHTML = `
    <div class="card p-5">
      <div class="section-title-bar">
        <h3 class="text-lg font-bold">قائمة الموردين</h3>
        <div class="flex gap-2 flex-wrap">
          <button onclick="downloadSuppliersTemplate()" class="bg-green-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-green-700"><i data-lucide="download" size="15"></i> تمبليت Excel</button>
          <button onclick="document.getElementById('suppliers-excel-upload').click()" class="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-blue-700"><i data-lucide="upload" size="15"></i> رفع Excel</button>
          <input type="file" id="suppliers-excel-upload" accept=".xlsx,.xls" class="hidden" onchange="handleSuppliersExcelUpload(event)">
          <button onclick="openAddSupplierModal()" class="btn-success flex items-center gap-2 text-sm"><i data-lucide="plus" size="17"></i> إضافة مورد</button>
        </div>
      </div>
      <div class="overflow-x-auto"><table class="w-full text-right"><thead><tr><th class="p-3">الكود</th><th class="p-3">اسم المورد</th><th class="p-3">الشركة</th><th class="p-3">الرصيد</th><th class="p-3">الإجراءات</th></tr></thead>
      <tbody>${db.suppliers.length===0?'<tr><td colspan="5" class="p-4 text-center text-gray-400">لا يوجد موردين</td></tr>':db.suppliers.map((s,i)=>`<tr class="border-b hover:bg-gray-50"><td class="p-3 font-mono text-green-600 text-sm">${s.code||'-'}</td><td class="p-3 font-semibold">${s.name}</td><td class="p-3 text-sm">${s.company||'-'}</td><td class="p-3 font-bold text-red-600">${(s.balance||0).toFixed(2)}</td><td class="p-3 flex gap-1 flex-wrap"><button onclick="viewSupplierStatement(${i})" class="text-green-600 hover:text-green-800 text-xs bg-green-50 px-2 py-1 rounded flex items-center gap-1"><i data-lucide="file-search" size="14"></i> كشف</button><button onclick="editSupplier(${i})" class="text-orange-500 hover:text-orange-700 text-xs bg-orange-50 px-2 py-1 rounded flex items-center gap-1"><i data-lucide="pencil" size="14"></i> تعديل</button><button onclick="deleteSupplier(${i})" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" size="16"></i></button></td></tr>`).join('')}</tbody></table></div>
    </div>`;
    lucide.createIcons();
};

function openAddSupplierModal() {
    document.getElementById('modal-title').innerText = 'إضافة مورد جديد';
    document.getElementById('modal-content').className = 'bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden';
    document.getElementById('modal-body').innerHTML = `<div class="space-y-3"><div class="grid grid-cols-2 gap-3"><div><label>الكود</label><input id="f-code" class="w-full"></div><div><label>الاسم</label><input id="f-name" class="w-full"></div></div><div><label>الشركة</label><input id="f-company" class="w-full"></div><div class="grid grid-cols-2 gap-3"><div><label>طريقة التعامل</label><select id="f-trans-type" class="w-full"><option>آجل</option><option>كاش</option></select></div><div><label>نظام السداد</label><input id="f-pay-system" class="w-full"></div></div><div><label>الرصيد الافتتاحي</label><input id="f-balance" class="w-full" type="number" value="0" step="0.01"></div></div>`;
    document.getElementById('modal-save-btn').onclick = () => {
        const name = document.getElementById('f-name').value.trim();
        const code = document.getElementById('f-code').value.trim();
        if (!name || !code) { alert('الكود والاسم مطلوبان'); return; }
        db.suppliers.push({ code, name, company: document.getElementById('f-company').value.trim(), transactionType: document.getElementById('f-trans-type').value, paymentSystem: document.getElementById('f-pay-system').value.trim(), openingBalance: parseFloat(document.getElementById('f-balance').value) || 0, balance: parseFloat(document.getElementById('f-balance').value) || 0 });
        saveData(); closeModal(); renderSuppliers();
    };
    document.getElementById('modal-overlay').classList.remove('hidden');
    lucide.createIcons();
}

function editSupplier(index) {
    const s = db.suppliers[index]; if (!s) return;
    document.getElementById('modal-title').innerText = 'تعديل بيانات المورد';
    document.getElementById('modal-content').className = 'bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden';
    document.getElementById('modal-body').innerHTML = `<div class="space-y-3"><div class="grid grid-cols-2 gap-3"><div><label>كود المورد</label><input id="f-code" class="w-full" type="text" value="${s.code||''}"></div><div><label>اسم المورد</label><input id="f-name" class="w-full" type="text" value="${s.name||''}"></div></div><div><label>اسم الشركة</label><input id="f-company" class="w-full" type="text" value="${s.company||''}"></div><div class="grid grid-cols-2 gap-3"><div><label>طريقة التعامل</label><select id="f-trans-type" class="w-full"><option ${s.transactionType==='آجل'?'selected':''}>آجل</option><option ${s.transactionType==='كاش'?'selected':''}>كاش</option></select></div><div><label>نظام السداد</label><input id="f-pay-system" class="w-full" type="text" value="${s.paymentSystem||''}"></div></div><div><label>الرصيد الافتتاحي</label><input id="f-balance" class="w-full" type="number" value="${s.openingBalance||0}" step="0.01"></div></div>`;
    document.getElementById('modal-save-btn').onclick = () => {
        s.code = document.getElementById('f-code').value.trim(); s.name = document.getElementById('f-name').value.trim(); s.company = document.getElementById('f-company').value.trim(); s.transactionType = document.getElementById('f-trans-type').value; s.paymentSystem = document.getElementById('f-pay-system').value.trim(); const newOpening = parseFloat(document.getElementById('f-balance').value) || 0; const diff = newOpening - (s.openingBalance || 0); s.openingBalance = newOpening; s.balance = (s.balance || 0) + diff;
        saveData(); closeModal(); renderSuppliers();
    };
    document.getElementById('modal-overlay').classList.remove('hidden');
    lucide.createIcons();
}

function deleteSupplier(index) { if (!confirm('هل تريد حذف هذا المورد؟')) return; db.suppliers.splice(index, 1); saveData(); renderSuppliers(); }

function viewSupplierStatement(supplierIndex) {
    const supplier = db.suppliers[supplierIndex]; if (!supplier) return;
    const overlay = document.getElementById('statement-overlay'); const body = document.getElementById('statement-body');
    document.getElementById('statement-title').innerText = 'كشف حساب مورد: ' + supplier.name;
    const purchaseInvoices = db.invoices.filter(inv => inv.type === 'purchase' && inv.supplierId === supplierIndex);
    const supplierPayments = db.payments.filter(p => p.paymentType === 'supplier' && p.entityId === supplierIndex);
    let allTransactions = [];
    purchaseInvoices.forEach(inv => allTransactions.push({ date: inv.date, desc: 'فاتورة مشتريات #' + (inv.invoiceNumber || inv.id), debit: 0, credit: inv.total || 0, type: 'invoice' }));
    supplierPayments.forEach(p => allTransactions.push({ date: p.date, desc: p.description || 'سداد', debit: p.amount || 0, credit: 0, type: 'payment' }));
    allTransactions.sort((a, b) => a.date.localeCompare(b.date));
    let runningBalance = supplier.openingBalance || 0;
    const totalDebit = allTransactions.reduce((s, t) => s + t.debit, 0);
    const totalCredit = allTransactions.reduce((s, t) => s + t.credit, 0);
    const finalBalance = (supplier.openingBalance || 0) - totalDebit + totalCredit;
    body.innerHTML = `<div class="space-y-4"><div class="grid grid-cols-4 gap-3"><div class="stat-card text-center"><p class="text-xs text-gray-500">المورد</p><h4 class="font-bold">${supplier.name}</h4></div><div class="stat-card text-center"><p class="text-xs text-gray-500">الرصيد الافتتاحي</p><h4 class="font-bold">${(supplier.openingBalance||0).toFixed(2)}</h4></div><div class="stat-card text-center"><p class="text-xs text-gray-500">الرصيد الحالي</p><h4 class="font-bold ${finalBalance>=0?'text-red-600':'text-green-600'}">${finalBalance.toFixed(2)}</h4></div></div><table class="w-full text-right border rounded-lg"><thead><tr><th class="p-2">التاريخ</th><th class="p-2">البيان</th><th class="p-2">مدين</th><th class="p-2">دائن</th><th class="p-2">الرصيد</th></tr></thead><tbody><tr class="bg-gray-50"><td>-</td><td>رصيد افتتاحي</td><td>-</td><td>-</td><td class="font-bold">${(supplier.openingBalance||0).toFixed(2)}</td></tr>${allTransactions.map(t=>{runningBalance=runningBalance-t.debit+t.credit;return`<tr class="border-b ${t.debit>0?'debit-row':'credit-row'}"><td>${t.date}</td><td>${t.desc}</td><td class="statement-debit">${t.debit>0?t.debit.toFixed(2):'-'}</td><td class="statement-credit">${t.credit>0?t.credit.toFixed(2):'-'}</td><td class="font-bold">${runningBalance.toFixed(2)}</td></tr>`;}).join('')}<tr class="bg-gray-100 font-bold"><td colspan="2">الإجماليات</td><td class="text-red-600">${totalDebit.toFixed(2)}</td><td class="text-green-600">${totalCredit.toFixed(2)}</td><td>${finalBalance.toFixed(2)}</td></tr></tbody></table></div>`;
    overlay.classList.remove('hidden');
    lucide.createIcons();
}

function downloadSuppliersTemplate() {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ "الكود": "S001", "اسم المورد": "مورد تجريبي", "الشركة": "شركة التوريد", "طريقة التعامل": "آجل", "نظام السداد": "شهري", "الرصيد": 0 }]), "الموردين");
    XLSX.writeFile(wb, "suppliers_template.xlsx");
}

function handleSuppliersExcelUpload(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { const data = new Uint8Array(e.target.result); const workbook = XLSX.read(data, { type: 'array' }); let count = 0; if (workbook.Sheets["الموردين"]) { XLSX.utils.sheet_to_json(workbook.Sheets["الموردين"]).forEach(row => { if (row["اسم المورد"] && row["الكود"]) { db.suppliers.push({ code: row["الكود"], name: row["اسم المورد"], company: row["الشركة"] || '', transactionType: row["طريقة التعامل"] || 'آجل', paymentSystem: row["نظام السداد"] || '', openingBalance: parseFloat(row["الرصيد"]) || 0, balance: parseFloat(row["الرصيد"]) || 0 }); count++; } }); } saveData(); alert('تم استيراد ' + count + ' مورد بنجاح!'); renderSuppliers(); event.target.value = ''; };
    reader.readAsArrayBuffer(file);
}