import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  type DocumentProps,
} from '@react-pdf/renderer'
import { BUSINESS } from '@/lib/constants'
import type { TaxType, PaymentStatus } from '@/types'

// ============================================
// Types for PDF Template Data
// ============================================

export interface InvoicePdfData {
  invoiceNumber: string
  invoiceDate: string
  customer: {
    name: string
    email?: string | null
    phone?: string | null
    address?: string | null
  }
  jobCardNumber?: string | null
  items: Array<{
    description: string
    hsnSac?: string | null
    quantity: number
    unitPrice: number
    amount: number
  }>
  subtotal: number
  taxType: TaxType
  cgst: number
  sgst: number
  igst: number
  total: number
  paymentStatus: PaymentStatus
  notes?: string | null
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
    paddingBottom: 15,
  },
  companyInfo: {
    flexDirection: 'column',
    maxWidth: '60%',
  },
  companyName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 8,
    color: '#4B5563',
    marginBottom: 2,
  },
  invoiceTitle: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  invoiceTitleText: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#1E40AF',
    marginBottom: 6,
  },
  invoiceMeta: {
    fontSize: 9,
    color: '#374151',
    marginBottom: 2,
    textAlign: 'right',
  },
  invoiceMetaLabel: {
    fontFamily: 'Helvetica-Bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1F2937',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customerRow: {
    fontSize: 9,
    color: '#374151',
    marginBottom: 2,
  },
  customerName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 3,
  },
  // Table styles
  table: {
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 7,
    paddingHorizontal: 6,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 7,
    paddingHorizontal: 6,
    backgroundColor: '#F9FAFB',
  },
  colSno: { width: '6%' },
  colDesc: { width: '36%' },
  colHsn: { width: '14%' },
  colQty: { width: '10%', textAlign: 'right' },
  colRate: { width: '17%', textAlign: 'right' },
  colAmt: { width: '17%', textAlign: 'right' },
  headerText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    textTransform: 'uppercase',
  },
  cellText: {
    fontSize: 9,
    color: '#374151',
  },
  // Totals
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  totalsBox: {
    width: '45%',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  totalsLabel: {
    fontSize: 9,
    color: '#4B5563',
  },
  totalsValue: {
    fontSize: 9,
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
  },
  totalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#1E40AF',
    marginTop: 4,
  },
  totalFinalLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
  },
  totalFinalValue: {
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
  },
  footerDivider: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 7,
    color: '#6B7280',
    marginBottom: 2,
  },
  footerBold: {
    fontSize: 7,
    color: '#374151',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  signatureArea: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  signatureBox: {
    width: '40%',
    borderTopWidth: 1,
    borderTopColor: '#9CA3AF',
    paddingTop: 6,
    alignItems: 'center',
  },
  signatureText: {
    fontSize: 8,
    color: '#4B5563',
  },
  // Payment badge
  paymentBadge: {
    position: 'absolute',
    top: 40,
    right: 40,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  paymentBadgeText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  notesSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
  },
  notesText: {
    fontSize: 8,
    color: '#4B5563',
  },
})

// ============================================
// Helper Functions
// ============================================

function formatCurrencyPdf(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getPaymentBadgeColor(status: PaymentStatus): { bg: string; text: string } {
  switch (status) {
    case 'paid':
      return { bg: '#D1FAE5', text: '#065F46' }
    case 'pending':
      return { bg: '#FEF3C7', text: '#92400E' }
    case 'partial':
      return { bg: '#DBEAFE', text: '#1E40AF' }
    case 'cancelled':
      return { bg: '#FEE2E2', text: '#991B1B' }
    default:
      return { bg: '#F3F4F6', text: '#374151' }
  }
}

// ============================================
// PDF Document Component
// ============================================

export function InvoicePdfDocument({
  data,
}: {
  data: InvoicePdfData
}): React.ReactElement<DocumentProps> {
  const badgeColor = getPaymentBadgeColor(data.paymentStatus)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Payment Status Badge */}
        <View
          style={[styles.paymentBadge, { backgroundColor: badgeColor.bg }]}
          fixed
        >
          <Text style={[styles.paymentBadgeText, { color: badgeColor.text }]}>
            {data.paymentStatus}
          </Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{BUSINESS.legalName}</Text>
            <Text style={styles.companyDetail}>
              {BUSINESS.address.street}, {BUSINESS.address.area}
            </Text>
            <Text style={styles.companyDetail}>
              {BUSINESS.address.city}, {BUSINESS.address.state} – {BUSINESS.address.pincode}
            </Text>
            <Text style={styles.companyDetail}>
              Phone: {BUSINESS.phone} | Email: {BUSINESS.email}
            </Text>
            {BUSINESS.gst && (
              <Text style={styles.companyDetail}>GSTIN: {BUSINESS.gst}</Text>
            )}
          </View>
          <View style={styles.invoiceTitle}>
            <Text style={styles.invoiceTitleText}>TAX INVOICE</Text>
            <Text style={styles.invoiceMeta}>
              <Text style={styles.invoiceMetaLabel}>Invoice: </Text>
              {data.invoiceNumber}
            </Text>
            <Text style={styles.invoiceMeta}>
              <Text style={styles.invoiceMetaLabel}>Date: </Text>
              {data.invoiceDate}
            </Text>
            {data.jobCardNumber && (
              <Text style={styles.invoiceMeta}>
                <Text style={styles.invoiceMetaLabel}>Job Card: </Text>
                {data.jobCardNumber}
              </Text>
            )}
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={styles.customerName}>{data.customer.name}</Text>
          {data.customer.phone && (
            <Text style={styles.customerRow}>Phone: {data.customer.phone}</Text>
          )}
          {data.customer.email && (
            <Text style={styles.customerRow}>Email: {data.customer.email}</Text>
          )}
          {data.customer.address && (
            <Text style={styles.customerRow}>{data.customer.address}</Text>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={styles.colSno}>
                <Text style={styles.headerText}>#</Text>
              </View>
              <View style={styles.colDesc}>
                <Text style={styles.headerText}>Description</Text>
              </View>
              <View style={styles.colHsn}>
                <Text style={styles.headerText}>HSN/SAC</Text>
              </View>
              <View style={styles.colQty}>
                <Text style={[styles.headerText, { textAlign: 'right' }]}>Qty</Text>
              </View>
              <View style={styles.colRate}>
                <Text style={[styles.headerText, { textAlign: 'right' }]}>Rate</Text>
              </View>
              <View style={styles.colAmt}>
                <Text style={[styles.headerText, { textAlign: 'right' }]}>Amount</Text>
              </View>
            </View>

            {/* Table Rows */}
            {data.items.map((item, index) => (
              <View
                key={index}
                style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <View style={styles.colSno}>
                  <Text style={styles.cellText}>{index + 1}</Text>
                </View>
                <View style={styles.colDesc}>
                  <Text style={styles.cellText}>{item.description}</Text>
                </View>
                <View style={styles.colHsn}>
                  <Text style={styles.cellText}>{item.hsnSac || '—'}</Text>
                </View>
                <View style={styles.colQty}>
                  <Text style={[styles.cellText, { textAlign: 'right' }]}>{item.quantity}</Text>
                </View>
                <View style={styles.colRate}>
                  <Text style={[styles.cellText, { textAlign: 'right' }]}>
                    {formatCurrencyPdf(item.unitPrice)}
                  </Text>
                </View>
                <View style={styles.colAmt}>
                  <Text style={[styles.cellText, { textAlign: 'right' }]}>
                    {formatCurrencyPdf(item.amount)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{formatCurrencyPdf(data.subtotal)}</Text>
            </View>

            {data.taxType === 'intra_state' ? (
              <>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>CGST @ 9%</Text>
                  <Text style={styles.totalsValue}>{formatCurrencyPdf(data.cgst)}</Text>
                </View>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>SGST @ 9%</Text>
                  <Text style={styles.totalsValue}>{formatCurrencyPdf(data.sgst)}</Text>
                </View>
              </>
            ) : (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>IGST @ 18%</Text>
                <Text style={styles.totalsValue}>{formatCurrencyPdf(data.igst)}</Text>
              </View>
            )}

            <View style={styles.totalFinalRow}>
              <Text style={styles.totalFinalLabel}>TOTAL</Text>
              <Text style={styles.totalFinalValue}>{formatCurrencyPdf(data.total)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.notesSection}>
            <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>Notes</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* Signature Area */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureText}>Authorized Signatory</Text>
            <Text style={[styles.signatureText, { marginTop: 2 }]}>
              {BUSINESS.legalName}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider}>
            <Text style={styles.footerBold}>Terms &amp; Conditions:</Text>
            <Text style={styles.footerText}>
              1. Payment is due upon receipt unless otherwise agreed.
            </Text>
            <Text style={styles.footerText}>
              2. Warranty as specified per service/part. No warranty on physical damage after delivery.
            </Text>
            <Text style={styles.footerText}>
              3. This is a computer-generated invoice and is valid without signature.
            </Text>
            <Text style={[styles.footerText, { marginTop: 6 }]}>
              {BUSINESS.legalName} | {BUSINESS.address.street}, {BUSINESS.address.area}, {BUSINESS.address.city} – {BUSINESS.address.pincode}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
