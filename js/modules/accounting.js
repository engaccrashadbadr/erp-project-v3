// موديول القيود اليومية

window.renderAccounting = function() {
    const container = document.getElementById('accounting');
    if (!container) return;
    const totalDebitAll = db.entries.reduce((s, e) => s + (e.debitAmount || 0), 0);
    const totalCreditAll = db.entries.reduce((s, e) => s + (e.creditAmount || 0), 0);
    container.innerHTML = `
    <div class="card p-5">
      <div class="section-title-bar">
        <h3 class="text-lg font-bold">القيود اليومية</h3>
        <button onclick="openEntryModal()" class="bg-slate-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm hover:bg-slate-800"><i data-lucide="plus" size="17"></i> قيد جديد</button>
      </div>
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="stat-card text-center"><p class="text-xs text-gray-500">عدد القيود</p><h4 class="font-bold">${db.entries.length}</h4></div>
        <div class="stat-card text-center"><p class="text-xs text-gray-500">إجمالي المدين</p><h4 class="font-bold text-red-600">${totalDebitAll.toFixed(2)}</h4></div>
        <div class="stat-card text-center"><p class="text-xs text-gray-500">إجمالي الدائن</p><h4 class="font-bold text-green-600">${totalCreditAll.toFixed(2)}</h4></div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-right">
          <thead><tr><th class="p-3">التاريخ</th><th class="p-3">البيان</th><th class="p-3">مدين</th><th class="p-3">دائن</th><th class="p-3">النوع</th><th class="p-3">إجراءات</th></tr></thead>
          <tbody>
            ${db.entries.length===0?'<tr><td colspan="6" class="p-4 text-center text-gray-400">لا توجد قيود</td></tr>':
            db.entries.slice().reverse().map((e,i)=>{
              const ri=db.entries.length-1-i;
              return `<tr class="border-b hover:bg-gray-50">
                <td class="p-2 text-sm">${e.date}</td>
                <td class="p-2 text-sm">${e.description}</td>
                <td class="p-2 font-bold text-red-600">${(e.debitAmount||0).toFixed(2)}</td>
                <td class="p-2 font-bold text-green-600">${(e.creditAmount||0).toFixed(2)}</td>
                <td class="p-2"><span class="badge bg-gray-100">${e.type||'آخر'}</span></td>
                <td class="p-2 flex gap-1">
                  <button onclick="editEntry(${ri})" class="text-orange-500 hover:text-orange-700 text-xs bg-orange-50 px-2 py-1 rounded"><i data-lucide="pencil" size="14"></i></button>
                  <button onclick="deleteEntry(${ri})" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" size="16"></i></button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
    lucide.createIcons();
};

function openEntryModal() {
    document.getElementById('modal-title').innerText = 'قيد محاسبي';
    document.getElementById('modal-content').className = 'bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden';
    document.getElementById('modal-body').innerHTML = `
    <div class="space-y-3">
      <div><label>التاريخ</label><input id="f-date" class="w-full" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div><label>البيان</label><input id="f-desc" class="w-full"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label>حساب مدين</label><input id="f-debit-acc" class="w-full" list="accounts-list"><datalist id="accounts-list">${db.chartOfAccounts.map(a=>`<option value="${a.name}">`).join('')}</datalist></div>
        <div><label>مبلغ مدين</label><input id="f-debit-amt" class="w-full" type="number" value="0" step="0.01"></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label>حساب دائن</label><input id="f-credit-acc" class="w-full" list="accounts-list"></div>
        <div><label>مبلغ دائن</label><input id="f-credit-amt" class="w-full" type="number" value="0" step="0.01"></div>
      </div>
    </div>`;
    document.getElementById('modal-save-btn').onclick = () => {
        const desc = document.getElementById('f-desc').value.trim();
        if (!desc) { alert('البيان مطلوب'); return; }
        db.entries.push({
            date: document.getElementById('f-date').value,
            description: desc,
            debitAccount: document.getElementById('f-debit-acc').value,
            debitAmount: parseFloat(document.getElementById('f-debit-amt').value) || 0,
            creditAccount: document.getElementById('f-credit-acc').value,
            creditAmount: parseFloat(document.getElementById('f-credit-amt').value) || 0,
            type: 'manual',
            invoiceId: null
        });
        saveData(); closeModal(); renderAccounting();
    };
    document.getElementById('modal-overlay').classList.remove('hidden');
    lucide.createIcons();
}

function editEntry(index) {
    const e = db.entries[index]; if (!e) return;
    document.getElementById('modal-title').innerText = 'تعديل القيد';
    document.getElementById('modal-content').className = 'bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden';
    document.getElementById('modal-body').innerHTML = `
    <div class="space-y-3">
      <div><label>التاريخ</label><input id="f-date" class="w-full" type="date" value="${e.date}"></div>
      <div><label>البيان</label><input id="f-desc" class="w-full" type="text" value="${e.description||''}"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label>حساب مدين</label><input id="f-debit-acc" class="w-full" type="text" value="${e.debitAccount||''}"></div>
        <div><label>مبلغ مدين</label><input id="f-debit-amt" class="w-full" type="number" value="${e.debitAmount||0}" step="0.01"></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label>حساب دائن</label><input id="f-credit-acc" class="w-full" type="text" value="${e.creditAccount||''}"></div>
        <div><label>مبلغ دائن</label><input id="f-credit-amt" class="w-full" type="number" value="${e.creditAmount||0}" step="0.01"></div>
      </div>
    </div>`;
    document.getElementById('modal-save-btn').onclick = () => {
        e.date = document.getElementById('f-date').value;
        e.description = document.getElementById('f-desc').value.trim();
        e.debitAccount = document.getElementById('f-debit-acc').value.trim();
        e.debitAmount = parseFloat(document.getElementById('f-debit-amt').value) || 0;
        e.creditAccount = document.getElementById('f-credit-acc').value.trim();
        e.creditAmount = parseFloat(document.getElementById('f-credit-amt').value) || 0;
        saveData(); closeModal(); renderAccounting();
    };
    document.getElementById('modal-overlay').classList.remove('hidden');
    lucide.createIcons();
}

function deleteEntry(index) {
    const e = db.entries[index];
    if (e && e.invoiceId) { alert('لا يمكن حذف قيد مرتبط بفاتورة. احذف الفاتورة أولاً.'); return; }
    if (!confirm('هل أنت متأكد من حذف هذا القيد؟')) return;
    db.entries.splice(index, 1);
    saveData(); renderAccounting();
}
