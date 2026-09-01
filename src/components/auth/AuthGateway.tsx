/**
 * SmartProcure - Pre-Authentication Gateway (Sign In & Sign Up Interactive Interface)
 * Exact realization of the interactive architecture design from procurement.png
 * Features:
 * - Left Hero with 4 feature badges & metrics pills
 * - Interactive Sign In card with Google/Microsoft SSO & Quick Persona Logins
 * - 3-Step Create Account Wizard (Account -> Details -> Role)
 * - Interactive modules for Forgot Password, Reset Password, Role Selection, 2FA, and Welcome Screen
 * - Bottom Navy Enterprise Features Banner
 * - Strictly NO founder information on pre-auth screen.
 */

import React, { useState, useEffect } from 'react';
import { useAuth, SignUpData } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useI18n } from '../../context/I18nContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types';
import { SmartProcureLogo } from '../common/SmartProcureLogo';
import {
  Lock,
  Mail,
  User,
  Phone,
  Building2,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  ShoppingCart,
  FileCheck2,
  Box,
  Truck,
  Users,
  Shield,
  Clock,
  KeyRound,
  Check,
  CheckCircle,
  Briefcase,
  Layers,
  Zap,
  Globe,
  Sun,
  Moon,
  Smartphone,
  Cloud,
  Terminal,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export const AuthGateway: React.FC = () => {
  const { signIn, signUp, loginAsPersona } = useAuth();
  const { showToast } = useNotifications();
  const { t } = useI18n();
  const { isDark, toggleTheme, theme, setTheme } = useTheme();

  // Active view on the right: 'signin' | 'signup' | 'forgot' | 'reset' | '2fa' | 'success'
  const [activeView, setActiveView] = useState<'signin' | 'signup' | 'forgot' | 'reset' | '2fa' | 'success'>('signin');
  const [loading, setLoading] = useState(false);

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('ananya.deshmukh@procureflow.internal');
  const [signInPassword, setSignInPassword] = useState('Procure@2026');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up Multi-step Wizard State
  const [signUpStep, setSignUpStep] = useState<1 | 2 | 3>(1);
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: true,
    department: 'Engineering & Operations',
    companyName: 'SmartProcure Client Org',
    location: 'Bangalore, India',
    employeeId: 'EMP-9021',
    role: UserRole.EMPLOYEE,
  });
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('user@example.com');
  const [forgotSent, setForgotSent] = useState(false);

  // Reset Password State
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  // 2FA State
  const [twoFactorDigits, setTwoFactorDigits] = useState(['2', '4', '6', '8', '0', '1']);
  const [resendCountdown, setResendCountdown] = useState(30);

  // Success Screen State
  const [successCountdown, setSuccessCountdown] = useState(3);
  const [loggedUserName, setLoggedUserName] = useState('John Doe');

  // Timer for 2FA countdown
  useEffect(() => {
    if (activeView === '2fa' && resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [activeView, resendCountdown]);

  // Timer for Success redirect countdown
  useEffect(() => {
    if (activeView === 'success' && successCountdown > 0) {
      const timer = setTimeout(() => setSuccessCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (activeView === 'success' && successCountdown === 0) {
      // Auto complete sign-in
      loginAsPersona(signUpData.role || UserRole.EMPLOYEE);
    }
  }, [activeView, successCountdown, signUpData.role, loginAsPersona]);

  // Handle Standard Sign In
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim()) {
      showToast('error', 'Validation Error', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await signIn(signInEmail, signInPassword);
      if (res.success) {
        setLoggedUserName(signInEmail.split('@')[0]);
        setActiveView('success');
        setSuccessCountdown(3);
      } else {
        showToast('error', 'Authentication Failed', res.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      showToast('error', 'Sign In Error', err?.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  // Handle SSO Sign In Simulation
  const handleSSOSignIn = (provider: 'Google' | 'Microsoft') => {
    showToast('info', `${provider} SSO`, `Authenticated securely via ${provider} Workspace.`);
    setLoggedUserName(provider === 'Google' ? 'Google Workspace User' : 'Microsoft Enterprise User');
    setActiveView('success');
    setSuccessCountdown(3);
  };

  // Handle 1-Click Persona Sign In
  const handleQuickPersona = (role: UserRole, name: string) => {
    loginAsPersona(role);
    showToast('success', 'Logged In', `Welcome back, ${name}!`);
  };

  // Handle Sign Up Step 1
  const handleSignUpStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpData.name.trim() || !signUpData.email.trim() || !signUpData.password.trim()) {
      showToast('error', 'Required Fields', 'Please fill in your name, work email, and password.');
      return;
    }
    if (signUpData.password !== signUpData.confirmPassword && signUpData.confirmPassword) {
      showToast('error', 'Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (!signUpData.agreeTerms) {
      showToast('error', 'Agreement Required', 'Please accept the Terms & Conditions and Privacy Policy.');
      return;
    }
    setSignUpStep(2);
  };

  // Handle Sign Up Step 2
  const handleSignUpStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpStep(3);
  };

  // Handle Sign Up Final Step 3 (Role selection & complete)
  const handleSignUpStep3 = async () => {
    setLoading(true);
    try {
      const res = await signUp({
        name: signUpData.name,
        email: signUpData.email,
        phone: signUpData.phone,
        department: signUpData.department,
        role: signUpData.role,
        password: signUpData.password,
      });
      if (res.success) {
        setLoggedUserName(signUpData.name);
        setActiveView('success');
        setSuccessCountdown(3);
      } else {
        showToast('error', 'Registration Failed', res.message || 'Could not create account');
      }
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      showToast('error', 'Email Required', 'Please enter your account email address.');
      return;
    }
    setForgotSent(true);
    showToast('success', 'Reset Link Dispatched', `Password recovery link sent to ${forgotEmail}`);
    setTimeout(() => {
      setActiveView('reset');
    }, 1500);
  };

  // Handle Reset Password Submit
  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetNewPassword.length < 8) {
      showToast('error', 'Password Weak', 'Password must be at least 8 characters long.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      showToast('error', 'Mismatch', 'Passwords do not match.');
      return;
    }
    showToast('success', 'Password Updated', 'Your new password has been saved. Please sign in.');
    setActiveView('signin');
  };

  // Handle 2FA Digit Input Change
  const handle2FADigitChange = (index: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    const updated = [...twoFactorDigits];
    updated[index] = val;
    setTwoFactorDigits(updated);
  };

  const handle2FAVerify = () => {
    const code = twoFactorDigits.join('');
    if (code.length === 6) {
      showToast('success', '2FA Verified', 'Two-Factor Authentication successful.');
      setLoggedUserName('Verified User');
      setActiveView('success');
      setSuccessCountdown(3);
    } else {
      showToast('error', 'Invalid Code', 'Please enter a 6-digit code.');
    }
  };

  // Password Strength Validation Rules
  const hasMinLength = resetNewPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(resetNewPassword);
  const hasNumber = /[0-9]/.test(resetNewPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(resetNewPassword);

  // Available Roles Matrix
  const rolesList = [
    {
      role: UserRole.EMPLOYEE,
      title: 'Employee',
      desc: 'Create Requests',
      icon: User,
      color: 'blue',
      bgLight: 'bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-400',
      activeBg: 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30',
    },
    {
      role: UserRole.MANAGER,
      title: 'Manager',
      desc: 'Approve Requests',
      icon: Users,
      color: 'purple',
      bgLight: 'bg-purple-50 text-purple-600 border-purple-200 hover:border-purple-400',
      activeBg: 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/30',
    },
    {
      role: UserRole.PROCUREMENT_MANAGER,
      title: 'Procurement',
      desc: 'Manage Orders',
      icon: Briefcase,
      color: 'emerald',
      bgLight: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:border-emerald-400',
      activeBg: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30',
    },
    {
      role: UserRole.SUPPLIER,
      title: 'Supplier',
      desc: 'Process Orders',
      icon: FileCheck2,
      color: 'amber',
      bgLight: 'bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-400',
      activeBg: 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/30',
    },
    {
      role: UserRole.DELIVERY_AGENT,
      title: 'Delivery Agent',
      desc: 'Track Deliveries',
      icon: Truck,
      color: 'cyan',
      bgLight: 'bg-cyan-50 text-cyan-600 border-cyan-200 hover:border-cyan-400',
      activeBg: 'bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-500/30',
    },
    {
      role: UserRole.CUSTOMER,
      title: 'Customer',
      desc: 'View Orders',
      icon: User,
      color: 'pink',
      bgLight: 'bg-pink-50 text-pink-600 border-pink-200 hover:border-pink-400',
      activeBg: 'bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-500/30',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans relative overflow-x-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Branding & Theme Switcher */}
      <nav className="h-16 px-6 lg:px-12 flex items-center justify-between z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <SmartProcureLogo size="md" variant="full" theme="dark" />

        <div className="flex items-center gap-3">
          {/* Explicit Light/Dark Toggle */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 shadow-xs">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                !isDark ? 'bg-white text-amber-600 shadow-xs font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Switch to Light Mode"
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                isDark ? 'bg-slate-800 text-blue-400 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Switch to Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Split Hero & Interactive Application Form Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex flex-col justify-center z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Brand Hero & 4 Feature Badges & Metrics */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-4">
              <SmartProcureLogo size="lg" variant="full" theme="dark" />
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Smarter Procurement, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">
                  Better Business.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
                Streamline your purchases, manage suppliers, track orders, and stay in control — all in one place.
              </p>
            </div>

            {/* 4 Feature Badges in a Row (Request, Approve, Order, Deliver) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {/* Badge 1: Request */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col items-center text-center space-y-2 hover:border-blue-500/50 hover:bg-slate-900 transition shadow-sm group">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Request</div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5">Create Purchase Requests</div>
                </div>
              </div>

              {/* Badge 2: Approve */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col items-center text-center space-y-2 hover:border-purple-500/50 hover:bg-slate-900 transition shadow-sm group">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Approve</div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5">Multi-level Approvals</div>
                </div>
              </div>

              {/* Badge 3: Order */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col items-center text-center space-y-2 hover:border-emerald-500/50 hover:bg-slate-900 transition shadow-sm group">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Order</div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5">Manage Purchase Orders</div>
                </div>
              </div>

              {/* Badge 4: Deliver */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col items-center text-center space-y-2 hover:border-amber-500/50 hover:bg-slate-900 transition shadow-sm group">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Deliver</div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5">Track & Receive Deliveries</div>
                </div>
              </div>
            </div>

            {/* Bottom Metrics Pills Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-bold text-white">10K+</span>
                <span className="text-slate-400 text-[11px]">Requests</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-bold text-white">3K+</span>
                <span className="text-slate-400 text-[11px]">Suppliers</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                <Box className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold text-white">25K+</span>
                <span className="text-slate-400 text-[11px]">Orders</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold text-white">99%</span>
                <span className="text-slate-400 text-[11px]">On-Time Delivery</span>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Interactive Card Form (as in procurement.png) */}
          <div className="lg:col-span-6">
            <div className="bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 relative transition-all">
              
              {/* VIEW 1: SIGN IN */}
              {activeView === 'signin' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back!</h2>
                    <p className="text-xs text-slate-500 mt-1">Sign in to your account</p>
                  </div>

                  <form onSubmit={handleSignInSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={signInEmail}
                          onChange={(e) => setSignInEmail(e.target.value)}
                          placeholder="user@example.com"
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showSignInPassword ? 'text' : 'password'}
                          required
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignInPassword(!showSignInPassword)}
                          className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Remember me</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveView('forgot')}
                        className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
                    >
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  {/* SSO Continue With */}
                  <div className="space-y-3 pt-2">
                    <div className="relative flex items-center justify-center">
                      <div className="border-t border-slate-200 w-full" />
                      <span className="bg-white px-3 text-[10px] uppercase tracking-wider text-slate-400 font-semibold absolute">
                        OR CONTINUE WITH
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSSOSignIn('Google')}
                        className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span>Google</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSSOSignIn('Microsoft')}
                        className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 23 23">
                          <path fill="#f35325" d="M1 1h10v10H1z" />
                          <path fill="#81bc06" d="M12 1h10v10H12z" />
                          <path fill="#05a6f0" d="M1 12h10v10H1z" />
                          <path fill="#ffba08" d="M12 12h10v10H12z" />
                        </svg>
                        <span>Microsoft</span>
                      </button>
                    </div>
                  </div>

                  {/* 1-Click Quick Persona Access Row */}
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">
                      Instant 1-Click Demo Login:
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickPersona(UserRole.EMPLOYEE, 'Ananya (Employee)')}
                        className="p-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold transition text-center cursor-pointer border border-blue-100"
                      >
                        Employee
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPersona(UserRole.MANAGER, 'Vikram (Manager)')}
                        className="p-1.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-semibold transition text-center cursor-pointer border border-purple-100"
                      >
                        Manager
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPersona(UserRole.PROCUREMENT_MANAGER, 'Pooja (Procurement)')}
                        className="p-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold transition text-center cursor-pointer border border-emerald-100"
                      >
                        Procurement
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPersona(UserRole.ADMIN, 'IT Admin')}
                        className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition text-center cursor-pointer border border-slate-200"
                      >
                        IT Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPersona(UserRole.SUPPLIER, 'Suresh (Vendor)')}
                        className="p-1.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-semibold transition text-center cursor-pointer border border-amber-100"
                      >
                        Supplier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPersona(UserRole.DELIVERY_AGENT, 'Amit (Logistics)')}
                        className="p-1.5 rounded-md bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-[11px] font-semibold transition text-center cursor-pointer border border-cyan-100"
                      >
                        Delivery Agent
                      </button>
                    </div>
                  </div>

                  {/* Toggle to Sign Up */}
                  <div className="text-center pt-2">
                    <p className="text-xs text-slate-600">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveView('signup');
                          setSignUpStep(1);
                        }}
                        className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                      >
                        Sign up
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {/* VIEW 2: CREATE ACCOUNT (3-STEP WIZARD) */}
              {activeView === 'signup' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Account</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Join SmartProcure today</p>
                  </div>

                  {/* 3-Step Indicator */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          signUpStep === 1
                            ? 'bg-blue-600 text-white'
                            : signUpStep > 1
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        1
                      </span>
                      <span className={`font-semibold ${signUpStep === 1 ? 'text-blue-600' : 'text-slate-600'}`}>
                        Account
                      </span>
                    </div>

                    <div className="h-[1px] w-8 bg-slate-200" />

                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          signUpStep === 2
                            ? 'bg-blue-600 text-white'
                            : signUpStep > 2
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        2
                      </span>
                      <span className={`font-semibold ${signUpStep === 2 ? 'text-blue-600' : 'text-slate-600'}`}>
                        Details
                      </span>
                    </div>

                    <div className="h-[1px] w-8 bg-slate-200" />

                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          signUpStep === 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        3
                      </span>
                      <span className={`font-semibold ${signUpStep === 3 ? 'text-blue-600' : 'text-slate-600'}`}>
                        Role
                      </span>
                    </div>
                  </div>

                  {/* STEP 1: Account Essentials */}
                  {signUpStep === 1 && (
                    <form onSubmit={handleSignUpStep1} className="space-y-3.5 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                            <User className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            required
                            value={signUpData.name}
                            onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                            placeholder="John Doe"
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="email"
                            required
                            value={signUpData.email}
                            onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                            placeholder="john@example.com"
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-600 font-semibold text-xs gap-1">
                            <span>🇮🇳</span>
                            <span className="text-slate-500 font-mono">+91</span>
                          </div>
                          <input
                            type="tel"
                            value={signUpData.phone}
                            onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                            placeholder="98765 43210"
                            className="w-full pl-16 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Password</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                            <input
                              type={showSignUpPassword ? 'text' : 'password'}
                              required
                              value={signUpData.password}
                              onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                              placeholder="••••••••"
                              className="w-full pl-8 pr-8 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                              className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showSignUpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Confirm Password</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                            <input
                              type={showSignUpConfirmPassword ? 'text' : 'password'}
                              required
                              value={signUpData.confirmPassword}
                              onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                              placeholder="••••••••"
                              className="w-full pl-8 pr-8 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                              className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showSignUpConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <label className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-600 pt-1">
                        <input
                          type="checkbox"
                          checked={signUpData.agreeTerms}
                          onChange={(e) => setSignUpData({ ...signUpData, agreeTerms: e.target.checked })}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                        />
                        <span>
                          I agree to the <span className="text-blue-600 font-semibold">Terms & Conditions</span> and{' '}
                          <span className="text-blue-600 font-semibold">Privacy Policy</span>
                        </span>
                      </label>

                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
                      >
                        <span>Next</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}

                  {/* STEP 2: Organization Details */}
                  {signUpStep === 2 && (
                    <form onSubmit={handleSignUpStep2} className="space-y-3.5 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Company / Organization</label>
                        <input
                          type="text"
                          required
                          value={signUpData.companyName}
                          onChange={(e) => setSignUpData({ ...signUpData, companyName: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Department</label>
                        <select
                          value={signUpData.department}
                          onChange={(e) => setSignUpData({ ...signUpData, department: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="Engineering & Operations">Engineering & Operations</option>
                          <option value="Procurement & Sourcing">Procurement & Sourcing</option>
                          <option value="Information Technology">Information Technology</option>
                          <option value="Finance & Accounts">Finance & Accounts</option>
                          <option value="Supply Chain & Logistics">Supply Chain & Logistics</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Location</label>
                          <input
                            type="text"
                            value={signUpData.location}
                            onChange={(e) => setSignUpData({ ...signUpData, location: e.target.value })}
                            className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Employee ID</label>
                          <input
                            type="text"
                            value={signUpData.employeeId}
                            onChange={(e) => setSignUpData({ ...signUpData, employeeId: e.target.value })}
                            className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setSignUpStep(1)}
                          className="w-1/3 py-2 px-3 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back</span>
                        </button>
                        <button
                          type="submit"
                          className="w-2/3 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                        >
                          <span>Next: Choose Role</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  )}

                  {/* STEP 3: Role Selection Grid (As shown in procurement.png) */}
                  {signUpStep === 3 && (
                    <div className="space-y-4 text-xs">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Select Your Role</h3>
                        <p className="text-[11px] text-slate-500">Choose your account type and permission level</p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {rolesList.map((item) => {
                          const isSelected = signUpData.role === item.role;
                          const IconComponent = item.icon;

                          return (
                            <div
                              key={item.role}
                              onClick={() => setSignUpData({ ...signUpData, role: item.role })}
                              className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center space-y-1.5 transition cursor-pointer relative ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/40 text-blue-950 font-bold'
                                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                                  <Check className="w-3 h-3" />
                                </div>
                              )}
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <div className="font-bold text-xs">{item.title}</div>
                              <div className="text-[10px] text-slate-500 leading-none">{item.desc}</div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setSignUpStep(2)}
                          className="w-1/3 py-2 px-3 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSignUpStep3}
                          disabled={loading}
                          className="w-2/3 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
                        >
                          <span>Complete Registration</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Toggle back to Sign In */}
                  <div className="text-center pt-1 border-t border-slate-100">
                    <p className="text-xs text-slate-600">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setActiveView('signin')}
                        className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                      >
                        Sign in
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {/* VIEW 3: FORGOT PASSWORD */}
              {activeView === 'forgot' && (
                <div className="space-y-4 animate-in fade-in duration-200 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 mx-auto sm:mx-0 flex items-center justify-center">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Forgot Password</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Enter your email to receive a recovery reset link</p>
                  </div>

                  <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-left">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="user@example.com"
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
                    >
                      <SendIcon className="w-4 h-4" />
                      <span>Send Reset Link</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveView('signin')}
                      className="w-full text-center text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center justify-center gap-1.5 pt-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Login</span>
                    </button>
                  </form>
                </div>
              )}

              {/* VIEW 4: RESET PASSWORD */}
              {activeView === 'reset' && (
                <div className="space-y-4 animate-in fade-in duration-200 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 mx-auto sm:mx-0 flex items-center justify-center">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Reset Password</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Set a new secure password for your account</p>
                  </div>

                  <form onSubmit={handleResetSubmit} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-left">New Password</label>
                      <div className="relative">
                        <input
                          type={showResetNewPassword ? 'text' : 'password'}
                          required
                          value={resetNewPassword}
                          onChange={(e) => setResetNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                          className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showResetNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-left">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showResetConfirmPassword ? 'text' : 'password'}
                          required
                          value={resetConfirmPassword}
                          onChange={(e) => setResetConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                          className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showResetConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Password requirements checklist */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-left space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password must contain:</p>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>One uppercase letter</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>One number</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>One special character</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
                    >
                      <span>Reset Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* VIEW 5: TWO-FACTOR AUTHENTICATION (2FA) */}
              {activeView === '2fa' && (
                <div className="space-y-4 animate-in fade-in duration-200 text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Two-Factor Authentication</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Enter the 6-digit code sent to your phone/email</p>
                  </div>

                  {/* 6 Digit Input Boxes */}
                  <div className="flex items-center justify-center gap-2 py-3">
                    {twoFactorDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handle2FADigitChange(idx, e.target.value)}
                        className="w-10 h-12 text-center text-lg font-mono font-bold rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-xs"
                      />
                    ))}
                  </div>

                  <p className="text-xs text-slate-500">
                    Resend code in <span className="font-mono font-bold text-blue-600">00:{resendCountdown < 10 ? `0${resendCountdown}` : resendCountdown}</span>
                  </p>

                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={handle2FAVerify}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => showToast('info', 'Backup Code', 'Backup code verification available for emergency recovery.')}
                      className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Use backup code
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW 6: WELCOME SUCCESS STATE (Circular Redirect Animation) */}
              {activeView === 'success' && (
                <div className="space-y-5 animate-in zoom-in-95 duration-200 text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CheckCircle className="w-8 h-8" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome, {loggedUserName}!</h2>
                    <p className="text-xs text-slate-500 mt-1">Login successful. Redirecting to workspace dashboard...</p>
                  </div>

                  {/* Circular countdown gauge */}
                  <div className="flex flex-col items-center justify-center py-3">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-emerald-500 animate-spin flex items-center justify-center">
                      <span className="text-base font-black font-mono text-emerald-600">
                        {successCountdown}s
                      </span>
                    </div>
                  </div>

                  {/* Analytics Dashboard Graphic Illustration */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="text-left text-xs">
                      <div className="font-bold text-slate-800">SmartProcure Enterprise Cloud</div>
                      <div className="text-[11px] text-slate-500">AP-SOUTH-1 Cluster Initialized</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Bottom Interactive Showcase Bar to preview all screens from the design */}
        <div className="mt-10 p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="font-semibold text-slate-200">Interactive Interface Design Views:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveView('signin')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                activeView === 'signin' ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveView('signup');
                setSignUpStep(1);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                activeView === 'signup' && signUpStep === 1 ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => {
                setActiveView('signup');
                setSignUpStep(3);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                activeView === 'signup' && signUpStep === 3 ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Select Role
            </button>
            <button
              onClick={() => setActiveView('forgot')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                activeView === 'forgot' ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Forgot Password
            </button>
            <button
              onClick={() => setActiveView('reset')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                activeView === 'reset' ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Reset Password
            </button>
            <button
              onClick={() => setActiveView('2fa')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                activeView === '2fa' ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              2FA Verification
            </button>
            <button
              onClick={() => {
                setActiveView('success');
                setSuccessCountdown(3);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                activeView === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Welcome Screen
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Navy Enterprise Features Banner (From procurement.png) */}
      <footer className="bg-slate-900 border-t border-slate-800 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center lg:text-left">
            
            {/* Feature 1 */}
            <div className="flex items-center justify-center lg:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight">Secure Login</div>
                <div className="text-[10px] text-slate-400">JWT Authentication</div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center justify-center lg:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight">Role Based Access</div>
                <div className="text-[10px] text-slate-400">7 User Roles</div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center justify-center lg:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight">Instant Notifications</div>
                <div className="text-[10px] text-slate-400">Email / SMS / In-App</div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-center justify-center lg:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight">Cloud Ready</div>
                <div className="text-[10px] text-slate-400">Docker & Kubernetes</div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="flex items-center justify-center lg:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                <Terminal className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight">REST APIs</div>
                <div className="text-[10px] text-slate-400">OpenAPI/Swagger</div>
              </div>
            </div>

          </div>

          <div className="border-t border-slate-800/80 mt-4 pt-3 text-center text-[10px] text-slate-500">
            &copy; 2025 SmartProcure. All rights reserved | Smart Procurement &amp; Purchase Order Management System
          </div>
        </div>
      </footer>
    </div>
  );
};

// SendIcon helper
function SendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
