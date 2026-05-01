// =============================================
//  موديول العملاء - ERP System v3.5
// =============================================

// دالة عرض واجهة العملاء الرئيسية
window.renderCustomers = function() {
    const container = document.getElementById('customers');
    if (!container) return;
    container.innerHTML = `
    <div class="card p-5">
      <div class="section-title-bar">
        <h3 class="text-lg font-bold">قائمة العملاء</h3>
        <div class="flex gap-2 flex-wrap">
          <button id="btn-download-template" class="bg-green-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-green-700"><i data-lucide="download" size="15"></i> تمبليت Excel</button>
          <button id="btn-excel-upload" class="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-blue-700"><i data-lucide="upload" size="15"></i> رفع Excel</button>
          <input type="file" id="customers-excel-upload" accept=".xlsx,.xls" class="hidden">
          <button id="btn-add-customer" class="btn-primary flex items-center gap-2 text-sm"><i data-lucide="plus" size="17"></i> إضافة عميل</button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-right">
          <thead><tr><th class="p-3">الكود</th><th class="p-3">الاسم</th><th class="p-3">الهاتف</th><th class="p-3">النوع</th><th class="p-3">الرصيد</th><th class="p-3">الإجراءات</th></tr></thead>
          <tbody id="customers-tbody">
            ${db.customers.length === 0 
              ? '<tr><td colspan="6" class="p-4 text-center text-gray-400">لا يوجد عملاء</td></tr>'
              : db.customers.map((c, i) => customerRow(c, i)).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
    lucide.createIcons();
    // ربط الأحداث
    document.getElementById('btn-add-customer').onclick = openAddCustomerModal;
    document.getElementById('btn-download-template').onclick = downloadCustomersTemplate;
    document.getElementById('btn-excel-upload').onclick = () => document.getElementById('customers-excel-upload').click();
    document.getElementById('customers-excel-upload').onchange = handleCustomersExcelUpload;
};

// تنسيق صف العميل
function customerRow(c, i) {
    return `<tr class="border-b hover:bg-gray-50">
        <td class="p-3 font-mono text-blue-600 text-sm">${c.code || '-'}</td>
        <td class="p-3 font-semibold">${c.name}</td>
        <td class="p-3 text-sm">${c.phone || '-'}</td>
        <td class="p-3 text-sm">${c.customerType || '-'}</td>
        <td class="p-3 font-bold ${(c.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}">${(c.balance || 0).toFixed(2)}</td>
        <td class="p-3 flex gap-1 flex-wrap">
            <button onclick="viewCustomerStatement(${i})" class="text-blue-600 hover:text-blue-800 text-xs bg-blue-50 px-2 py-1 rounded flex items-center gap-1"><i data-lucide="file-search" size="14"></i> كشف</button>
            <button onclick="editCustomer(${i})" class="text-orange-500 hover:text-orange-700 text-xs bg-orange-50 px-2 py-1 rounded flex items-center gap-1"><i data-lucide="pencil" size="14"></i> تعديل</button>
            <button onclick="deleteCustomer(${i})" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" size="16"></i></button>
        </td>
    </tr>`;
}

// إضافة عميل جديد
function openAddCustomerModal() {
    const overlay = document.getElementById('modal-overlay');
    const body = document.getElementById('modal-body');
    document.getElementById('modal-title').innerText = 'إضافة عميل جديد';
    document.getElementById('modal-content').className = 'bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden';
    document.getElementById('modal-save-btn').onclick = () => {
        const name = document.getElementById('f-name').value.trim();
        const code = document.getElementById('f-code').value.trim();
        if (!name || !code) { alert('الكود والاسم مطلوبان'); return; }
        db.customers.push({ 
            code, name, 
            phone: document.getElementById('f-phone').value.trim(),
            openingBalance: parseFloat(document.getElementById('f-balance').value) || 0,
            balance: parseFloat(document.getElementById('f-balance').value) || 0,
            customerType: document.getElementById('f-cust-type').value,
            segment: 'A',
            paymentMethod: document.getElementById('f-pay-method').value,
            paymentPeriod: document.getElementById('f-pay-period').value.trim(),
            taxCard: '', taxName: '', responsiblePerson: '', salesRep: '' 
        });
        saveData();
        closeModal();
        renderCustomers();
    };
    body.innerHTML = `
        <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
                <div><label>الكود</label><input id="f-code" class="w-full"></div>
                <div><label>الاسم</label><input id="f-name" class="w-full"></div>
            </div>
            <div><label>الهاتف</label><input id="f-phone" class="w-full"></div>
            <div class="grid grid-cols-2 gap-3">
                <div><label>الرصيد الافتتاحي</label><input id="f-balance" class="w-full" type="number" value="0" step="0.01"></div>
                <div><label>النوع</label><select id="f-cust-type" class="w-full"><option>تجزئة</option><option>جملة</option><option>موزع</option></select></div>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div><label>طريقة السداد</label><select id="f-pay-method" class="w-full"><option>نقدي</option><option>آجل</option></select></div>
                <div><label>فترة السداد</label><input id="f-pay-period" class="w-full" placeholder="30 يوم"></div>
            </div>
        </div>`;
    overlay.classList.remove('hidden');
    lucide.createIcons();
}

// تعديل عميل
function editCustomer(index) {
    const c = db.customers[index];
    if (!c) return;
    const overlay = document.getElementById('modal-overlay');
    const body = document.getElementById('modal-body');
    document.getElementById('modal-title').innerText = 'تعديل بيانات العميل';
    document.getElementById('modal-content').className = 'bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden';
    body.innerHTML = `
        <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
                <div><label>كود العميل</label><input id="f-code" class="w-full" type="text" value="${c.code||''}"></div>
                <div><label>اسم العميل</label><input id="f-name" class="w-full" type="text" value="${c.name||''}"></div>
            </div>
            <div><label>رقم الهاتف</label><input id="f-phone" class="w-full" type="text" value="${c.phone||''}"></div>
            <div class="grid grid-cols-2 gap-3">
                <div><label>الرصيد الافتتاحي</label><input id="f-balance" class="w-full" type="number" value="${c.openingBalance||0}" step="0.01"></div>
                <div><label>نوع العميل</label><select id="f-cust-type" class="w-full"><option ${c.customerType==='تجزئة'?'selected':''}>تجزئة</option><option ${c.customerType==='جملة'?'selected':''}>جملة</option><option ${c.customerType==='موزع'?'selected':''}>موزع</option></select></div>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div><label>طريقة السداد</label><select id="f-pay-method" class="w-full"><option ${c.paymentMethod==='نقدي'?'selected':''}>نقدي</option><option ${c.paymentMethod==='آجل'?'selected':''}>آجل</option></select></div>
                <div><label>فترة السداد</label><input id="f-pay-period" class="w-full" type="text" value="${c.paymentPeriod||''}"></div>
            </div>
        </div>`;
    document.getElementById('modal-save-btn').onclick = () => {
        c.code = document.getElementById('f-code').value.trim();
        c.name = document.getElementById('f-name').value.trim();
        c.phone = document.getElementById('f-phone').value.trim();
        c.customerType = document.getElementById('f-cust-type').value;
        c.paymentMethod = document.getElementById('f-pay-method').value;
        c.paymentPeriod = document.getElementById('f-pay-period').value.trim();
        const newOpening = parseFloat(document.getElementById('f-balance').value) || 0;
        const diff = newOpening - (c.openingBalance || 0);
        c.openingBalance = newOpening;
        c.balance = (c.balance || 0) + diff;
        saveData();
        closeModal();
        renderCustomers();
    };
    overlay.classList.remove('hidden');
    lucide.createIcons();
}

// حذف عميل
function deleteCustomer(index) {
    if (!confirm('هل تريد حذف هذا العميل؟')) return;
    db.customers.splice(index, 1);
    saveData();
    renderCustomers();
}

// استيراد/تصدير Excel
function downloadCustomersTemplate() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([{ "الكود": "C001", "الاسم": "عميل تجريبي", "الهاتف": "0123456789", "الرصيد": 0, "النوع": "تجزئة", "الشريحة": "A", "طريقة السداد": "آجل", "فترة السداد": "30 يوم" }]);
    XLSX.utils.book_append_sheet(wb, ws, "العملاء");
    XLSX.writeFile(wb, "customers_template.xlsx");
}

function handleCustomersExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        let count = 0;
        if (workbook.Sheets["العملاء"]) {
            XLSX.utils.sheet_to_json(workbook.Sheets["العملاء"]).forEach(row => {
                if (row["الاسم"] && row["الكود"]) {
                    db.customers.push({ code: row["الكود"], name: row["الاسم"], phone: row["الهاتف"] || '',
                        openingBalance: parseFloat(row["الرصيد"]) || 0, balance: parseFloat(row["الرصيد"]) || 0,
                        customerType: row["النوع"] || 'تجزئة', segment: row["الشريحة"] || 'A',
                        paymentMethod: row["طريقة السداد"] || 'نقدي', paymentPeriod: row["فترة السداد"] || '',
                        taxCard: '', taxName: '', responsiblePerson: '', salesRep: '' });
                    count++;
                }
            });
        }
        saveData();
        alert('تم استيراد ' + count + ' عميل بنجاح!');
        renderCustomers();
        event.target.value = '';
    };
    reader.readAsArrayBuffer(file);
}

// كشف حساب العميل
function viewCustomerStatement(customerIndex) {
    const customer = db.customers[customerIndex];
    if (!customer) return;
    const overlay = document.getElementById('statement-overlay');
    const body = document.getElementById('statement-body');
    document.getElementById('statement-title').innerText = 'كشف حساب عميل: ' + customer.name;
    const saleInvoices = db.invoices.filter(inv => inv.type === 'sale' && inv.customerId === customerIndex);
    const customerPayments = db.payments.filter(p => p.paymentType === 'customer' && p.entityId === customerIndex);
    let allTransactions = [];
    saleInvoices.forEach(inv => allTransactions.push({ date: inv.date, desc: 'فاتورة مبيعات #' + (inv.invoiceNumber || inv.id), debit: inv.total || 0, credit: 0, type: 'invoice' }));
    customerPayments.forEach(p => allTransactions.push({ date: p.date, desc: p.description || 'تحصيل', debit: 0, credit: p.amount || 0, type: 'payment' }));
    allTransactions.sort((a, b) => a.date.localeCompare(b.date));
    let runningBalance = customer.openingBalance || 0;
    const totalDebit = allTransactions.reduce((s, t) => s + t.debit, 0);
    const totalCredit = allTransactions.reduce((s, t) => s + t.credit, 0);
    const finalBalance = (customer.openingBalance || 0) + totalDebit - totalCredit;
    body.innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-4 gap-3">
                <div class="stat-card text-center"><p class="text-xs text-gray-500">العميل</p><h4 class="font-bold">${customer.name}</h4></div>
                <div class="stat-card text-center"><p class="text-xs text-gray-500">الرصيد الافتتاحي</p><h4 class="font-bold">${(customer.openingBalance || 0).toFixed(2)}</h4></div>
                <div class="stat-card text-center"><p class="text-xs text-gray-500">الرصيد الحالي</p><h4 class="font-bold ${finalBalance >= 0 ? 'text-green-600' : 'text-red-600'}">${finalBalance.toFixed(2)}</h4></div>
            </div>
            <table class="w-full text-right border rounded-lg">
                <thead><tr><th class="p-2">التاريخ</th><th class="p-2">البيان</th><th class="p-2">مدين</th><th class="p-2">دائن</th><th class="p-2">الرصيد</th></tr></thead>
                <tbody>
                    <tr class="bg-gray-50"><td>-</td><td>رصيد افتتاحي</td><td>-</td><td>-</td><td class="font-bold">${(customer.openingBalance || 0).toFixed(2)}</td></tr>
                    ${allTransactions.map(t => {
                        runningBalance += t.debit - t.credit;
                        return `<tr class="border-b ${t.debit > 0 ? 'debit-row' : 'credit-row'}"><td>${t.date}</td><td>${t.desc}</td><td class="statement-debit">${t.debit > 0 ? t.debit.toFixed(2) : '-'}</td><td class="statement-credit">${t.credit > 0 ? t.credit.toFixed(2) : '-'}</td><td class="font-bold">${runningBalance.toFixed(2)}</td></tr>`;
                    }).join('')}
                    <tr class="bg-gray-100 font-bold"><td colspan="2">الإجماليات</td><td class="text-red-600">${totalDebit.toFixed(2)}</td><td class="text-green-600">${totalCredit.toFixed(2)}</td><td>${finalBalance.toFixed(2)}</td></tr>
                </tbody>
            </table>
        </div>`;
    overlay.classList.remove('hidden');
    lucide.createIcons();
}