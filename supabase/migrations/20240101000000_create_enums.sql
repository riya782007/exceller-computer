-- Create custom enum types for the Exceller Computer Platform
-- These define the allowed values for role, status, and category columns

CREATE TYPE user_role AS ENUM ('admin', 'technician', 'customer');
CREATE TYPE job_status AS ENUM ('received', 'diagnosed', 'quoted', 'approved', 'in_repair', 'ready', 'delivered', 'cancelled');
CREATE TYPE inventory_category AS ENUM ('part', 'refurbished_laptop', 'accessory');
CREATE TYPE bot_state AS ENUM ('active', 'paused', 'escalated');
CREATE TYPE tax_type AS ENUM ('intra_state', 'inter_state');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partial', 'cancelled');
