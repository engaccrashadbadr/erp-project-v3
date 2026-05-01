// موديول النسخ الاحتياطي والبيانات

window.renderBackup = function() {
    const container = document.getElementById('backup');
    if (!container) return;
    container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div class="card p-5">
        <h3 class="text-lg font-bold mb-4"><i data-lucide="file-spreadsheet" class="text-green-600"></i> عمليات Excel</h3>
        <div class="space-y-4">
          <div><button onclick="downloadFullTemplate()" class="w-full py-2.5 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 font-semibold flex items-center justify-center gap-2"><i data-lucide="download" size="17"></i> تحميل تمبليت شامل</button></div>
          <div class="pt-3 border-t">
            <input type="file" id="excel-upload" accept=".xlsx,.xls" class="hidden" onchange="handleExcelUpload(event)">
            <button onclick="document.getElementById('excel-upload').click()" class="w-full py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 font-semibold flex items-center justify-center gap-2"><i data-lucide="upload" size="17"></i> رفع ملف Excel</button>
          </div>
        </div>
      </div>
      <div class="card p-5">
        <h3 class="text-lg font-bold mb-4"><i data-lucide="shield-check" class="text-blue-600"></i> النسخ الاحتياطي</h3>
        <div class="space-y-4">
          <div><button onclick="exportBackup()" class="w-full py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-semibold flex items-center justify-center gap-2"><i data-lucide="database" size="17"></i> إنشاء نسخة JSON</button></div>
          <div class="pt-3 border-t">
            <input type="file" id="backup-upload" accept=".json" class="hidden" onchange="importBackup(event)">
            <button onclick="document.getElementById('backup-upload').click()" class="w-full py-2.5 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 font-semibold flex items-center justify-center gap-2"><i data-lucide="refresh-cw" size="17"></i> استعادة نسخة</button>
          </div>
        </div>
      </div>
    </div>`;
    lucide.createIcons();
};

function downloadFullTemplate() {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ "الكود": "C001", "الاسم": "عميل", "الهاتف": "0123", "الرصيد": 0, "النوع": "تجزئة" }]), "العملاء");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ "الكود": "S001", "اسم المورد": "مورد", "الشركة": "شركة", "الرصيد": 0 }]), "الموردين");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ "الصنف": "منتج", "النوع": "3", "كود المنتج": "P001", "الكمية": 50, "سعر التكلفة": 20, "سعر البيع": 35 }]), "المخزون");
    XLSX.writeFile(wb, "erp_template.xlsx");
}

function handleExcelUpload(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        let count = 0;
        if (workbook.Sheets["العملاء"]) {
            XLSX.utils.sheet_to_json(workbook.Sheets["العملاء"]).forEach(row => {
                if (row["الاسم"] && row["الكود"]) { db.customers.push({ code: row["الكود"], name: row["الاسم"], phone: row["الهاتف"] || '', openingBalance: parseFloat(row["الرصيد"]) || 0, balance: parseFloat(row["الرصيد"]) || 0, customerType: row["النوع"] || 'تجزئة', segment: 'A', paymentMethod: 'نقدي', paymentPeriod: '', taxCard: '', taxName: '', responsiblePerson: '', salesRep: '' }); count++; }
            });
        }
        if (workbook.Sheets["الموردين"]) {
            XLSX.utils.sheet_to_json(workbook.Sheets["الموردين"]).forEach(row => {
                if (row["اسم المورد"] && row["الكود"]) { db.suppliers.push({ code: row["الكود"], name: row["اسم المورد"], company: row["الشركة"] || '', transactionType: 'آجل', paymentSystem: '', openingBalance: parseFloat(row["الرصيد"]) || 0, balance: parseFloat(row["الرصيد"]) || 0 }); count++; }
            });
        }
        if (workbook.Sheets["المخزون"]) {
            XLSX.utils.sheet_to_json(workbook.Sheets["المخزون"]).forEach(row => {
                if (row["الصنف"]) { db.inventory.push({ name: row["الصنف"], productType: parseInt(row["النوع"]) || 3, productCode: row["كود المنتج"] || '', quantity: parseFloat(row["الكمية"]) || 0, costPrice: parseFloat(row["سعر التكلفة"]) || 0, sellingPrice: parseFloat(row["سعر البيع"]) || 0 }); count++; }
            });
        }
        saveData();
        alert('تم استيراد ' + count + ' سجل');
        updateDashboard();
        event.target.value = '';
    };
    reader.readAsArrayBuffer(file);
}

function exportBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "erp_backup_" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(a);
    a.click();
    a.remove();
}

function importBackup(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (imported.customers && imported.entries !== undefined) {
                if (!imported.payments) imported.payments = [];
                if (!imported.chartOfAccounts) imported.chartOfAccounts = [];
                if (!imported.monthlyClosings) imported.monthlyClosings = [];
                db = imported;
                saveData();
                alert('تم استعادة النسخة بنجاح');
                location.reload();
            } else alert('الملف غير صالح.');
        } catch (err) { alert('خطأ في قراءة الملف.'); }
    };
    reader.readAsText(file);
    event.target.value = '';
}