import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  LogIn, User, Lock, Eye, EyeOff, 
  Mail, Phone, CheckCircle2, CreditCard, Sparkles, X, AlertCircle,
  ArrowLeft, Sun, Moon, ShieldCheck, GraduationCap, KeyRound, Send, UserPlus
} from 'lucide-react'
import api from '../utils/api'

export default function Login() {
  const [activeTab, setActiveTab] = useState('login') // 'login' | 'register'
  const { login, register, socialLogin, user } = useAuth()
  const navigate = useNavigate()

  // State cho Đăng nhập
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  // State cho Đăng ký bằng Mã số sinh viên
  const [regStudentId, setRegStudentId] = useState('')
  const [regFullName, setRegFullName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)

  // Feedback states
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [autofillNotice, setAutofillNotice] = useState('')

  // Theme state (synced with Layout)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('qlpm_theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    }
    localStorage.setItem('qlpm_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  // Social Modal simulation state
  const [socialModal, setSocialModal] = useState({
    isOpen: false,
    provider: null, // 'google' | 'facebook'
    customEmail: '',
    customName: '',
    customStudentId: ''
  })

  // Quên mật khẩu & Khôi phục OTP state
  const [forgotModal, setForgotModal] = useState({
    isOpen: false,
    step: 1, // 1: Nhập MSSV/Email để nhận mã OTP, 2: Nhập OTP & Mật khẩu mới
    identifier: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
    maskedEmail: '',
    loading: false,
    error: '',
    success: ''
  })

  const openForgotModal = () => {
    clearMessages()
    setForgotModal({
      isOpen: true,
      step: 1,
      identifier: loginIdentifier || '',
      otp: '',
      newPassword: '',
      confirmPassword: '',
      maskedEmail: '',
      loading: false,
      error: '',
      success: ''
    })
  }

  const handleSendOtp = async (e) => {
    e?.preventDefault()
    if (!forgotModal.identifier.trim()) {
      setForgotModal(prev => ({ ...prev, error: 'Vui lòng nhập MSSV hoặc Email đã đăng ký' }))
      return
    }
    setForgotModal(prev => ({ ...prev, loading: true, error: '', success: '' }))
    try {
      const res = await api.post('/auth/forgot-password', { email_or_mssv: forgotModal.identifier.trim() })
      setForgotModal(prev => ({
        ...prev,
        step: 2,
        maskedEmail: res.data.email || 'email đã đăng ký',
        success: res.data.message || 'Mã xác nhận OTP 6 số đã được gửi.',
        loading: false
      }))
    } catch (err) {
      setForgotModal(prev => ({
        ...prev,
        error: err.response?.data?.error || 'Không tìm thấy tài khoản hoặc không thể gửi OTP',
        loading: false
      }))
    }
  }

  const handleResetPassword = async (e) => {
    e?.preventDefault()
    if (!forgotModal.otp.trim()) {
      setForgotModal(prev => ({ ...prev, error: 'Vui lòng nhập mã OTP 6 số' }))
      return
    }
    if (forgotModal.newPassword.length < 6) {
      setForgotModal(prev => ({ ...prev, error: 'Mật khẩu mới phải có tối thiểu 6 ký tự' }))
      return
    }
    if (forgotModal.newPassword !== forgotModal.confirmPassword) {
      setForgotModal(prev => ({ ...prev, error: 'Mật khẩu xác nhận không khớp' }))
      return
    }
    setForgotModal(prev => ({ ...prev, loading: true, error: '', success: '' }))
    try {
      await api.post('/auth/reset-password', {
        email_or_mssv: forgotModal.identifier.trim(),
        otp: forgotModal.otp.trim(),
        new_password: forgotModal.newPassword
      })
      setForgotModal(prev => ({
        ...prev,
        success: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.',
        loading: false
      }))
      setTimeout(() => {
        setLoginIdentifier(forgotModal.identifier)
        setLoginPassword(forgotModal.newPassword)
        setForgotModal(prev => ({ ...prev, isOpen: false }))
        setSuccessMsg('Đã cập nhật mật khẩu mới! Vui lòng bấm Đăng nhập.')
      }, 1500)
    } catch (err) {
      setForgotModal(prev => ({
        ...prev,
        error: err.response?.data?.error || 'Mã OTP không hợp lệ hoặc đã hết hạn',
        loading: false
      }))
    }
  }

  const clearMessages = () => {
    setError('')
    setSuccessMsg('')
    setAutofillNotice('')
  }

  // Xử lý đăng nhập
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)
    try {
      await login(loginIdentifier, loginPassword)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Mã số sinh viên/tài khoản hoặc mật khẩu không chính xác')
    } finally {
      setLoading(false)
    }
  }

  // Xử lý đăng ký bằng Mã số sinh viên
  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    clearMessages()

    if (!regStudentId.trim()) {
      setError('Vui lòng nhập Mã số sinh viên (MSSV)')
      return
    }
    if (!regFullName.trim()) {
      setError('Vui lòng nhập họ và tên sinh viên')
      return
    }
    if (regPassword.length < 6) {
      setError('Mật khẩu phải chứa ít nhất 6 ký tự')
      return
    }
    if (regPassword !== regConfirmPassword) {
      setError('Mật khẩu xác nhận không khớp nhau')
      return
    }

    setLoading(true)
    try {
      await register({
        student_id: regStudentId.trim().toUpperCase(),
        username: regStudentId.trim().toLowerCase(),
        password: regPassword,
        full_name: regFullName.trim(),
        email: regEmail.trim() || undefined,
        phone: regPhone.trim() || undefined
      })
      setSuccessMsg('Đăng ký tài khoản sinh viên thành công! Đang chuyển hướng...')
      setTimeout(() => {
        navigate('/')
      }, 1000)
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra khi tạo tài khoản')
    } finally {
      setLoading(false)
    }
  }

  // Tiện ích 1-chạm tự động điền tài khoản mẫu
  const handleAutofill = (username, password, label) => {
    clearMessages()
    setActiveTab('login')
    setLoginIdentifier(username)
    setLoginPassword(password)
    setAutofillNotice(`✓ Đã điền tài khoản ${label}`)
    setTimeout(() => setAutofillNotice(''), 3000)
  }

  // Mở hộp thoại xác thực mạng xã hội
  const handleOpenSocialModal = (provider) => {
    clearMessages()
    setSocialModal({
      isOpen: true,
      provider,
      customEmail: provider === 'google' ? 'sinhvien@hust.edu.vn' : 'sinhvien.fb@gmail.com',
      customName: provider === 'google' ? 'Sinh Viên Google' : 'Sinh Viên Facebook',
      customStudentId: ''
    })
  }

  // Thực hiện đăng nhập/đăng ký mạng xã hội
  const handleSocialConfirm = async (presetUser = null) => {
    setLoading(true)
    clearMessages()
    try {
      const payload = presetUser || {
        provider: socialModal.provider,
        provider_id: `${socialModal.provider}_${Date.now()}`,
        email: socialModal.customEmail.trim(),
        full_name: socialModal.customName.trim(),
        student_id: socialModal.customStudentId.trim().toUpperCase() || undefined,
        avatar: socialModal.provider === 'google'
          ? 'https://lh3.googleusercontent.com/a/default-user'
          : 'https://graph.facebook.com/v12.0/default-user'
      }

      await socialLogin(payload)
      setSocialModal({ isOpen: false, provider: null, customEmail: '', customName: '', customStudentId: '' })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng nhập mạng xã hội thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen luxury-login-canvas flex flex-col justify-between p-4 sm:p-6 md:p-8 relative selection:bg-[var(--color-accent)] selection:text-white transition-colors duration-300">
      
      {/* ───────── Top Utility Bar ───────── */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-20 pt-2 pb-6">
        <Link 
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-paper-0)]/80 hover:bg-[var(--color-paper-1)] border border-[var(--rule-soft)] text-xs font-mono font-medium text-[var(--color-ink-1)] hover:text-[var(--color-accent)] shadow-xs transition-all duration-200 btn-tactile"
          title="Quay lại trang chủ"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về trang chủ QLPH</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-paper-0)]/60 border border-[var(--rule-hair)] text-[11px] font-mono text-[var(--color-ink-2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Hệ thống trực tuyến</span>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full bg-[var(--color-paper-0)]/80 hover:bg-[var(--color-paper-1)] border border-[var(--rule-soft)] text-[var(--color-ink-1)] hover:text-[var(--color-accent)] shadow-xs transition-all duration-200 cursor-pointer btn-tactile"
            title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            aria-label="Toggle dark/light mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-90 transition-transform duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-[var(--color-ink-1)] hover:-rotate-45 transition-transform duration-300" />
            )}
          </button>
        </div>
      </header>

      {/* ───────── Central Authentication Card ───────── */}
      <main className="w-full max-w-lg mx-auto my-auto relative z-10 py-4 animate-fade-in">
        
        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          {/* SEEE Emblem Badge */}
          <div className="inline-block relative mb-3 group">
            <div className="h-14 sm:h-16 px-4 py-1.5 rounded-2xl bg-white shadow-lg ring-1 ring-amber-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 overflow-hidden">
              <img 
                src="/logo.png" 
                alt="SEEE - School of Electrical & Electronic Engineering" 
                className="h-full w-auto object-contain max-h-12" 
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[var(--color-paper-0)] shadow-xs"></div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="font-mono text-[11px] font-bold tracking-widest uppercase text-[var(--color-accent)] px-2.5 py-0.5 rounded-md bg-[var(--color-accent-tint)] border border-[var(--rule-hair)]">
              SEEE · HUST SINCE 1956
            </span>
          </div>

          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-[var(--color-ink-0)] leading-tight">
            Cổng Đăng Nhập Hệ Thống
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-ink-2)] mt-1 max-w-sm mx-auto font-sans">
            Quản lý &amp; Mượn phòng học · Trường Điện - Điện Tử
          </p>
        </div>

        {/* Haute-Couture Card */}
        <div className="luxury-login-card luxury-card-rim">
          
          {/* Segmented Tab Switcher */}
          <div className="p-2 border-b border-[var(--rule-hair)] bg-[var(--color-paper-1)]/60">
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[var(--color-paper-2)]/60 border border-[var(--rule-hair)]">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); clearMessages(); }}
                className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer btn-tactile ${
                  activeTab === 'login'
                    ? 'tab-pill-active'
                    : 'text-[var(--color-ink-2)] hover:text-[var(--color-ink-0)]'
                }`}
              >
                <LogIn className="w-4 h-4 flex-shrink-0" />
                <span>Đăng nhập</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('register'); clearMessages(); }}
                className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer btn-tactile ${
                  activeTab === 'register'
                    ? 'tab-pill-active'
                    : 'text-[var(--color-ink-2)] hover:text-[var(--color-ink-0)]'
                }`}
              >
                <CreditCard className="w-4 h-4 flex-shrink-0" />
                <span>Tạo tài khoản MSSV</span>
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 sm:p-8 space-y-5">
            
            {/* Autofill Notice Badge */}
            {autofillNotice && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-mono font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>{autofillNotice}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn font-sans">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs sm:text-sm flex items-center gap-2.5 animate-fadeIn font-sans">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ───────── TAB 1: FORM ĐĂNG NHẬP ───────── */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--color-ink-1)] mb-1.5">
                    Mã số sinh viên (MSSV) hoặc Tên đăng nhập
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-2)]" />
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 luxury-input rounded-xl text-xs sm:text-sm font-mono"
                      placeholder="VD: SV2024001 hoặc admin"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--color-ink-1)]">
                      Mật khẩu
                    </label>
                    <span className="text-[11px] text-[var(--color-ink-2)] font-sans">
                      (admin: khanh1211 / test: 123456)
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-2)]" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-2.5 luxury-input rounded-xl text-xs sm:text-sm font-sans"
                      placeholder="Nhập mật khẩu"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-2)] hover:text-[var(--color-accent)] p-1 cursor-pointer transition-colors"
                      title={showLoginPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="button"
                      onClick={openForgotModal}
                      className="text-xs text-[var(--color-accent)] hover:underline font-mono inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Quên mật khẩu?</span>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-[var(--color-accent)] via-rose-700 to-[var(--color-accent)] hover:brightness-105 active:scale-[0.98] disabled:opacity-50 text-white font-bold leading-none whitespace-nowrap rounded-xl shadow-lg shadow-rose-900/25 border border-white/20 transition-all duration-200 mt-2 cursor-pointer font-serif btn-tactile"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                  ) : (
                    <LogIn className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{loading ? 'Đang xác thực hệ thống...' : 'Đăng nhập vào hệ thống'}</span>
                </button>
              </form>
            )}

            {/* ───────── TAB 2: FORM ĐĂNG KÝ MSSV ───────── */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--color-ink-1)] mb-1">
                    Mã số sinh viên (MSSV) <span className="text-[var(--color-accent)]">*</span>
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-2)]" />
                    <input
                      type="text"
                      value={regStudentId}
                      onChange={(e) => setRegStudentId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 luxury-input rounded-xl text-xs sm:text-sm font-mono"
                      placeholder="VD: 20240123, B22DCCN015..."
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--color-ink-1)] mb-1">
                    Họ và tên sinh viên <span className="text-[var(--color-accent)]">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-2)]" />
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 luxury-input rounded-xl text-xs sm:text-sm font-sans"
                      placeholder="VD: Nguyễn Văn Hoàng"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--color-ink-1)] mb-1">
                      Email sinh viên
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-2)]" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 luxury-input rounded-xl text-xs sm:text-sm font-mono"
                        placeholder="sinhvien@hust.edu.vn"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--color-ink-1)] mb-1">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-2)]" />
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 luxury-input rounded-xl text-xs sm:text-sm font-mono"
                        placeholder="0987654321"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--color-ink-1)] mb-1">
                      Mật khẩu <span className="text-[var(--color-accent)]">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-2)]" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 luxury-input rounded-xl text-xs sm:text-sm font-sans"
                        placeholder="Ít nhất 6 ký tự"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--color-ink-1)] mb-1">
                      Xác nhận mật khẩu <span className="text-[var(--color-accent)]">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-2)]" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 luxury-input rounded-xl text-xs sm:text-sm font-sans"
                        placeholder="Nhập lại mật khẩu"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--color-ink-2)] pt-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRegPassword}
                      onChange={(e) => setShowRegPassword(e.target.checked)}
                      className="rounded accent-[var(--color-accent)] cursor-pointer"
                    />
                    <span>Hiện mật khẩu</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-[var(--color-accent)] via-rose-700 to-[var(--color-accent)] hover:brightness-105 active:scale-[0.98] disabled:opacity-50 text-white font-bold leading-none whitespace-nowrap rounded-xl shadow-lg shadow-rose-900/25 border border-white/20 transition-all duration-200 mt-2 cursor-pointer font-serif btn-tactile"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{loading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản sinh viên'}</span>
                </button>
              </form>
            )}

            {/* ───────── OAUTH SOCIAL BUTTONS ───────── */}
            <div className="pt-2">
              <div className="relative mb-4 text-center">
                <span className="bg-[var(--color-paper-0)] px-3 text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-2)] relative z-10">
                  Hoặc đăng nhập nhanh qua liên kết
                </span>
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--rule-hair)]"></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Google Button */}
                <button
                  type="button"
                  onClick={() => handleOpenSocialModal('google')}
                  className="inline-flex items-center justify-center gap-2.5 py-2.5 px-4 bg-[var(--color-paper-0)] hover:bg-[var(--color-paper-1)] border border-[var(--rule-soft)] hover:border-[var(--color-accent)] text-[var(--color-ink-0)] font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all duration-200 cursor-pointer btn-tactile group"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google</span>
                </button>

                {/* Facebook Button (Harmonized, refined aesthetic) */}
                <button
                  type="button"
                  onClick={() => handleOpenSocialModal('facebook')}
                  className="inline-flex items-center justify-center gap-2.5 py-2.5 px-4 bg-[var(--color-paper-0)] hover:bg-[var(--color-paper-1)] border border-[var(--rule-soft)] hover:border-[#1877F2] text-[var(--color-ink-0)] font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all duration-200 cursor-pointer btn-tactile group"
                >
                  <svg className="w-4 h-4 fill-[#1877F2] flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </button>
              </div>
            </div>

            {/* ───────── 1-TAP DEMO AUTOFILL CHIPS ───────── */}
            <div className="pt-4 border-t border-[var(--rule-hair)]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--color-accent)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Tài khoản mẫu (Bấm để tự điền):
                </span>
                <span className="text-[10px] font-mono text-[var(--color-ink-2)]">1 chạm</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleAutofill('admin', 'khanh1211', 'Quản trị viên')}
                  className="autofill-chip text-left p-2 rounded-xl bg-[var(--color-paper-1)] border border-[var(--rule-soft)] cursor-pointer"
                  title="Điền tài khoản Quản trị viên"
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--color-ink-0)] font-serif">
                    <ShieldCheck className="w-3 h-3 text-[var(--color-accent)]" />
                    <span>Quản trị viên</span>
                  </div>
                  <div className="text-[10px] font-mono text-[var(--color-ink-2)] mt-0.5">
                    admin / khanh1211
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAutofill('user_test', '123456', 'Sinh viên Test')}
                  className="autofill-chip text-left p-2 rounded-xl bg-[var(--color-paper-1)] border border-[var(--rule-soft)] cursor-pointer"
                  title="Điền tài khoản Sinh viên Test"
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--color-ink-0)] font-serif">
                    <GraduationCap className="w-3 h-3 text-amber-500" />
                    <span>Sinh viên Test</span>
                  </div>
                  <div className="text-[10px] font-mono text-[var(--color-ink-2)] mt-0.5">
                    user_test / 123456
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register')
                    clearMessages()
                    setAutofillNotice('👉 Vui lòng nhập thông tin để tạo tài khoản sinh viên mới')
                    setTimeout(() => setAutofillNotice(''), 3500)
                  }}
                  className="autofill-chip text-left p-2 rounded-xl bg-[var(--color-paper-1)] border border-[var(--rule-soft)] cursor-pointer hover:border-[var(--color-accent)] transition-colors"
                  title="Chuyển sang trang tạo tài khoản mới"
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--color-accent)] font-serif">
                    <UserPlus className="w-3 h-3 text-[var(--color-accent)]" />
                    <span>Đăng ký mới</span>
                  </div>
                  <div className="text-[10px] font-mono text-[var(--color-ink-2)] mt-0.5">
                    Tự tạo nick cá nhân
                  </div>
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ───────── Minimal Footer Credits ───────── */}
      <footer className="w-full max-w-lg mx-auto text-center z-10 py-3 text-xs font-mono text-[var(--color-ink-2)] flex items-center justify-center gap-2">
        <span>© 2026 Trường Điện - Điện Tử (SEEE)</span>
        <span>·</span>
        <span>Đại Học Bách Khoa Hà Nội</span>
      </footer>

      {/* ───────── SOCIAL AUTH SIMULATION MODAL ───────── */}
      {socialModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="luxury-login-card w-full max-w-md shadow-2xl overflow-hidden border border-amber-500/30">
            {/* Modal Header */}
            <div className={`p-4 text-white flex items-center justify-between ${
              socialModal.provider === 'google' 
                ? 'bg-gradient-to-r from-red-600 to-amber-600' 
                : 'bg-gradient-to-r from-blue-700 to-indigo-800'
            }`}>
              <div className="flex items-center gap-2 font-bold font-serif text-sm">
                {socialModal.provider === 'google' ? (
                  <>
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                    </svg>
                    <span>Liên kết tài khoản Google</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>Liên kết tài khoản Facebook</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSocialModal({ isOpen: false, provider: null, customEmail: '', customName: '', customStudentId: '' })}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              <p className="text-xs sm:text-sm text-[var(--color-ink-1)]">
                Chọn hồ sơ mẫu để đăng nhập ngay 1-chạm vào hệ thống SEEE:
              </p>

              {/* Quick Select Presets */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleSocialConfirm({
                    provider: socialModal.provider,
                    provider_id: `${socialModal.provider}_student_01`,
                    email: socialModal.provider === 'google' ? 'nguyenvana.sv@hust.edu.vn' : 'nguyen.van.a.fb@gmail.com',
                    full_name: 'Nguyễn Văn A (Sinh viên)',
                    student_id: 'SV2024099',
                    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                  })}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border border-[var(--rule-soft)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-tint)] transition-all text-left cursor-pointer btn-tactile"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-rose-700 text-white font-bold flex items-center justify-center text-xs font-serif shadow-xs">
                      A
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[var(--color-ink-0)] font-serif">Nguyễn Văn A</p>
                      <p className="text-[11px] text-[var(--color-ink-2)] font-mono">
                        {socialModal.provider === 'google' ? 'nguyenvana.sv@hust.edu.vn' : 'nguyen.van.a.fb@gmail.com'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold font-mono text-[var(--color-accent)] bg-[var(--color-paper-0)] px-2 py-0.5 rounded-full border border-[var(--rule-hair)]">
                    1 chạm
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialConfirm({
                    provider: socialModal.provider,
                    provider_id: `${socialModal.provider}_student_02`,
                    email: socialModal.provider === 'google' ? 'tranthib.sv@hust.edu.vn' : 'tran.thi.b.fb@gmail.com',
                    full_name: 'Trần Thị B (Sinh viên)',
                    student_id: 'SV2024100',
                    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'
                  })}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border border-[var(--rule-soft)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-tint)] transition-all text-left cursor-pointer btn-tactile"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-600 to-rose-700 text-white font-bold flex items-center justify-center text-xs font-serif shadow-xs">
                      B
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[var(--color-ink-0)] font-serif">Trần Thị B</p>
                      <p className="text-[11px] text-[var(--color-ink-2)] font-mono">
                        {socialModal.provider === 'google' ? 'tranthib.sv@hust.edu.vn' : 'tran.thi.b.fb@gmail.com'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold font-mono text-[var(--color-accent)] bg-[var(--color-paper-0)] px-2 py-0.5 rounded-full border border-[var(--rule-hair)]">
                    1 chạm
                  </span>
                </button>
              </div>

              {/* Tùy chỉnh thông tin tài khoản */}
              <div className="pt-3 border-t border-[var(--rule-hair)] space-y-2.5">
                <p className="text-[11px] font-bold text-[var(--color-ink-2)] font-mono uppercase tracking-wider">
                  Hoặc nhập địa chỉ email tùy chọn:
                </p>
                <div>
                  <input
                    type="email"
                    value={socialModal.customEmail}
                    onChange={(e) => setSocialModal({ ...socialModal, customEmail: e.target.value })}
                    placeholder="email@hust.edu.vn"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm luxury-input rounded-xl font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={socialModal.customName}
                    onChange={(e) => setSocialModal({ ...socialModal, customName: e.target.value })}
                    placeholder="Họ và tên"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm luxury-input rounded-xl font-sans"
                  />
                  <input
                    type="text"
                    value={socialModal.customStudentId}
                    onChange={(e) => setSocialModal({ ...socialModal, customStudentId: e.target.value })}
                    placeholder="MSSV (tùy chọn)"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm luxury-input rounded-xl font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSocialConfirm()}
                  disabled={loading || !socialModal.customEmail.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-[var(--color-accent)] to-rose-700 hover:brightness-105 active:scale-[0.98] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md cursor-pointer btn-tactile"
                >
                  <span>{loading ? 'Đang xác thực...' : 'Tiếp tục đăng nhập'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────── FORGOT PASSWORD OTP MODAL ───────── */}
      {forgotModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="luxury-login-card w-full max-w-md shadow-2xl overflow-hidden border border-amber-500/30">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-[var(--color-accent)] to-rose-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold font-serif text-sm">
                <KeyRound className="w-4 h-4 text-amber-300" />
                <span>Khôi phục mật khẩu tài khoản</span>
              </div>
              <button
                type="button"
                onClick={() => setForgotModal(prev => ({ ...prev, isOpen: false }))}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-4">
              {forgotModal.error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-start gap-2 animate-fadeIn font-sans">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
                  <span>{forgotModal.error}</span>
                </div>
              )}

              {forgotModal.success && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-fadeIn font-sans">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                  <span>{forgotModal.success}</span>
                </div>
              )}

              {forgotModal.step === 1 ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <p className="text-xs text-[var(--color-ink-1)] font-sans">
                    Nhập <strong>Mã số sinh viên (MSSV)</strong> hoặc <strong>Email</strong> liên kết với tài khoản. Hệ thống sẽ cấp mã OTP xác minh gồm 6 số có hiệu lực trong 15 phút.
                  </p>

                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--color-ink-1)] mb-1">
                      MSSV hoặc Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-2)]" />
                      <input
                        type="text"
                        value={forgotModal.identifier}
                        onChange={(e) => setForgotModal(prev => ({ ...prev, identifier: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 luxury-input rounded-xl text-xs sm:text-sm font-mono"
                        placeholder="VD: SV2024001 hoặc sinhvien@hust.edu.vn"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotModal.loading}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-[var(--color-accent)] to-rose-700 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md cursor-pointer btn-tactile font-serif"
                  >
                    {forgotModal.loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                    ) : (
                      <Send className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span>{forgotModal.loading ? 'Đang gửi mã...' : 'Gửi mã xác nhận OTP'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3.5">
                  <p className="text-xs text-[var(--color-ink-1)] font-sans">
                    Vui lòng nhập mã OTP đã nhận qua email và đặt mật khẩu đăng nhập mới:
                  </p>

                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--color-ink-1)] mb-1">
                      Mã xác nhận OTP (6 chữ số)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotModal.otp}
                      onChange={(e) => setForgotModal(prev => ({ ...prev, otp: e.target.value }))}
                      className="w-full px-4 py-2.5 luxury-input rounded-xl text-center text-lg font-mono font-bold tracking-widest text-[var(--color-accent)]"
                      placeholder="000000"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--color-ink-1)] mb-1">
                        Mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={forgotModal.newPassword}
                        onChange={(e) => setForgotModal(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-3 py-2 luxury-input rounded-xl text-xs sm:text-sm font-sans"
                        placeholder="Ít nhất 6 ký tự"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--color-ink-1)] mb-1">
                        Xác nhận lại
                      </label>
                      <input
                        type="password"
                        value={forgotModal.confirmPassword}
                        onChange={(e) => setForgotModal(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3 py-2 luxury-input rounded-xl text-xs sm:text-sm font-sans"
                        placeholder="Nhập lại mật khẩu"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setForgotModal(prev => ({ ...prev, step: 1, error: '', success: '' }))}
                      className="text-xs font-mono text-[var(--color-ink-2)] hover:text-[var(--color-ink-0)] underline cursor-pointer"
                    >
                      ← Nhận lại mã OTP
                    </button>

                    <button
                      type="submit"
                      disabled={forgotModal.loading}
                      className="inline-flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-[var(--color-accent)] to-rose-700 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer btn-tactile font-serif"
                    >
                      {forgotModal.loading ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
