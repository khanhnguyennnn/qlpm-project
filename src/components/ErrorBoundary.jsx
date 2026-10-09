import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-paper-0)] text-[var(--color-ink-0)] font-sans">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[var(--color-paper-1)] border border-[var(--rule-soft)] shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold font-display text-[var(--color-ink-0)]">
                Đã xảy ra sự cố hiển thị
              </h2>
              <p className="text-xs text-[var(--color-ink-1)] leading-relaxed">
                Hệ thống gặp lỗi trong quá trình kết xuất dữ liệu. Vui lòng thử tải lại trang hoặc quay về trang chủ.
              </p>
            </div>
            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-slate-900/5 dark:bg-white/5 text-[11px] font-mono text-left text-slate-500 dark:text-slate-400 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[var(--color-accent)] text-white hover:opacity-90 transition cursor-pointer btn-tactile shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tải lại trang</span>
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[var(--color-paper-2)] text-[var(--color-ink-0)] hover:bg-[var(--color-paper-3)] transition cursor-pointer btn-tactile border border-[var(--rule-hair)]"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Về trang chủ</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
