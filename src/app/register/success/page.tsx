import { Building2, CheckCircle2, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export default function RegistrationSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">PropX</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <Card className="border-0 shadow-xl shadow-slate-200/50">
            <CardContent className="pt-10 pb-10 space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-slate-900">Registration Received!</h1>
                <p className="text-slate-500">
                  Thank you for registering with PropX. We will verify your payment and activate your account within 24 hours.
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 text-left border border-blue-100">
                <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                    Our team reviews your payment screenshot
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                    Your account gets activated (within 24 hrs)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                    Login and start managing your properties
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  Go to Login <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="text-xs text-slate-400">
                Questions? Contact us at support@propx.in
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/60">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-slate-400">
          © 2026 PropX. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
