// موديول المخزون

window.renderInventory = function() {
    const container = document.getElementById('inventory');
    if (!container) return;
    container.innerHTML = `
    <div class="card p-5">
      <div class="section-title-bar"><h3 class="text-lg font-bold">إدارة المخزون</h3><button onclick="openAddInventoryModal()" class="bg-orange-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold hover:bg-orange-700"><i data-lucide="plus" size="17"></i> إضافة صنف</button></div>
      <div class="grid grid-cols-3 gap-4 mb-5"><div class="stat-card"><p class="text-xs text-gray-500">إجمالي الأصناف</p><h4 class="text-xl font-bold">${db.inventory.length}</h4></div><div class="stat-card"><p class="text-xs text-gray-500">قيمة المخزون</p><h4 class="text-xl font-bold text-blue-600">${db.inventory.reduce((s,i)=>s+((i.costPrice||0)*(i.quantity||0)),0).toFixed(2)}</h4></div><div class="stat-card"><p class="text-xs text-gray-500">أصناف منخفضة (≤5)</p><h4 class="text-xl font-bold text-red-600">${db.inventory.filter(i=>i.quantity<=5).length}</h4></div></div>
      <div class="overflow-x-auto"><table class="w-full text-right"><thead><tr><th class="p-3">كود المنتج</th><th class="p-3">النوع</th><th class="p-3">الصنف</th><th class="p-3">الكمية</th><th class="p-3">سعر التكلفة</th><th class="p-3">سعر البيع</th><th class="p-3">الإجراءات</th></tr></thead>
      <tbody>${db.inventory.length===0?'<tr><td colspan="7" class="p-4 text-center text-gray-400">المخزن فارغ</td></tr>':db.inventory.map((item,i)=>`<tr class="border-b hover:bg-gray-50 ${item.quantity<=5&&item.quantity>0?'bg-yellow-50':''} ${item.quantity<=0?'bg-red-50':''}"><td class="p-3 font-mono font-bold text-sm">${item.productCode||'-'}</td><td class="p-3">${getProductTypeLabel(item.productType)}</td><td class="p-3 font-semibold">${item.name}</td><td class="p-3 font-bold ${item.quantity<=5?'text-red-600':''}">${item.quantity}</td><td class="p-3 text-sm">${(item.costPrice||0).toFixed(2)}</td><td class="p-3 text-sm text-blue-600 font-semibold">${(item.sellingPrice||0).toFixed(2)}</td><td class="p-3 flex gap-1"><button onclick="editInventory(${i})" class="text-orange-500 hover:text-orange-700 text-xs bg-orange-50 px-2 py-1 rounded flex items-center gap-1"><i data-lucide="pencil" size="14"></i> تعديل</button><button onclick="deleteInventory(${i})" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" size="16"></i></button></td></tr>`).join('')}</tbody></table></div>
    </div>`;
    lucide.createIcons();
};

function getProductTypeLabel(code) {
    if (code === 1 || code === '1') return '<span class="badge badge-raw">مادة خام (1)</span>';
    if (code === 2 || code === '2') return '<span class="badge badge-semi">نصف مصنع (2)</span>';
    if (code === 3 || code === '3') return '<span class="badge badge-finished">منتج كامل (3)</span>';
    return '<span class="badge bg-gray-100 text-gray-600">غير محدد</span>';
}

function getProductTypeName(code) {
    if (code === 1 || code === '1') return 'مادة خام';
    if (code === 2 || code === '2') return 'نصف مصنع';
    if (code === 3 || code === '3') return 'منتج كامل';
    return 'غير محدد';
}

function openAddInventoryModal() {
    document.getElementById('modal-title').innerText = 'إضافة صنف';
    document.getElementById('modal-content').className = 'bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden';
    document.getElementById('modal-body').innerHTML = `<div class="space-y-3"><div><label>اسم الصنف</label><input id="f-name" class="w-full"></div><div class="grid grid-cols-2 gap-3"><div><label>نوع المنتج</label><select id="f-prod-type" class="w-full"><option value="1">1 - مادة خام</option><option value="2">2 - نصف مصنع</option><option value="3" selected>3 - منتج كامل</option></select></div><div><label>كود المنتج</label><input id="f-prod-code" class="w-full"></div></div><div class="grid grid-cols-3 gap-3"><div><label>الكمية</label><input id="f-qty" class="w-full" type="number" value="0"></div><div><label>سعر التكلفة</label><input id="f-cost" class="w-full" type="number" value="0" step="0.01"></div><div><label>سعر البيع</label><input id="f-selling" class="w-full" type="number" value="0" step="0.01"></div></div></div>`;
    document.getElementById('modal-save-btn').onclick = () => {
        const name = document.getElementById('f-name').value.trim(); if (!name) { alert('اسم الصنف مطلوب'); return; }
        db.inventory.push({ name, productType: parseInt(document.getElementById('f-prod-type').value), productCode: document.getElementById('f-prod-code').value.trim(), quantity: parseFloat(document.getElementById('f-qty').value) || 0, costPrice: parseFloat(document.getElementById('f-cost').value) || 0, sellingPrice: parseFloat(document.getElementById('f-selling').value) || 0 });
        saveData(); closeModal(); renderInventory();
    };
    document.getElementById('modal-overlay').classList.remove('hidden');
    lucide.createIcons();
}

function editInventory(index) {
    const item = db.inventory[index]; if (!item) return;
    document.getElementById('modal-title').innerText = 'تعديل الصنف';
    document.getElementById('modal-content').className = 'bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden';
    document.getElementById('modal-body').innerHTML = `<div class="space-y-3"><div><label>اسم الصنف</label><input id="f-name" class="w-full" type="text" value="${item.name||''}"></div><div class="grid grid-cols-2 gap-3"><div><label>نوع المنتج</label><select id="f-prod-type" class="w-full"><option value="1" ${item.productType==1?'selected':''}>1 - مادة خام</option><option value="2" ${item.productType==2?'selected':''}>2 - نصف مصنع</option><option value="3" ${item.productType==3?'selected':''}>3 - منتج كامل</option></select></div><div><label>كود المنتج</label><input id="f-prod-code" class="w-full" type="text" value="${item.productCode||''}"></div></div><div class="grid grid-cols-3 gap-3"><div><label>الكمية</label><input id="f-qty" class="w-full" type="number" value="${item.quantity||0}"></div><div><label>سعر التكلفة</label><input id="f-cost" class="w-full" type="number" value="${item.costPrice||0}" step="0.01"></div><div><label>سعر البيع</label><input id="f-selling" class="w-full" type="number" value="${item.sellingPrice||0}" step="0.01"></div></div></div>`;
    document.getElementById('modal-save-btn').onclick = () => {
        item.name = document.getElementById('f-name').value.trim(); item.productType = parseInt(document.getElementById('f-prod-type').value); item.productCode = document.getElementById('f-prod-code').value.trim(); item.quantity = parseFloat(document.getElementById('f-qty').value) || 0; item.costPrice = parseFloat(document.getElementById('f-cost').value) || 0; item.sellingPrice = parseFloat(document.getElementById('f-selling').value) || 0;
        saveData(); closeModal(); renderInventory();
    };
    document.getElementById('modal-overlay').classList.remove('hidden');
    lucide.createIcons();
}

function deleteInventory(index) { if (!confirm('هل تريد حذف هذا الصنف؟')) return; db.inventory.splice(index, 1); saveData(); renderInventory(); }