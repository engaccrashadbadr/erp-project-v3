// js/modules/settings.js
// موديول الإعدادات وإدارة المستخدمين - خاص بالأدمن فقط

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
        </div>
    `;

    // تحميل بيانات المستخدمين
    loadUsersTable();

    // زر الإضافة
    document.getElementById('add-user-btn').addEventListener('click', () => openUserModal());

    lucide.createIcons();
};

// ========== دوال مساعدة ==========

function loadUsersTable() {
    const users = ERP.getUsersDB();
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    tbody.innerHTML = users.map(user => `
        <tr class="border-t">
            <td class="p-3 border">${user.username}</td>
            <td class="p-3 border capitalize">${getRoleName(user.role)}</td>
            <td class="p-3 border space-x-2 space-x-reverse">
                <button class="text-blue-600 hover:underline" onclick="editUser(${user.id})">تعديل</button>
                <button class="text-yellow-600 hover:underline" onclick="changePassword(${user.id})">كلمة المرور</button>
                <button class="text-red-600 hover:underline" onclick="deleteUser(${user.id})">حذف</button>
            </td>
        </tr>
    `).join('');
}

function getRoleName(roleCode) {
    return roleCode === 'admin' ? 'مدير النظام' : 
           roleCode === 'sales' ? 'مندوب مبيعات' : roleCode;
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
                <label class="block text-sm font-medium mb-1">الدور</label>
                <select id="input-role" class="w-full border rounded-lg p-2.5">
                    <option value="admin" ${user && user.role === 'admin' ? 'selected' : ''}>مدير النظام (كامل الصلاحيات)</option>
                    <option value="sales" ${user && user.role === 'sales' ? 'selected' : ''}>مندوب مبيعات (محدود)</option>
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
        const currentUserId = getCurrentSession().userId;

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
            // إعادة تحميل الصلاحيات بعد تغيير الدور (دون تسجيل خروج)
            // طالما الجلسة لا تزال محفوظة، نقوم بتحديث الشريط
            buildSidebar();
        }
    };

    // زر الإلغاء يستخدم closeModal
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