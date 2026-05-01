// موديول القوائم المالية

window.renderFinancialStatements = function() {
    const container = document.getElementById('financialStatements');
    if (!container) return;
    const totalRevenue = db.entries.filter(e => e.creditAccount === 'المبيعات' || e.type === 'customer').reduce((s, e) => s + (e.creditAmount || 0), 0);
    const totalCOGS = db.entries.filter(e => e.debitAccount === 'المشتريات' || e.type === 'supplier').reduce((s, e) => s + (e.debitAmount || 0), 0);
    const totalExpenses = db.costs.reduce((s, c) => s + (c.amount || 0), 0);
    const totalCashIn = db.payments.filter(p => p.paymentType === 'customer').reduce((s, p) => s + (p.amount || 0), 0);
    const totalCashOut = db.payments.filter(p => p.paymentType === 'supplier').reduce((s, p) => s + (p.amount || 0), 0);
    const customerBalance = db.customers.reduce((s, c) => s + (c.balance || 0), 0);
    const supplierBalance = db.suppliers.reduce((s, s2) => s + (s2.balance || 0), 0);
    const invValue = db.inventory.reduce((s, i) => s + ((i.costPrice || 0) * (i.quantity || 0)), 0);
    const netIncome = totalRevenue - totalCOGS - totalExpenses;
    const totalAssets = customerBalance + invValue + (totalCashIn - totalCashOut);
    const totalLiabilities = supplierBalance;
    const equity = totalAssets - totalLiabilities;
    const trialBalanceData = [];
    const tbMap = {};
    db.entries.forEach(e => {
        if (e.debitAccount) { if (!tbMap[e.debitAccount]) tbMap[e.debitAccount] = { debit: 0, credit: 0 }; tbMap[e.debitAccount].debit += (e.debitAmount || 0); }
        if (e.creditAccount) { if (!tbMap[e.creditAccount]) tbMap[e.creditAccount] = { debit: 0, credit: 0 }; tbMap[e.creditAccount].credit += (e.creditAmount || 0); }
    });
    for (const [name, vals] of Object.entries(tbMap)) trialBalanceData.push({ account: name, debit: vals.debit, credit: vals.credit, balance: vals.debit - vals.credit });
    container.innerHTML = `
    <div class="space-y-5">
      <div class="flex gap-2 flex-wrap"><button onclick="exportFinancialToExcel()" class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-green-700"><i data-lucide="download" size="16"></i> تصدير الكل إلى Excel</button></div>
      <div class="card p-5"><h3 class="text-lg font-bold mb-4">قائمة المركز المالي</h3>
        <div class="grid grid-cols-2 gap-4">
          <div><h4 class="font-bold text-blue-600 mb-2">الأصول</h4><div class="space-y-2"><div class="flex justify-between p-2 bg-blue-50 rounded"><span>العملاء (مدينون)</span><span class="font-bold">${customerBalance.toFixed(2)}</span></div><div class="flex justify-between p-2 bg-blue-50 rounded"><span>المخزون</span><span class="font-bold">${invValue.toFixed(2)}</span></div><div class="flex justify-between p-2 bg-blue-50 rounded"><span>النقدية المتاحة</span><span class="font-bold">${(totalCashIn-totalCashOut).toFixed(2)}</span></div><div class="flex justify-between p-2 bg-blue-100 rounded font-bold"><span>إجمالي الأصول</span><span>${totalAssets.toFixed(2)}</span></div></div></div>
          <div><div><h4 class="font-bold text-red-600 mb-2">الخصوم</h4><div class="space-y-2"><div class="flex justify-between p-2 bg-red-50 rounded"><span>الموردين (دائنون)</span><span class="font-bold">${supplierBalance.toFixed(2)}</span></div><div class="flex justify-between p-2 bg-red-100 rounded font-bold"><span>إجمالي الخصوم</span><span>${totalLiabilities.toFixed(2)}</span></div></div></div>
          <div class="mt-4"><h4 class="font-bold text-purple-600 mb-2">حقوق الملكية</h4><div class="flex justify-between p-2 bg-purple-50 rounded font-bold"><span>صافي حقوق الملكية</span><span>${equity.toFixed(2)}</span></div></div></div></div>
      </div>
      <div class="card p-5"><h3 class="text-lg font-bold mb-4">قائمة الدخل والأرباح والخسائر</h3>
        <div class="space-y-2"><div class="flex justify-between p-2 bg-green-50 rounded"><span>الإيرادات (المبيعات)</span><span class="font-bold text-green-600">${totalRevenue.toFixed(2)}</span></div><div class="flex justify-between p-2 bg-red-50 rounded"><span>تكلفة البضاعة المباعة</span><span class="font-bold text-red-600">(${totalCOGS.toFixed(2)})</span></div><div class="flex justify-between p-2 bg-red-50 rounded"><span>المصروفات التشغيلية</span><span class="font-bold text-red-600">(${totalExpenses.toFixed(2)})</span></div><div class="flex justify-between p-2 bg-blue-100 rounded font-bold text-lg"><span>صافي الربح / الخسارة</span><span class="${netIncome>=0?'text-green-600':'text-red-600'}">${netIncome.toFixed(2)}</span></div></div>
      </div>
      <div class="card p-5"><h3 class="text-lg font-bold mb-4">قائمة التدفقات النقدية</h3>
        <div class="space-y-2"><div class="flex justify-between p-2 bg-cyan-50 rounded"><span>التدفقات النقدية من العملاء</span><span class="font-bold text-green-600">${totalCashIn.toFixed(2)}</span></div><div class="flex justify-between p-2 bg-rose-50 rounded"><span>التدفقات النقدية للموردين</span><span class="font-bold text-red-600">(${totalCashOut.toFixed(2)})</span></div><div class="flex justify-between p-2 bg-blue-100 rounded font-bold"><span>صافي التدفق النقدي</span><span>${(totalCashIn-totalCashOut).toFixed(2)}</span></div></div>
      </div>
      <div class="card p-5"><h3 class="text-lg font-bold mb-4">ميزان المراجعة</h3>
        <div class="overflow-x-auto"><table class="w-full text-right"><thead><tr><th class="p-2">الحساب</th><th class="p-2">مدين</th><th class="p-2">دائن</th><th class="p-2">الرصيد</th></tr></thead>
        <tbody>${trialBalanceData.length===0?'<tr><td colspan="4" class="p-4 text-center text-gray-400">لا توجد بيانات</td></tr>':trialBalanceData.map(t=>`<tr class="border-b"><td class="p-2 font-semibold">${t.account}</td><td class="p-2 text-red-600">${t.debit.toFixed(2)}</td><td class="p-2 text-green-600">${t.credit.toFixed(2)}</td><td class="p-2 font-bold ${t.balance>=0?'text-red-600':'text-green-600'}">${Math.abs(t.balance).toFixed(2)} ${t.balance>=0?'مدين':'دائن'}</td></tr>`).join('')}
        <tr class="bg-gray-100 font-bold"><td>الإجمالي</td><td class="text-red-600">${trialBalanceData.reduce((s,t)=>s+t.debit,0).toFixed(2)}</td><td class="text-green-600">${trialBalanceData.reduce((s,t)=>s+t.credit,0).toFixed(2)}</td><td>-</td></tr></tbody></table></div>
      </div>
    </div>`;
    lucide.createIcons();
};

function exportFinancialToExcel() {
    const wb = XLSX.utils.book_new();
    const totalRevenue = db.entries.filter(e => e.creditAccount === 'المبيعات' || e.type === 'customer').reduce((s, e) => s + (e.creditAmount || 0), 0);
    const totalCOGS = db.entries.filter(e => e.debitAccount === 'المشتريات' || e.type === 'supplier').reduce((s, e) => s + (e.debitAmount || 0), 0);
    const totalExpenses = db.costs.reduce((s, c) => s + (c.amount || 0), 0);
    const totalCashIn = db.payments.filter(p => p.paymentType === 'customer').reduce((s, p) => s + (p.amount || 0), 0);
    const totalCashOut = db.payments.filter(p => p.paymentType === 'supplier').reduce((s, p) => s + (p.amount || 0), 0);
    const customerBalance = db.customers.reduce((s, c) => s + (c.balance || 0), 0);
    const supplierBalance = db.suppliers.reduce((s, s2) => s + (s2.balance || 0), 0);
    const invValue = db.inventory.reduce((s, i) => s + ((i.costPrice || 0) * (i.quantity || 0)), 0);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
        { "البند": "الأصول - العملاء", "القيمة": customerBalance },
        { "البند": "الأصول - المخزون", "القيمة": invValue },
        { "البند": "الأصول - النقدية", "القيمة": totalCashIn - totalCashOut },
        { "البند": "الخصوم - الموردين", "القيمة": supplierBalance },
        { "البند": "الإيرادات", "القيمة": totalRevenue },
        { "البند": "تكلفة البضاعة", "القيمة": totalCOGS },
        { "البند": "المصروفات", "القيمة": totalExpenses },
        { "البند": "صافي الربح", "القيمة": totalRevenue - totalCOGS - totalExpenses }
    ]), "القوائم المالية");
    XLSX.writeFile(wb, "financial_statements.xlsx");
}