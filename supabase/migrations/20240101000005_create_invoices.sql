-- Invoices and invoice items tables
-- GST-compliant invoicing with CGST/SGST (intra-state) or IGST (inter-state)

-- Sequence for invoice numbers
CREATE SEQUENCE invoice_number_seq START WITH 1;

-- Function to generate invoice numbers in format EXC-YYYY-NNNN
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'EXC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_number_seq')::text, 4, '0');
END;
$$;

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL DEFAULT public.generate_invoice_number(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  job_id UUID REFERENCES repair_jobs(id) ON DELETE SET NULL,
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  tax_type tax_type NOT NULL DEFAULT 'intra_state',
  cgst NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (cgst >= 0),
  sgst NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (sgst >= 0),
  igst NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (igst >= 0),
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  payment_status payment_status NOT NULL DEFAULT 'pending',
  pdf_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  hsn_sac TEXT,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_job ON invoices(job_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: invoices
-- Admin: full access
CREATE POLICY "admin_full_access_invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Customers: read own invoices
CREATE POLICY "customers_read_own_invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- RLS Policies: invoice_items
-- Admin: full access
CREATE POLICY "admin_full_access_invoice_items"
  ON invoice_items
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Customers: read own invoice items
CREATE POLICY "customers_read_own_invoice_items"
  ON invoice_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices i WHERE i.id = invoice_id AND i.customer_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
