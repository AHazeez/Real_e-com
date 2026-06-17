CREATE DATABASE IF NOT EXISTS wake_cake CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wake_cake;

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  last_login_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_roles FOREIGN KEY (role_id) REFERENCES roles(id),
  INDEX idx_users_role_id (role_id),
  INDEX idx_users_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'India',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_customers_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT,
  name VARCHAR(180) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(120),
  stock_quantity INT NOT NULL DEFAULT 0,
  image_url VARCHAR(500),
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_categories FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT chk_products_price CHECK (price >= 0),
  CONSTRAINT chk_products_stock CHECK (stock_quantity >= 0),
  INDEX idx_products_category_id (category_id),
  INDEX idx_products_status (status),
  INDEX idx_products_name (name),
  INDEX idx_products_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT NOT NULL UNIQUE,
  stock_quantity INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inventory_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT chk_inventory_stock CHECK (stock_quantity >= 0),
  CONSTRAINT chk_inventory_reorder CHECK (reorder_level >= 0),
  INDEX idx_inventory_low_stock (stock_quantity, reorder_level)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS carts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_carts_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_carts_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT chk_carts_quantity CHECK (quantity > 0),
  UNIQUE KEY uq_carts_user_product (user_id, product_id),
  INDEX idx_carts_user_id (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  order_number VARCHAR(40) NOT NULL UNIQUE,
  status ENUM('Pending', 'Confirmed', 'Baking', 'Ready', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_address TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_users FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT chk_orders_amounts CHECK (subtotal >= 0 AND tax_amount >= 0 AND delivery_fee >= 0 AND total_amount >= 0),
  INDEX idx_orders_user_id (user_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  product_name VARCHAR(180) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_orders FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_products FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT chk_order_items_quantity CHECK (quantity > 0),
  CONSTRAINT chk_order_items_amounts CHECK (unit_price >= 0 AND line_total >= 0),
  INDEX idx_order_items_order_id (order_id),
  INDEX idx_order_items_product_id (product_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  payment_method VARCHAR(80) NOT NULL DEFAULT 'COD',
  status ENUM('Pending', 'Paid', 'Failed', 'Refunded') NOT NULL DEFAULT 'Pending',
  amount DECIMAL(10,2) NOT NULL,
  transaction_reference VARCHAR(190),
  paid_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_orders FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT chk_payments_amount CHECK (amount >= 0),
  INDEX idx_payments_order_id (order_id),
  INDEX idx_payments_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS app_settings (
  id TINYINT PRIMARY KEY,
  company_name VARCHAR(180) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address VARCHAR(500) NOT NULL,
  instagram VARCHAR(255),
  facebook VARCHAR(255),
  twitter VARCHAR(255),
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_app_settings_singleton CHECK (id = 1),
  CONSTRAINT chk_app_settings_delivery_fee CHECK (delivery_fee >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reports (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  report_type ENUM('daily_sales', 'weekly_sales', 'monthly_sales', 'top_selling_products') NOT NULL,
  report_date DATE NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reports_type_date (report_type, report_date)
) ENGINE=InnoDB;

INSERT INTO roles (name) VALUES ('Admin'), ('Customer')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO categories (category_name) VALUES
('Chocolate Cakes'),
('Fruit Cakes'),
('Cupcakes'),
('Custom Cakes')
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name);

INSERT INTO app_settings
  (id, company_name, email, phone, address, instagram, facebook, twitter, delivery_fee)
VALUES
  (1, 'Wake Cake Bakery', 'support@example.com', '+1 000 000 0000', 'Configure production address', NULL, NULL, NULL, 0.00)
ON DUPLICATE KEY UPDATE id = VALUES(id);
