// موديول السداد والتحصيل

window.renderPayments = function() {
    const container = document.getElementById('payments');
    if (!container) return;
    container.innerHTML = `
    <div class="space-y-5">
      <div class="card p-5">
        <div class="section-title-bar">
          <h3 class="text-lg font-bold">سداد وتحويلات العملاء</h3>
          <button onclick="openPaymentModal('customer_payment')" class="btn-primary flex items-center gap-2 text-sm"><i data-lucide="plus" size="17"></i> تسجيل سداد</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-right">
            <thead><tr><th class="p-3">التاريخ</th><th class="p-3">العميل</th><th class="p-3">الطريقة</th><th class="p-3">المبلغ</th><th class="p-3">إجراءات</th></tr></thead>
            <tbody>
              ${db.payments.filter(p=>p.paymentType==='customer').length===0?'<tr><td colspan="5" class="p-4 text-center text-gray-400">لا توجد مدفوعات</td></tr>':
              db.payments.filter(p=>p.paymentType==='customer').slice().reverse().map((p)=>{
                const cn=p.entityId!=null && db.customers[p.entityId]?db.customers[p.entityId].name:'غير معروف';
                const realIdx=db.payments.indexOf(p);
                return `<tr class="border-b hover:bg-gray-50 credit-row">
                  <td class="p-3 text-sm">${p.date}</td><td class="p-3">${cn}</td>
                  <td class="p-3 text-sm">${p.method==='cash'?'نقدي':p.method==='bank_transfer'?'تحويل بنكي':'أخرى'}</td>
                  <td class="p-3 font-bold text-green-600">${(p.amount||0).toFixed(2)}</td>
                  <td class="p-3 flex gap-1">
                    <button onclick="editPayment(${realIdx})" class="text-orange-500 hover:text-orange-700 text-xs bg-orange-50 px-2 py-1 rounded"><i data-lucide="pencil" size="14"></i></button>
                    <button onclick="deletePayment(${realIdx})" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" size="16"></i></button>
                  </td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card p-5">
        <div class="section-title-bar">
          <h3 class="text-lg font-bold">سداد للموردين</h3>
          <button onclick="openPaymentModal('supplier_payment')" class="btn-success flex items-center gap-2 text-sm"><i data-lucide="plus" size="17"></i> تسجيل سداد</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-right">
            <thead><tr><th class="p-3">التاريخ</th><th class="p-3">المورد</th><th class="p-3">الطريقة</th><th class="p-3">المبلغ</th><th class="p-3">إجراءات</th></tr></thead>
            <tbody>
              ${db.payments.filter(p=>p.paymentType==='supplier').length===0?'<tr><td colspan="5" class="p-4 text-center text-gray-400">لا توجد مدفوعات</td></tr>':
              db.payments.filter(p=>p.paymentType==='supplier').slice().reverse().map((p)=>{
                const sn=p.entityId!=null && db.suppliers[p.entityId]?db.suppliers[p.entityId].name:'غير معروف';
                const realIdx=db.payments.indexOf(p);
                return `<tr class="border-b hover:bg-gray-50 debit-row">
                  <td class="p-3 text-sm">${p.date}</td><td class="p-3">${sn}</td>
                  <td class="p-3 text-sm">${p.method==='cash'?'نقدي':p.method==='bank_transfer'?'تحويل بنكي':'أخرى'}</td>
                  <td class="p-3 font-bold text-red-600">${(p.amount||0).toFixed(2)}</td>
                  <td class="p-3 flex gap-1">
                    <button onclick="editPayment(${realIdx})" class="text-orange-500 hover:text-orange-700 text-xs bg-orange-50 px-2 py-1 rounded"><i data-lucide="pencil" size="14"></i></button>
                    <button onclick="deletePayment(${realIdx})" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" size="16"></i></button>
                  </td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
    lucide.createIcons();
};

function openPaymentModal(type) {
    const isCust = type === 'customer_payment';
    document.getElementById('modal-title').innerText = isCust ? 'سداد عميل' : 'سداد مورد';
    document.getElementById('modal-content').className = 'bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden';
    const entityOptions = isCust ? db.customers.map((c,i)=>`<option value="${i}">${c.name} (${(c.balance||0).toFixed(2)})</option>`).join('') : db.suppliers.map((s,i)=>`<option value="${i}">${s.name} (${(s.balance||0).toFixed(2)})</option>`).join('');
    document.getElementById('modal-body').innerHTML = `
    <div class="space-y-3">
      <div><label>${isCust?'العميل':'المورد'}</label><select id="pmt-entity" class="w-full"><option value="">-- اختر --</option>${entityOptions}</select></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label>التاريخ</label><input id="pmt-date" type="date" class="w-full" value="${new Date().toISOString().split('T')[0]}"></div>
        <div><label>الطريقة</label><select id="pmt-method" class="w-full"><option value="cash">نقدي</option><option value="bank_transfer">تحويل بنكي</option><option value="other">أخرى</option></select></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label>المبلغ</label><input id="pmt-amount" type="number" class="w-full" value="0" step="0.01"></div>
        <div><label>البيان</label><input id="pmt-desc" type="text" class="w-full"></div>
      </div>
    </div>`;
    document.getElementById('modal-save-btn').onclick = () => {
        const entityIndex = parseInt(document.getElementById('pmt-entity').value);
        const dateVal = document.getElementById('pmt-date').value;
        const amountVal = parseFloat(document.getElementById('pmt-amount').value) || 0;
        const methodVal = document.getElementById('pmt-method').value;
        const descVal = document.getElementById('pmt-desc').value.trim();
        if (isNaN(entityIndex) || entityIndex < 0) { alert('الرجاء اختيار الكيان.'); return; }
        if (!dateVal) { alert('الرجاء تحديد التاريخ.'); return; }
        if (amountVal <= 0) { alert('الرجاء إدخال مبلغ صحيح.'); return; }
        const payment = { id: Date.now(), paymentType: isCust ? 'customer' : 'supplier', entityId: entityIndex, date: dateVal, amount: amountVal, method: methodVal, description: descVal || 'سداد', createdAt: new Date().toISOString() };
        db.payments.push(payment);
        if (isCust && db.customers[entityIndex]) {
            db.customers[entityIndex].balance = (db.customers[entityIndex].balance || 0) - amountVal;
            db.entries.push({ date: dateVal, description: descVal || 'تحصيل من عميل', debitAccount: 'النقدية', debitAmount: amountVal, creditAccount: 'العملاء', creditAmount: amountVal, type: 'customer_payment', invoiceId: null });
        } else if (!isCust && db.suppliers[entityIndex]) {
            db.suppliers[entityIndex].balance = (db.suppliers[entityIndex].balance || 0) - amountVal;
            db.entries.push({ date: dateVal, description: descVal || 'سداد للمورد', debitAccount: 'الموردين', debitAmount: amountVal, creditAccount: 'النقدية', creditAmount: amountVal, type: 'supplier_payment', invoiceId: null });
        }
        saveData(); closeModal(); renderPayments();
        alert('تم تسجيل السداد بنجاح!');
    };
    document.getElementById('modal-overlay').classList.remove('hidden');
    lucide.createIcons();
}

function editPayment(index) {
    const p = db.payments[index]; if (!p) return;
    const isCust = p.paymentType === 'customer';
    document.getElementById('modal-title').innerText = 'تعديل السداد';
    document.getElementById('modal-content').className = 'bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden';
    const entityOptions = isCust ? db.customers.map((c,i)=>`<option value="${i}" ${i===p.entityId?'selected':''}>${c.name}</option>`).join('') : db.suppliers.map((s,i)=>`<option value="${i}" ${i===p.entityId?'selected':''}>${s.name}</option>`).join('');
    document.getElementById('modal-body').innerHTML = `
    <div class="space-y-3">
      <div><label>${isCust?'العميل':'المورد'}</label><select id="pmt-entity" class="w-full">${entityOptions}</select></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label>التاريخ</label><input id="pmt-date" type="date" class="w-full" value="${p.date}"></div>
        <div><label>الطريقة</label><select id="pmt-method" class="w-full"><option value="cash" ${p.method==='cash'?'selected':''}>نقدي</option><option value="bank_transfer" ${p.method==='bank_transfer'?'selected':''}>تحويل بنكي</option><option value="other" ${p.method==='other'?'selected':''}>أخرى</option></select></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label>المبلغ</label><input id="pmt-amount" type="number" class="w-full" value="${p.amount||0}" step="0.01"></div>
        <div><label>البيان</label><input id="pmt-desc" type="text" class="w-full" value="${p.description||''}"></div>
      </div>
    </div>`;
    document.getElementById('modal-save-btn').onclick = () => {
        const oldAmount = p.amount || 0;
        const oldEntityId = p.entityId;
        p.entityId = parseInt(document.getElementById('pmt-entity').value);
        p.date = document.getElementById('pmt-date').value;
        p.method = document.getElementById('pmt-method').value;
        p.amount = parseFloat(document.getElementById('pmt-amount').value) || 0;
        p.description = document.getElementById('pmt-desc').value.trim();
        if (isCust && db.customers[oldEntityId]) db.customers[oldEntityId].balance = (db.customers[oldEntityId].balance || 0) + oldAmount;
        if (!isCust && db.suppliers[oldEntityId]) db.suppliers[oldEntityId].balance = (db.suppliers[oldEntityId].balance || 0) + oldAmount;
        if (isCust && db.customers[p.entityId]) db.customers[p.entityId].balance = (db.customers[p.entityId].balance || 0) - p.amount;
        if (!isCust && db.suppliers[p.entityId]) db.suppliers[p.entityId].balance = (db.suppliers[p.entityId].balance || 0) - p.amount;
        saveData(); closeModal(); renderPayments();
    };
    document.getElementById('modal-overlay').classList.remove('hidden');
    lucide.createIcons();
}

function deletePayment(index) {
    if (!confirm('هل أنت متأكد من حذف هذا السداد؟')) return;
    const p = db.payments[index];
    if (p) {
        if (p.paymentType === 'customer' && db.customers[p.entityId]) db.customers[p.entityId].balance = (db.customers[p.entityId].balance || 0) + (p.amount || 0);
        if (p.paymentType === 'supplier' && db.suppliers[p.entityId]) db.suppliers[p.entityId].balance = (db.suppliers[p.entityId].balance || 0) + (p.amount || 0);
    }
    db.payments.splice(index, 1);
    saveData(); renderPayments();
}