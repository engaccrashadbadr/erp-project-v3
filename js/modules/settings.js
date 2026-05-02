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
            
            <!-- خانة البحث الجديدة -->
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

            <!-- عرض الأدوار المتاحة -->
            <div class="mt-6 bg-blue-50 p-4 rounded-lg">
                <h4 class="font-semibold mb-2">الأدوار المتاحة:</h4>
                <ul class="list-disc list-inside space-y-1 text-sm">
                    <li><strong>مدير النظام (admin)</strong>: صلاحيات كاملة لجميع الأقسام والإعدادات.</li>
                    <li><strong>مندوب مبيعات (sales)</strong>: يصل إلى لوحة التحكم، العملاء، والفواتير فقط.</li>
                </ul>
                <p class="text-xs text-gray-500 mt-2">يمكن البحث عن أي دور بكتابة اسمه أو جزء منه في خانة البحث أعلاه.</p>
            </div>
        </div>
    `;

    // تحميل بيانات المستخدمين أول مرة
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

    // فلترة المستخدمين حسب النص المدخل (في اسم المستخدم أو اسم الدور)
    const filteredUsers = filterText 
        ? users.filter(u => 
            u.username.includes(filterText) || 
            getRoleName(u.role).includes(filterText)
          )
        : users;

    if (filteredUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-gray-500">لا توجد نتائج مطابقة</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredUsers.map(user => `
        <tr class="border-t">
            <td class="p-3 border">${user.username}</td>
            <td class="p-3 border">${getRoleName(user.role)}</td>
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

// ... باقي الدوال (openUserModal, editUser, changePassword, deleteUser) تبقى كما هي بدون تغيير