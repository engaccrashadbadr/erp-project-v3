// موديول أرباح المنتجات

window.renderProfit = function() {
    const container = document.getElementById('profit');
    if (!container) return;
    const saleInvoices = db.invoices.filter(inv => inv.type === 'sale');
    const productProfit = {};
    saleInvoices.forEach(inv => {
        if (inv.items) inv.items.forEach(item => {
            const key = item.name;
            if (!productProfit[key]) productProfit[key] = { qty: 0, revenue: 0, cost: 0, profit: 0 };
            productProfit[key].qty += (item.quantity || 0);
            productProfit[key].revenue += (item.lineTotal || 0);
            productProfit[key].cost += (item.lineCost || 0);
            productProfit[key].profit += (item.lineProfit || 0);
        });
    });
    const totalRevenue = Object.values(productProfit).reduce((s, p) => s + p.revenue, 0);
    const totalCostAll = Object.values(productProfit).reduce((s, p) => s + p.cost, 0);
    const totalProfitAll = Object.values(productProfit).reduce((s, p) => s + p.profit, 0);
    container.innerHTML = `
    <div class="card p-5">
      <h3 class="text-lg font-bold mb-4">أرباح المنتجات</h3>
      <div class="grid grid-cols-3 gap-3 mb-5">
        <div class="stat-card text-center"><p class="text-xs">الإيرادات</p><h4 class="text-xl font-bold text-blue-600">${totalRevenue.toFixed(2)}</h4></div>
        <div class="stat-card text-center"><p class="text-xs">التكاليف</p><h4 class="text-xl font-bold text-red-600">${totalCostAll.toFixed(2)}</h4></div>
        <div class="stat-card text-center"><p class="text-xs">الأرباح</p><h4 class="text-xl font-bold ${totalProfitAll>=0?'text-green-600':'text-red-600'}">${totalProfitAll.toFixed(2)}</h4></div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-right">
          <thead><tr><th class="p-3">المنتج</th><th class="p-3">الكمية</th><th class="p-3">الإيرادات</th><th class="p-3">التكاليف</th><th class="p-3">الربح</th></tr></thead>
          <tbody>
            ${Object.keys(productProfit).length===0?'<tr><td colspan="5" class="p-4 text-center text-gray-400">لا توجد مبيعات</td></tr>':
            Object.entries(productProfit).map(([name,p])=>`<tr class="border-b"><td class="p-3 font-semibold">${name}</td><td class="p-3">${p.qty}</td><td class="p-3 text-blue-600">${p.revenue.toFixed(2)}</td><td class="p-3 text-red-600">${p.cost.toFixed(2)}</td><td class="p-3 font-bold ${p.profit>=0?'text-green-600':'text-red-600'}">${p.profit.toFixed(2)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
    lucide.createIcons();
};