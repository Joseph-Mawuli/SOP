-- ============================================
-- 9. SUPPLIERS TABLE (NEW - Supplier Module)
-- ============================================
CREATE TABLE suppliers (
  supplier_id SERIAL PRIMARY KEY,
  supplier_name VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  city VARCHAR(50),
  country VARCHAR(50),
  payment_terms VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. PRODUCT_SUPPLIERS TABLE (Join table)
-- ============================================
CREATE TABLE product_suppliers (
  product_supplier_id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  supplier_id INT NOT NULL REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
  supplier_sku VARCHAR(50),
  supplier_unit_price DECIMAL(10, 2),
  lead_time_days INT,
  minimum_order_qty INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, supplier_id)
);

-- ============================================
-- 11. AUDIT_LOGS TABLE (NEW - Advanced Audit Logging)
-- ============================================
CREATE TABLE audit_logs (
  audit_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failure')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 12. RATE_LIMIT_LOGS TABLE (NEW - Rate Limiting)
-- ============================================
CREATE TABLE rate_limit_logs (
  limit_id SERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  request_count INT DEFAULT 1,
  window_start TIMESTAMP,
  window_end TIMESTAMP,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- NEW INDEXES FOR NEW TABLES
-- ============================================
CREATE INDEX idx_suppliers_name ON suppliers(supplier_name);
CREATE INDEX idx_suppliers_email ON suppliers(email);
CREATE INDEX idx_product_suppliers_product_id ON product_suppliers(product_id);
CREATE INDEX idx_product_suppliers_supplier_id ON product_suppliers(supplier_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_rate_limit_logs_ip ON rate_limit_logs(ip_address);
CREATE INDEX idx_rate_limit_logs_endpoint ON rate_limit_logs(endpoint);
CREATE INDEX idx_rate_limit_logs_window ON rate_limit_logs(window_start, window_end);

-- ============================================
-- UPDATED SCHEMA COMPLETE
-- ============================================
-- Added 3 new tables: suppliers, product_suppliers, audit_logs, rate_limit_logs
-- Total tables now: 12 (previously 8)
-- New features: Supplier management, Advanced audit logging, Rate limiting infrastructure
