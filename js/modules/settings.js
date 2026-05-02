// js/modules/settings.js
// موديول الإعدادات وإدارة المستخدمين - خاص بالأدمن فقط

// قائمة الأدوار الكاملة مع الشرح الوظيفي
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
            
            <!-- خانة البحث -->
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
                    <tbody id="users-tbody">
                        <!-- سيتم تعبئته -->
                    </tbody>
                </table>
            </div>

            <!-- ملخص الأدوار المتاحة -->
            <div class="mt-6 bg-blue-50 p-4 rounded-lg">
                <h4 class="font-semibold mb-2">الأدوار الوظيفية المتاحة في السلم الإداري:</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    ${ALL_ROLES.map(r => `<div><strong>${r.name}</strong> <span class="text-xs text-gray-600">(${r.code})</span></div>`).join('')}
                </div>
                <p class="text-xs text-gray-500 mt-2">يمكنك البحث عن أي مستخدم أو دور بكتابة أي جزء من الاسم في خانة البحث أعلاه.</p>
            </div>
        </div>
    `;

    // تحميل البيانات
    loadUsersTable();

    // زر الإضافة
    document.getElementById('add-user-btn').addEventListener('click', () => openUserModal());

    // حدث البحث
    document.getElementById('user-search-input').addEventListener('input', function(e) {
        loadUsersTable(e.target.value.trim());
    });

    lucide.createIcons();
};

// ========== دوال مساعدة ==========

function loadUsersTable(filterText = '') {
    const users = ERP.getUsersDB();
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    // فلترة المستخدمين حسب النص المدخل (في اسم المستخدم أو اسم الدور المعروض)
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

function getRoleName(roleCode) {
    const role = ALL_ROLES.find(r => r.code === roleCode);
    return role ? role.name : roleCode;
}

async function openUserModal(user = null) {
    const isEdit = !!user;
    const title = isEdit ? 'تعديل مستخدم' : 'إضافة مستخدم جديد';
    const modalSave = document.getElementById('modal-save-btn');

    document.getElementById('modal-title').innerText = title;

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
                <select id="input-role" class="w-full border rounded-lg p-2.5">
                    ${ALL_ROLES.map(r => `<option value="${r.code}" ${user && user.role === r.code ? 'selected' : ''}>${r.name}</option>`).join('')}
                </select>
            </div>
        </div>
    `;

    // إظهار النافذة المنبثقة
    document.getElementById('modal-overlay').classList.remove('hidden');

    // إعادة تعريف عملية الحفظ
    modalSave.onclick = async () => {
        const username = document.getElementById('input-username').value.trim();
        const role = document.getElementById('input-role').value;

        if (!username) {
            alert('اسم المستخدم مطلوب');
            return;
        }

        const users = ERP.getUsersDB();
        const currentUserId = getCurrentSession()?.userId;

        if (isEdit) {
            // تعديل مستخدم
            const index = users.findIndex(u => u.id === user.id);
            if (index === -1) return alert('المستخدم غير موجود');
            // التأكد من عدم تكرار الاسم
            const duplicate = users.find(u => u.username === username && u.id !== user.id);
            if (duplicate) return alert('اسم المستخدم موجود مسبقاً');
            users[index].username = username;
            users[index].role = role;
        } else {
            // إضافة جديد
            const password = document.getElementById('input-password')?.value.trim();
            if (!password) return alert('كلمة المرور مطلوبة');
            const exists = users.some(u => u.username === username);
            if (exists) return alert('اسم المستخدم موجود مسبقاً');
            const newId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
            const hashedPass = await ERP.hashPassword(password);
            users.push({ id: newId, username, password: hashedPass, role });
        }

        ERP.saveUsersDB(users);
        closeModal();
        loadUsersTable();

        // إذا غيّر المستخدم الحالي دوره، نعيد بناء الشريط الجانبي
        if (isEdit && user.id === currentUserId) {
            buildSidebar();
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

    const hashed = await ERP.hashPassword(newPass);
    user.password = hashed;
    ERP.saveUsersDB(users);
    alert('تم تغيير كلمة المرور بنجاح');
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