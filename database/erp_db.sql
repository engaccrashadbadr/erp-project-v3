-- جدول المستخدمين
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الأدوار
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- جدول الصلاحيات
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- علاقة many-to-many بين الأدوار والصلاحيات
CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- الصفحات الأساسية (كي نتحكم بها من خلال الصلاحيات)
INSERT INTO permissions (name, description) VALUES 
('dashboard', 'لوحة التحكم'),
('customers', 'العملاء'),
('suppliers', 'الموردين'),
('inventory', 'المخزون'),
('invoices', 'الفواتير'),
('payments', 'السداد والتحصيل'),
('accounting', 'القيود اليومية'),
('chartOfAccounts', 'شجرة الحسابات'),
('costs', 'التكاليف والتقارير'),
('profit', 'أرباح المنتجات'),
('financialStatements', 'القوائم المالية'),
('monthlyClosing', 'الإقفال الشهري'),
('backup', 'النسخ والبيانات');

-- الأدوار الافتراضية
INSERT INTO roles (name, description) VALUES 
('admin', 'مدير النظام'),
('sales', 'مندوب مبيعات');

-- ربط الأدوار بالصلاحيات
-- المدير: جميع الصلاحيات
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- مندوب المبيعات: صلاحيات محدودة
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE name IN ('dashboard', 'customers', 'invoices');

-- مستخدم افتراضي (كلمة المرور "123" بعد التشفير)
-- سيتم إنشاؤه لاحقاً من خلال واجهة التسجيل أو يمكنك إضافته يدوياً باستخدام PHP
-- INSERT INTO users (username, password, role_id) VALUES ('admin', '$2y$10$...', 1);

-- الجداول الوظيفية (ستضيفها لاحقاً أو تترك إنشاءها للواجهة)
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0,
    supplier_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT,
    total DECIMAL(10,2) DEFAULT 0,
    status ENUM('pending','paid','cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);