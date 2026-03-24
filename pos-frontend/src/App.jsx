import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Users,
  ShoppingCart,
  ReceiptText,
  BarChart3,
  ScanBarcode,
  Plus,
  Pencil,
  CheckCircle2,
  X,
  Globe,
  ShieldAlert,
  ClipboardList,
  ShieldCheck,
  Lock,
  FileSpreadsheet,
  Printer,
  Search,
  ArrowUpDown,
  PackageCheck,
  PackageX,
  Moon,
  Sun,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import * as XLSX from 'xlsx'
import { validateBookDraft } from './posLogic'

const logoUrl = 'https://i.postimg.cc/hPWCrLY4/educon_logo_high_quality_png_white.png'

const initialBooks = [
  {
    id: 1,
    title: 'Arabic for Beginners',
    author: 'Salma Hassan',
    sellingPrice: 120,
    costPrice: 70,
    stock: 32,
    barcode: '978001',
    isArriving: false,
  },
  {
    id: 2,
    title: 'Math Sparks 1',
    author: 'Omar Nasser',
    sellingPrice: 95,
    costPrice: 55,
    stock: 24,
    barcode: '978002',
    isArriving: false,
  },
  {
    id: 3,
    title: 'Science Lab Notes',
    author: 'Dina Fathy',
    sellingPrice: 150,
    costPrice: 85,
    stock: 18,
    barcode: '978003',
    isArriving: true,
  },
  {
    id: 4,
    title: 'English Reader Level 2',
    author: 'Layla Sadek',
    sellingPrice: 110,
    costPrice: 60,
    stock: 28,
    barcode: '978004',
    isArriving: false,
  },
  {
    id: 5,
    title: 'Coding for Kids',
    author: 'Kareem Adel',
    sellingPrice: 180,
    costPrice: 95,
    stock: 12,
    barcode: '978005',
    isArriving: false,
  },
]

const initialStudents = [
  {
    id: 1,
    name: 'Maha El-Sayed',
    stage: 'third',
    gender: 'female',
    system: 'general',
    specialty: 'Science',
    phone: '+20 10 1234 5678',
  },
  {
    id: 2,
    name: 'Yousef Khaled',
    stage: 'second',
    gender: 'male',
    system: 'azhar',
    specialty: 'Literature',
    phone: '+20 12 2222 3344',
  },
  {
    id: 3,
    name: 'Amina Mostafa',
    stage: 'first',
    gender: 'female',
    system: 'general',
    specialty: 'Science',
    phone: '+20 11 4455 6677',
  },
]

const staffMembers = [
  { id: 'youssef' },
  { id: 'suad' },
  { id: 'maryam' },
]

const auditStaffMembers = [
  { id: 'heba' },
  { id: 'maryam' },
]

const navItems = [
  { id: 'pos', icon: ShoppingCart },
  { id: 'books', icon: BookOpen },
  { id: 'booksInsights', icon: BarChart3 },
  { id: 'students', icon: Users },
  { id: 'pickupReservation', icon: PackageCheck },
  { id: 'cancelReservation', icon: PackageX },
  { id: 'returns', icon: ArrowUpDown },
  { id: 'receipt', icon: ReceiptText },
  { id: 'receiptArchive', icon: Printer },
  { id: 'emergency', icon: ShieldAlert },
  { id: 'inventory', icon: ClipboardList },
  { id: 'admin', icon: ShieldCheck },
  { id: 'accounting', icon: FileSpreadsheet },
  { id: 'reports', icon: BarChart3 },
]

const defaultWhatsappGroupLinks = {
  general: {
    male: {
      first: 'https://chat.whatsapp.com/CRWmWxM7WY00Wuo8Yi5TpD?mode=gi_t',
      second: 'https://chat.whatsapp.com/KUZ1x8vNs7W5IJvg2O5e2Q?mode=gi_t',
      third: 'https://chat.whatsapp.com/JkDFCkXoWlrLMTqkNPC6OE?mode=gi_t',
    },
    female: {
      first: 'https://chat.whatsapp.com/LlBiHxx4iEhDdSVzYZwgLx?mode=gi_t',
      second: 'https://chat.whatsapp.com/J1WGjEM7icVE1ccuKHd3hm?mode=gi_t',
      third: 'https://chat.whatsapp.com/J1WGjEM7icVE1ccuKHd3hm?mode=gi_t',
    },
  },
  azhar: {
    male: {
      first: 'https://chat.whatsapp.com/CRWmWxM7WY00Wuo8Yi5TpD?mode=gi_t',
      second: 'https://chat.whatsapp.com/KUZ1x8vNs7W5IJvg2O5e2Q?mode=gi_t',
      third: 'https://chat.whatsapp.com/IArhfylW8BMD5gV5plOO5s?mode=gi_t',
    },
    female: {
      first: 'https://chat.whatsapp.com/LlBiHxx4iEhDdSVzYZwgLx?mode=gi_t',
      second: 'https://chat.whatsapp.com/J1WGjEM7icVE1ccuKHd3hm?mode=gi_t',
      third: 'https://chat.whatsapp.com/IArhfylW8BMD5gV5plOO5s?mode=gi_t',
    },
  },
}

const defaultChannelLink = 'https://whatsapp.com/channel/0029Vb6OHma0rGiTqALr1019'

const formatCurrency = (locale, value) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value)

const clampDeposit = (value) => {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return 0
  return Math.max(numeric, 0)
}

const SEP = '━━━━━━━━━━━━━━━━'
const SEP2 = '────────────────'

const receiptTypeLabels = { sale: 'بيع', reservation: 'حجز', sale_reservation: 'بيع وحجز', pickup: 'استلام حجز', cancel: 'سحب حجز', return: 'مرتجع' }

const paymentMethodLabels = { cash: 'كاش', wallet: 'فودافون كاش', bank: 'تحويل بنكي', mixed: 'مختلط' }

const buildReceiptText = ({
  academyName,
  studentName,
  staffName,
  items,
  subtotal,
  discount,
  total,
  transactionId,
  transactionDate,
  isArabic,
  formatCurrencyFn,
  receiptType = 'sale',
  customFooter = '',
}) => {
  const typeLabel = receiptTypeLabels[receiptType] || receiptType
  if (isArabic) {
    const lines = [
      `📚 ${academyName}`,
      SEP,
      `نوع العملية: ${typeLabel}`,
      `رقم العملية: ${transactionId}`,
      `التاريخ: ${transactionDate}`,
      `الموظف: ${staffName}`,
      studentName ? `الطالب: ${studentName}` : null,
    ].filter(Boolean)
    lines.push(SEP2)
    items.forEach((item) => {
      const typeLabel = item.type === 'reservation' ? ' (حجز)' : ''
      lines.push(`• ${item.title} × ${item.qty}${typeLabel}`)
      lines.push(`  ${formatCurrencyFn(item.lineTotal)}`)
    })
    lines.push(SEP2)
    lines.push(`الإجمالي قبل الخصم: ${formatCurrencyFn(subtotal)}`)
    lines.push(`الخصم: ${formatCurrencyFn(discount)}`)
    lines.push(`الإجمالي النهائي: ${formatCurrencyFn(total)}`)
    lines.push(SEP)
    lines.push('شكراً لزيارتكم! 🙏')
    if (customFooter?.trim()) lines.push(SEP2, customFooter.trim())
    return lines.join('\n')
  }
  const lines = [academyName, '---']
  lines.push(`Transaction: ${transactionId}`)
  lines.push(`Date: ${transactionDate}`)
  lines.push(`Staff: ${staffName}`)
  if (studentName) lines.push(`Student: ${studentName}`)
  items.forEach((item) => {
    lines.push(`${item.title} x${item.qty} = ${item.lineTotal}`)
  })
  lines.push(`Subtotal: ${subtotal}`)
  lines.push(`Discount: ${discount}`)
  lines.push(`Total: ${total}`)
  lines.push('---')
  lines.push('Thank you!')
  if (customFooter?.trim()) lines.push('---', customFooter.trim())
  return lines.join('\n')
}

const STORAGE_KEY = 'educon-pos-state-v1'

const readStoredSnapshot = () => {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return null
    return data
  } catch {
    return null
  }
}

const apiBaseUrl = (() => {
  const raw = import.meta.env.VITE_API_BASE_URL
  if (typeof raw === 'string' && raw.trim()) return raw.trim().replace(/\/+$/, '')
  return 'http://localhost:8000'
})()

async function apiRequest(path, options) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { 'content-type': 'application/json', ...(options?.headers || {}) },
    ...options,
  })
  if (!response.ok) {
    let detail = ''
    try {
      const data = await response.json()
      if (data?.detail) detail = String(data.detail)
    } catch (error) {
      void error
    }
    const error = new Error(detail || `Request failed: ${response.status}`)
    error.status = response.status
    throw error
  }
  if (response.status === 204) return null
  return response.json()
}

const gradeFromStage = (stage) => {
  if (stage === 'first') return '1st Sec'
  if (stage === 'second') return '2nd Sec'
  if (stage === 'third') return '3rd Sec'
  return null
}

const stageFromGrade = (grade) => {
  if (grade === '1st Sec') return 'first'
  if (grade === '2nd Sec') return 'second'
  if (grade === '3rd Sec') return 'third'
  return 'first'
}

const systemToApi = (system) => {
  if (system === 'general') return 'General'
  if (system === 'azhar') return 'Azhar'
  return null
}

const systemFromApi = (system) => {
  if (system === 'General') return 'general'
  if (system === 'Azhar') return 'azhar'
  return 'general'
}

const specialtyToApi = (specialty) => {
  if (!specialty) return null
  if (specialty === 'Scientific') return 'Scientific'
  if (specialty === 'Math') return 'Math'
  if (specialty === 'Literary') return 'Literary'
  if (specialty === 'Science') return 'Scientific'
  if (specialty === 'Literature') return 'Literary'
  return null
}

const specialtyFromApi = (specialty) => {
  if (specialty === 'Scientific') return 'Science'
  if (specialty === 'Math') return 'Math'
  if (specialty === 'Literary') return 'Literature'
  return ''
}

const mapApiBookToUi = (book) => {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    sellingPrice: book.selling_price,
    costPrice: book.cost_price,
    estimatedCostPrice: book.estimated_cost_price,
    stock: book.total_stock,
    reservedStock: book.reserved_stock,
    barcode: book.isbn_barcode || '',
    isArriving: Boolean(book.is_arriving),
    estimatedSellingPrice: book.estimated_selling_price,
  }
}

const mapUiBookToApi = (book) => {
  return {
    title: book.title,
    author: book.author,
    isbn_barcode: book.barcode ? String(book.barcode) : null,
    cost_price: Number(book.costPrice) || 0,
    selling_price: Number(book.sellingPrice) || 0,
    estimated_cost_price: book.estimatedCostPrice === '' || book.estimatedCostPrice == null ? null : Number(book.estimatedCostPrice),
    estimated_selling_price: book.estimatedSellingPrice === '' || book.estimatedSellingPrice == null ? null : Number(book.estimatedSellingPrice),
    total_stock: Number(book.stock) || 0,
    reserved_stock: Number(book.reservedStock) || 0,
    is_arriving: Boolean(book.isArriving),
  }
}

const mapApiStudentToUi = (student) => {
  return {
    id: student.id,
    name: student.name,
    phone: student.phone || '',
    stage: stageFromGrade(student.grade),
    gender: student.gender || 'male',
    system: systemFromApi(student.system),
    specialty: specialtyFromApi(student.specialty),
    balance: Number(student.balance) || 0,
  }
}

const mapUiStudentToApi = (student) => {
  const grade = gradeFromStage(student.stage)
  const system = systemToApi(student.system)
  let specialty = specialtyToApi(student.specialty)
  if (grade === '3rd Sec' && !specialty) specialty = 'Scientific'
  return {
    name: student.name,
    phone: student.phone || null,
    gender: student.gender || null,
    grade,
    system,
    specialty,
    balance: Number(student.balance) || 0,
  }
}

const formatPhoneForWhatsApp = (phone) => {
  if (!phone || typeof phone !== 'string') return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return null
  if (digits.startsWith('20') && digits.length >= 12) return digits.slice(0, 12)
  if (digits.startsWith('0') && digits.length >= 10) return '20' + digits.slice(1)
  if (digits.length >= 10) return digits.length === 10 ? '20' + digits : digits
  return null
}

const cartKey = (bookId, type) => `${type}:${bookId}`
const getDefaultReservationDeposit = (book) => {
  const price = Number(book?.sellingPrice) || 0
  if (price <= 0) return 0
  return Math.max(Math.round(price * 0.3), 20)
}

function App() {
  const { t, i18n } = useTranslation()
  const storedSnapshot = useMemo(() => readStoredSnapshot(), [])
  const [useBackend, setUseBackend] = useState(() =>
    typeof storedSnapshot?.useBackend === 'boolean' ? storedSnapshot.useBackend : true,
  )
  const [activeView, setActiveView] = useState(() =>
    typeof storedSnapshot?.activeView === 'string' ? storedSnapshot.activeView : 'pos',
  )
  const [books, setBooks] = useState(() =>
    Array.isArray(storedSnapshot?.books) ? storedSnapshot.books : initialBooks,
  )
  const [students, setStudents] = useState(() =>
    Array.isArray(storedSnapshot?.students) ? storedSnapshot.students : initialStudents,
  )
  const [cartItems, setCartItems] = useState(() => {
    if (!Array.isArray(storedSnapshot?.cartItems)) return []
    const raw = storedSnapshot.cartItems
    if (raw.length === 0) return []
    if (raw.every((item) => item && typeof item === 'object' && typeof item.key === 'string')) return raw
    return raw
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const bookId = item.bookId ?? item.id
        if (typeof bookId !== 'number') return null
        const type = item.type === 'reservation' ? 'reservation' : 'sale'
        return {
          key: cartKey(bookId, type),
          bookId,
          qty: Number(item.qty) || 1,
          type,
          deposit: Number(item.deposit) || 0,
          linkedReservation: item.linkedReservation || null,
        }
      })
      .filter(Boolean)
  })
  const [searchTerm, setSearchTerm] = useState(() =>
    typeof storedSnapshot?.searchTerm === 'string' ? storedSnapshot.searchTerm : '',
  )
  const [studentPickerSearch, setStudentPickerSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState(() =>
    typeof storedSnapshot?.selectedStudentId === 'string' ? storedSnapshot.selectedStudentId : '',
  )
  const [discount, setDiscount] = useState(() =>
    typeof storedSnapshot?.discount === 'number' ? storedSnapshot.discount : 0,
  )
  const [bookModal, setBookModal] = useState({ open: false, mode: 'add', data: null })
  const [studentModal, setStudentModal] = useState({ open: false, mode: 'add', data: null })
  const [barcodeModal, setBarcodeModal] = useState({ open: false, book: null })
  const [selectedStaffId, setSelectedStaffId] = useState(() =>
    typeof storedSnapshot?.selectedStaffId === 'string' ? storedSnapshot.selectedStaffId : 'youssef',
  )
  const [pendingReservations, setPendingReservations] = useState(() =>
    Array.isArray(storedSnapshot?.pendingReservations) ? storedSnapshot.pendingReservations : [],
  )
  const [salesHistory, setSalesHistory] = useState(() =>
    Array.isArray(storedSnapshot?.salesHistory) ? storedSnapshot.salesHistory : [],
  )
  const [withdrawals, setWithdrawals] = useState(() =>
    Array.isArray(storedSnapshot?.withdrawals) ? storedSnapshot.withdrawals : [],
  )
  const [auditLog, setAuditLog] = useState(() =>
    Array.isArray(storedSnapshot?.auditLog) ? storedSnapshot.auditLog : [],
  )
  const [adminUnlocked, setAdminUnlocked] = useState(() =>
    typeof storedSnapshot?.adminUnlocked === 'boolean' ? storedSnapshot.adminUnlocked : false,
  )
  const [adminPassword, setAdminPassword] = useState('')
  const [transactionCounter, setTransactionCounter] = useState(() =>
    typeof storedSnapshot?.transactionCounter === 'number' ? storedSnapshot.transactionCounter : 1,
  )
  const [lastTransaction, setLastTransaction] = useState(() => storedSnapshot?.lastTransaction ?? null)
  const [quickStudent, setQuickStudent] = useState(() =>
    storedSnapshot?.quickStudent && typeof storedSnapshot.quickStudent === 'object'
      ? storedSnapshot.quickStudent
      : {
          name: '',
          phone: '',
          stage: 'first',
          gender: 'male',
          system: 'general',
          specialty: '',
        },
  )
  const [emergencyForm, setEmergencyForm] = useState(() =>
    storedSnapshot?.emergencyForm && typeof storedSnapshot.emergencyForm === 'object'
      ? storedSnapshot.emergencyForm
      : { amount: '', reason: '', staffId: '' },
  )
  const [auditStaffId, setAuditStaffId] = useState(() =>
    typeof storedSnapshot?.auditStaffId === 'string' ? storedSnapshot.auditStaffId : 'heba',
  )
  const [cancelledReservations, setCancelledReservations] = useState(() =>
    Array.isArray(storedSnapshot?.cancelledReservations) ? storedSnapshot.cancelledReservations : [],
  )
  const [isDarkMode, setIsDarkMode] = useState(() =>
    typeof storedSnapshot?.isDarkMode === 'boolean' ? storedSnapshot.isDarkMode : false,
  )
  const [followsUs, setFollowsUs] = useState(() =>
    typeof storedSnapshot?.followsUs === 'boolean' ? storedSnapshot.followsUs : false,
  )
  const [adminCustomFooter, setAdminCustomFooter] = useState(() =>
    typeof storedSnapshot?.adminCustomFooter === 'string' ? storedSnapshot.adminCustomFooter : '',
  )
  const [adminWhatsappLinks, _setAdminWhatsappLinks] = useState(() =>
    storedSnapshot?.adminWhatsappLinks ?? null,
  )
  const [adminChannelLink, _setAdminChannelLink] = useState(() =>
    storedSnapshot?.adminChannelLink ?? null,
  )
  const [pickupSearch, setPickupSearch] = useState('')
  const [cancelSearch, setCancelSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState(() =>
    typeof storedSnapshot?.paymentMethod === 'string' ? storedSnapshot.paymentMethod : 'cash',
  )
  const [auditActualCash, setAuditActualCash] = useState(() =>
    typeof storedSnapshot?.auditActualCash === 'string' ? storedSnapshot.auditActualCash : '',
  )
  const [legacyReservationModal, setLegacyReservationModal] = useState({ open: false })
  const [studentDetailsModal, setStudentDetailsModal] = useState({ open: false, student: null })
  const [paidAmount, setPaidAmount] = useState('')
  const [walletLog, setWalletLog] = useState(() =>
    Array.isArray(storedSnapshot?.walletLog) ? storedSnapshot.walletLog : [],
  )
  const [receiptArchiveItems, setReceiptArchiveItems] = useState([])
  const [booksInsightsRows, setBooksInsightsRows] = useState([])
  const [financeReport, setFinanceReport] = useState(null)
  const [supplies, setSupplies] = useState([])
  const [supplyForm, setSupplyForm] = useState({ bookId: '', qty: '1', unitCost: '', paid: '', supplier: '' })
  const inputRef = useRef(null)

  const whatsappGroupLinks = adminWhatsappLinks || defaultWhatsappGroupLinks
  const channelLink = adminChannelLink || defaultChannelLink

  const isRtl = i18n.language === 'ar'
  const locale = isRtl ? 'ar-EG' : 'en-US'

  useEffect(() => {
    document.body.setAttribute('dir', isRtl ? 'rtl' : 'ltr')
  }, [isRtl])

  useEffect(() => {
    const snapshot = useBackend
      ? {
          useBackend,
          activeView,
          selectedStaffId,
          isDarkMode,
          followsUs,
          adminCustomFooter,
          adminWhatsappLinks,
          adminChannelLink,
          paymentMethod,
          auditActualCash,
          adminUnlocked,
        }
      : {
          useBackend,
          activeView,
          books,
          students,
          cartItems,
          searchTerm,
          selectedStudentId,
          discount,
          pendingReservations,
          salesHistory,
          withdrawals,
          auditLog,
          adminUnlocked,
          transactionCounter,
          lastTransaction,
          quickStudent,
          emergencyForm,
          auditStaffId,
          cancelledReservations,
          selectedStaffId,
          isDarkMode,
          followsUs,
          adminCustomFooter,
          adminWhatsappLinks,
          adminChannelLink,
          paymentMethod,
          auditActualCash,
          walletLog,
        }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    } catch (error) {
      void error
    }
  }, [
    useBackend,
    activeView,
    books,
    students,
    cartItems,
    searchTerm,
    selectedStudentId,
    discount,
    pendingReservations,
    salesHistory,
    withdrawals,
    auditLog,
    adminUnlocked,
    transactionCounter,
    lastTransaction,
    quickStudent,
    emergencyForm,
    auditStaffId,
    cancelledReservations,
    selectedStaffId,
    isDarkMode,
    followsUs,
    adminCustomFooter,
    adminWhatsappLinks,
    adminChannelLink,
    paymentMethod,
    auditActualCash,
    walletLog, // Depend on Wallet Log
  ])

  useEffect(() => {
    if (!useBackend) return
    let cancelled = false
    const run = async () => {
      try {
        let apiBooks = await apiRequest('/books')
        let apiStudents = await apiRequest('/students')

        if (Array.isArray(apiBooks) && apiBooks.length === 0 && Array.isArray(storedSnapshot?.books) && storedSnapshot.books.length) {
          for (const b of storedSnapshot.books) {
            const draft = {
              title: b.title,
              author: b.author,
              sellingPrice: b.sellingPrice,
              costPrice: b.costPrice,
              stock: b.stock,
              barcode: b.barcode,
              isArriving: b.isArriving,
            }
            await apiRequest('/books', { method: 'POST', body: JSON.stringify(mapUiBookToApi(draft)) })
          }
          apiBooks = await apiRequest('/books')
        }

        if (Array.isArray(apiStudents) && apiStudents.length === 0 && Array.isArray(storedSnapshot?.students) && storedSnapshot.students.length) {
          for (const s of storedSnapshot.students) {
            const draft = {
              name: s.name,
              phone: s.phone,
              stage: s.stage,
              gender: s.gender,
              system: s.system,
              specialty: s.specialty,
              balance: s.balance,
            }
            await apiRequest('/students', { method: 'POST', body: JSON.stringify(mapUiStudentToApi(draft)) })
          }
          apiStudents = await apiRequest('/students')
        }

        const uiBooks = Array.isArray(apiBooks) ? apiBooks.map(mapApiBookToUi) : []
        const uiStudents = Array.isArray(apiStudents) ? apiStudents.map(mapApiStudentToUi) : []

        const apiReservations = await apiRequest('/reservations')
        const bookById = new Map(uiBooks.map((b) => [b.id, b]))
        const pending = Array.isArray(apiReservations)
          ? apiReservations
              .filter((r) => r.status === 'pending')
              .map((r) => {
                const book = bookById.get(r.book_id)
                return {
                  id: r.id,
                  transactionId: r.transaction_id ?? null,
                  studentId: r.student_id,
                  bookId: r.book_id,
                  qty: r.quantity || 1,
                  status: r.status,
                  deposit: r.deposit_amount || 0,
                  pendingArrival: Boolean(book?.isArriving),
                  date: r.created_at,
                }
              })
          : []

        if (cancelled) return
        setBooks(uiBooks)
        setStudents(uiStudents)
        setPendingReservations(pending)
        setSelectedStudentId((prev) => (uiStudents.some((s) => String(s.id) === String(prev)) ? prev : ''))
      } catch {
        if (cancelled) return
        setUseBackend(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [useBackend, storedSnapshot])

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [isDarkMode])

  useEffect(() => {
    if (activeView === 'pos' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [activeView])

  useEffect(() => {
    if (!useBackend) return
    if (activeView !== 'receiptArchive') return
    let cancelled = false
    const run = async () => {
      try {
        const data = await apiRequest('/receipt-archive')
        if (cancelled) return
        setReceiptArchiveItems(Array.isArray(data) ? data : [])
      } catch {
        if (cancelled) return
        setReceiptArchiveItems([])
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [useBackend, activeView])

  useEffect(() => {
    if (!useBackend) return
    if (activeView !== 'booksInsights') return
    let cancelled = false
    const run = async () => {
      try {
        const stats = await apiRequest('/reports/books')
        const rows = Array.isArray(stats) ? stats : []
        const byId = new Map(rows.map((r) => [r.book_id, r]))
        const merged = books.map((b) => {
          const s = byId.get(b.id)
          return {
            book: b,
            soldQty: Number(s?.sold_qty) || 0,
            reservedQty: Number(s?.pending_reserved_qty) || 0,
            reservedStock: Number(b.reservedStock) || 0,
            availableToSell: Math.max((Number(b.stock) || 0) - (Number(b.reservedStock) || 0), 0),
          }
        })
        merged.sort((a, b) => b.soldQty - a.soldQty)
        if (cancelled) return
        setBooksInsightsRows(merged)
      } catch {
        if (cancelled) return
        setBooksInsightsRows([])
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [useBackend, activeView, books])

  useEffect(() => {
    if (!useBackend) return
    if (activeView !== 'accounting') return
    let cancelled = false
    const run = async () => {
      try {
        const [finance, suppliesList] = await Promise.all([
          apiRequest('/reports/finance'),
          apiRequest('/supplies'),
        ])
        if (cancelled) return
        setFinanceReport(finance || null)
        setSupplies(Array.isArray(suppliesList) ? suppliesList : [])
      } catch {
        if (cancelled) return
        setFinanceReport(null)
        setSupplies([])
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [useBackend, activeView])

  const stageOptions = [
    { value: 'first', label: t('stages.first') },
    { value: 'second', label: t('stages.second') },
    { value: 'third', label: t('stages.third') },
  ]

  const genderOptions = [
    { value: 'male', label: t('gender.male') },
    { value: 'female', label: t('gender.female') },
  ]

  const systemOptions = [
    { value: 'general', label: t('system.general') },
    { value: 'azhar', label: t('system.azhar') },
  ]

  const cartDetails = useMemo(() => {
    const items = cartItems
      .map((entry) => {
        const book = books.find((item) => item.id === entry.bookId)
        if (!book) return null
        
        let lineUnit = book.sellingPrice
        if (entry.type === 'reservation') {
           lineUnit = clampDeposit(entry.deposit)
        } else if (entry.linkedReservation) {
           // If linked reservation, deduct deposit from unit price?
           // Or show unit price as (Price - Deposit)
           // Let's use the 'pickup' logic: Remaining = Price - Deposit
           const deposit = entry.linkedReservation?.deposit || 0
           lineUnit = Math.max(book.sellingPrice - deposit, 0)
        }

        const pendingArrival = entry.type === 'reservation' && Boolean(book.isArriving)
        return {
          ...book,
          lineKey: entry.key,
          qty: entry.qty,
          type: entry.type,
          deposit: clampDeposit(entry.deposit),
          isZeroReservation: Boolean(entry.isZeroReservation),
          lineTotal: entry.qty * lineUnit,
          pendingArrival,
          linkedReservation: entry.linkedReservation
        }
      })
      .filter(Boolean)
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
    const safeDiscount = Number.isNaN(Number(discount)) ? 0 : Number(discount)
    const total = Math.max(subtotal - safeDiscount, 0)
    return { items, subtotal, total, safeDiscount }
  }, [cartItems, books, discount])
  const reservationOutstandingTotal = useMemo(() => {
    return cartDetails.items
      .filter((item) => item.type === 'reservation')
      .reduce((sum, item) => sum + Math.max((Number(item.sellingPrice) || 0) * item.qty - (Number(item.deposit) || 0), 0), 0)
  }, [cartDetails.items])

  const filteredBooks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return books
    if (term.match(/^ed-?\d+$/i)) return books
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term) ||
        book.barcode.includes(term)
    )
  }, [books, searchTerm])

  const studentAutocomplete = useMemo(() => {
    const name = quickStudent.name?.trim().toLowerCase()
    if (!name || name.length < 2) return null
    return students.find(
      (s) => s.name?.toLowerCase().includes(name) || name.includes(s.name?.toLowerCase())
    )
  }, [quickStudent.name, students])

  const selectedStudent = students.find((student) => student.id === Number(selectedStudentId))
  const filteredStudentsForPicker = useMemo(() => {
    const term = studentPickerSearch.trim().toLowerCase()
    if (!term) return []
    const digits = term.replace(/\D/g, '')
    return students
      .filter((s) => {
        const byName = s.name?.toLowerCase().includes(term)
        const byPhone = digits.length >= 3 && (s.phone || '').replace(/\D/g, '').includes(digits)
        return byName || byPhone
      })
      .slice(0, 12)
  }, [studentPickerSearch, students])
  const pendingReservationMap = useMemo(() => {
    return pendingReservations.reduce((acc, item) => {
      acc[`${item.studentId}-${item.bookId}`] = item
      return acc
    }, {})
  }, [pendingReservations])

  const hasPendingReservation = (studentId, bookId) =>
    Boolean(pendingReservationMap[`${studentId}-${bookId}`])

  const addCartLine = (bookId, type, options) => {
    const key = cartKey(bookId, type)
    setCartItems((prev) => {
      const existing = prev.find((item) => item.key === key)
      if (existing) {
        return prev.map((item) => (item.key === key ? { ...item, qty: item.qty + 1 } : item))
      }
      return [
        ...prev,
        {
          key,
          bookId,
          qty: 1,
          type,
          deposit: Number(options?.deposit) || 0,
          isZeroReservation: Boolean(options?.isZeroReservation),
          linkedReservation: options?.linkedReservation || null,
        },
      ]
    })
  }

  const addToCart = (book) => {
    if (selectedStudent && hasPendingReservation(selectedStudent.id, book.id)) {
      const res = pendingReservationMap[`${selectedStudent.id}-${book.id}`]
      if (res && !book.isArriving) {
        addCartLine(book.id, 'sale', { deposit: res.deposit || 0, linkedReservation: res })
        return
      }
    }

    const type = book.isArriving ? 'reservation' : 'sale'
    addCartLine(book.id, type, { deposit: type === 'reservation' ? getDefaultReservationDeposit(book) : 0, isZeroReservation: false })
  }

  const updateCartQty = (key, delta) => {
    setCartItems((prev) => {
      const updated = prev
        .map((item) => (item.key === key ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
      return updated
    })
  }

  const updateCartType = (key, nextType) => {
    setCartItems((prev) => {
      const item = prev.find((i) => i.key === key)
      if (!item) return prev
      const book = books.find((b) => b.id === item.bookId)
      const safeType = nextType === 'sale' && book?.isArriving ? 'reservation' : nextType
      const nextKey = cartKey(item.bookId, safeType)
      if (nextKey === item.key) return prev
      const existing = prev.find((i) => i.key === nextKey)
      const nextItem = {
        ...item,
        type: safeType,
        key: nextKey,
        linkedReservation: safeType === 'reservation' ? null : item.linkedReservation,
        deposit: safeType === 'reservation' ? (item.deposit || getDefaultReservationDeposit(book)) : item.deposit,
        isZeroReservation: safeType === 'reservation' ? Boolean(item.isZeroReservation) : false,
      }
      if (!existing) {
        return prev.map((i) => (i.key === item.key ? nextItem : i))
      }
      return prev
        .filter((i) => i.key !== item.key)
        .map((i) => (i.key === existing.key ? { ...i, qty: i.qty + item.qty } : i))
    })
  }

  const updateCartDeposit = (key, deposit) => {
    setCartItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, deposit, isZeroReservation: Number(deposit) === 0 } : item)),
    )
  }

  const formatTransactionId = (n) => `ED-${String(n).padStart(4, '0')}`

  const handleScanKey = (event) => {
    if (event.key !== 'Enter') return
    const value = searchTerm.trim()
    if (!value) return
    const match = books.find((book) => book.barcode === value)
    if (match) {
      addToCart(match)
      setSearchTerm('')
      return
    }
    const txMatch = value.toUpperCase().match(/^ED-?(\d+)$/i)
    if (txMatch) {
      const txNum = parseInt(txMatch[1], 10)
      const sale = salesHistory.find((s) => s.id === formatTransactionId(txNum) || s.id === `ED-${txNum}`)
      if (sale?.student) {
        setSelectedStudentId(String(sale.student.id))
        setQuickStudent({
          name: sale.student.name || '',
          phone: sale.student.phone || '',
          stage: sale.student.stage || 'first',
          gender: sale.student.gender || 'male',
          system: sale.student.system || 'general',
          specialty: sale.student.specialty || '',
        })
      }
      setSearchTerm('')
    }
  }

  const toggleLanguage = () => {
    i18n.changeLanguage(isRtl ? 'en' : 'ar')
  }

  const openBookModal = (mode, data = null) => {
    setBookModal({ open: true, mode, data })
  }

  const openStudentModal = (mode, data = null) => {
    setStudentModal({ open: true, mode, data })
  }

  const saveBook = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const title = formData.get('title')?.trim()
    const barcode = formData.get('barcode')?.trim()
    const sellingPrice = Number(formData.get('sellingPrice'))
    const costPrice = Number(formData.get('costPrice'))
    const stock = Number(formData.get('stock'))
    const isArriving = formData.get('isArriving') === 'on'
    const estimatedSellingPriceRaw = formData.get('estimatedSellingPrice')
    const estimatedCostPriceRaw = formData.get('estimatedCostPrice')
    const estimatedSellingPrice = estimatedSellingPriceRaw === '' ? null : Number(estimatedSellingPriceRaw)
    const estimatedCostPrice = estimatedCostPriceRaw === '' ? null : Number(estimatedCostPriceRaw)

    const validationError = validateBookDraft({ title, barcode, sellingPrice, costPrice, stock, isArriving })
    if (validationError) return alert(validationError)
    if (estimatedSellingPrice != null && (Number.isNaN(estimatedSellingPrice) || estimatedSellingPrice < 0)) {
      return alert('سعر البيع التقريبي غير صحيح')
    }
    if (estimatedCostPrice != null && (Number.isNaN(estimatedCostPrice) || estimatedCostPrice < 0)) {
      return alert('سعر التكلفة التقريبي غير صحيح')
    }
    if (barcode) {
      if (bookModal.mode === 'add' && books.some((b) => b.barcode === barcode)) {
        return alert('هذا الباركود مستخدم بالفعل لكتاب آخر!')
      }
      if (bookModal.mode === 'edit' && books.some((b) => b.id !== bookModal.data?.id && b.barcode === barcode)) {
        return alert('هذا الباركود مستخدم بالفعل لكتاب آخر!')
      }
    }

    const payload = {
      title: formData.get('title'),
      author: formData.get('author'),
      sellingPrice: Number(formData.get('sellingPrice')) || 0,
      costPrice: Number(formData.get('costPrice')) || 0,
      stock: Number(formData.get('stock')) || 0,
      estimatedSellingPrice,
      estimatedCostPrice,
      barcode: formData.get('barcode'),
      isArriving,
    }
    if (!useBackend) {
      const local = { ...payload, id: bookModal.mode === 'edit' ? bookModal.data.id : Date.now() }
      setBooks((prev) => {
        if (bookModal.mode === 'edit') {
          return prev.map((item) => (item.id === local.id ? local : item))
        }
        return [...prev, local]
      })
      setBookModal({ open: false, mode: 'add', data: null })
      return
    }

    try {
      const baseDraft = {
        ...payload,
        reservedStock: bookModal.data?.reservedStock ?? 0,
      }
      if (bookModal.mode === 'edit') {
        const updated = await apiRequest(`/books/${bookModal.data.id}`, {
          method: 'PUT',
          body: JSON.stringify(mapUiBookToApi(baseDraft)),
        })
        const ui = mapApiBookToUi(updated)
        setBooks((prev) => prev.map((item) => (item.id === ui.id ? ui : item)))
      } else {
        const created = await apiRequest('/books', {
          method: 'POST',
          body: JSON.stringify(mapUiBookToApi(baseDraft)),
        })
        const ui = mapApiBookToUi(created)
        setBooks((prev) => [...prev, ui])
      }
      setBookModal({ open: false, mode: 'add', data: null })
    } catch (error) {
      alert(error?.message || 'فشل حفظ الكتاب')
    }
  }

  const saveStudent = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const name = formData.get('name')?.trim()
    const phone = formData.get('phone')?.trim()

    if (!name) return alert('اسم الطالب مطلوب')
    if (!phone) return alert('رقم الهاتف مطلوب')
    
    // Check duplicates
    if (studentModal.mode === 'add') {
       const exists = students.some(s => s.phone === phone || s.name.toLowerCase() === name.toLowerCase())
       if (exists) return alert('هذا الطالب مسجل بالفعل (الاسم أو الهاتف مكرر)')
    }

    const payload = {
      name: formData.get('name'),
      stage: formData.get('stage'),
      gender: formData.get('gender'),
      system: formData.get('system'),
      specialty: formData.get('specialty'),
      phone: formData.get('phone'),
    }

    if (!useBackend) {
      const local = { ...payload, id: studentModal.mode === 'edit' ? studentModal.data.id : Date.now() }
      setStudents((prev) => {
        if (studentModal.mode === 'edit') {
          return prev.map((item) => (item.id === local.id ? local : item))
        }
        return [...prev, local]
      })
      setStudentModal({ open: false, mode: 'add', data: null })
      return
    }

    try {
      const baseDraft = {
        ...payload,
        balance: studentModal.data?.balance ?? 0,
      }
      if (studentModal.mode === 'edit') {
        const updated = await apiRequest(`/students/${studentModal.data.id}`, {
          method: 'PUT',
          body: JSON.stringify(mapUiStudentToApi(baseDraft)),
        })
        const ui = mapApiStudentToUi(updated)
        setStudents((prev) => prev.map((item) => (item.id === ui.id ? ui : item)))
      } else {
        const created = await apiRequest('/students', {
          method: 'POST',
          body: JSON.stringify(mapUiStudentToApi(baseDraft)),
        })
        const ui = mapApiStudentToUi(created)
        setStudents((prev) => [...prev, ui])
      }
      setStudentModal({ open: false, mode: 'add', data: null })
    } catch (error) {
      alert(error?.message || 'فشل حفظ الطالب')
    }
  }

  const handleQuickStudentSubmit = async (event) => {
    event.preventDefault()
    if (!useBackend) {
      const payload = {
        id: Date.now(),
        ...quickStudent,
      }
      setStudents((prev) => [...prev, payload])
      setSelectedStudentId(String(payload.id))
      setQuickStudent({
        name: '',
        phone: '',
        stage: 'first',
        gender: 'male',
        system: 'general',
        specialty: '',
      })
      return
    }

    try {
      const created = await apiRequest('/students', {
        method: 'POST',
        body: JSON.stringify(mapUiStudentToApi({ ...quickStudent, balance: 0 })),
      })
      const ui = mapApiStudentToUi(created)
      setStudents((prev) => [...prev, ui])
      setSelectedStudentId(String(ui.id))
    } catch (error) {
      alert(error?.message || 'فشل تسجيل الطالب')
      return
    }
    setQuickStudent({
      name: '',
      phone: '',
      stage: 'first',
      gender: 'male',
      system: 'general',
      specialty: '',
    })
  }

  const handleEmergencySubmit = (event) => {
    event.preventDefault()
    const amountValue = Number(emergencyForm.amount)
    if (!amountValue || amountValue <= 0) return
    setWithdrawals((prev) => [
      ...prev,
      {
        id: Date.now(),
        amount: amountValue,
        reason: emergencyForm.reason,
        staffId: emergencyForm.staffId || selectedStaffId,
        date: new Date().toISOString(),
      },
    ])
    setEmergencyForm({ amount: '', reason: '', staffId: '' })
  }

  const handleCompleteSale = async () => {
    if (cartDetails.items.length === 0) return
    let studentForSale = selectedStudent
    if (!studentForSale && quickStudent.name?.trim() && quickStudent.phone?.trim()) {
      if (!useBackend) {
        const newStudent = {
          id: Date.now(),
          name: quickStudent.name.trim(),
          phone: quickStudent.phone.trim(),
          stage: quickStudent.stage || 'first',
          gender: quickStudent.gender || 'male',
          system: quickStudent.system || 'general',
          specialty: quickStudent.specialty || '',
        }
        setStudents((prev) => [...prev, newStudent])
        setSelectedStudentId(String(newStudent.id))
        setQuickStudent({ name: '', phone: '', stage: 'first', gender: 'male', system: 'general', specialty: '' })
        studentForSale = newStudent
      } else {
        try {
          const created = await apiRequest('/students', {
            method: 'POST',
            body: JSON.stringify(mapUiStudentToApi({ ...quickStudent, balance: 0 })),
          })
          const ui = mapApiStudentToUi(created)
          setStudents((prev) => [...prev, ui])
          setSelectedStudentId(String(ui.id))
          setQuickStudent({ name: '', phone: '', stage: 'first', gender: 'male', system: 'general', specialty: '' })
          studentForSale = ui
        } catch (error) {
          alert(error?.message || 'فشل تسجيل الطالب')
          return
        }
      }
    }
    if (useBackend && !studentForSale?.id) {
      alert('اختر طالبًا قبل إتمام البيع')
      return
    }
    const transactionId = formatTransactionId(transactionCounter)
    const transactionDate = new Date()
    const costTotal = cartDetails.items.reduce((sum, item) => {
      if (item.type === 'reservation') return sum
      return sum + item.costPrice * item.qty
    }, 0)
    const netProfit = cartDetails.total - costTotal

    const hasReservation = cartDetails.items.some((i) => i.type === 'reservation')
    const allReservation = cartDetails.items.length > 0 && cartDetails.items.every((i) => i.type === 'reservation')
    const receiptType = allReservation ? 'reservation' : hasReservation ? 'sale' : 'sale'
    const saleEntry = {
      id: transactionId,
      date: transactionDate.toISOString(),
      staffId: selectedStaffId,
      staffName: t(`staff.${selectedStaffId}`),
      student: studentForSale,
      items: cartDetails.items,
      subtotal: cartDetails.subtotal,
      discount: cartDetails.safeDiscount,
      total: cartDetails.total,
      costTotal,
      netProfit,
      receiptType,
      paymentMethod,
    }

    const newReservations = cartDetails.items
      .filter((item) => item.type === 'reservation')
      .map((item) => ({
        id: `${transactionId}-${item.id}`,
        transactionId,
        studentId: studentForSale?.id,
        bookId: item.id,
        qty: item.qty,
        status: 'pending',
        deposit: item.deposit,
        pendingArrival: item.pendingArrival,
        date: transactionDate.toISOString(),
      }))
      .filter((item) => item.studentId)

    if (useBackend) {
      try {
        const reservationItems = cartDetails.items.filter((item) => item.type === 'reservation')
        for (const item of reservationItems) {
          await apiRequest('/reservations', {
            method: 'POST',
            body: JSON.stringify({
              student_id: studentForSale.id,
              book_id: item.id,
              quantity: item.qty,
              deposit_amount: item.deposit || 0,
              staff_name: selectedStaffId,
            }),
          })
        }

        const saleItems = cartDetails.items
          .filter((item) => item.type !== 'reservation')
          .map((item) => ({
            book_id: item.id,
            quantity: item.qty,
            reservation_id: item.linkedReservation?.id != null ? Number(item.linkedReservation.id) : null,
          }))
        if (saleItems.length) {
          await apiRequest('/transactions', {
            method: 'POST',
            body: JSON.stringify({
              student_id: studentForSale.id,
              discount: cartDetails.safeDiscount,
              staff_name: selectedStaffId,
              items: saleItems,
            }),
          })
        }
      } catch (error) {
        alert(error?.message || 'فشل حفظ العملية على السيرفر')
        return
      }
    }

    setSalesHistory((prev) => [saleEntry, ...prev])
    if (!useBackend && newReservations.length) {
      setPendingReservations((prev) => [...prev, ...newReservations])
    }
    setTransactionCounter((prev) => prev + 1)
    setLastTransaction(saleEntry)
    
    // Handle Flexible Payment (Debt/Wallet)
    const paid = Number(paidAmount)
    const totalDue = cartDetails.total
    let nextBalance = Number(studentForSale?.balance) || 0
    if (studentForSale?.id) {
       // 1. Debt (Underpayment)
       if (paidAmount !== '' && paid < totalDue) {
          const debt = totalDue - paid
          nextBalance -= debt
          setStudents(prev => prev.map(s => 
             s.id === studentForSale.id 
               ? { ...s, balance: (s.balance || 0) - debt } 
               : s
          ))
          // Log Debt Transaction
          const logEntry = {
            id: Date.now(),
            studentId: studentForSale.id,
            amount: -debt,
            type: 'purchase_debt',
            date: new Date().toISOString(),
            description: `متبقي على فاتورة ${transactionId}`
          }
          setWalletLog(prev => [logEntry, ...prev])
       }
       // 2. Wallet Deposit (Overpayment)
       else if (paidAmount !== '' && paid > totalDue) {
          const change = paid - totalDue
          nextBalance += change
          // Ask user if they want to add to wallet? For now, we assume YES based on request "Smart Wallet"
          // In a real app, maybe a modal confirm. But let's auto-deposit for efficiency as requested.
          setStudents(prev => prev.map(s => 
             s.id === studentForSale.id 
               ? { ...s, balance: (s.balance || 0) + change } 
               : s
          ))
           // Log Deposit Transaction
           const logEntry = {
            id: Date.now(),
            studentId: studentForSale.id,
            amount: change,
            type: 'deposit_change',
            date: new Date().toISOString(),
            description: `باقي فاتورة ${transactionId}`
          }
          setWalletLog(prev => [logEntry, ...prev])
       }
       // 3. Payment via Wallet (If selected payment method is 'wallet' or partial)
       // This logic assumes "Paid Amount" is CASH. 
       // If user wants to pay FROM wallet, they should probably select "Wallet" in payment methods
       // OR we deduct from wallet automatically?
       // Let's keep it simple: "Paid Amount" is what they handed over. 
       // If they handed 0, and have balance, we can deduct?
       // The user asked for "Wallet has money... exchange books from it".
       
       if (paymentMethod === 'wallet' && studentForSale.balance >= totalDue) {
          // Deduct full amount
           nextBalance -= totalDue
           setStudents(prev => prev.map(s => 
             s.id === studentForSale.id 
               ? { ...s, balance: (s.balance || 0) - totalDue } 
               : s
          ))
          const logEntry = {
            id: Date.now(),
            studentId: studentForSale.id,
            amount: -totalDue,
            type: 'purchase_wallet',
            date: new Date().toISOString(),
            description: `دفع فاتورة ${transactionId} من المحفظة`
          }
          setWalletLog(prev => [logEntry, ...prev])
       }
    }

    const soldItems = cartDetails.items.filter((item) => item.type !== 'reservation')
    const reservedItems = cartDetails.items.filter((item) => item.type === 'reservation')
    
    // For items that were "linkedReservation", we need to mark the reservation as completed (picked up)
    // We didn't actually "pick up" via the official flow, but we sold the book.
    // So we should remove the pending reservation.
    const linkedReservations = cartDetails.items
        .filter(item => item.linkedReservation)
        .map(item => item.linkedReservation.id)
    
    if (!useBackend && linkedReservations.length > 0) {
       setPendingReservations(prev => prev.filter(r => !linkedReservations.includes(r.id)))
    }
    
    // Update Stock: Deduct for BOTH sold items AND reserved items (to hold stock)
    // Combined list of items that need stock deduction
    // Note: If item was "linkedReservation", stock was ALREADY deducted when reserved.
    // So we should NOT deduct again for linkedReservation items.
    
    const stockDeductItems = [
       ...soldItems.filter(item => !item.linkedReservation), // Only deduct if NOT linked (not already reserved)
       ...reservedItems
    ]
    
    if (!useBackend && stockDeductItems.length) {
      setBooks((prev) =>
        prev.map((book) => {
          const item = stockDeductItems.find((i) => i.id === book.id)
          if (!item) return book
          // For reservations, we deduct stock now.
          // Note: If item is 'arriving', stock might be 0, so we allow negative or just 0?
          // Usually we shouldn't reserve if no stock, but user might want "Pre-order".
          // Let's stick to: If in stock, deduct. If not, maybe allow (negative stock implies pre-order demand).
          // For safety, let's max at 0.
          const nextStock = Math.max((book.stock || 0) - item.qty, 0)
          return { ...book, stock: nextStock }
        }),
      )
    }
    if (useBackend && studentForSale?.id) {
      try {
        if (paidAmount !== '' || paymentMethod === 'wallet') {
          await apiRequest(`/students/${studentForSale.id}`, {
            method: 'PUT',
            body: JSON.stringify(mapUiStudentToApi({ ...studentForSale, balance: nextBalance })),
          })
        }
        const apiBooks = await apiRequest('/books')
        const apiStudents = await apiRequest('/students')
        const apiReservations = await apiRequest('/reservations')
        const uiBooks = Array.isArray(apiBooks) ? apiBooks.map(mapApiBookToUi) : []
        const uiStudents = Array.isArray(apiStudents) ? apiStudents.map(mapApiStudentToUi) : []
        const bookById = new Map(uiBooks.map((b) => [b.id, b]))
        const pending = Array.isArray(apiReservations)
          ? apiReservations
              .filter((r) => r.status === 'pending')
              .map((r) => {
                const book = bookById.get(r.book_id)
                return {
                  id: r.id,
                  transactionId: null,
                  studentId: r.student_id,
                  bookId: r.book_id,
                  qty: r.quantity || 1,
                  status: r.status,
                  deposit: r.deposit_amount || 0,
                  pendingArrival: Boolean(book?.isArriving),
                  date: r.created_at,
                }
              })
          : []
        setBooks(uiBooks)
        setStudents(uiStudents)
        setPendingReservations(pending)
      } catch (error) {
        alert(error?.message || 'فشل تحديث البيانات من السيرفر')
      }
    }
    setCartItems([])
    setDiscount(0)
    setPaidAmount('')
    setSelectedStudentId('')
    setQuickStudent({
      name: '',
      phone: '',
      stage: 'first',
      gender: 'male',
      system: 'general',
      specialty: '',
    })
    setSearchTerm('')
    setActiveView('receipt')
  }

  const effectiveStudent = useMemo(() => {
    if (selectedStudent) return selectedStudent
    if (quickStudent.name?.trim() && quickStudent.phone?.trim()) {
      return {
        id: 0,
        name: quickStudent.name.trim(),
        phone: quickStudent.phone.trim(),
        stage: quickStudent.stage,
        gender: quickStudent.gender,
        system: quickStudent.system,
        specialty: quickStudent.specialty || '',
      }
    }
    return null
  }, [selectedStudent, quickStudent])

  const receiptPayload = useMemo(() => {
    const hasLiveContext = cartDetails.items.length > 0 || Boolean(effectiveStudent)
    if (lastTransaction && !hasLiveContext) {
      return lastTransaction
    }
    return {
      id: formatTransactionId(transactionCounter),
      date: new Date().toISOString(),
      staffId: selectedStaffId,
      staffName: t(`staff.${selectedStaffId}`),
      student: effectiveStudent,
      items: cartDetails.items,
      subtotal: cartDetails.subtotal,
      discount: cartDetails.safeDiscount,
      total: cartDetails.total,
    }
  }, [lastTransaction, transactionCounter, selectedStaffId, effectiveStudent, cartDetails, t])

  const formatCurrencyForReceipt = (v) =>
    new Intl.NumberFormat(isRtl ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    }).format(v || 0)

  const getReceiptType = (payload) => {
    if (payload.receiptType) return payload.receiptType
    const items = payload.items || []
    const hasReservation = items.some((i) => i.type === 'reservation')
    const hasSale = items.some((i) => i.type !== 'reservation')
    const allReservation = items.length > 0 && items.every((i) => i.type === 'reservation')
    if (allReservation) return 'reservation'
    if (hasReservation && hasSale) return 'sale_reservation'
    return 'sale'
  }

  const receiptText = buildReceiptText({
    academyName: t('receipt.academy'),
    studentName: receiptPayload.student?.name,
    staffName: receiptPayload.staffName,
    items: receiptPayload.items || [],
    subtotal: receiptPayload.subtotal,
    discount: receiptPayload.discount,
    total: receiptPayload.total,
    transactionId: receiptPayload.id,
    transactionDate: new Date(receiptPayload.date).toLocaleString(locale),
    isArabic: isRtl,
    formatCurrencyFn: formatCurrencyForReceipt,
    receiptType: getReceiptType(receiptPayload),
    customFooter: adminCustomFooter,
  })

  const studentPhone = receiptPayload.student?.phone
  const whatsappPhone = formatPhoneForWhatsApp(studentPhone)

  const whatsappGroupLink = useMemo(() => {
    if (!receiptPayload.student) return null
    const systemKey = receiptPayload.student.system || 'general'
    const genderKey = receiptPayload.student.gender || 'male'
    const stageKey = receiptPayload.student.stage || 'first'
    return (
      whatsappGroupLinks?.[systemKey]?.[genderKey]?.[stageKey] ||
      whatsappGroupLinks.general.male.first
    )
  }, [receiptPayload.student, whatsappGroupLinks])

  const fullWhatsAppMessage = useMemo(() => {
    if (followsUs) return receiptText
    let msg = receiptText
    msg += `\n\n📢 تابع قناة Educon Academy في واتساب:\n${channelLink}`
    if (whatsappGroupLink) msg += `\n\n👥 انضم لمجموعتك:\n${whatsappGroupLink}`
    return msg
  }, [receiptText, followsUs, whatsappGroupLink, channelLink])

  const receiptLink = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(fullWhatsAppMessage)}`
    : null

  const archiveAndPrintReceipt = async () => {
    const payload = {
      ...receiptPayload,
      receiptType: getReceiptType(receiptPayload),
    }
    if (useBackend) {
      try {
        const archived = await apiRequest('/receipt-archive', {
          method: 'POST',
          body: JSON.stringify({
            transaction_code: payload.id,
            receipt_type: payload.receiptType || 'sale',
            staff_name: payload.staffName,
            payload,
          }),
        })
        setReceiptArchiveItems((prev) => [archived, ...prev])
      } catch (error) {
        void error
      }
    } else {
      try {
        const raw = localStorage.getItem('educon-pos-receipt-archive-v1')
        const list = raw ? JSON.parse(raw) : []
        const next = [{ id: Date.now(), payload, printedAt: new Date().toISOString() }, ...(Array.isArray(list) ? list : [])]
        localStorage.setItem('educon-pos-receipt-archive-v1', JSON.stringify(next))
      } catch (error) {
        void error
      }
    }
    window.print()
  }

  const totalSales = salesHistory.reduce((sum, entry) => sum + entry.total, 0)
  const totalCost = salesHistory.reduce((sum, entry) => sum + entry.costTotal, 0)
  const totalNet = salesHistory.reduce((sum, entry) => sum + entry.netProfit, 0)
  const totalWithdrawals = withdrawals.reduce((sum, entry) => sum + entry.amount, 0)
  const safeBalance = totalSales - totalWithdrawals
  const chartMax = Math.max(totalSales, totalCost, totalNet, 1)

  const typeCounts = salesHistory.reduce(
    (acc, entry) => {
      const key = entry.receiptType || 'sale'
      acc[key] = (acc[key] || 0) + 1
      return acc
    },
    {},
  )

  const exportToExcel = () => {
    const salesSheet = salesHistory.map((entry) => ({
      Transaction: entry.id,
      Date: new Date(entry.date).toLocaleString(locale),
      Staff: entry.staffName,
      Student: entry.student?.name || '',
      PaymentMethod: paymentMethodLabels[entry.paymentMethod] || entry.paymentMethod || '',
      Subtotal: entry.subtotal,
      Discount: entry.discount,
      Total: entry.total,
      Cost: entry.costTotal,
      NetProfit: entry.netProfit,
    }))

    const withdrawalsSheet = withdrawals.map((entry) => ({
      Date: new Date(entry.date).toLocaleString(locale),
      Staff: t(`staff.${entry.staffId}`),
      Amount: entry.amount,
      Reason: entry.reason,
    }))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(salesSheet), 'Sales')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(withdrawalsSheet), 'Withdrawals')
    XLSX.writeFile(workbook, 'educon-admin-report.xlsx')
  }

  const handleAudit = () => {
    if (!['heba', 'maryam'].includes(auditStaffId)) return
    const actual = Number(auditActualCash) || 0
    const diff = actual - safeBalance
    const snapshot = {
      id: auditLog.length + 1,
      staffId: auditStaffId,
      date: new Date().toISOString(),
      safeBalance,
      totalSales,
      totalWithdrawals,
      actualCash: actual,
      diff,
    }
    setAuditLog((prev) => [snapshot, ...prev])
    setSalesHistory([])
    setWithdrawals([])
    setPendingReservations([])
  }

  return (
    <div className={`min-h-screen ${isRtl ? 'rtl' : 'ltr'} ${isDarkMode ? 'dark' : ''} bg-slate-50 dark:bg-slate-950`}>
      <style>{`
        @media print {
          html, body {
            width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          body * { visibility: hidden !important; }
          .receipt-print-only, .receipt-print-only * { visibility: visible !important; }
          .receipt-print-only {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            background: #fff !important;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
          }
          .receipt-print-only * { color: #000 !important; }
        }
        @page { size: 80mm auto; margin: 0; }
      `}</style>
      <div className={`flex min-h-screen ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
        <aside className="no-print w-full max-w-[260px] shrink-0 bg-gradient-to-b from-brand-700 via-brand-600 to-brand-900 px-6 py-8 text-white shadow-glow">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <ReceiptText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">POS</p>
              <h1 className="text-lg font-semibold leading-tight">{t('appName')}</h1>
            </div>
          </div>

          <nav className="mt-10 space-y-2">
            {navItems
              .filter((item) => item.id !== 'receipt' || lastTransaction)
              .map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive ? 'bg-white text-brand-700 shadow-lg' : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{t(`nav.${item.id}`)}</span>
                </button>
              )
            })}
          </nav>

          <div className="mt-10 rounded-2xl bg-white/10 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">{t('labels.staff')}</p>
            <select
              value={selectedStaffId}
              onChange={(event) => setSelectedStaffId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
            >
              {staffMembers.map((member) => (
                <option key={member.id} value={member.id} className="text-slate-900">
                  {t(`staff.${member.id}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-auto space-y-2 pt-10">
            <button
              type="button"
              onClick={() => setIsDarkMode((d) => !d)}
              className="flex w-full items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold"
            >
              <span className="flex items-center gap-2">
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDarkMode ? t('labels.lightMode') : t('labels.darkMode')}
              </span>
            </button>
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex w-full items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold"
            >
              <span className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {isRtl ? 'English' : 'العربية'}
              </span>
              <span className="text-xs text-white/70">{isRtl ? 'EN' : 'AR'}</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 px-6 py-8 lg:px-10">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-brand-600">Edycon</p>
              <h2 className="text-2xl font-semibold text-slate-900">{t(`nav.${activeView}`)}</h2>
              <p className="mt-1 text-xs text-slate-400">
                {t('labels.activeStaff')}: {t(`staff.${selectedStaffId}`)}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white dark:bg-slate-800 dark:border dark:border-slate-700 px-4 py-3 shadow">
              <ScanBarcode className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <input
                ref={inputRef}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={handleScanKey}
                placeholder={t('labels.search')}
                className="w-64 border-none bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />
            </div>
          </header>

          {activeView === 'pos' && (
            <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              <div className="space-y-6">
                <div className="rounded-3xl bg-white p-6 shadow">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{t('sections.studentSelect')}</h3>
                    <button
                      type="button"
                      onClick={() => openStudentModal('add')}
                      className="flex items-center gap-2 text-sm font-semibold text-brand-600"
                    >
                      <Plus className="h-4 w-4" />
                      {t('actions.add')}
                    </button>
                  </div>
                  <InputField
                    name="studentPickerSearch"
                    label="بحث طالب قديم"
                    value={studentPickerSearch}
                    onChange={(event) => setStudentPickerSearch(event.target.value)}
                    placeholder="اكتب الاسم أو الموبايل"
                  />
                  {selectedStudent && (
                    <div className="mt-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      تم اختيار: {selectedStudent.name} · {selectedStudent.phone || 'بدون هاتف'}
                    </div>
                  )}
                  {studentPickerSearch.trim() && (
                    <div className="mt-3 max-h-56 overflow-auto rounded-2xl border border-slate-200 bg-white">
                      {filteredStudentsForPicker.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => {
                            setSelectedStudentId(String(student.id))
                            setStudentPickerSearch(student.name || '')
                          }}
                          className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-right text-sm hover:bg-slate-50"
                        >
                          <span className="font-semibold text-slate-800">{student.name}</span>
                          <span className="text-xs text-slate-500">{student.phone || '--'}</span>
                        </button>
                      ))}
                      {filteredStudentsForPicker.length === 0 && (
                        <p className="px-4 py-3 text-sm text-slate-400">لا يوجد مطابقات</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{t('sections.quickRegister')}</h3>
                    <p className="text-xs text-slate-400">{t('labels.quickRegisterHint')}</p>
                  </div>
                  <form onSubmit={handleQuickStudentSubmit} className="mt-4 grid gap-4">
                    <div>
                      <InputField
                        name="quickName"
                        label={t('fields.name')}
                        value={quickStudent.name}
                        onChange={(event) =>
                          setQuickStudent((prev) => ({ ...prev, name: event.target.value }))
                        }
                        required
                      />
                      {studentAutocomplete && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuickStudent({
                              name: studentAutocomplete.name,
                              phone: studentAutocomplete.phone || '',
                              stage: studentAutocomplete.stage || 'first',
                              gender: studentAutocomplete.gender || 'male',
                              system: studentAutocomplete.system || 'general',
                              specialty: studentAutocomplete.specialty || '',
                            })
                            setSelectedStudentId(String(studentAutocomplete.id))
                          }}
                          className="mt-1 text-xs font-semibold text-brand-600"
                        >
                          {t('labels.useExistingStudent')}
                        </button>
                      )}
                    </div>
                    <InputField
                      name="quickPhone"
                      label={t('fields.phone')}
                      value={quickStudent.phone}
                      onChange={(event) =>
                        setQuickStudent((prev) => ({ ...prev, phone: event.target.value }))
                      }
                      required
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <SelectField
                        label={t('fields.stage')}
                        value={quickStudent.stage}
                        onChange={(event) =>
                          setQuickStudent((prev) => ({ ...prev, stage: event.target.value }))
                        }
                        options={stageOptions}
                      />
                      <SelectField
                        label={t('fields.gender')}
                        value={quickStudent.gender}
                        onChange={(event) =>
                          setQuickStudent((prev) => ({ ...prev, gender: event.target.value }))
                        }
                        options={genderOptions}
                      />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <SelectField
                        label={t('fields.system')}
                        value={quickStudent.system}
                        onChange={(event) =>
                          setQuickStudent((prev) => ({ ...prev, system: event.target.value }))
                        }
                        options={systemOptions}
                      />
                      <InputField
                        name="specialty"
                        label={t('fields.specialty')}
                        value={quickStudent.specialty}
                        onChange={(event) =>
                          setQuickStudent((prev) => ({ ...prev, specialty: event.target.value }))
                        }
                      />
                    </div>
                    <button
                      type="submit"
                      className="flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white"
                    >
                      <Plus className="h-4 w-4" />
                      {t('actions.registerStudent')}
                    </button>
                  </form>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{t('sections.products')}</h3>
                    <span className="text-xs font-semibold text-slate-400">
                      {filteredBooks.length} items
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {filteredBooks.map((book) => {
                      const highlightReservation =
                        selectedStudent && hasPendingReservation(selectedStudent.id, book.id)
                      const reservedStock = Number(book.reservedStock) || 0
                      const availableToSell = Math.max((Number(book.stock) || 0) - reservedStock, 0)
                      const canAddSale = book.isArriving || availableToSell > 0 || Boolean(highlightReservation)
                      return (
                        <div
                          key={book.id}
                          className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 ${
                            highlightReservation
                              ? 'ring-2 ring-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.6)]'
                              : ''
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-slate-900">{book.title}</p>
                            <p className="text-xs text-slate-500">
                              {book.author} · {t('labels.barcode')}: {book.barcode}
                            </p>
                            {highlightReservation && (
                              <p className="mt-1 text-xs font-semibold text-sky-600">
                                {t('labels.pendingReservation')} (سيتم خصم العربون تلقائيًا)
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-sm">
                              <p className="font-semibold text-brand-600">
                                {formatCurrency(locale, book.sellingPrice)}
                              </p>
                              <p className="text-xs text-slate-400">
                                {t('labels.stock')}: {book.stock} · محجوز: {reservedStock} · متاح للبيع: {availableToSell}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => addToCart(book)}
                              disabled={!canAddSale}
                              className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white ${canAddSale ? 'bg-brand-600' : 'bg-slate-300 cursor-not-allowed'}`}
                            >
                              {t('actions.addToCart')}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl bg-white p-6 shadow">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{t('sections.cart')}</h3>
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
                      {cartDetails.items.length} items
                    </span>
                  </div>

                  {cartDetails.items.length === 0 ? (
                    <p className="mt-6 text-sm text-slate-400">{t('empty.cart')}</p>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {cartDetails.items.map((item) => (
                        <div
                          key={item.lineKey}
                          className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                              <p className="text-xs text-slate-400">
                                {formatCurrency(locale, item.sellingPrice)} · {t('labels.qty')}{' '}
                                {item.qty}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateCartQty(item.lineKey, -1)}
                                className="h-7 w-7 rounded-full border border-slate-200 text-sm"
                              >
                                -
                              </button>
                              <span className="text-sm font-semibold">{item.qty}</span>
                              <button
                                type="button"
                                onClick={() => updateCartQty(item.lineKey, 1)}
                                className="h-7 w-7 rounded-full border border-slate-200 text-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={item.isArriving}
                                onClick={() => updateCartType(item.lineKey, 'sale')}
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  item.type === 'sale'
                                    ? 'bg-brand-600 text-white'
                                    : 'border border-slate-200 text-slate-500'
                                } ${item.isArriving ? 'cursor-not-allowed opacity-50' : ''}`}
                              >
                                {t('labels.sale')}
                              </button>
                              <button
                                type="button"
                                onClick={() => updateCartType(item.lineKey, 'reservation')}
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  item.type === 'reservation'
                                    ? 'bg-sky-600 text-white'
                                    : 'border border-slate-200 text-slate-500'
                                }`}
                              >
                                {t('labels.reservation')}
                              </button>
                              <button
                                type="button"
                                disabled={item.isArriving && item.type !== 'reservation'}
                                onClick={() => {
                                  const nextType = item.type === 'sale' ? 'reservation' : 'sale'
                                  addCartLine(item.id, nextType, {
                                    deposit: nextType === 'reservation' ? getDefaultReservationDeposit(item) : 0,
                                    isZeroReservation: false,
                                  })
                                }}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                              >
                                {item.type === 'sale' ? 'إضافة حجز' : 'إضافة شراء'}
                              </button>
                            </div>
                            {item.type === 'reservation' && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">{t('labels.deposit')}</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={item.deposit}
                                  onChange={(event) =>
                                    updateCartDeposit(item.lineKey, event.target.value)
                                  }
                                  className="w-24 rounded-xl border border-slate-200 bg-white px-2 py-1 text-right text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateCartDeposit(item.lineKey, item.isZeroReservation ? getDefaultReservationDeposit(item) : 0)}
                                  className="rounded-xl border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600"
                                >
                                  {item.isZeroReservation ? 'إلغاء الصفري' : 'حجز صفري'}
                                </button>
                              </div>
                            )}
                          </div>
                          {item.type === 'reservation' && item.pendingArrival && (
                            <div className="mt-2 inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                              {t('labels.pendingArrival')}
                            </div>
                          )}
                          {item.linkedReservation && (
                             <div className="mt-2 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                استكمال حجز (تم خصم {item.linkedReservation.deposit})
                             </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">طريقة الدفع</span>
                      <select
                        value={paymentMethod}
                        onChange={(event) => setPaymentMethod(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-sm"
                      >
                        <option value="cash">كاش</option>
                        <option value="wallet">فودافون كاش</option>
                        <option value="bank">تحويل بنكي</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{t('labels.subtotal')}</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(locale, cartDetails.subtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{t('labels.discount')}</span>
                      <input
                        type="number"
                        min="0"
                        value={discount}
                        onChange={(event) => setDiscount(event.target.value)}
                        className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-1 text-right text-sm"
                      />
                    </div>
                    <div className="flex items-center justify-between text-base">
                      <span className="text-slate-900">{t('labels.total')}</span>
                      <span className="font-semibold text-brand-700">
                        {formatCurrency(locale, cartDetails.total)}
                      </span>
                    </div>
                    {reservationOutstandingTotal > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">متبقي على الحجوزات لاحقًا</span>
                        <span className="font-semibold text-amber-700">{formatCurrency(locale, reservationOutstandingTotal)}</span>
                      </div>
                    )}

                    <div className="border-t border-slate-200 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">المدفوع</span>
                        <input
                          type="number"
                          min="0"
                          value={paidAmount}
                          onChange={(event) => setPaidAmount(event.target.value)}
                          placeholder={cartDetails.total}
                          className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-1 text-right text-sm"
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm font-semibold">
                        <span>
                          {Number(paidAmount) >= cartDetails.total ? 'الباقي للعميل' : 'متبقي عليه (دين)'}
                        </span>
                        <span className={Number(paidAmount) >= cartDetails.total ? 'text-emerald-600' : 'text-rose-600'}>
                          {formatCurrency(locale, Math.abs((Number(paidAmount) || 0) - cartDetails.total))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCompleteSale}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {t('actions.completeSale')}
                  </button>
                </div>

                <ThermalReceipt
                  t={t}
                  locale={locale}
                  receipt={receiptPayload}
                  receiptLink={receiptLink}
                  hasPhone={Boolean(whatsappPhone)}
                  followsUs={followsUs}
                  onFollowsUsChange={setFollowsUs}
                  whatsappGroupLink={whatsappGroupLink}
                  channelLink={channelLink}
                  onPrint={archiveAndPrintReceipt}
                />
              </div>
            </section>
          )}

          {activeView === 'books' && (
            <BooksTable
              t={t}
              locale={locale}
              books={books}
              onAdd={() => openBookModal('add')}
              onEdit={(book) => openBookModal('edit', book)}
              onPrint={(book) => setBarcodeModal({ open: true, book })}
            />
          )}

          {activeView === 'booksInsights' && (
            <BooksInsightsView
              locale={locale}
              rows={booksInsightsRows}
              formatCurrency={formatCurrency}
            />
          )}

          {activeView === 'students' && (
            <StudentsTable
              t={t}
              students={students}
              stageOptions={stageOptions}
              genderOptions={genderOptions}
              systemOptions={systemOptions}
              onAdd={() => openStudentModal('add')}
              onEdit={(student) => openStudentModal('edit', student)}
              onView={(student) => setStudentDetailsModal({ open: true, student })}
            />
          )}

          {activeView === 'pickupReservation' && (
            <div className="rounded-3xl bg-white p-10 text-center shadow">
              <PackageCheck className="mx-auto h-12 w-12 text-brand-600" />
              <h3 className="mt-4 text-lg font-semibold">{t('nav.pickupReservation')}</h3>
              <p className="mt-2 text-sm text-slate-500">{t('labels.searchByTxOrPhone')}</p>
              <input
                type="text"
                value={pickupSearch}
                onChange={(e) => setPickupSearch(e.target.value)}
                placeholder="ED-0001 أو الاسم أو الهاتف"
                className="mt-4 w-full max-w-md rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              />
              <button
                type="button"
                onClick={() => setLegacyReservationModal({ open: true })}
                className="mt-3 rounded-2xl border border-dashed border-brand-300 bg-brand-50 px-4 py-2 text-xs font-semibold text-brand-700"
              >
                حجز من الدفتر القديم
              </button>
              <PickupReservationContent
                t={t}
                locale={locale}
                pickupSearch={pickupSearch}
                students={students}
                books={books}
                pendingReservations={pendingReservations}
                salesHistory={salesHistory}
                formatCurrency={formatCurrency}
                onComplete={({ student, reservations }) => {
                  const ids = reservations.map((r) => r.id)
                  const items = reservations.map((r) => {
                    const book = books.find((b) => b.id === r.bookId)
                    const qty = r.qty || 1
                    const pricePerUnit = book ? book.sellingPrice || 0 : 0
                    const fullPrice = pricePerUnit * qty
                    const deposit = r.deposit || 0
                    const remaining = Math.max(fullPrice - deposit, 0)
                    return {
                      id: r.id,
                      title: book?.title || '',
                      qty,
                      type: 'pickup',
                      deposit,
                      lineTotal: remaining,
                    }
                  })
                  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
                  const transactionId = formatTransactionId(transactionCounter)
                  const transactionDate = new Date()
                  const pickupEntry = {
                    id: transactionId,
                    date: transactionDate.toISOString(),
                    staffId: selectedStaffId,
                    staffName: t(`staff.${selectedStaffId}`),
                    student,
                    items,
                    subtotal,
                    discount: 0,
                    total: subtotal,
                    costTotal: 0,
                    netProfit: subtotal,
                    receiptType: 'pickup',
                    paymentMethod,
                  }
                  
                  // Deduct from Wallet if Payment Method is Wallet
                  // Note: 'paymentMethod' here is passed from prop, usually 'cash' default?
                  // We need to allow selecting payment method in Pickup View too.
                  // For now, let's assume if they have enough balance, we can deduct?
                  // Or just respect 'paymentMethod' prop which might be default 'cash'.
                  // The user said: "When I deposit book price in wallet, it must be deducted from any new operation".
                  // So if student has balance, we should probably prioritize it?
                  // Or let's just deduct if paymentMethod is wallet.
                  // But we don't have a payment selector in Pickup View yet.
                  // Let's AUTO-DEDUCT from wallet if balance > 0, regardless?
                  // No, that's dangerous.
                  
                  // Let's add simple logic: If student has balance >= total, deduct from wallet and mark as paid by wallet.
                  if (student.balance >= subtotal) {
                     setStudents(prev => prev.map(s => 
                        s.id === student.id 
                          ? { ...s, balance: (s.balance || 0) - subtotal } 
                          : s
                     ))
                     pickupEntry.paymentMethod = 'wallet'
                     const logEntry = {
                        id: Date.now(),
                        studentId: student.id,
                        amount: -subtotal,
                        type: 'pickup_wallet',
                        date: new Date().toISOString(),
                        description: `استلام حجز ${transactionId} من المحفظة`
                      }
                      setWalletLog(prev => [logEntry, ...prev])
                  } else {
                     pickupEntry.paymentMethod = 'cash'
                  }

                  setSalesHistory((prev) => [pickupEntry, ...prev])
                  setTransactionCounter((prev) => prev + 1)
                  setLastTransaction(pickupEntry)
                  // Stock was ALREADY deducted when reservation was made. 
                  // So we DO NOT deduct again here.
                  /*
                  if (pickedBooks.length) {
                    setBooks((prev) =>
                      prev.map((book) => {
                        const picked = pickedBooks.find((r) => r.bookId === book.id)
                        if (!picked) return book
                        const nextStock = Math.max((book.stock || 0) - picked.qty, 0)
                        return { ...book, stock: nextStock }
                      }),
                    )
                  }
                  */
                  setPendingReservations((prev) => prev.filter((r) => !ids.includes(r.id)))
                  setActiveView('receipt')
                }}
              />
            </div>
          )}

          {activeView === 'cancelReservation' && (
            <div className="rounded-3xl bg-white p-10 text-center shadow">
              <PackageX className="mx-auto h-12 w-12 text-amber-500" />
              <h3 className="mt-4 text-lg font-semibold">{t('nav.cancelReservation')}</h3>
              <p className="mt-2 text-sm text-slate-500">{t('labels.searchByTxOrPhone')}</p>
              <input
                type="text"
                value={cancelSearch}
                onChange={(e) => setCancelSearch(e.target.value)}
                placeholder="ED-0001 أو الاسم أو الهاتف"
                className="mt-4 w-full max-w-md rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              />
              <CancelReservationContent
                t={t}
                locale={locale}
                cancelSearch={cancelSearch}
                students={students}
                books={books}
                pendingReservations={pendingReservations}
                salesHistory={salesHistory}
                formatCurrency={formatCurrency}
                onComplete={({ student, reservations, totalRefund, refundMethod }) => {
                  const ids = reservations.map((r) => r.id)
                  const toCancel = pendingReservations.filter((r) => ids.includes(r.id))
                  setPendingReservations((prev) => prev.filter((r) => !ids.includes(r.id)))
                  setCancelledReservations((prev) => [...prev, ...toCancel])
                  
                  // Restore Stock
                  const cancelledItems = toCancel.map(r => ({ bookId: r.bookId, qty: r.qty || 1 }))
                  setBooks(prev => prev.map(book => {
                     const item = cancelledItems.find(i => i.bookId === book.id)
                     if (!item) return book
                     return { ...book, stock: (book.stock || 0) + item.qty }
                  }))

                  if (refundMethod === 'wallet') {
                     // Refund to Wallet
                     setStudents(prev => prev.map(s => 
                        s.id === student.id 
                          ? { ...s, balance: (s.balance || 0) + totalRefund } 
                          : s
                     ))
                     const logEntry = {
                        id: Date.now(),
                        studentId: student.id,
                        amount: totalRefund,
                        type: 'refund_cancel_reservation',
                        date: new Date().toISOString(),
                        description: `استرداد حجز للمحفظة`
                      }
                      setWalletLog(prev => [logEntry, ...prev])
                  } else {
                     // Refund Cash (Withdrawal)
                     setWithdrawals((prev) => [
                        ...prev,
                        {
                          id: Date.now(),
                          amount: -totalRefund,
                          reason: 'سحب حجز (كاش)',
                          staffId: selectedStaffId,
                          date: new Date().toISOString(),
                        },
                      ])
                  }

                  const items = reservations.map((r) => {
                    const book = books.find((b) => b.id === r.bookId)
                    return {
                      id: r.id,
                      title: book?.title || '',
                      qty: r.qty || 1,
                      type: 'cancel',
                      lineTotal: r.deposit || 0,
                    }
                  })
                  const transactionId = formatTransactionId(transactionCounter)
                  const transactionDate = new Date()
                  const cancelEntry = {
                    id: transactionId,
                    date: transactionDate.toISOString(),
                    staffId: selectedStaffId,
                    staffName: t(`staff.${selectedStaffId}`),
                    student,
                    items,
                    subtotal: totalRefund,
                    discount: 0,
                    total: totalRefund,
                    costTotal: 0,
                    netProfit: -totalRefund,
                    receiptType: 'cancel',
                    paymentMethod,
                  }
                  setLastTransaction(cancelEntry)
                  setActiveView('receipt')
                }}
              />
            </div>
          )}

          {activeView === 'returns' && (
            <div className="rounded-3xl bg-white p-10 text-center shadow">
              <ArrowUpDown className="mx-auto h-12 w-12 text-rose-500" />
              <h3 className="mt-4 text-lg font-semibold">مرتجع فاتورة</h3>
              <p className="mt-2 text-sm text-slate-500">ابحث برقم العملية أو اسم الطالب</p>
              <ReturnSaleContent
                t={t}
                locale={locale}
                salesHistory={salesHistory}
                formatCurrency={formatCurrency}
                selectedStaffId={selectedStaffId}
                paymentMethod={paymentMethod}
                onReturnComplete={(entry, affectedBooks, isWalletRefund) => {
                  setSalesHistory((prev) => [entry, ...prev])
                  setTransactionCounter((prev) => prev + 1)
                  setLastTransaction(entry)
                  if (affectedBooks.length) {
                    setBooks((prev) =>
                      prev.map((book) => {
                        const returned = affectedBooks.find((r) => r.bookId === book.id)
                        if (!returned) return book
                        const nextStock = (book.stock || 0) + returned.qty
                        return { ...book, stock: nextStock }
                      }),
                    )
                  }
                  
                  if (isWalletRefund && entry.student?.id) {
                     setStudents(prev => prev.map(s => 
                        s.id === entry.student.id 
                          ? { ...s, balance: (s.balance || 0) + Math.abs(entry.total) } 
                          : s
                     ))
                     const logEntry = {
                        id: Date.now(),
                        studentId: entry.student.id,
                        amount: Math.abs(entry.total),
                        type: 'refund_return_sale',
                        date: new Date().toISOString(),
                        description: `استرداد فاتورة ${entry.originalTransactionId} للمحفظة`
                      }
                      setWalletLog(prev => [logEntry, ...prev])
                  }

                  setActiveView('receipt')
                }}
              />
            </div>
          )}

          {activeView === 'receipt' && (
            <div className="max-w-3xl space-y-4">
              <ThermalReceipt
                t={t}
                locale={locale}
                receipt={receiptPayload}
                receiptLink={receiptLink}
                hasPhone={Boolean(whatsappPhone)}
                followsUs={followsUs}
                onFollowsUsChange={setFollowsUs}
                whatsappGroupLink={whatsappGroupLink}
                channelLink={channelLink}
                onPrint={archiveAndPrintReceipt}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCartItems([])
                    setDiscount(0)
                    setSelectedStudentId('')
                    setQuickStudent({
                      name: '',
                      phone: '',
                      stage: 'first',
                      gender: 'male',
                      system: 'general',
                      specialty: '',
                    })
                    setLastTransaction(null)
                    setActiveView('pos')
                  }}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold"
                >
                  عملية جديدة
                </button>
              </div>
            </div>
          )}

          {activeView === 'receiptArchive' && (
            <ReceiptArchiveView
              locale={locale}
              items={receiptArchiveItems}
              onRefresh={async () => {
                if (!useBackend) return
                try {
                  const data = await apiRequest('/receipt-archive')
                  setReceiptArchiveItems(Array.isArray(data) ? data : [])
                } catch {
                  setReceiptArchiveItems([])
                }
              }}
              onOpenReceipt={(payload) => {
                setLastTransaction(payload)
                setActiveView('receipt')
              }}
            />
          )}

          {activeView === 'accounting' && (
            <AccountingView
              locale={locale}
              books={books}
              report={financeReport}
              supplies={supplies}
              form={supplyForm}
              onFormChange={setSupplyForm}
              onRefresh={async () => {
                if (!useBackend) return
                try {
                  const [finance, suppliesList] = await Promise.all([
                    apiRequest('/reports/finance'),
                    apiRequest('/supplies'),
                  ])
                  setFinanceReport(finance || null)
                  setSupplies(Array.isArray(suppliesList) ? suppliesList : [])
                } catch {
                  setFinanceReport(null)
                  setSupplies([])
                }
              }}
              onCreateSupply={async () => {
                if (!useBackend) return
                const bookId = Number(supplyForm.bookId)
                const quantity = Number(supplyForm.qty)
                const unitCost = Number(supplyForm.unitCost)
                const paid = supplyForm.paid === '' ? 0 : Number(supplyForm.paid)
                if (!bookId || quantity <= 0 || Number.isNaN(quantity) || Number.isNaN(unitCost)) return
                try {
                  await apiRequest('/supplies', {
                    method: 'POST',
                    body: JSON.stringify({
                      book_id: bookId,
                      quantity,
                      unit_cost: unitCost,
                      paid_amount: paid,
                      supplier_name: supplyForm.supplier || null,
                      staff_name: selectedStaffId,
                    }),
                  })
                  setSupplyForm({ bookId: '', qty: '1', unitCost: '', paid: '', supplier: '' })
                  const apiBooks = await apiRequest('/books')
                  setBooks(Array.isArray(apiBooks) ? apiBooks.map(mapApiBookToUi) : [])
                  const [finance, suppliesList] = await Promise.all([
                    apiRequest('/reports/finance'),
                    apiRequest('/supplies'),
                  ])
                  setFinanceReport(finance || null)
                  setSupplies(Array.isArray(suppliesList) ? suppliesList : [])
                } catch (error) {
                  alert(error?.message || 'فشل تسجيل التوريد')
                }
              }}
            />
          )}

          {activeView === 'emergency' && (
            <div className="rounded-3xl bg-white p-6 shadow">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-amber-500" />
                <div>
                  <h3 className="text-lg font-semibold">{t('sections.emergency')}</h3>
                  <p className="text-sm text-slate-500">{t('labels.emergencyHint')}</p>
                </div>
              </div>
              <form onSubmit={handleEmergencySubmit} className="mt-6 grid gap-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <InputField
                    name="emergencyAmount"
                    label={t('fields.amount')}
                    type="number"
                    min="1"
                    value={emergencyForm.amount}
                    onChange={(event) =>
                      setEmergencyForm((prev) => ({ ...prev, amount: event.target.value }))
                    }
                    required
                  />
                  <SelectField
                    label={t('fields.staff')}
                    value={emergencyForm.staffId || selectedStaffId}
                    onChange={(event) =>
                      setEmergencyForm((prev) => ({ ...prev, staffId: event.target.value }))
                    }
                    options={staffMembers.map((member) => ({
                      value: member.id,
                      label: t(`staff.${member.id}`),
                    }))}
                  />
                </div>
                <InputField
                  name="emergencyReason"
                  label={t('fields.reason')}
                  value={emergencyForm.reason}
                  onChange={(event) =>
                    setEmergencyForm((prev) => ({ ...prev, reason: event.target.value }))
                  }
                  required
                />
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {t('labels.safeWarning')}
                </div>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white"
                >
                  {t('actions.recordWithdrawal')}
                </button>
              </form>
              {withdrawals.length > 0 && (
                <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <h4 className="text-sm font-semibold text-slate-700">{t('labels.recentWithdrawals')}</h4>
                  <div className="mt-3 space-y-2 text-xs text-slate-500">
                    {withdrawals.slice(0, 4).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between">
                        <span>
                          {t(`staff.${entry.staffId}`)} · {entry.reason}
                        </span>
                        <span className="font-semibold text-slate-700">
                          {formatCurrency(locale, entry.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'inventory' && (
            <div className="rounded-3xl bg-white p-6 shadow">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-6 w-6 text-brand-600" />
                <div>
                  <h3 className="text-lg font-semibold">{t('sections.inventory')}</h3>
                  <p className="text-sm text-slate-500">{t('labels.inventoryHint')}</p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <StatCard title={t('labels.safeBalance')} value={formatCurrency(locale, safeBalance)} />
                <StatCard title={t('labels.salesTotal')} value={formatCurrency(locale, totalSales)} />
                <StatCard
                  title={t('labels.withdrawalsTotal')}
                  value={formatCurrency(locale, totalWithdrawals)}
                />
              </div>
              <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700">{t('labels.auditSession')}</h4>
                    <p className="text-xs text-slate-500">{t('labels.auditHint')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-slate-600">
                      <p className="mb-1">الرصيد الفعلي في الدرج</p>
                      <input
                        type="number"
                        min="0"
                        value={auditActualCash}
                        onChange={(event) => setAuditActualCash(event.target.value)}
                        className="w-32 rounded-xl border border-slate-300 bg-white px-2 py-1 text-right text-xs"
                      />
                    </div>
                    <SelectField
                      label={t('fields.auditStaff')}
                      value={auditStaffId}
                      onChange={(event) => setAuditStaffId(event.target.value)}
                      options={auditStaffMembers.map((member) => ({
                        value: member.id,
                        label: t(`staff.${member.id}`),
                      }))}
                      compact
                    />
                    <button
                      type="button"
                      onClick={handleAudit}
                      disabled={!['heba', 'maryam'].includes(auditStaffId)}
                      className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {t('actions.audit')}
                    </button>
                  </div>
                </div>
                {auditLog.length > 0 && (
                  <div className="mt-4 space-y-2 text-xs text-slate-500">
                    {auditLog.slice(0, 3).map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-slate-100 bg-white px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span>
                            {t(`staff.${entry.staffId}`)} ·{' '}
                            {new Date(entry.date).toLocaleString(locale)}
                          </span>
                          <span className="font-semibold text-slate-700">
                            {formatCurrency(locale, entry.safeBalance)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px]">
                          <span>الرصيد المتوقع</span>
                          <span>{formatCurrency(locale, entry.safeBalance)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span>الرصيد الفعلي</span>
                          <span>{formatCurrency(locale, entry.actualCash || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span>الفرق</span>
                          <span className={entry.diff === 0 ? 'text-emerald-600' : entry.diff > 0 ? 'text-amber-600' : 'text-rose-600'}>
                            {formatCurrency(locale, entry.diff || 0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === 'admin' && (
            <div className="rounded-3xl bg-white p-6 shadow">
              {!adminUnlocked ? (
                <div className="max-w-lg space-y-4">
                  <div className="flex items-center gap-3">
                    <Lock className="h-6 w-6 text-brand-600" />
                    <div>
                      <h3 className="text-lg font-semibold">{t('sections.admin')}</h3>
                      <p className="text-sm text-slate-500">{t('labels.adminHint')}</p>
                    </div>
                  </div>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault()
                      if (adminPassword === 'educon_admin') {
                        setAdminUnlocked(true)
                        setAdminPassword('')
                      }
                    }}
                    className="space-y-3"
                  >
                    <InputField
                      name="adminPassword"
                      label={t('fields.password')}
                      type="password"
                      value={adminPassword}
                      onChange={(event) => setAdminPassword(event.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      {t('actions.unlock')}
                    </button>
                  </form>
                </div>
              ) : (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{t('sections.admin')}</h3>
                      <p className="text-sm text-slate-500">{t('labels.adminMetrics')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={exportToExcel}
                        className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        {t('actions.exportExcel')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminUnlocked(false)}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                      >
                        {t('actions.lock')}
                      </button>
                    </div>
                  </div>
                  <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <label className="block text-sm font-semibold text-slate-700">{(t('labels.customReceiptFooter') || 'نص إضافي للإيصالات')}</label>
                    <textarea
                      value={adminCustomFooter}
                      onChange={(e) => setAdminCustomFooter(e.target.value)}
                      placeholder="سياسات، عروض، إيفنتات..."
                      rows={3}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                    />
                  </div>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <StatCard title={t('labels.salesTotal')} value={formatCurrency(locale, totalSales)} />
                    <StatCard title={t('labels.costTotal')} value={formatCurrency(locale, totalCost)} />
                    <StatCard title={t('labels.netProfit')} value={formatCurrency(locale, totalNet)} />
                  </div>
                  <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <h4 className="text-sm font-semibold text-slate-700">{t('labels.performance')}</h4>
                    <div className="mt-4 space-y-3">
                      <MetricBar
                        label={t('labels.salesTotal')}
                        value={totalSales}
                        valueLabel={formatCurrency(locale, totalSales)}
                        max={chartMax}
                        color="bg-emerald-500"
                      />
                      <MetricBar
                        label={t('labels.costTotal')}
                        value={totalCost}
                        valueLabel={formatCurrency(locale, totalCost)}
                        max={chartMax}
                        color="bg-amber-500"
                      />
                      <MetricBar
                        label={t('labels.netProfit')}
                        value={totalNet}
                        valueLabel={formatCurrency(locale, totalNet)}
                        max={chartMax}
                        color="bg-sky-500"
                      />
                    </div>
                  </div>
                  <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <h4 className="text-sm font-semibold text-slate-700">{t('labels.recentTransactions')}</h4>
                    <div className="mt-3 space-y-2 text-xs text-slate-500">
                      {salesHistory.slice(0, 5).map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between">
                          <span>
                            {entry.id} · {entry.student?.name || t('labels.walkIn')} ·{' '}
                            {t(`staff.${entry.staffId}`)}
                          </span>
                          <span className="font-semibold text-slate-700">
                            {formatCurrency(locale, entry.total)}
                          </span>
                        </div>
                      ))}
                      {salesHistory.length === 0 && (
                        <p className="text-xs text-slate-400">{t('empty.sales')}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'reports' && (
            <div className="rounded-3xl bg-white p-10 shadow">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-brand-600" />
                <div>
                  <h3 className="text-lg font-semibold">{t('nav.reports')}</h3>
                  <p className="text-sm text-slate-500">ملخص سريع للفترة الحالية (من آخر جرد حتى الآن).</p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <StatCard title="عدد العمليات" value={salesHistory.length} />
                <StatCard title="إجمالي المبيعات" value={formatCurrency(locale, totalSales)} />
                <StatCard title="إجمالي السحوبات" value={formatCurrency(locale, totalWithdrawals)} />
                <StatCard title="رصيد الخزنة" value={formatCurrency(locale, safeBalance)} />
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-right text-xs text-slate-700">
                  <h4 className="text-sm font-semibold text-slate-800">أنواع العمليات</h4>
                  <div className="mt-3 space-y-1">
                    <p>بيع: {typeCounts.sale || 0}</p>
                    <p>حجز: {typeCounts.reservation || 0}</p>
                    <p>استلام حجز: {typeCounts.pickup || 0}</p>
                    <p>سحب حجز: {typeCounts.cancel || 0}</p>
                    <p>مرتجع: {typeCounts.return || 0}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-right text-xs text-slate-700">
                  <h4 className="text-sm font-semibold text-slate-800">أفضل الكتب مبيعًا (الفترة الحالية)</h4>
                  <div className="mt-3 space-y-1">
                    {books
                      .map((book) => {
                        const soldQty = salesHistory.reduce((sum, entry) => {
                          const items = Array.isArray(entry.items) ? entry.items : []
                          const fromSale = items.filter((item) => item.id === book.id && (item.type === 'sale' || item.type === 'pickup'))
                          return (
                            sum +
                            fromSale.reduce((s, item) => s + (item.qty || 1), 0)
                          )
                        }, 0)
                        return { book, soldQty }
                      })
                      .filter((row) => row.soldQty > 0)
                      .sort((a, b) => b.soldQty - a.soldQty)
                      .slice(0, 5)
                      .map((row) => (
                        <div key={row.book.id} className="flex items-center justify-between">
                          <span>{row.book.title}</span>
                          <span className="font-semibold">{row.soldQty}</span>
                        </div>
                      ))}
                    {books.every((book) =>
                      salesHistory.every((entry) =>
                        !(Array.isArray(entry.items) && entry.items.some((item) => item.id === book.id)),
                      ),
                    ) && <p className="text-slate-400">لا توجد كتب مباعة في هذه الفترة.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {bookModal.open && (
        <Modal onClose={() => setBookModal({ open: false, mode: 'add', data: null })}>
          <form onSubmit={saveBook} className="space-y-4">
            <ModalHeader
              title={bookModal.mode === 'edit' ? t('actions.edit') : t('actions.add')}
              onClose={() => setBookModal({ open: false, mode: 'add', data: null })}
            />
            <InputField
              name="title"
              label={t('fields.name')}
              defaultValue={bookModal.data?.title}
              required
            />
            <InputField
              name="author"
              label={t('fields.author')}
              defaultValue={bookModal.data?.author}
              required
            />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                name="isArriving"
                defaultChecked={bookModal.data?.isArriving}
                className="h-4 w-4 rounded border-slate-300"
              />
              {t('labels.arrivingSoon')}
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <InputField
                name="estimatedSellingPrice"
                label="سعر البيع التقريبي"
                type="number"
                defaultValue={bookModal.data?.estimatedSellingPrice ?? ''}
              />
              <InputField
                name="estimatedCostPrice"
                label="سعر التكلفة التقريبي"
                type="number"
                defaultValue={bookModal.data?.estimatedCostPrice ?? ''}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <InputField
                name="sellingPrice"
                label={t('labels.sellingPrice')}
                type="number"
                defaultValue={bookModal.data?.sellingPrice}
              />
              <InputField
                name="costPrice"
                label={t('labels.costPrice')}
                type="number"
                defaultValue={bookModal.data?.costPrice}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <InputField
                name="stock"
                label={t('labels.stock')}
                type="number"
                defaultValue={bookModal.data?.stock}
              />
              <InputField
                name="barcode"
                label={t('labels.barcode')}
                defaultValue={bookModal.data?.barcode}
              />
            </div>
            <ModalActions t={t} />
          </form>
        </Modal>
      )}

      {barcodeModal.open && (
        <Modal onClose={() => setBarcodeModal({ open: false, book: null })}>
          <div className="space-y-4">
            <ModalHeader
              title={t('labels.barcodePreview')}
              onClose={() => setBarcodeModal({ open: false, book: null })}
            />
            <div className="flex items-center justify-center">
              <div className="w-64 rounded-2xl border border-slate-200 bg-white p-4 text-center">
                <p className="text-sm font-semibold text-slate-900">
                  {barcodeModal.book?.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {barcodeModal.book?.barcode}
                </p>
                <div className="mt-4 h-10 rounded bg-slate-200" />
                <p className="mt-2 text-xs text-slate-400">{t('labels.labelPreview')}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold"
              >
                <Printer className="h-4 w-4" />
                {t('actions.print')}
              </button>
              <button
                type="button"
                onClick={() => setBarcodeModal({ open: false, book: null })}
                className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
              >
                {t('actions.close')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {studentModal.open && (
        <Modal onClose={() => setStudentModal({ open: false, mode: 'add', data: null })}>
          <form onSubmit={saveStudent} className="space-y-4">
            <ModalHeader
              title={studentModal.mode === 'edit' ? t('actions.edit') : t('actions.add')}
              onClose={() => setStudentModal({ open: false, mode: 'add', data: null })}
            />
            <InputField
              name="name"
              label={t('fields.name')}
              defaultValue={studentModal.data?.name}
              required
            />
            <div className="grid gap-3 md:grid-cols-2">
              <SelectField
                label={t('fields.stage')}
                name="stage"
                defaultValue={studentModal.data?.stage || 'first'}
                options={stageOptions}
              />
              <SelectField
                label={t('fields.gender')}
                name="gender"
                defaultValue={studentModal.data?.gender || 'male'}
                options={genderOptions}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <SelectField
                label={t('fields.system')}
                name="system"
                defaultValue={studentModal.data?.system || 'general'}
                options={systemOptions}
              />
              <InputField
                name="specialty"
                label={t('fields.specialty')}
                defaultValue={studentModal.data?.specialty}
              />
            </div>
            <InputField
              name="phone"
              label={t('fields.phone')}
              defaultValue={studentModal.data?.phone}
              required
            />
            <ModalActions t={t} />
          </form>
        </Modal>
      )}

      {studentDetailsModal.open && studentDetailsModal.student && (
        <StudentDetailsModal
          t={t}
          locale={locale}
          student={studentDetailsModal.student}
          salesHistory={salesHistory}
          pendingReservations={pendingReservations}
          books={books}
          walletLog={walletLog}
          formatCurrency={formatCurrency}
          onClose={() => setStudentDetailsModal({ open: false, student: null })}
          onPickup={({ student, reservations }) => {
            // Re-use logic from PickupReservationContent via a wrapper or direct call
            // Ideally we should extract the pickup logic to a shared function "handlePickup"
            // For now, let's just close modal and switch to pickup view with search pre-filled?
            // No, better to execute it here.
            // Let's Copy-Paste the logic from PickupReservationContent's onComplete for now, 
            // but since we don't have access to setSalesHistory etc here easily without passing them,
            // we might want to refactor.
            // Actually, we can pass a "handlePickup" function from App to StudentDetailsModal.
            
            // Wait, passing "onPickup" prop is what we did.
            // So we need to define the handler in App.
            
            // Reuse the logic:
            const ids = reservations.map((r) => r.id)
            const items = reservations.map((r) => {
              const book = books.find((b) => b.id === r.bookId)
              const qty = r.qty || 1
              const pricePerUnit = book ? book.sellingPrice || 0 : 0
              const fullPrice = pricePerUnit * qty
              const deposit = r.deposit || 0
              const remaining = Math.max(fullPrice - deposit, 0)
              return {
                id: r.id,
                title: book?.title || '',
                qty,
                type: 'pickup',
                deposit,
                lineTotal: remaining,
              }
            })
            const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
            const transactionId = formatTransactionId(transactionCounter)
            const transactionDate = new Date()
            const pickupEntry = {
              id: transactionId,
              date: transactionDate.toISOString(),
              staffId: selectedStaffId,
              staffName: t(`staff.${selectedStaffId}`),
              student,
              items,
              subtotal,
              discount: 0,
              total: subtotal,
              costTotal: 0,
              netProfit: subtotal,
              receiptType: 'pickup',
              paymentMethod: 'cash', // Default to cash in modal for now
            }
            setSalesHistory((prev) => [pickupEntry, ...prev])
            setTransactionCounter((prev) => prev + 1)
            setLastTransaction(pickupEntry)
            // Stock ALREADY deducted on reservation. Do NOT deduct again.
            /*
            if (pickedBooks.length) {
              setBooks((prev) =>
                prev.map((book) => {
                  const picked = pickedBooks.find((r) => r.bookId === book.id)
                  if (!picked) return book
                  const nextStock = Math.max((book.stock || 0) - picked.qty, 0)
                  return { ...book, stock: nextStock }
                }),
              )
            }
            */
            setPendingReservations((prev) => prev.filter((r) => !ids.includes(r.id)))
            setStudentDetailsModal({ open: false, student: null })
            setActiveView('receipt')
          }}
        />
      )}

      <LegacyReservationModal
        open={legacyReservationModal.open}
        onClose={() => setLegacyReservationModal({ open: false })}
        books={books}
        students={students}
        setStudents={setStudents}
        setPendingReservations={setPendingReservations}
      />
    </div>
  )
}

function findReservationsBySearch(search, students, pendingReservations, salesHistory) {
  const term = (search || '').trim().toLowerCase()
  if (!term) return { student: null, reservations: [], candidates: [] }

  // 1. Try Transaction ID first
  const txMatch = term.match(/^ed-?(\d+)$/i)
  if (txMatch) {
    const txId = `ED-${String(parseInt(txMatch[1], 10)).padStart(4, '0')}`
    const sale = salesHistory.find((s) => s.id === txId)
    if (sale?.student) {
      const res = pendingReservations.filter((r) => r.studentId === sale.student.id)
      return { student: sale.student, reservations: res, candidates: [] }
    }
  }

  // 2. Find ALL matching students
  const termDigits = term.replace(/\D/g, '')
  const matchedStudents = students.filter((s) => {
    const name = (s.name || '').toLowerCase()
    const phoneDigits = (s.phone || '').replace(/\D/g, '')
    const phoneExact = termDigits.length >= 7 && phoneDigits === termDigits
    const phonePartial = termDigits.length >= 7 && phoneDigits.includes(termDigits)
    const nameExact = name === term
    const nameStarts = term.length >= 2 && name.startsWith(term)
    const nameContains = term.length >= 3 && name.includes(term)
    return phoneExact || phonePartial || nameExact || nameStarts || nameContains
  })

  if (matchedStudents.length === 0) return { student: null, reservations: [], candidates: [] }

  const rank = (s) => {
    const name = (s.name || '').toLowerCase()
    const phoneDigits = (s.phone || '').replace(/\D/g, '')
    const hasRes = pendingReservations.some((r) => r.studentId === s.id) ? 1 : 0
    const phoneExact = termDigits.length >= 7 && phoneDigits === termDigits ? 1 : 0
    const nameExact = name === term ? 1 : 0
    const starts = name.startsWith(term) ? 1 : 0
    return hasRes * 100 + phoneExact * 40 + nameExact * 30 + starts * 10
  }
  const sorted = [...matchedStudents].sort((a, b) => rank(b) - rank(a))
  const candidates = sorted.filter((s) => pendingReservations.some((r) => r.studentId === s.id))
  const exact = sorted.find((s) => {
    const name = (s.name || '').toLowerCase()
    const phoneDigits = (s.phone || '').replace(/\D/g, '')
    return name === term || (termDigits.length >= 7 && phoneDigits === termDigits)
  })
  if (!exact && candidates.length > 1) {
    return { student: null, reservations: [], candidates }
  }
  const bestMatch = exact || sorted[0]
  const res = pendingReservations.filter((r) => r.studentId === bestMatch.id)
  
  return { student: bestMatch, reservations: res, candidates: [] }
}

function PickupReservationContent({ t, locale, pickupSearch, students, books, pendingReservations, salesHistory, formatCurrency, onComplete }) {
  const { student, reservations, candidates } = useMemo(
    () => findReservationsBySearch(pickupSearch, students, pendingReservations, salesHistory),
    [pickupSearch, students, pendingReservations, salesHistory]
  )
  
  // Calculate Balance (Debt/Credit)
  const balance = student?.balance || 0

  if (!pickupSearch.trim()) {
    if (pendingReservations.length === 0) {
      return <p className="mt-6 text-sm text-slate-500">لا يوجد حجوزات معلقة حاليًا.</p>
    }
    return (
      <div className="mt-6 text-sm text-slate-500">
        اكتب رقم العملية، اسم الطالب، أو رقم الهاتف لعرض حجوزاته المعلقة.
      </div>
    )
  }
  if (!student && candidates.length > 1) {
    return (
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
        <p className="font-semibold text-amber-700">يوجد أكثر من طالب مطابق. اكتب اسمًا أكمل أو رقم هاتف أو رقم عملية.</p>
        <div className="mt-2 space-y-1 text-slate-700">
          {candidates.slice(0, 8).map((c) => (
            <p key={c.id}>{c.name} · {c.phone || '--'}</p>
          ))}
        </div>
      </div>
    )
  }
  if (!student) return <p className="mt-6 text-sm text-slate-500">{t('empty.students')}</p>
  if (reservations.length === 0) return <p className="mt-6 text-sm text-slate-500">لا يوجد حجوزات معلقة</p>
  const totalDeposit = reservations.reduce((sum, r) => sum + (r.deposit || 0), 0)
  const totalPrice = reservations.reduce((sum, r) => {
    const book = books.find((b) => b.id === r.bookId)
    const qty = r.qty || 1
    return sum + (book ? (book.sellingPrice || 0) * qty : 0)
  }, 0)
  const remainingTotal = Math.max(totalPrice - totalDeposit, 0)
  return (
    <div className="mt-6 text-right">
      <p className="font-semibold">{student.name}</p>
      <p className="text-sm text-slate-500">{student.phone}</p>
      <div className="mt-4 space-y-2">
        {reservations.map((r) => {
          const book = books.find((b) => b.id === r.bookId)
          const qty = r.qty || 1
          const price = book ? (book.sellingPrice || 0) * qty : 0
          const remaining = Math.max(price - (r.deposit || 0), 0)
          return (
            <div key={r.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p>{book?.title}</p>
              <p className="text-xs text-slate-500">{r.transactionId || r.id}</p>
              <div className="mt-1 text-xs text-slate-600">
                <p>سعر الكتاب: {formatCurrency(locale, price)}</p>
                <p>المدفوع حجزًا: {formatCurrency(locale, r.deposit || 0)}</p>
                <p>المتبقي على هذا الحجز: {formatCurrency(locale, remaining)}</p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-4 space-y-1 text-sm">
        <p className="font-semibold">إجمالي المدفوع حجزًا: {formatCurrency(locale, totalDeposit)}</p>
        <p>إجمالي سعر الكتب: {formatCurrency(locale, totalPrice)}</p>
        <p className="font-semibold text-emerald-700">المتبقي على الحساب الآن: {formatCurrency(locale, remainingTotal)}</p>
        {balance > 0 && (
           <p className="text-xs font-semibold text-brand-600">رصيد المحفظة المتاح: {formatCurrency(locale, balance)}</p>
        )}
        {remainingTotal > 0 && balance >= remainingTotal && (
           <p className="text-xs text-emerald-600">سيتم الخصم من المحفظة تلقائيًا.</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onComplete({ student, reservations })}
        className="mt-4 rounded-2xl bg-brand-600 px-6 py-2 text-sm font-semibold text-white"
      >
        تأكيد الاستلام {remainingTotal > 0 && balance >= remainingTotal ? '(من المحفظة)' : ''}
      </button>
    </div>
  )
}

function CancelReservationContent({ t, locale, cancelSearch, students, books, pendingReservations, salesHistory, formatCurrency, onComplete }) {
  const { student, reservations, candidates } = useMemo(
    () => findReservationsBySearch(cancelSearch, students, pendingReservations, salesHistory),
    [cancelSearch, students, pendingReservations, salesHistory]
  )
  if (!cancelSearch.trim()) {
    if (pendingReservations.length === 0) {
      return <p className="mt-6 text-sm text-slate-500">لا يوجد حجوزات معلقة يمكن سحبها.</p>
    }
    return (
      <div className="mt-6 text-sm text-slate-500">
        اكتب رقم العملية، اسم الطالب، أو رقم الهاتف لعرض الحجوزات القابلة للسحب.
      </div>
    )
  }
  if (!student && candidates.length > 1) {
    return (
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
        <p className="font-semibold text-amber-700">يوجد أكثر من طالب مطابق. اكتب اسمًا أكمل أو رقم هاتف أو رقم عملية.</p>
        <div className="mt-2 space-y-1 text-slate-700">
          {candidates.slice(0, 8).map((c) => (
            <p key={c.id}>{c.name} · {c.phone || '--'}</p>
          ))}
        </div>
      </div>
    )
  }
  if (!student) return <p className="mt-6 text-sm text-slate-500">{t('empty.students')}</p>
  if (reservations.length === 0) return <p className="mt-6 text-sm text-slate-500">لا يوجد حجوزات معلقة</p>
  const totalRefund = reservations.reduce((sum, r) => sum + (r.deposit || 0), 0)
  return (
    <div className="mt-6 text-right">
      <p className="font-semibold">{student.name}</p>
      <p className="text-sm text-slate-500">{student.phone}</p>
      <div className="mt-4 space-y-2">
        {reservations.map((r) => {
          const book = books.find((b) => b.id === r.bookId)
          return (
            <div key={r.id} className="rounded-xl border border-amber-100 bg-amber-50 p-3">
              <p>{book?.title} - استرداد: {formatCurrency(locale, r.deposit)}</p>
            </div>
          )
        })}
      </div>
      <p className="mt-4 font-semibold text-amber-700">إجمالي الاسترداد: {formatCurrency(locale, totalRefund)}</p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => onComplete({ student, reservations, totalRefund, refundMethod: 'cash' })}
          className="flex-1 rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white"
        >
          سحب كاش
        </button>
        <button
          type="button"
          onClick={() => onComplete({ student, reservations, totalRefund, refundMethod: 'wallet' })}
          className="flex-1 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
        >
          إيداع في المحفظة
        </button>
      </div>
    </div>
  )
}

function ReturnSaleContent({ t, locale, salesHistory, formatCurrency, selectedStaffId, paymentMethod, onReturnComplete }) {
  const [search, setSearch] = useState('')
  const term = search.trim().toLowerCase()
  let sale = null
  if (term) {
    const txMatch = term.match(/^ed-?(\d+)$/i)
    if (txMatch) {
      const txId = `ED-${String(parseInt(txMatch[1], 10)).padStart(4, '0')}`
      sale = salesHistory.find((s) => s.id === txId)
    }
    if (!sale) {
      sale = salesHistory.find(
        (s) =>
          s.student?.name?.toLowerCase().includes(term) ||
          term.includes(s.student?.name?.toLowerCase() || '') ||
          (s.student?.phone && s.student.phone.replace(/\D/g, '').includes(term.replace(/\D/g, ''))),
      )
    }
  }
  if (!salesHistory.length) {
    return (
      <div className="mt-6 text-sm text-slate-500">لا يوجد مبيعات مسجلة بعد.</div>
    )
  }
  return (
    <div className="mt-6 space-y-4 text-right">
      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="ED-0001 أو الاسم أو الهاتف"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
      />
      {!term && <p className="text-sm text-slate-500">اكتب رقم الفاتورة أو اسم الطالب.</p>}
      {term && !sale && <p className="text-sm text-slate-500">لم يتم العثور على فاتورة مطابقة.</p>}
      {sale && (
        <div className="mt-4 space-y-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-slate-800">
          <p className="font-semibold">الطالب: {sale.student?.name || 'بدون اسم'}</p>
          <p className="text-xs text-slate-600">رقم العملية الأصلية: {sale.id}</p>
          <div className="mt-2 space-y-1">
            {(sale.items || []).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <span>
                  {item.title} × {item.qty}
                </span>
                <span>{formatCurrency(locale, item.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span>إجمالي الفاتورة</span>
            <span className="font-semibold text-rose-700">
              {formatCurrency(locale, sale.total)}
            </span>
          </div>
          <button
        type="button"
        onClick={() => {
          const now = new Date()
          const items = (sale.items || []).map((item) => ({
            ...item,
            type: 'return',
            lineTotal: -Math.abs(item.lineTotal),
          }))
          const total = -Math.abs(sale.total)
          const subtotal = -Math.abs(sale.subtotal || sale.total)
          const entry = {
            id: `RET-${sale.id}`,
            date: now.toISOString(),
            staffId: selectedStaffId,
            staffName: t(`staff.${selectedStaffId}`),
            student: sale.student,
            items,
            subtotal,
            discount: 0,
            total,
            costTotal: -(sale.costTotal || 0),
            netProfit: -(sale.netProfit || 0),
            receiptType: 'return',
            paymentMethod: sale.paymentMethod || paymentMethod,
            originalTransactionId: sale.id,
          }
          const affectedBooks = (sale.items || [])
            .filter((item) => item.type === 'sale' || item.type === 'pickup')
            .map((item) => ({ bookId: item.id, qty: item.qty }))
          onReturnComplete(entry, affectedBooks)
        }}
        className="mt-4 w-full rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
      >
        إرجاع الفاتورة بالكامل (كاش)
      </button>
      <button
        type="button"
        onClick={() => {
          const now = new Date()
          const items = (sale.items || []).map((item) => ({
            ...item,
            type: 'return',
            lineTotal: -Math.abs(item.lineTotal),
          }))
          const total = -Math.abs(sale.total)
          const subtotal = -Math.abs(sale.subtotal || sale.total)
          const entry = {
            id: `RET-${sale.id}`,
            date: now.toISOString(),
            staffId: selectedStaffId,
            staffName: t(`staff.${selectedStaffId}`),
            student: sale.student,
            items,
            subtotal,
            discount: 0,
            total,
            costTotal: -(sale.costTotal || 0),
            netProfit: -(sale.netProfit || 0),
            receiptType: 'return',
            paymentMethod: 'wallet',
            originalTransactionId: sale.id,
          }
          const affectedBooks = (sale.items || [])
            .filter((item) => item.type === 'sale' || item.type === 'pickup')
            .map((item) => ({ bookId: item.id, qty: item.qty }))
          onReturnComplete(entry, affectedBooks, true) // Pass true for walletRefund
        }}
        className="mt-2 w-full rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
      >
        إرجاع الفاتورة للمحفظة
      </button>
        </div>
      )}
    </div>
  )
}

function LegacyReservationModal({ open, onClose, books, students, setStudents, setPendingReservations }) {
  const defaultDate = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [form, setForm] = useState({
    studentName: '',
    phone: '',
    date: '',
    notebookPage: '',
    notebookLine: '',
    bookId: '',
    qty: '1',
    deposit: '',
  })
  if (!open) return null
  const effectiveDate = form.date || defaultDate
  const effectiveQty = form.qty || '1'
  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }
  const handleSubmit = (event) => {
    event.preventDefault()
    const name = form.studentName.trim()
    const phone = form.phone.trim()
    if (!name) return
    if (!form.bookId) return
    const qty = Math.max(parseInt(effectiveQty, 10) || 1, 1)
    const deposit = Number(form.deposit) || 0
    let existingStudent = null
    if (phone) {
      const digits = phone.replace(/\D/g, '')
      existingStudent = students.find((s) => s.phone && s.phone.replace(/\D/g, '') === digits)
    }
    if (!existingStudent) {
      existingStudent = students.find((s) => s.name && s.name.trim() === name)
    }
    let studentId = existingStudent?.id
    if (!studentId) {
      studentId = Date.now()
      const newStudent = {
        id: studentId,
        name,
        phone,
      }
      setStudents((prev) => [...prev, newStudent])
    }
    const reservation = {
      id: `LEG-${Date.now()}`,
      transactionId: null,
      studentId,
      bookId: form.bookId,
      qty,
      status: 'pending',
      deposit,
      pendingArrival: true,
      date: effectiveDate || new Date().toISOString(),
      notebookPage: form.notebookPage || null,
      notebookLine: form.notebookLine || null,
      legacy: true,
    }
    setPendingReservations((prev) => [...prev, reservation])
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="حجز من الدفتر القديم">
      <form onSubmit={handleSubmit} className="space-y-4 text-right">
        <div className="grid gap-3 md:grid-cols-2">
          <InputField
            name="studentName"
            label="اسم الطالب"
            value={form.studentName}
            onChange={handleChange}
            required
          />
          <InputField
            name="phone"
            label="رقم الهاتف"
            value={form.phone}
            onChange={handleChange}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <InputField
            name="date"
            label="تاريخ الحجز (من الدفتر)"
            type="date"
            value={effectiveDate}
            onChange={handleChange}
          />
          <InputField
            name="notebookPage"
            label="رقم الصفحة"
            value={form.notebookPage}
            onChange={handleChange}
          />
          <InputField
            name="notebookLine"
            label="رقم السطر"
            value={form.notebookLine}
            onChange={handleChange}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <SelectField
            label="الكتاب"
            value={form.bookId}
            onChange={(event) => handleChange({ target: { name: 'bookId', value: event.target.value } })}
            options={books.map((book) => ({ value: book.id, label: book.title }))}
          />
          <InputField
            name="qty"
            label="الكمية"
            type="number"
            min="1"
            value={effectiveQty}
            onChange={handleChange}
          />
          <InputField
            name="deposit"
            label="المبلغ المدفوع حجزًا"
            type="number"
            min="0"
            value={form.deposit}
            onChange={handleChange}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            حفظ الحجز
          </button>
        </div>
      </form>
    </Modal>
  )
}

function ThermalReceipt({ t, locale, receipt, receiptLink, hasPhone, followsUs, onFollowsUsChange, whatsappGroupLink, channelLink, onPrint }) {
  const dateLabel = receipt?.date ? new Date(receipt.date).toLocaleString(locale) : '--'
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow">
      <div className="receipt-print-only print-area mx-auto space-y-4" style={{ width: '80mm' }} dir={locale.startsWith('ar') ? 'rtl' : 'ltr'}>
        <div className="rounded-2xl bg-slate-900 px-4 py-3 text-center">
          <img src={logoUrl} alt="Educon logo" className="mx-auto h-10 object-contain" />
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-600">{t('receipt.academy')}</p>
          <h3 className="text-lg font-semibold">{t('receipt.title')}</h3>
        </div>
        <div className="space-y-1 text-xs text-slate-600">
          {receipt?.receiptType && (
            <div className="flex items-center justify-between">
              <span>{t('labels.receiptType')}</span>
              <span className="font-semibold text-slate-900">{receiptTypeLabels[receipt.receiptType] || receipt.receiptType}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span>{t('labels.transaction')}</span>
            <span className="font-semibold text-slate-900">{receipt?.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t('labels.date')}</span>
            <span className="font-semibold text-slate-900">{dateLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t('labels.staff')}</span>
            <span className="font-semibold text-slate-900">{receipt?.staffName}</span>
          </div>
        </div>
        <div className="text-xs text-slate-600">
          <p>
            {t('labels.student')}: {receipt?.student?.name || '--'}
          </p>
          <p>
            {t('fields.stage')}: {receipt?.student ? t(`stages.${receipt.student.stage}`) : '--'}
          </p>
          <p>
            {t('fields.phone')}: {receipt?.student?.phone || '--'}
          </p>
        </div>
        <div className="space-y-2 border-y border-dashed border-slate-200 py-4 text-xs">
          {receipt?.items?.length === 0 ? (
            <p className="text-slate-400">{t('empty.cart')}</p>
          ) : (
            receipt?.items?.map((item) => (
              <div key={item.lineKey || `${item.type}:${item.id}`} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>
                    {item.title} · {item.qty}x
                  </span>
                  <span className="font-semibold">{formatCurrency(locale, item.lineTotal)}</span>
                </div>
                {item.type === 'reservation' && (
                  <p className="text-[10px] text-sky-700">
                    {t('labels.reservation')} · {t('labels.deposit')}: {item.deposit || 0}
                    {item.pendingArrival ? ` · ${t('labels.pendingArrival')}` : ''}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span>{t('labels.subtotal')}</span>
            <span className="font-semibold">{formatCurrency(locale, receipt?.subtotal || 0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t('labels.discount')}</span>
            <span className="font-semibold">{formatCurrency(locale, receipt?.discount || 0)}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>{t('labels.total')}</span>
            <span className="text-brand-700">{formatCurrency(locale, receipt?.total || 0)}</span>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400">{t('receipt.thanks')}</p>
      </div>
      <div className="no-print mt-5 space-y-3">
        {onFollowsUsChange && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={followsUs}
              onChange={(e) => onFollowsUsChange(e.target.checked)}
              className="rounded border-slate-300"
            />
            {t('labels.followsUs')}
          </label>
        )}
        <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onPrint?.()}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold"
        >
          {t('actions.print')}
        </button>
        {hasPhone && receiptLink ? (
          <a
            href={receiptLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            {t('actions.whatsappReceipt')}
          </a>
        ) : (
          <span
            className="flex cursor-not-allowed items-center gap-2 rounded-2xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500"
            title={t('labels.addPhoneFirst')}
          >
            {t('actions.whatsappReceipt')}
            <span className="text-xs">({t('labels.addPhoneFirst')})</span>
          </span>
        )}
        {whatsappGroupLink && (
          <a
            href={whatsappGroupLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold"
          >
            {t('actions.whatsappGroup')}
          </a>
        )}
        {channelLink && (
          <a
            href={channelLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold"
          >
            {t('actions.whatsappChannel')}
          </a>
        )}
        </div>
      </div>
    </div>
  )
}

function StudentsTable({ t, students, stageOptions, genderOptions, systemOptions, onAdd, onEdit, onView }) {
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [filterSystem, setFilterSystem] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')

  const filteredAndSorted = useMemo(() => {
    let list = [...students]
    const term = search.trim().toLowerCase()
    if (term) {
      list = list.filter(
        (s) =>
          s.name?.toLowerCase().includes(term) ||
          s.phone?.replace(/\D/g, '').includes(term.replace(/\D/g, ''))
      )
    }
    if (filterStage) list = list.filter((s) => s.stage === filterStage)
    if (filterSystem) list = list.filter((s) => s.system === filterSystem)
    if (filterGender) list = list.filter((s) => s.gender === filterGender)

    list.sort((a, b) => {
      let va = a[sortBy] ?? ''
      let vb = b[sortBy] ?? ''
      if (sortBy === 'name') {
        va = String(va).toLowerCase()
        vb = String(vb).toLowerCase()
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      va = String(va)
      vb = String(vb)
      const cmp = va.localeCompare(vb, undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [students, search, filterStage, filterSystem, filterGender, sortBy, sortDir])

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(col); setSortDir('asc') }
  }

  const exportStudentsToExcel = () => {
    const rows = filteredAndSorted.map((s) => ({
      [t('fields.name')]: s.name,
      [t('fields.stage')]: t(`stages.${s.stage || 'first'}`),
      [t('fields.system')]: t(`system.${s.system || 'general'}`),
      [t('fields.gender')]: t(`gender.${s.gender || 'male'}`),
      [t('fields.specialty')]: s.specialty || '--',
      [t('fields.phone')]: s.phone || '--',
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), t('nav.students'))
    XLSX.writeFile(wb, 'educon-students.xlsx')
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">{t('nav.students')}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            {t('actions.add')}
          </button>
          <button
            type="button"
            onClick={exportStudentsToExcel}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {t('labels.exportStudents')}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('labels.searchStudents')}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm rtl:pl-4 rtl:pr-9"
          />
        </div>
        <select
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
        >
          <option value="">{t('labels.filterAll')} ({t('fields.stage')})</option>
          {stageOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filterSystem}
          onChange={(e) => setFilterSystem(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
        >
          <option value="">{t('labels.filterAll')} ({t('fields.system')})</option>
          {systemOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filterGender}
          onChange={(e) => setFilterGender(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
        >
          <option value="">{t('labels.filterAll')} ({t('fields.gender')})</option>
          {genderOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
              <SortHeaderCell col="name" label={t('fields.name')} onToggle={toggleSort} />
              <SortHeaderCell col="stage" label={t('fields.stage')} onToggle={toggleSort} />
              <SortHeaderCell col="system" label={t('fields.system')} onToggle={toggleSort} />
              <SortHeaderCell col="gender" label={t('fields.gender')} onToggle={toggleSort} />
              <th className="pb-3">{t('fields.specialty')}</th>
              <SortHeaderCell col="phone" label={t('fields.phone')} onToggle={toggleSort} />
              <th className="pb-3">{t('labels.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAndSorted.map((student) => (
              <tr key={student.id} className="text-slate-700 hover:bg-slate-50/50">
                <td className="py-3 font-medium">{student.name}</td>
                <td className="py-3">{t(`stages.${student.stage || 'first'}`)}</td>
                <td className="py-3">{t(`system.${student.system || 'general'}`)}</td>
                <td className="py-3">{t(`gender.${student.gender || 'male'}`)}</td>
                <td className="py-3">{student.specialty || '--'}</td>
                <td className="py-3">{student.phone || '--'}</td>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onView(student)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600"
                    >
                      <Users className="h-4 w-4" />
                      عرض
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(student)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
                    >
                      <Pencil className="h-4 w-4" />
                      {t('actions.edit')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAndSorted.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">{t('empty.students')}</p>
        )}
      </div>
    </div>
  )
}

function SortHeaderCell({ col, label, onToggle }) {
  return (
    <th
      className="cursor-pointer select-none pb-3 text-left text-xs uppercase tracking-wider text-slate-400 hover:text-slate-600"
      onClick={() => onToggle(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3.5 w-3.5" />
      </span>
    </th>
  )
}

function BooksTable({ t, locale, books, onAdd, onEdit, onPrint }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{t('nav.books')}</h3>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          {t('actions.add')}
        </button>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="pb-3">{t('fields.name')}</th>
              <th className="pb-3">{t('fields.author')}</th>
              <th className="pb-3">{t('labels.costPrice')}</th>
              <th className="pb-3">{t('labels.sellingPrice')}</th>
              <th className="pb-3">تقريبي</th>
              <th className="pb-3">{t('labels.stock')}</th>
              <th className="pb-3">الحالة</th>
              <th className="pb-3">{t('labels.barcode')}</th>
              <th className="pb-3">{t('labels.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {books.map((book) => (
              <tr key={book.id} className="text-slate-700">
                <td className="py-3">{book.title}</td>
                <td className="py-3">{book.author}</td>
                <td className="py-3">{formatCurrency(locale, book.costPrice)}</td>
                <td className="py-3">{formatCurrency(locale, book.sellingPrice)}</td>
                <td className="py-3">{book.estimatedSellingPrice != null ? formatCurrency(locale, book.estimatedSellingPrice) : '--'}</td>
                <td className="py-3">{book.stock}</td>
                <td className="py-3">
                  {book.isArriving ? (
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">لم يصل</span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">متاح</span>
                  )}
                </td>
                <td className="py-3">{book.barcode}</td>
                <td className="py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onEdit(book)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600"
                    >
                      <Pencil className="h-4 w-4" />
                      {t('actions.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onPrint(book)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
                    >
                      <Printer className="h-4 w-4" />
                      {t('actions.barcodePrint')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BooksInsightsView({ locale, rows, formatCurrency }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">تحليل الكتب</h3>
        <p className="text-xs text-slate-500">الأكثر مبيعًا · المحجوز · المتاح للبيع</p>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="pb-3">الكتاب</th>
              <th className="pb-3">المبيعات</th>
              <th className="pb-3">محجوز (معلّق)</th>
              <th className="pb-3">المخزن</th>
              <th className="pb-3">محجوز من المخزن</th>
              <th className="pb-3">متاح للبيع</th>
              <th className="pb-3">سعر البيع</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.book.id} className="text-slate-700">
                <td className="py-3">
                  <div className="font-medium">{row.book.title}</div>
                  <div className="text-xs text-slate-400">{row.book.author}</div>
                </td>
                <td className="py-3 font-semibold">{row.soldQty}</td>
                <td className="py-3 font-semibold text-sky-700">{row.reservedQty}</td>
                <td className="py-3">{row.book.stock}</td>
                <td className="py-3">{row.reservedStock}</td>
                <td className={`py-3 font-semibold ${row.availableToSell <= 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{row.availableToSell}</td>
                <td className="py-3">{formatCurrency(locale, row.book.sellingPrice)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-slate-400">
                  لا توجد بيانات
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReceiptArchiveView({ locale, items, onRefresh, onOpenReceipt }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">أرشيف الإيصالات</h3>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold"
        >
          تحديث
        </button>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="pb-3">الوقت</th>
              <th className="pb-3">رقم العملية</th>
              <th className="pb-3">النوع</th>
              <th className="pb-3">الموظف</th>
              <th className="pb-3">الطالب</th>
              <th className="pb-3">الإجمالي</th>
              <th className="pb-3">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((it) => {
              const payload = it.payload || {}
              const date = it.printed_at ? new Date(it.printed_at).toLocaleString(locale) : '--'
              return (
                <tr key={it.id} className="text-slate-700">
                  <td className="py-3 text-xs text-slate-500">{date}</td>
                  <td className="py-3 font-semibold">{it.transaction_code || payload.id || '--'}</td>
                  <td className="py-3">{it.receipt_type || payload.receiptType || '--'}</td>
                  <td className="py-3">{it.staff_name || payload.staffName || '--'}</td>
                  <td className="py-3">{payload.student?.name || '--'}</td>
                  <td className="py-3 font-semibold">{formatCurrency(locale, payload.total || 0)}</td>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => onOpenReceipt(payload)}
                      className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      عرض/طباعة
                    </button>
                  </td>
                </tr>
              )
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-slate-400">
                  لا توجد إيصالات
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AccountingView({ locale, books, report, supplies, form, onFormChange, onRefresh, onCreateSupply }) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">الحسابات</h3>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold"
          >
            تحديث
          </button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <StatCard title="إجمالي الإيراد" value={formatCurrency(locale, report?.revenue || 0)} />
          <StatCard title="تكلفة البضاعة (COGS)" value={formatCurrency(locale, report?.cogs || 0)} />
          <StatCard title="مجمل الربح" value={formatCurrency(locale, report?.gross_profit || 0)} />
          <StatCard title="إجمالي السحوبات" value={formatCurrency(locale, report?.withdrawals || 0)} />
          <StatCard title="رصيد الخزنة" value={formatCurrency(locale, report?.safe_balance || 0)} />
          <StatCard title="مستحق للمورّد" value={formatCurrency(locale, report?.supplier_due || 0)} />
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow">
        <h4 className="text-base font-semibold">توريد مخزون</h4>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <select
            value={form.bookId}
            onChange={(e) => onFormChange((p) => ({ ...p, bookId: e.target.value }))}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
          >
            <option value="">اختر كتاب</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={form.qty}
            onChange={(e) => onFormChange((p) => ({ ...p, qty: e.target.value }))}
            placeholder="الكمية"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            value={form.unitCost}
            onChange={(e) => onFormChange((p) => ({ ...p, unitCost: e.target.value }))}
            placeholder="سعر التوريد/كتاب"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            value={form.paid}
            onChange={(e) => onFormChange((p) => ({ ...p, paid: e.target.value }))}
            placeholder="المدفوع للمورّد"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
          />
          <input
            type="text"
            value={form.supplier}
            onChange={(e) => onFormChange((p) => ({ ...p, supplier: e.target.value }))}
            placeholder="اسم المورّد (اختياري)"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onCreateSupply}
            className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            تسجيل التوريد
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow">
        <h4 className="text-base font-semibold">سجل التوريدات</h4>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="pb-3">التاريخ</th>
                <th className="pb-3">كتاب</th>
                <th className="pb-3">كمية</th>
                <th className="pb-3">تكلفة/كتاب</th>
                <th className="pb-3">الإجمالي</th>
                <th className="pb-3">مدفوع</th>
                <th className="pb-3">متبقي</th>
                <th className="pb-3">المورّد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {supplies.map((s) => (
                <tr key={s.id} className="text-slate-700">
                  <td className="py-3 text-xs text-slate-500">{new Date(s.timestamp).toLocaleString(locale)}</td>
                  <td className="py-3">{books.find((b) => b.id === s.book_id)?.title || s.book_id}</td>
                  <td className="py-3 font-semibold">{s.quantity}</td>
                  <td className="py-3">{formatCurrency(locale, s.unit_cost)}</td>
                  <td className="py-3 font-semibold">{formatCurrency(locale, s.total_cost)}</td>
                  <td className="py-3">{formatCurrency(locale, s.paid_amount || 0)}</td>
                  <td className="py-3 font-semibold text-rose-700">{formatCurrency(locale, (s.total_cost || 0) - (s.paid_amount || 0))}</td>
                  <td className="py-3">{s.supplier_name || '--'}</td>
                </tr>
              ))}
              {supplies.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-slate-400">
                    لا توجد توريدات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ManagementTable({ title, actionLabel, onAdd, columns, rows, onEdit }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </button>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
              {columns.map((col) => (
                <th key={col} className="pb-3">
                  {col}
                </th>
              ))}
              <th className="pb-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="text-slate-700">
                {row.map((cell, index) => (
                  <td key={`${rowIndex}-${index}`} className="py-3">
                    {cell}
                  </td>
                ))}
                <td className="py-3">
                  <button
                    type="button"
                    onClick={() => onEdit(rowIndex)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-400">{title}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function MetricBar({ label, value, valueLabel, max, color }) {
  const width = Math.round((value / max) * 100)
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span className="font-semibold text-slate-700">{valueLabel}</span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="rounded-full p-1 text-slate-500">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <button type="button" onClick={onClose} className="rounded-full p-1 text-slate-500">
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}

function ModalActions({ t }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <button
        type="reset"
        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold"
      >
        {t('actions.cancel')}
      </button>
      <button
        type="submit"
        className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
      >
        {t('actions.save')}
      </button>
    </div>
  )
}

function InputField({ label, ...props }) {
  return (
    <label className="block text-sm text-slate-600">
      <span className="mb-2 block text-xs uppercase tracking-wider text-slate-400">{label}</span>
      <input
        {...props}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
      />
    </label>
  )
}

function SelectField({ label, options, compact = false, ...props }) {
  return (
    <label className="block text-sm text-slate-600">
      <span className="mb-2 block text-xs uppercase tracking-wider text-slate-400">{label}</span>
      <select
        {...props}
        className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 ${
          compact ? 'py-2' : 'py-3'
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function StudentDetailsModal({ t, locale, student, salesHistory, pendingReservations, books, onClose, onPickup, formatCurrency, walletLog }) {
  const [activeTab, setActiveTab] = useState('history')

  const studentSales = useMemo(() => {
    return salesHistory.filter(s => s.student?.id === student.id)
  }, [salesHistory, student.id])

  const studentReservations = useMemo(() => {
    return pendingReservations.filter(r => r.studentId === student.id)
  }, [pendingReservations, student.id])

  const studentWalletLog = useMemo(() => {
    return (walletLog || []).filter(l => l.studentId === student.id).sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [walletLog, student.id])

  // Calculate Balance (Debt/Credit)
  const balance = student.balance || 0

  return (
    <Modal onClose={onClose}>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{student.name}</h3>
            <p className="text-sm text-slate-500">{student.phone || 'No Phone'}</p>
          </div>
          <div className="text-left">
            <p className="text-xs text-slate-500">الرصيد الحالي (المحفظة)</p>
            <p className={`text-lg font-bold ${balance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatCurrency(locale, balance)}
            </p>
          </div>
        </div>

        <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              activeTab === 'history' ? 'bg-white text-brand-700 shadow' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            سجل المعاملات
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              activeTab === 'reservations' ? 'bg-white text-brand-700 shadow' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            الحجوزات ({studentReservations.length})
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              activeTab === 'wallet' ? 'bg-white text-brand-700 shadow' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            سجل المحفظة
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {activeTab === 'history' && (
            <div className="space-y-3">
              {studentSales.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">لا يوجد معاملات سابقة.</p>
              ) : (
                studentSales.map(sale => (
                  <div key={sale.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">
                        {receiptTypeLabels[sale.receiptType] || sale.receiptType}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(sale.date).toLocaleDateString(locale)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-600">
                      {sale.items?.map(item => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.title} × {item.qty}</span>
                          <span>{formatCurrency(locale, item.lineTotal)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-sm font-semibold">
                      <span>الإجمالي</span>
                      <span>{formatCurrency(locale, sale.total)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'wallet' && (
             <div className="space-y-3">
              {studentWalletLog.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">لا يوجد حركات في المحفظة.</p>
              ) : (
                studentWalletLog.map(log => (
                  <div key={log.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                       <span className={`font-semibold ${log.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                         {log.amount > 0 ? '+' : ''}{formatCurrency(locale, log.amount)}
                       </span>
                       <span className="text-xs text-slate-500">
                        {new Date(log.date).toLocaleDateString(locale)}
                       </span>
                    </div>
                    <p className="text-xs text-slate-600">{log.description}</p>
                  </div>
                ))
              )}
             </div>
          )}

          {activeTab === 'reservations' && (
            <div className="space-y-3">
              {studentReservations.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">لا يوجد حجوزات معلقة.</p>
              ) : (
                <PickupReservationContent
                  t={t}
                  locale={locale}
                  pickupSearch={student.name} // Pass name to force match
                  students={[student]} // Pass only this student
                  books={books}
                  pendingReservations={pendingReservations} // Pass all, filtered internally or by search
                  salesHistory={salesHistory}
                  formatCurrency={formatCurrency}
                  selectedStaffId=""
                  onComplete={onPickup}
                />
              )}
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-4">
           <button
             type="button"
             onClick={onClose}
             className="rounded-2xl border border-slate-200 px-6 py-2 text-sm font-semibold"
           >
             إغلاق
           </button>
        </div>
      </div>
    </Modal>
  )
}

export default App
