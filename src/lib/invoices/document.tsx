import type { ReactElement } from 'react'
import { BUSINESS } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { TaxType } from '@/types'
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'

export interface InvoicePdfLineItem {
  description: string
  hsn_sac: string | null
  quantity: number
  unit_price: number
  amount: number
}

export interface InvoicePdfData {
  invoiceNumber: string
  invoiceDate: string
  taxType: TaxType
  customerName: string
  customerPhone?: string | null
  customerAddress?: string | null
  jobCardNumber?: string | null
  items: InvoicePdfLineItem[]
  subtotal: number
  cgst: number
  sgst: number
  igst: number
  total: number
  paymentStatus: string
  notes?: string | null
  upiUri?: string | null
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#111827',
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 12,
  },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold' },
  muted: { color: '#4b5563', marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  section: { marginTop: 14 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 6,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: { flexDirection: 'row', padding: 6, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  colDesc: { width: '40%' },
  colHsn: { width: '16%' },
  colQty: { width: '10%', textAlign: 'right' },
  colPrice: { width: '17%', textAlign: 'right' },
  colAmt: { width: '17%', textAlign: 'right' },
  totals: { marginTop: 12, alignSelf: 'flex-end', width: 220 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  grand: { fontFamily: 'Helvetica-Bold', fontSize: 12, marginTop: 4 },
  disclaimer: { marginTop: 24, fontSize: 8, color: '#6b7280' },
})

export function InvoiceDocument({ data }: { data: InvoicePdfData }): ReactElement {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{BUSINESS.legalName}</Text>
          <Text style={styles.muted}>{BUSINESS.name}</Text>
          <Text style={styles.muted}>
            {BUSINESS.address.street}, {BUSINESS.address.area}, {BUSINESS.address.city} –{' '}
            {BUSINESS.address.pincode}
          </Text>
          <Text style={styles.muted}>
            {BUSINESS.phone} · {BUSINESS.email}
            {BUSINESS.gst ? ` · GSTIN ${BUSINESS.gst}` : ''}
          </Text>
        </View>

        <View style={styles.row}>
          <View>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Bill To</Text>
            <Text>{data.customerName}</Text>
            {data.customerPhone ? <Text>{data.customerPhone}</Text> : null}
            {data.customerAddress ? <Text>{data.customerAddress}</Text> : null}
          </View>
          <View>
            <Text>Invoice: {data.invoiceNumber}</Text>
            <Text>Date: {formatDate(data.invoiceDate)}</Text>
            {data.jobCardNumber ? <Text>Job card: {data.jobCardNumber}</Text> : null}
            <Text>Tax: {data.taxType === 'intra_state' ? 'CGST + SGST (Delhi)' : 'IGST'}</Text>
            <Text>Payment: {data.paymentStatus}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colHsn}>HSN/SAC</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Rate</Text>
            <Text style={styles.colAmt}>Amount</Text>
          </View>
          {data.items.map((item, index) => (
            <View key={`${item.description}-${index}`} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colHsn}>{item.hsn_sac ?? '—'}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unit_price)}</Text>
              <Text style={styles.colAmt}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{formatCurrency(data.subtotal)}</Text>
          </View>
          {data.taxType === 'intra_state' ? (
            <>
              <View style={styles.totalRow}>
                <Text>CGST 9%</Text>
                <Text>{formatCurrency(data.cgst)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text>SGST 9%</Text>
                <Text>{formatCurrency(data.sgst)}</Text>
              </View>
            </>
          ) : (
            <View style={styles.totalRow}>
              <Text>IGST 18%</Text>
              <Text>{formatCurrency(data.igst)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grand]}>
            <Text>Total</Text>
            <Text>{formatCurrency(data.total)}</Text>
          </View>
        </View>

        {data.upiUri ? (
          <View style={styles.section}>
            <Text>UPI payment: {data.upiUri}</Text>
            <Text style={styles.muted}>Scan this UPI ID from your banking app where a QR is displayed at the counter.</Text>
          </View>
        ) : null}

        {data.notes ? (
          <View style={styles.section}>
            <Text>Notes: {data.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.disclaimer}>
          This is a computer-generated GST invoice. Repair estimates quoted before diagnosis are not final.
        </Text>
      </Page>
    </Document>
  )
}
