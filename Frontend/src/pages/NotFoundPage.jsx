import { Link } from 'react-router-dom'
import { Home, AlertCircle } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10
                      flex items-center justify-center">
        <AlertCircle size={36} className="text-slate-500" />
      </div>
      <div>
        <h2 className="font-display text-5xl font-bold text-white mb-2">404</h2>
        <p className="text-lg text-slate-400 mb-1">Page not found</p>
        <p className="text-sm text-slate-600">
          {`The page you're looking for doesn't exist or has been moved.`}
        </p>
      </div>
      <Link to="/" className="btn-primary">
        <Home size={16} />
        Back to Dashboard
      </Link>
    </div>
  )
}
