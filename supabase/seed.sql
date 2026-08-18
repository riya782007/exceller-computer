-- Seed data for development environment
-- DO NOT run this in production

-- Note: In development, create an admin user through the Supabase dashboard
-- or Auth API first, then this seed will create the profile record.

-- Sample inventory items (for testing)
INSERT INTO inventory_items (sku, name, category, brand, model, cost_price, selling_price, quantity, hsn_sac, is_public, condition, warranty_months)
VALUES
  ('SCR-DELL-15', 'Dell Inspiron 15 LCD Screen', 'part', 'Dell', 'Inspiron 15', 2500, 4500, 10, '85285900', false, 'New', 3),
  ('SCR-HP-14', 'HP Pavilion 14 LCD Screen', 'part', 'HP', 'Pavilion 14', 2300, 4200, 8, '85285900', false, 'New', 3),
  ('BAT-DELL-LAT', 'Dell Latitude E5xxx Battery', 'part', 'Dell', 'Latitude E5', 1800, 3000, 15, '85076000', false, 'New', 6),
  ('BAT-HP-ELITE', 'HP EliteBook Battery', 'part', 'HP', 'EliteBook', 2000, 3500, 12, '85076000', false, 'New', 6),
  ('SSD-256-SATA', 'Kingston 256GB SATA SSD', 'part', NULL, NULL, 1800, 2800, 20, '84717020', false, 'New', 12),
  ('SSD-512-NVME', 'Samsung 512GB NVMe SSD', 'part', 'Samsung', '980', 3200, 4800, 15, '84717020', false, 'New', 12),
  ('RAM-8GB-DDR4', '8GB DDR4 RAM', 'part', NULL, NULL, 1200, 1800, 25, '84733020', false, 'New', NULL),
  ('RAM-16GB-DDR4', '16GB DDR4 RAM', 'part', NULL, NULL, 2400, 3500, 18, '84733020', false, 'New', NULL),
  ('KB-DELL-LAT', 'Dell Latitude Keyboard', 'part', 'Dell', 'Latitude', 800, 1500, 10, '84716060', false, 'New', 3),
  ('CHRG-USB-C-65W', 'USB-C 65W Charger Universal', 'accessory', NULL, NULL, 600, 1200, 30, '85044090', true, 'New', 6),
  ('RFBL-DELL-5490', 'Dell Latitude 5490 (i5/8GB/256GB)', 'refurbished_laptop', 'Dell', 'Latitude 5490', 18000, 28000, 3, '84713010', true, 'Grade A Refurbished', 6),
  ('RFBL-HP-840G5', 'HP EliteBook 840 G5 (i5/8GB/256GB)', 'refurbished_laptop', 'HP', 'EliteBook 840 G5', 19000, 30000, 2, '84713010', true, 'Grade A Refurbished', 6),
  ('RFBL-LEN-T480', 'Lenovo ThinkPad T480 (i5/8GB/512GB)', 'refurbished_laptop', 'Lenovo', 'ThinkPad T480', 20000, 32000, 4, '84713010', true, 'Grade A Refurbished', 6)
ON CONFLICT (sku) DO NOTHING;
