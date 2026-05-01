// موديول الفواتير

window.renderInvoices = function() {
    const container = document.getElementById('invoices');
    if (!container) return;
    const saleInvoices = db.invoices.filter(inv => inv.type === 'sale');
    const purchaseInvoices = db.invoices.filter(inv => inv.type === 'purchase');
    container.innerHTML = `
    <div class="space-y-5">
      <div class="card p-5"><div class="section-title-bar"><h3 class="text-lg font-bold">فواتير المبيعات</h3><button onclick="openInvoiceModal('sale')" class="btn-primary flex items-center gap-2 text-sm"><i data-lucide="plus" size="17"></i> فاتورة مبيعات</button></div>
      <div class="overflow-x-auto"><table class="w-full text-right"><thead><tr><th class="p-3">رقم</th><th class="p-3">التاريخ</th><th class="p-3">العميل</th><th class="p-3">الإجمالي</th><th class="p-3">الربح</th><th class="p-3">إجراءات</th></tr></thead>
      <tbody>${saleInvoices.length===0?'<tr><td colspan="6" class="p-4 text-center text-gray-400">لا توجد فواتير</td></tr>':saleInvoices.slice().reverse().map(inv=>{const cn=inv.customerId!=null&&db.customers[inv.customerId]?db.customers[inv.customerId].name:'غير معروف';const profit=(inv.total||0)-(inv.totalCost||0);return`<tr class="border-b hover:bg-gray-50"><td class="p-3 text-blue-600 font-semibold">${inv.invoiceNumber||'#'+inv.id}</td><td class="p-3 text-sm">${inv.date}</td><td class="p-3">${cn}</td><td class="p-3 font-bold text-green-600">${(inv.total||0).toFixed(2)}</td><td class="p-3 font-bold ${profit>=0?'text-green-600':'text-red-600'}">${profit.toFixed(2)}</td><td class="p-3 flex gap-1 flex-wrap"><button onclick="viewInvoicePDF(${inv.id})" class="text-purple-600 hover:text-purple-800 text-xs bg-purple-50 px-2 py-1 rounded flex items-center gap-1"><i data-lucide="file-text" size="14"></i> PDF</button><button onclick="deleteInvoice(${inv.id})" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" size="16"></i></button></td></tr>`;}).join('')}</tbody></table></div></div>
      <div class="card p-5"><div class="section-title-bar"><h3 class="text-lg font-bold">فواتير المشتريات</h3><button onclick="openInvoiceModal('purchase')" class="btn-success flex items-center gap-2 text-sm"><i data-lucide="plus" size="17"></i> فاتورة مشتريات</button></div>
      <div class="overflow-x-auto"><table class="w-full text-right"><thead><tr><th class="p-3">رقم</th><th class="p-3">التاريخ</th><th class="p-3">المورد</th><th class="p-3">الإجمالي</th><th class="p-3">إجراءات</th></tr></thead>
      <tbody>${purchaseInvoices.length===0?'<tr><td colspan="5" class="p-4 text-center text-gray-400">لا توجد فواتير</td></tr>':purchaseInvoices.slice().reverse().map(inv=>{const sn=inv.supplierId!=null&&db.suppliers[inv.supplierId]?db.suppliers[inv.supplierId].name:'غير معروف';return`<tr class="border-b hover:bg-gray-50"><td class="p-3 text-green-600 font-semibold">${inv.invoiceNumber||'#'+inv.id}</td><td class="p-3 text-sm">${inv.date}</td><td class="p-3">${sn}</td><td class="p-3 font-bold text-red-600">${(inv.total||0).toFixed(2)}</td><td class="p-3 flex gap-1 flex-wrap"><button onclick="viewInvoicePDF(${inv.id})" class="text-purple-600 hover:text-purple-800 text-xs bg-purple-50 px-2 py-1 rounded flex items-center gap-1"><i data-lucide="file-text" size="14"></i> PDF</button><button onclick="deleteInvoice(${inv.id})" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" size="16"></i></button></td></tr>`;}).join('')}</tbody></table></div></div>
    </div>`;
    lucide.createIcons();
};

let currentInvoiceType = 'sale';

function openInvoiceModal(type) {
    currentInvoiceType = type;
    const isSale = type === 'sale';
    document.getElementById('modal-content').className = 'bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden';
    document.getElementById('modal-title').innerText = isSale ? 'فاتورة مبيعات جديدة' : 'فاتورة مشتريات جديدة';
    const entityOptions = isSale ? db.customers.map((c, i) => `<option value="${i}">${c.name} (${c.code||'-'})</option>`).join('') : db.suppliers.map((s, i) => `<option value="${i}">${s.name} (${s.code||'-'})</option>`).join('');
    document.getElementById('modal-body').innerHTML = `
    <div class="space-y-5">
      <div class="grid grid-cols-4 gap-3"><div><label>رقم الفاتورة</label><input id="inv-number" type="text" class="w-full"></div><div><label>${isSale?'العميل':'المورد'}</label><select id="inv-entity" class="w-full"><option value="">-- اختر --</option>${entityOptions}</select></div><div><label>التاريخ</label><input id="inv-date" type="date" class="w-full" value="${new Date().toISOString().split('T')[0]}"></div><div><label>البيان</label><input id="inv-desc" type="text" class="w-full"></div></div>
      <div><div class="flex justify-between items-center mb-2"><label>الأصناف</label><button type="button" onclick="addInvoiceItemRow()" class="text-blue-600 hover:text-blue-800 text-sm font-semibold bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1"><i data-lucide="plus-circle" size="15"></i> إضافة صنف</button></div>
      <div id="invoice-items-container" class="space-y-2 border rounded-xl p-3 bg-gray-50 min-h-[70px]"><p id="no-items-msg" class="text-center text-gray-400 py-4">اضغط "إضافة صنف" للبدء.</p></div>
      <div class="grid grid-cols-3 gap-3 mt-4 bg-slate-100 p-4 rounded-xl"><div><span class="text-sm text-gray-600">الإجمالي:</span><span id="inv-grand-total" class="font-bold text-xl text-blue-700 block">0.00</span></div><div><span class="text-sm text-gray-600">التكلفة:</span><span id="inv-total-cost" class="font-bold text-xl text-gray-600 block">0.00</span></div><div><span class="text-sm text-gray-600">الربح:</span><span id="inv-total-profit" class="font-bold text-xl block" style="color:#059669">0.00</span></div></div></div>
    </div>`;
    document.getElementById('modal-save-btn').onclick = saveInvoiceFromModal;
    document.getElementById('modal-overlay').classList.remove('hidden');
    lucide.createIcons();
}

function addInvoiceItemRow() {
    const container = document.getElementById('invoice-items-container');
    const noMsg = document.getElementById('no-items-msg');
    if (noMsg) noMsg.remove();
    const invOptions = db.inventory.map((item, i) => `<option value="${i}">${item.name} (${getProductTypeName(item.productType)}) - مخزون: ${item.quantity} - تكلفة: ${(item.costPrice||0).toFixed(2)}</option>`).join('');
    const row = document.createElement('div');
    row.className = 'invoice-item-row flex flex-wrap md:flex-nowrap gap-2 items-center bg-white p-3 rounded-xl border';
    row.innerHTML = `
    <select onchange="updateInvoiceItemPrice(this)" class="flex-1 min-w-[160px] p-2 border rounded-lg inv-item-select text-sm"><option value="">-- اختر الصنف --</option>${invOptions}</select>
    <input type="number" placeholder="الكمية" min="1" value="1" onchange="updateInvoiceLineTotal(this)" class="w-20 p-2 border rounded-lg inv-qty text-sm text-center">
    <input type="number" placeholder="سعر" min="0" step="0.01" value="0" onchange="updateInvoiceLineTotal(this)" class="w-24 p-2 border rounded-lg inv-price text-sm text-center">
    <span class="inv-line-cost text-gray-500 w-20 text-center text-xs hidden">0.00</span>
    <span class="inv-line-total font-bold text-green-600 w-24 text-center text-sm">0.00</span>
    <button onclick="removeInvoiceItemRow(this)" class="text-red-500 hover:text-red-700 p-1"><i data-lucide="trash-2" size="16"></i></button>`;
    container.appendChild(row);
    lucide.createIcons();
    calculateInvoiceGrandTotal();
}

function removeInvoiceItemRow(btn) {
    btn.closest('.invoice-item-row').remove();
    calculateInvoiceGrandTotal();
    const container = document.getElementById('invoice-items-container');
    if (container && container.querySelectorAll('.invoice-item-row').length === 0) {
        const noMsg = document.createElement('p'); noMsg.id = 'no-items-msg'; noMsg.className = 'text-center text-gray-400 py-4'; noMsg.innerText = 'اضغط "إضافة صنف" للبدء.'; container.appendChild(noMsg);
    }
}

function updateInvoiceItemPrice(selectEl) {
    const row = selectEl.closest('.invoice-item-row');
    const index = parseInt(selectEl.value);
    const priceInput = row.querySelector('.inv-price');
    const costSpan = row.querySelector('.inv-line-cost');
    if (!isNaN(index) && db.inventory[index]) {
        priceInput.value = db.inventory[index].sellingPrice || db.inventory[index].costPrice || 0;
        costSpan.innerText = (db.inventory[index].costPrice || 0).toFixed(2);
        costSpan.setAttribute('data-cost', db.inventory[index].costPrice || 0);
    }
    updateInvoiceLineTotal(row.querySelector('.inv-qty'));
}

function updateInvoiceLineTotal(inputEl) {
    const row = inputEl.closest('.invoice-item-row');
    const qty = parseFloat(row.querySelector('.inv-qty').value) || 0;
    const price = parseFloat(row.querySelector('.inv-price').value) || 0;
    row.querySelector('.inv-line-total').innerText = (qty * price).toFixed(2);
    calculateInvoiceGrandTotal();
}

function calculateInvoiceGrandTotal() {
    const totals = document.querySelectorAll('.inv-line-total');
    const costSpans = document.querySelectorAll('.inv-line-cost');
    let grandTotal = 0, totalCost = 0;
    totals.forEach(el => { grandTotal += parseFloat(el.innerText) || 0; });
    costSpans.forEach(el => { const row = el.closest('.invoice-item-row'); if (row) { const qty = parseFloat(row.querySelector('.inv-qty').value) || 0; totalCost += (parseFloat(el.getAttribute('data-cost')) || 0) * qty; } });
    const totalProfit = grandTotal - totalCost;
    const gtEl = document.getElementById('inv-grand-total'); const tcEl = document.getElementById('inv-total-cost'); const tpEl = document.getElementById('inv-total-profit');
    if (gtEl) gtEl.innerText = grandTotal.toFixed(2);
    if (tcEl) tcEl.innerText = totalCost.toFixed(2);
    if (tpEl) { tpEl.innerText = totalProfit.toFixed(2); tpEl.style.color = totalProfit >= 0 ? '#059669' : '#dc2626'; }
}

function saveInvoiceFromModal() {
    const isSale = currentInvoiceType === 'sale';
    const invoiceNumber = document.getElementById('inv-number').value.trim();
    const entitySelect = document.getElementById('inv-entity');
    const dateInput = document.getElementById('inv-date');
    const descInput = document.getElementById('inv-desc');
    const itemRows = document.querySelectorAll('#invoice-items-container .invoice-item-row');
    if (!invoiceNumber) { alert('الرجاء إدخال رقم الفاتورة.'); return; }
    const entityIndex = parseInt(entitySelect.value);
    if (isNaN(entityIndex) || entityIndex < 0) { alert(isSale ? 'الرجاء اختيار عميل.' : 'الرجاء اختيار مورد.'); return; }
    if (!dateInput.value) { alert('الرجاء تحديد التاريخ.'); return; }
    if (itemRows.length === 0) { alert('الرجاء إضافة صنف واحد على الأقل.'); return; }
    const items = []; let hasError = false;
    itemRows.forEach(row => {
        const invIndex = parseInt(row.querySelector('.inv-item-select').value);
        const qty = parseFloat(row.querySelector('.inv-qty').value) || 0;
        const price = parseFloat(row.querySelector('.inv-price').value) || 0;
        const costSpan = row.querySelector('.inv-line-cost');
        const unitCost = parseFloat(costSpan.getAttribute('data-cost')) || 0;
        if (isNaN(invIndex) || invIndex < 0 || !db.inventory[invIndex]) { hasError = true; return; }
        if (qty <= 0) { hasError = true; return; }
        if (isSale && db.inventory[invIndex].quantity < qty) { alert('المخزون غير كافٍ: ' + db.inventory[invIndex].name); hasError = true; return; }
        items.push({ inventoryId: invIndex, name: db.inventory[invIndex].name, quantity: qty, unitPrice: price, unitCost: unitCost, lineTotal: qty * price, lineCost: qty * unitCost, lineProfit: (qty * price) - (qty * unitCost) });
    });
    if (hasError) return;
    const grandTotal = items.reduce((s, it) => s + it.lineTotal, 0);
    const totalCost = items.reduce((s, it) => s + it.lineCost, 0);
    const invoiceId = Date.now();
    const invoice = { id: invoiceId, invoiceNumber, type: currentInvoiceType, customerId: isSale ? entityIndex : null, supplierId: !isSale ? entityIndex : null, date: dateInput.value, description: descInput.value || '', items, total: grandTotal, totalCost, totalProfit: grandTotal - totalCost, createdAt: new Date().toISOString() };
    items.forEach(item => { const invItem = db.inventory[item.inventoryId]; if (invItem) { if (isSale) invItem.quantity -= item.quantity; else { invItem.quantity += item.quantity; if (item.unitPrice > 0) invItem.costPrice = item.unitPrice; } } });
    if (isSale && db.customers[entityIndex]) db.customers[entityIndex].balance = (db.customers[entityIndex].balance || 0) + grandTotal;
    else if (!isSale && db.suppliers[entityIndex]) db.suppliers[entityIndex].balance = (db.suppliers[entityIndex].balance || 0) + grandTotal;
    if (isSale) { db.entries.push({ date: dateInput.value, description: 'فاتورة مبيعات #' + invoiceNumber, debitAccount: 'العملاء', debitAmount: grandTotal, creditAccount: 'المبيعات', creditAmount: grandTotal, type: 'customer', invoiceId }); }
    else { db.entries.push({ date: dateInput.value, description: 'فاتورة مشتريات #' + invoiceNumber, debitAccount: 'المشتريات', debitAmount: grandTotal, creditAccount: 'الموردين', creditAmount: grandTotal, type: 'supplier', invoiceId }); }
    db.invoices.push(invoice);
    saveData(); closeModal(); renderInvoices();
    alert('تم حفظ الفاتورة بنجاح!');
}

function viewInvoicePDF(invoiceId) {
    const inv = db.invoices.find(i => i.id === invoiceId); if (!inv) return;
    const overlay = document.getElementById('invoice-pdf-overlay');
    const body = document.getElementById('invoice-pdf-body');
    const isSale = inv.type === 'sale';
    const entityName = isSale ? (inv.customerId != null && db.customers[inv.customerId] ? db.customers[inv.customerId].name : 'غير معروف') : (inv.supplierId != null && db.suppliers[inv.supplierId] ? db.suppliers[inv.supplierId].name : 'غير معروف');
    body.innerHTML = `<div class="print-area bg-white p-6" style="direction:rtl;"><div class="text-center mb-6 border-b pb-4"><h2 class="text-2xl font-extrabold text-gray-800">${isSale?'فاتورة مبيعات':'فاتورة مشتريات'}</h2><p class="text-sm text-gray-500">رقم: ${inv.invoiceNumber||'#'+inv.id}</p></div><div class="grid grid-cols-2 gap-4 mb-4 text-sm"><div><span class="font-semibold">التاريخ:</span> ${inv.date}</div><div><span class="font-semibold">${isSale?'العميل':'المورد'}:</span> ${entityName}</div></div>${inv.description?`<div class="mb-4 text-sm"><span class="font-semibold">البيان:</span> ${inv.description}</div>`:''}<table class="w-full border-collapse border mb-4 text-sm"><thead><tr class="bg-gray-100"><th class="border p-2">#</th><th class="border p-2">الصنف</th><th class="border p-2">الكمية</th><th class="border p-2">سعر الوحدة</th><th class="border p-2">الإجمالي</th></tr></thead><tbody>${inv.items?inv.items.map((it,i)=>`<tr><td class="border p-2 text-center">${i+1}</td><td class="border p-2">${it.name}</td><td class="border p-2 text-center">${it.quantity}</td><td class="border p-2 text-center">${(it.unitPrice||0).toFixed(2)}</td><td class="border p-2 text-center font-semibold">${(it.lineTotal||0).toFixed(2)}</td></tr>`).join(''):''}</tbody><tfoot><tr class="bg-gray-50 font-bold"><td colspan="4" class="border p-2 text-left">الإجمالي</td><td class="border p-2 text-center">${(inv.total||0).toFixed(2)}</td></tr></tfoot></table><div class="text-center text-xs text-gray-400 mt-6">تم إنشاء هذه الفاتورة بواسطة نظام ERP</div></div>`;
    overlay.classList.remove('hidden');
    lucide.createIcons();
}

function closeInvoicePDF() { document.getElementById('invoice-pdf-overlay').classList.add('hidden'); }
function printInvoicePDF() {
    const content = document.getElementById('invoice-pdf-body').querySelector('.print-area'); if (!content) return;
    const printWin = window.open('', '_blank', 'width=900,height=700');
    printWin.document.write('<html dir="rtl"><head><title>فاتورة</title><style>body{font-family:Cairo,sans-serif;padding:20px;direction:rtl}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:right}@media print{body{padding:0}}</style></head><body>' + content.outerHTML + '</body></html>');
    printWin.document.close(); setTimeout(() => printWin.print(), 500);
}

function deleteInvoice(invoiceId) {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;
    const invIndex = db.invoices.findIndex(inv => inv.id === invoiceId); if (invIndex === -1) return;
    const inv = db.invoices[invIndex];
    if (inv.items) inv.items.forEach(item => { const invItem = db.inventory[item.inventoryId]; if (invItem) { if (inv.type === 'sale') invItem.quantity += (item.quantity || 0); else invItem.quantity = Math.max(0, invItem.quantity - (item.quantity || 0)); } });
    if (inv.type === 'sale' && inv.customerId != null && db.customers[inv.customerId]) db.customers[inv.customerId].balance = (db.customers[inv.customerId].balance || 0) - (inv.total || 0);
    else if (inv.type === 'purchase' && inv.supplierId != null && db.suppliers[inv.supplierId]) db.suppliers[inv.supplierId].balance = (db.suppliers[inv.supplierId].balance || 0) - (inv.total || 0);
    db.entries = db.entries.filter(e => e.invoiceId !== invoiceId);
    db.invoices.splice(invIndex, 1);
    saveData(); renderInvoices();
}