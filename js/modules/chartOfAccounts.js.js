// موديول شجرة الحسابات

window.renderChartOfAccounts = function() {
    const container = document.getElementById('chartOfAccounts');
    if (!container) return;
    const accounts = db.chartOfAccounts;
    const rootAccounts = accounts.filter(a => !a.parentId);
    container.innerHTML = `
    <div class="card p-5">
      <div class="section-title-bar">
        <h3 class="text-lg font-bold">شجرة الحسابات</h3>
        <button onclick="openAddChartAccountModal()" class="bg-indigo-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm hover:bg-indigo-700"><i data-lucide="plus" size="17"></i> إضافة حساب</button>
      </div>
      <div class="space-y-2" id="chart-tree">
        ${rootAccounts.map(a=>renderAccountTree(a, accounts)).join('')}
      </div>
      ${accounts.length===0?'<p class="text-center text-gray-400 py-4">لا توجد حسابات. أضف حساباً جديداً.</p>':''}
    </div>`;
    lucide.createIcons();
};

function renderAccountTree(account, allAccounts) {
    const children = allAccounts.filter(a => a.parentId === account.id);
    const typeColors = { asset: 'text-blue-600', liability: 'text-red-600', equity: 'text-purple-600', revenue: 'text-green-600', expense: 'text-orange-600' };
    const typeBadge = { asset: 'bg-blue-100 text-blue-700', liability: 'bg-red-100 text-red-700', equity: 'bg-purple-100 text-purple-700', revenue: 'bg-green-100 text-green-700', expense: 'bg-orange-100 text-orange-700' };
    const typeName = { asset: 'أصول', liability: 'خصوم', equity: 'حقوق ملكية', revenue: 'إيرادات', expense: 'مصروفات' };
    return `
    <div>
      <div class="tree-item flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg border">
        <div class="flex items-center gap-2">
          <span class="font-mono text-sm font-bold ${typeColors[account.type]||''}">${account.code||''}</span>
          <span class="font-semibold">${account.name}</span>
          <span class="badge ${typeBadge[account.type]||'bg-gray-100'} text-xs">${typeName[account.type]||account.type}</span>
        </div>
        <div class="flex gap-1">
          <button onclick="editChartAccount(${account.id})" class="text-orange-500 hover:text-orange-700 text-xs bg-orange-50 px-2 py-1 rounded"><i data-lucide="pencil" size="14"></i></button>
          <button onclick="deleteChartAccount(${account.id})" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" size="14"></i></button>
        </div>
      </div>
      ${children.length>0?`<div class="tree-children">${children.map(c=>renderAccountTree(c,allAccounts)).join('')}</div>`:''}
    </div>`;
}

function openAddChartAccountModal() {
    document.getElementById('modal-title').innerText = 'إضافة حساب جديد';
    document.getElementById('modal-content').className = 'bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden';
    const parentOpts = db.chartOfAccounts.map(a=>`<option value="${a.id}">${a.code} - ${a.name}</option>`).join('');
    document.getElementById('modal-body').innerHTML = `
    <div class="space-y-3">
      <div><label>كود الحساب</label><input id="f-code" class="w-full"></div>
      <div><label>اسم الحساب</label><input id="f-name" class="w-full"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label>النوع</label><select id="f-type" class="w-full"><option value="asset">أصول</option><option value="liability">خصوم</option><option value="equity">حقوق ملكية</option><option value="revenue">إيرادات</option><option value="expense">مصروفات</option></select></div>
        <div><label>الحساب الأب</label><select id="f-parent" class="w-full"><option value="">-- لا يوجد --</option>${parentOpts}</select></div>
      </div>
    </div>`;
    document.getElementById('modal-save-btn').onclick = () => {
        const code = document.getElementById('f-code').value.trim();
        const name = document.getElementById('f-name').value.trim();
        if (!code || !name) { alert('الكود والاسم مطلوبان'); return; }
        const parentVal = document.getElementById('f-parent').value;
        db.chartOfAccounts.push({ id: Date.now(), code, name, type: document.getElementById('f-type').value, parentId: parentVal ? parseInt(parentVal) : null });
        saveData(); closeModal(); renderChartOfAccounts();
    };
    document.getElementById('modal-overlay').classList.remove('hidden');
    lucide.createIcons();
}

function editChartAccount(id) {
    const acc = db.chartOfAccounts.find(a=>a.id===id); if (!acc) return;
    document.getElementById('modal-title').innerText = 'تعديل الحساب';
    document.getElementById('modal-content').className = 'bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden';
    const parentOpts = db.chartOfAccounts.filter(a=>a.id!==id).map(a=>`<option value="${a.id}" ${acc.parentId===a.id?'selected':''}>${a.code} - ${a.name}</option>`).join('');
    document.getElementById('modal-body').innerHTML = `
    <div class="space-y-3">
      <div><label>كود الحساب</label><input id="f-code" class="w-full" type="text" value="${acc.code||''}"></div>
      <div><label>اسم الحساب</label><input id="f-name" class="w-full" type="text" value="${acc.name||''}"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label>النوع</label><select id="f-type" class="w-full"><option value="asset" ${acc.type==='asset'?'selected':''}>أصول</option><option value="liability" ${acc.type==='liability'?'selected':''}>خصوم</option><option value="equity" ${acc.type==='equity'?'selected':''}>حقوق ملكية</option><option value="revenue" ${acc.type==='revenue'?'selected':''}>إيرادات</option><option value="expense" ${acc.type==='expense'?'selected':''}>مصروفات</option></select></div>
        <div><label>الحساب الأب</label><select id="f-parent" class="w-full"><option value="">-- لا يوجد --</option>${parentOpts}</select></div>
      </div>
    </div>`;
    document.getElementById('modal-save-btn').onclick = () => {
        acc.code = document.getElementById('f-code').value.trim();
        acc.name = document.getElementById('f-name').value.trim();
        acc.type = document.getElementById('f-type').value;
        const parentVal = document.getElementById('f-parent').value;
        acc.parentId = parentVal ? parseInt(parentVal) : null;
        saveData(); closeModal(); renderChartOfAccounts();
    };
    document.getElementById('modal-overlay').classList.remove('hidden');
    lucide.createIcons();
}

function deleteChartAccount(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الحساب؟')) return;
    const hasChildren = db.chartOfAccounts.some(a=>a.parentId===id);
    if (hasChildren) { alert('لا يمكن حذف حساب له حسابات فرعية.'); return; }
    db.chartOfAccounts = db.chartOfAccounts.filter(a=>a.id!==id);
    saveData(); renderChartOfAccounts();
}