// js/modules/settings.js
// موديول الإعدادات وإدارة المستخدمين - مع إصلاح زر الإضافة والنافذة المنبثقة

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

// ========== إنشاء النافذة المنبثقة إذا لم تكن موجودة ==========
function ensureModalExists() {
    if (document.getElementById('modal-overlay')) return;
    
    const modalHTML = `
        <div id="modal-overlay" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 id="modal-title" class="text-xl font-bold">إضافة مستخدم</h3>
                    <button id="modal-close-btn" class="text-gray-500 hover:text-gray-700">&times;</button>
                </div>
                <div id="modal-body"></div>
                <div class="flex justify-left gap-3 mt-6">
                    <button id="modal-save-btn" class="btn-primary px-4 py-2 bg-blue-600 text-white rounded-lg">حفظ</button>
                    <button id="modal-cancel-btn" class="px-4 py-2 bg-gray-300 rounded-lg">إلغاء</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // ربط أحداث الإغلاق
    document.getElementById('modal-close-btn').onclick = closeModal;
    document.getElementById('modal-cancel-btn').onclick = closeModal;
    document.getElementById('modal-overlay').onclick = (e) => {
        if (e.target === document.getElementById('modal-overlay')) closeModal();
    };
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.add('hidden');
}

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

    // التأكد من وجود النافذة المنبثقة
    ensureModalExists();
    
    // ربط الأحداث
    document.getElementById('add-user-btn').onclick = () => openUserModal(null);
    document.getElementById('user-search-input').oninput = function(e) {
        loadUsersTable(e.target.value.trim());
    };

    loadUsersTable();
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
            <td class="p-3 border">${escapeHtml(user.username)}</td>
            <td class="p-3 border">${escapeHtml(roleDisplay)}</td>
            <td class="p-3 border space-x-2 space-x-reverse">
                <button class="text-blue-600 hover:underline" onclick="editUser(${user.id})">تعديل</button>
                <button class="text-yellow-600 hover:underline" onclick="changePassword(${user.id})">كلمة المرور</button>
                <button class="text-red-600 hover:underline" onclick="deleteUser(${user.id})">حذف</button>
            </td>
        <tr>`;
    }).join('');
}

// دالة مساعدة لمنع هجمات XSS
function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== فتح نافذة إضافة / تعديل مستخدم ==========
function openUserModal(user) {
    const isEdit = !!user;  // true إذا كان user موجوداً (تعديل)، false إذا كان null أو undefined (إضافة)
    ensureModalExists();
    
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    if (!modalTitle || !modalBody) {
        console.error('عناصر النافذة غير موجودة');
        return;
    }
    
    // تعيين العنوان بشكل صريح
    modalTitle.innerText = isEdit ? 'تعديل مستخدم' : 'إضافة مستخدم جديد';
    
    // القيمة المبدئية للدور: في حالة التعديل نأخذ دور المستخدم، وإلا admin
    const selectedRole = user ? user.role : 'admin';
    
    modalBody.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-1">اسم المستخدم</label>
                <input id="input-username" class="w-full border rounded-lg p-2.5" value="${user ? escapeHtml(user.username) : ''}">
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
    
    // دالة ملء قائمة الأدوار مع فلترة
    function populateRoleSelect(filter = '') {
        const select = document.getElementById('input-role');
        if (!select) return;
        const filteredRoles = ALL_ROLES.filter(r => 
            r.name.includes(filter) || r.code.includes(filter)
        );
        select.innerHTML = filteredRoles.map(r => 
            `<option value="${r.code}" ${selectedRole === r.code ? 'selected' : ''}>${escapeHtml(r.name)}</option>`
        ).join('');
        if (filteredRoles.length === 0) {
            select.innerHTML = '<option disabled>لا توجد أدوار مطابقة</option>';
        }
    }
    populateRoleSelect();
    
    const roleSearch = document.getElementById('role-search');
    if (roleSearch) {
        roleSearch.oninput = function(e) {
            populateRoleSelect(e.target.value.trim());
        };
    }
    
    // إظهار النافذة
    document.getElementById('modal-overlay').classList.remove('hidden');
    
    // ربط زر الحفظ (إزالة أي مستمع سابق لمنع التكرار)
    const saveBtn = document.getElementById('modal-save-btn');
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    
    newSaveBtn.onclick = async function() {
        const username = document.getElementById('input-username').value.trim();
        const roleSelect = document.getElementById('input-role');
        const role = roleSelect ? roleSelect.value : null;
        
        if (!username) {
            alert('اسم المستخدم مطلوب');
            return;
        }
        if (!role) {
            alert('يرجى اختيار دور');
            return;
        }
        
        const users = ERP.getUsersDB();
        const session = getCurrentSession();
        const currentUserId = session ? session.userId : null;
        
        try {
            if (isEdit) {
                // تعديل مستخدم موجود
                const index = users.findIndex(u => u.id === user.id);
                if (index === -1) {
                    alert('المستخدم غير موجود');
                    return;
                }
                // التحقق من عدم تكرار اسم المستخدم (باستثناء نفس المستخدم)
                const duplicate = users.find(u => u.username === username && u.id !== user.id);
                if (duplicate) {
                    alert('اسم المستخدم موجود مسبقاً');
                    return;
                }
                users[index].username = username;
                users[index].role = role;
                ERP.saveUsersDB(users);
                alert('تم تعديل المستخدم بنجاح');
            } else {
                // إضافة مستخدم جديد
                const password = document.getElementById('input-password').value.trim();
                if (!password) {
                    alert('كلمة المرور مطلوبة');
                    return;
                }
                const exists = users.some(u => u.username === username);
                if (exists) {
                    alert('اسم المستخدم موجود مسبقاً');
                    return;
                }
                const newId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
                const hashedPass = await ERP.hashPassword(password);
                users.push({ id: newId, username, password: hashedPass, role });
                ERP.saveUsersDB(users);
                alert('تم إضافة المستخدم بنجاح');
            }
            
            closeModal();
            loadUsersTable(); // تحديث الجدول
            
            // إذا تم تعديل المستخدم الحالي، تحديث القائمة الجانبية
            if (isEdit && user.id === currentUserId) {
                buildSidebar();
            }
        } catch (err) {
            console.error(err);
            alert('فشل في حفظ المستخدم: ' + err.message);
        }
    };
}

// ========== دوال إدارة المستخدمين ==========
function editUser(userId) {
    const users = ERP.getUsersDB();
    const user = users.find(u => u.id === userId);
    if (!user) {
        alert('المستخدم غير موجود');
        return;
    }
    openUserModal(user);
}

function changePassword(userId) {
    const users = ERP.getUsersDB();
    const user = users.find(u => u.id === userId);
    if (!user) {
        alert('المستخدم غير موجود');
        return;
    }
    const newPass = prompt(`أدخل كلمة المرور الجديدة للمستخدم: ${user.username}`);
    if (!newPass) return;
    ERP.hashPassword(newPass).then(hashed => {
        user.password = hashed;
        ERP.saveUsersDB(users);
        alert('تم تغيير كلمة المرور بنجاح');
    }).catch(e => alert('فشل التغيير: ' + e.message));
}

function deleteUser(userId) {
    const session = getCurrentSession();
    if (session && userId === session.userId) {
        alert('لا يمكنك حذف حسابك الحالي');
        return;
    }
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    let users = ERP.getUsersDB();
    users = users.filter(u => u.id !== userId);
    ERP.saveUsersDB(users);
    loadUsersTable();
}