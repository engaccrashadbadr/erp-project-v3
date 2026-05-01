// js/app.js

// الكائن الرئيسي للتطبيق
const ERP = {
    // قاعدة البيانات الموحدة
    db: {
        customers: [],
        suppliers: [],
        inventory: [],
        invoices: [],
        entries: [],
        costs: [],
        payments: [],
        chartOfAccounts: [],
        monthlyClosings: []
    },

    // الحالة العامة للتطبيق
    currentInvoiceType: 'sale',
    currentStatementData: null,
    currentEditData: null,
    currentInvoicePDFData: null,
    currentModule: 'dashboard',

    // دوال مساعدة مشتركة
    getProductTypeLabel(code) {
        if (code === 1 || code === '1') return '<span class="badge badge-raw">مادة خام (1)</span>';
        if (code === 2 || code === '2') return '<span class="badge badge-semi">نصف مصنع (2)</span>';
        if (code === 3 || code === '3') return '<span class="badge badge-finished">منتج كامل (3)</span>';
        return '<span class="badge bg-gray-100 text-gray-600">غير محدد</span>';
    },

    getProductTypeName(code) {
        if (code === 1 || code === '1') return 'مادة خام';
        if (code === 2 || code === '2') return 'نصف مصنع';
        if (code === 3 || code === '3') return 'منتج كامل';
        return 'غير محدد';
    },

    getAccountTypeName(type) {
        const map = { asset: 'أصول', liability: 'خصوم', equity: 'حقوق ملكية', revenue: 'إيرادات', expense: 'مصروفات' };
        return map[type] || type;
    },

    // تحميل وحدة جديدة ديناميكياً
    loadModule(moduleName) {
        if (ERP.currentModule === moduleName) return;
        
        // إزالة السكريبت القديم إذا وجد
        const oldScript = document.querySelector('script[data-module]');
        if (oldScript) oldScript.remove();

        // تحديث القائمة النشطة
        document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById('btn-' + moduleName);
        if (btn) btn.classList.add('active');

        // تحديث العنوان
        const titles = {
            dashboard: 'لوحة التحكم', customers: 'إدارة العملاء', suppliers: 'إدارة الموردين',
            inventory: 'إدارة المخزون', invoices: 'إدارة الفواتير', payments: 'السداد والتحصيل',
            accounting: 'القيود اليومية', chartOfAccounts: 'شجرة الحسابات', costs: 'التكاليف والتقارير',
            profit: 'أرباح المنتجات', financialStatements: 'القوائم المالية',
            monthlyClosing: 'الإقفال الشهري', backup: 'النسخ والبيانات'
        };
        document.getElementById('section-title').innerText = titles[moduleName] || moduleName;
        ERP.currentModule = moduleName;

        // تحميل ملف JavaScript الخاص بالموديول
        const script = document.createElement('script');
        script.src = `js/modules/${moduleName}.js`;
        script.setAttribute('data-module', moduleName);
        script.onload = () => {
            // استدعاء دالة التهيئة الخاصة بالموديول إذا كانت معرفة
            if (typeof ERP.renderCurrentModule === 'function') {
                ERP.renderCurrentModule();
            }
            lucide.createIcons();
        };
        document.body.appendChild(script);
    },

    // دوال قاعدة البيانات
    saveData() {
        localStorage.setItem('erp_db_v3', JSON.stringify(ERP.db));
        // تحديث لوحة التحكم إذا كانت مفتوحة حالياً
        if (ERP.currentModule === 'dashboard' && typeof ERP.Modules.dashboard !== 'undefined') {
            ERP.renderCurrentModule();
        }
    },

    initDB() {
        const saved = localStorage.getItem('erp_db_v3');
        if (saved) {
            ERP.db = JSON.parse(saved);
            // التأكد من وجود جميع المصفوفات
            ['customers', 'suppliers', 'inventory', 'invoices', 'entries', 'costs', 'payments', 'chartOfAccounts', 'monthlyClosings'].forEach(key => {
                if (!ERP.db[key]) ERP.db[key] = [];
            });
        }
        
        // إعداد شجرة الحسابات الافتراضية إذا كانت فارغة
        if (!ERP.db.chartOfAccounts || ERP.db.chartOfAccounts.length === 0) {
            ERP.db.chartOfAccounts = [
                { id: 1, code: '1', name: 'الأصول', type: 'asset', parentId: null },
                { id: 2, code: '1.1', name: 'النقدية', type: 'asset', parentId: 1 },
                { id: 3, code: '1.2', name: 'العملاء', type: 'asset', parentId: 1 },
                { id: 4, code: '1.3', name: 'المخزون', type: 'asset', parentId: 1 },
                { id: 5, code: '2', name: 'الخصوم', type: 'liability', parentId: null },
                { id: 6, code: '2.1', name: 'الموردين', type: 'liability', parentId: 5 },
                { id: 7, code: '2.2', name: 'قروض', type: 'liability', parentId: 5 },
                { id: 8, code: '3', name: 'حقوق الملكية', type: 'equity', parentId: null },
                { id: 9, code: '3.1', name: 'رأس المال', type: 'equity', parentId: 8 },
                { id: 10, code: '4', name: 'الإيرادات', type: 'revenue', parentId: null },
                { id: 11, code: '4.1', name: 'المبيعات', type: 'revenue', parentId: 10 },
                { id: 12, code: '5', name: 'المصروفات', type: 'expense', parentId: null },
                { id: 13, code: '5.1', name: 'تكاليف البضاعة المباعة', type: 'expense', parentId: 12 },
                { id: 14, code: '5.2', name: 'مصروفات تشغيلية', type: 'expense', parentId: 12 },
            ];
        }
    },

    // وظائف المودال العامة
    openModal(type) {
        // هذه الدالة يتم تعريفها في كل موديول، ولكن هنا نضع الهيكل الأساسي
        // الموديول الحالي هو المسؤول عن ملء المحتوى
        if (typeof ERP.Modules[ERP.currentModule]?.openModal === 'function') {
            ERP.Modules[ERP.currentModule].openModal(type);
        }
    },

    closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.getElementById('modal-body').innerHTML = '';
        ERP.currentEditData = null;
    },

    finalizeModal(section) {
        ERP.saveData();
        ERP.closeModal();
        ERP.loadModule(section);
    },

    deleteItem(type, index) {
        if (!confirm('هل أنت متأكد من الحذف؟')) return;
        // منطق الحذف الخاص ببعض الأنواع
        if (type === 'payments') {
            const p = ERP.db.payments[index];
            if (p) {
                if (p.paymentType === 'customer' && ERP.db.customers[p.entityId])
                    ERP.db.customers[p.entityId].balance = (ERP.db.customers[p.entityId].balance || 0) + (p.amount || 0);
                if (p.paymentType === 'supplier' && ERP.db.suppliers[p.entityId])
                    ERP.db.suppliers[p.entityId].balance = (ERP.db.suppliers[p.entityId].balance || 0) + (p.amount || 0);
            }
        }
        if (type === 'entries') {
            const e = ERP.db.entries[index];
            if (e && e.invoiceId) {
                alert('لا يمكن حذف قيد مرتبط بفاتورة. احذف الفاتورة أولاً.');
                return;
            }
        }
        ERP.db[type].splice(index, 1);
        ERP.saveData();
        // إعادة تحميل الموديول الحالي لتحديث العرض
        ERP.loadModule(ERP.currentModule);
    },

    // إغلاق النوافذ المنبثقة
    closeStatement() {
        document.getElementById('statement-overlay').classList.add('hidden');
        ERP.currentStatementData = null;
    },

    closeInvoicePDF() {
        document.getElementById('invoice-pdf-overlay').classList.add('hidden');
        ERP.currentInvoicePDFData = null;
    },

    printStatement() {
        const content = document.querySelector('#statement-overlay .bg-white');
        if (!content) return;
        const printWin = window.open('', '_blank', 'width=900,height=700');
        printWin.document.write(
            '<html dir="rtl"><head><title>كشف حساب</title><style>body{font-family:Cairo,sans-serif;padding:20px;direction:rtl}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:right}.debit{color:#dc2626}.credit{color:#059669}</style></head><body>' +
            content.innerHTML + '</body></html>');
        printWin.document.close();
        setTimeout(() => printWin.print(), 500);
    },

    printInvoicePDF() {
        const content = document.getElementById('invoice-pdf-body').querySelector('.print-area');
        if (!content) return;
        const printWin = window.open('', '_blank', 'width=900,height=700');
        printWin.document.write(
            '<html dir="rtl"><head><title>فاتورة</title><style>body{font-family:Cairo,sans-serif;padding:20px;direction:rtl}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:right}@media print{body{padding:0}}</style></head><body>' +
            content.outerHTML + '</body></html>');
        printWin.document.close();
        setTimeout(() => printWin.print(), 500);
    },

    // كائن لتخزين دوال الموديولات
    Modules: {}
};

// تهيئة قاعدة البيانات عند بدء التشغيل
ERP.initDB();

// إغلاق النوافذ المنبثقة عند النقر خارجها
document.getElementById('modal-overlay')?.addEventListener('click', function(e) {
    if (e.target === this) ERP.closeModal();
});
document.getElementById('statement-overlay')?.addEventListener('click', function(e) {
    if (e.target === this) ERP.closeStatement();
});
document.getElementById('invoice-pdf-overlay')?.addEventListener('click', function(e) {
    if (e.target === this) ERP.closeInvoicePDF();
});

// دالة مساعدة للتأكد من تحميل DOM (تستخدم داخل الموديولات)
function whenReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
}
// js/app.js الجزء المعدل في ملف
const ERP = {
    db: JSON.parse(localStorage.getItem('erp_db_v3')) || {
        customers: [], suppliers: [], inventory: [], invoices: [], 
        entries: [], costs: [], payments: [], chartOfAccounts: [], monthlyClosings: []
    },

    loadModule(moduleName) {
        // تحديث الواجهة وتغيير العناوين
        const titles = { dashboard: 'لوحة التحكم', customers: 'العملاء', /* ... باقي العناوين */ };
        document.getElementById('section-title').innerText = titles[moduleName] || moduleName;
        
        // إخفاء كل الأقسام وإظهار القسم المطلوب
        document.querySelectorAll('#main-content > section').forEach(s => s.classList.add('hidden'));
        const target = document.getElementById(moduleName);
        if (target) target.classList.remove('hidden');

        // تحميل الملف برمجياً
        const script = document.createElement('script');
        script.src = `js/modules/${moduleName}.js?v=${Date.now()}`; // إضافة التوقيت لمنع الكاش
        script.onload = () => {
            // استدعاء دالة الرندر الموجودة داخل الموديول
            const renderFunctionName = 'render' + moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
            if (typeof window[renderFunctionName] === 'function') {
                window[renderFunctionName]();
            }
            lucide.createIcons();
        };
        document.body.appendChild(script);
    },

    saveData() {
        localStorage.setItem('erp_db_v3', JSON.stringify(this.db));
    }
};
