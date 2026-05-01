// modules/dashboard.js - إصلاح كامل

window.renderDashboard = function() {
    // حساب الإحصائيات من قاعدة البيانات العامة
    const totalSales = db.invoices.filter(inv => inv.type === 'sale').reduce((s, inv) => s + (inv.total || 0), 0);
    const totalPurchases = db.invoices.filter(inv => inv.type === 'purchase').reduce((s, inv) => s + (inv.total || 0), 0);
    const totalCosts = db.costs.reduce((s, c) => s + (c.amount || 0), 0);
    const totalProfit = db.invoices.filter(inv => inv.type === 'sale').reduce((s, inv) => s + (inv.totalProfit || 0), 0);
    const invValue = db.inventory.reduce((s, i) => s + ((i.costPrice || 0) * (i.quantity || 0)), 0);
    const customerBalance = db.customers.reduce((s, c) => s + (c.balance || 0), 0);
    const supplierBalance = db.suppliers.reduce((s, sup) => s + (sup.balance || 0), 0);
    const totalPaymentsIn = db.payments.filter(p => p.paymentType === 'customer').reduce((s, p) => s + (p.amount || 0), 0);
    const totalPaymentsOut = db.payments.filter(p => p.paymentType === 'supplier').reduce((s, p) => s + (p.amount || 0), 0);

    const dashboardSection = document.getElementById('dashboard');
    if (!dashboardSection) return;

    dashboardSection.innerHTML = `
        <div class="space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="stat-card border-r-4 border-blue-500">
                    <div class="flex justify-between">
                        <div><p class="text-xs text-gray-500">إجمالي المبيعات</p><h3 class="text-xl font-bold mt-1">${totalSales.toFixed(2)}</h3></div>
                        <div class="p-2.5 bg-blue-50 rounded-xl text-blue-500"><i data-lucide="trending-up"></i></div>
                    </div>
                </div>
                <div class="stat-card border-r-4 border-green-500">
                    <div class="flex justify-between">
                        <div><p class="text-xs text-gray-500">المشتريات</p><h3 class="text-xl font-bold mt-1">${totalPurchases.toFixed(2)}</h3></div>
                        <div class="p-2.5 bg-green-50 rounded-xl text-green-500"><i data-lucide="shopping-cart"></i></div>
                    </div>
                </div>
                <div class="stat-card border-r-4 border-purple-500">
                    <div class="flex justify-between">
                        <div><p class="text-xs text-gray-500">صافي الأرباح</p><h3 class="text-xl font-bold mt-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}">${totalProfit.toFixed(2)}</h3></div>
                        <div class="p-2.5 bg-purple-50 rounded-xl text-purple-500"><i data-lucide="dollar-sign"></i></div>
                    </div>
                </div>
                <div class="stat-card border-r-4 border-orange-500">
                    <div class="flex justify-between">
                        <div><p class="text-xs text-gray-500">قيمة المخزون</p><h3 class="text-xl font-bold mt-1">${invValue.toFixed(2)}</h3></div>
                        <div class="p-2.5 bg-orange-50 rounded-xl text-orange-500"><i data-lucide="package"></i></div>
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-4 gap-4">
                <div class="stat-card border-r-4 border-cyan-500"><p class="text-xs text-gray-500">رصيد العملاء</p><h3 class="text-lg font-bold mt-1">${customerBalance.toFixed(2)}</h3></div>
                <div class="stat-card border-r-4 border-red-500"><p class="text-xs text-gray-500">رصيد الموردين</p><h3 class="text-lg font-bold mt-1 text-red-600">${supplierBalance.toFixed(2)}</h3></div>
                <div class="stat-card border-r-4 border-teal-500"><p class="text-xs text-gray-500">تحصيلات</p><h3 class="text-lg font-bold mt-1 text-green-600">${totalPaymentsIn.toFixed(2)}</h3></div>
                <div class="stat-card border-r-4 border-rose-500"><p class="text-xs text-gray-500">مدفوعات</p><h3 class="text-lg font-bold mt-1 text-red-600">${totalPaymentsOut.toFixed(2)}</h3></div>
            </div>
        </div>
    `;
    lucide.createIcons();
};