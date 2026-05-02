// js/modules/settings.js
// موديول الإعدادات وإدارة المستخدمين - مع بحث عن الدور عند الإضافة

const ALL_ROLES = [
    { code: 'admin', name: 'مدير النظام (كامل الصلاحيات)' },
    { code: 'general_manager', name: 'المدير العام' },
    { code: 'financial_manager', name: 'المدير المالي' },
    { code: 'accountant', name: 'محاسب' },
    { code: 'sales_manager', name: 'مدير المبيعات' },
    { code: 'sales', name: 'مندوب مبيعات' },
    { code: 'inventory_manager', name: 'مدير المخزون' },
    { code: 'purchase_manager', name: 'مدير المشتريات' },
    { code: 'hr_manager', name: 'مدير الموارد البشرية' },
    { code: 'it_admin', name: 'مدير تقنية المعلومات' },
    { code: 'data_entry', name: 'موظف إدخال بيانات' }
];

window.renderSettings = function() {
    const section = document.getElementById('settings');
    if (!section) return;

    section.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold">إدارة المستخدمين والصلاحيات</h2>
                <button id="add-user-btn" class="btn-primary px-4 py-2 bg-blue-600 text-white rounded-lg">
                    <i data-lucide="user-plus" class="inline ml-1" size="16"></i> إضافة مستخدم
                </button>
            </div>
            
            <div class="mb-4">
                <input 
                    type="text" 
                    id="user-search-input" 
                    placeholder="ابحث عن مستخدم أو دور..." 
                    class="w-full border rounded-lg p-2.5"
                >
            </div>

            <div class="overflow-x-auto">
                <table class="w-full border-collapse">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="p-3 border text-right">اسم المستخدم</th>
                            <th class="p-3 border text-right">الدور</th>
                            <th class="p-3 border text-right">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="users-tbody"></tbody>
                </table>
            </div>

            <div class="mt-6 bg-blue-50 p-4 rounded-lg">
                <h4 class="font-semibold mb-2">الأدوار الوظيفية المتاحة:</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    ${ALL_ROLES.map(r => `<div><strong>${r.name}</strong> <span class="text-xs text-gray-600">(${r.code})</span></div>`).join('')}
                </div>
                <p class="text-xs text-gray-500 mt-2">يمكنك البحث عن أي مستخدم أو دور في الجدول أعلاه.</p>
            </div>
        </div>
    `;

    loadUsersTable();

    document.getElementById('add-user-btn').addEventListener('click', () => openUserModal());
    document.getElementById('user-search-input').addEventListener('input', e => loadUsersTable(e.target.value.trim()));

    lucide.createIcons();
};

function loadUsersTable(filterText = '') {
    const users = ERP.getUsersDB();
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    const filteredUsers = filterText 
        ? users.filter(u => {
            const roleName = (ALL_ROLES.find(r => r.code === u.role) || {}).name || u.role;
            return u.username.includes(filterText) || roleName.includes(filterText);
        })
        : users;

    if (filteredUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-gray-500">لا توجد نتائج مطابقة</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredUsers.map(user => {
        const roleInfo = ALL_ROLES.find(r => r.code === user.role);
        const roleDisplay = roleInfo ? roleInfo.name : user.role;
        return `
        <tr class="border-t">
            <td class="p-3 border">${user.username}</td>
            <td class="p-3 border">${roleDisplay}</td>
            <td class="p-3 border space-x-2 space-x-reverse">
                <button class="text-blue-600 hover:underline" onclick="editUser(${user.id})">تعديل</button>
                <button class="text-yellow-600 hover:underline" onclick="changePassword(${user.id})">كلمة المرور</button>
                <button class="text-red-600 hover:underline" onclick="deleteUser(${user.id})">حذف</button>
            </td>
        </tr>`;
    }).join('');
}

// ========== نافذة الإضافة/التعديل مع بحث عن الدور ==========
async function openUserModal(user = null) {
    const isEdit = !!user;
    document.getElementById('modal-title').innerText = isEdit ? 'تعديل مستخدم' : 'إضافة مستخدم جديد';

    const selectedRole = user ? user.role : ALL_ROLES[0].code;

    document.getElementById('modal-body').innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-1">اسم المستخدم</label>
                <input id="input-username" class="w-full border rounded-lg p-2.5" value="${user ? user.username : ''}">
            </div>
            ${!isEdit ? `
            <div>
                <label class="block text-sm font-medium mb-1">كلمة المرور</label>
                <input id="input-password" type="password" class="w-full border rounded-lg p-2.5" placeholder="ادخل كلمة المرور">
            </div>` : ''}
            <div>
                <label class="block text-sm font-medium mb-1">الدور الوظيفي</label>
                <input type="text" id="role-search" placeholder="ابحث عن دور..." class="w-full border rounded-lg p-2.5 mb-2">
                <select id="input-role" class="w-full border rounded-lg p-2.5" size="5"></select>
            </div>
        </div>
    `;

    // دالة تعبئة القائمة المنسدلة حسب البحث
    function populateRoleSelect(filter = '') {
        const select = document.getElementById('input-role');
        if (!select) return;
        const filteredRoles = ALL_ROLES.filter(r => r.name.includes(filter) || r.code.includes(filter));
        select.innerHTML = filteredRoles.map(r => `<option value="${r.code}" ${selectedRole === r.code ? 'selected' : ''}>${r.name}</option>`).join('');
        if (filteredRoles.length === 0) {
            select.innerHTML = '<option disabled>لا توجد أدوار مطابقة</option>';
        }
    }
    populateRoleSelect();
    document.getElementById('role-search').addEventListener('input', e => populateRoleSelect(e.target.value.trim()));

    document.getElementById('modal-overlay').classList.remove('hidden');

    const modalSave = document.getElementById('modal-save-btn');
    modalSave.onclick = async () => {
        const username = document.getElementById('input-username').value.trim();
        const roleSelect = document.getElementById('input-role');
        const role = roleSelect.value;

        if (!username) { alert('اسم المستخدم مطلوب'); return; }
        if (!role) { alert('يرجى اختيار دور'); return; }

        const users = ERP.getUsersDB();
        const currentUserId = getCurrentSession()?.userId;

        try {
            if (isEdit) {
                const index = users.findIndex(u => u.id === user.id);
                if (index === -1) return alert('المستخدم غير موجود');
                const duplicate = users.find(u => u.username === username && u.id !== user.id);
                if (duplicate) return alert('اسم المستخدم موجود مسبقاً');
                users[index].username = username;
                users[index].role = role;
            } else {
                const password = document.getElementById('input-password')?.value.trim();
                if (!password) { alert('كلمة المرور مطلوبة'); return; }
                const exists = users.some(u => u.username === username);
                if (exists) { alert('اسم المستخدم موجود مسبقاً'); return; }
                const newId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
                const hashedPass = await ERP.hashPassword(password);
                users.push({ id: newId, username, password: hashedPass, role });
            }

            ERP.saveUsersDB(users);
            closeModal();
            loadUsersTable();

            if (isEdit && user.id === currentUserId) {
                buildSidebar();
            }
        } catch (err) {
            alert('فشل في حفظ المستخدم: ' + err.message);
        }
    };
}

async function editUser(userId) {
    const users = ERP.getUsersDB();
    const user = users.find(u => u.id === userId);
    if (!user) return;
    await openUserModal(user);
}

async function changePassword(userId) {
    const users = ERP.getUsersDB();
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newPass = prompt(`أدخل كلمة المرور الجديدة للمستخدم: ${user.username}`);
    if (!newPass) return;
    try {
        user.password = await ERP.hashPassword(newPass);
        ERP.saveUsersDB(users);
        alert('تم تغيير كلمة المرور بنجاح');
    } catch (e) {
        alert('فشل التغيير: ' + e.message);
    }
}

function deleteUser(userId) {
    const session = getCurrentSession();
    if (userId === session.userId) {
        alert('لا يمكنك حذف حسابك الحالي');
        return;
    }
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    let users = ERP.getUsersDB();
    users = users.filter(u => u.id !== userId);
    ERP.saveUsersDB(users);
    loadUsersTable();
}