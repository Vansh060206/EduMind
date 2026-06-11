import React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#030014] flex flex-col items-center justify-center p-6 text-white font-sans">
          <div className="bg-white/5 border border-red-500/30 p-8 rounded-2xl max-w-md w-full text-center space-y-6 shadow-2xl backdrop-blur-md">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-red-400">Something went wrong</h1>
            
            <p className="text-gray-400 text-sm">
              We encountered an unexpected error while loading this page. 
              Our team has been notified.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4 p-3 bg-black/40 rounded text-left text-xs text-red-300 overflow-x-auto">
                <p className="font-mono">{this.state.error.toString()}</p>
              </div>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 border border-red-500/30 py-3 px-6 rounded-xl transition-all duration-300"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Reload Page</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
