'use client'

import { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Only show on mobile devices
    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
      navigator.userAgent
    )
    if (!isMobile) return

    // Check if user previously dismissed
    const dismissed = localStorage.getItem('propx-pwa-dismissed')
    if (dismissed) {
      const dismissedDate = new Date(dismissed)
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
      // Show again after 7 days
      if (daysSinceDismissed < 7) return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('propx-pwa-dismissed', new Date().toISOString())
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gray-900 border-t border-gray-700 shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">PX</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">Install PropX</p>
            <p className="text-gray-400 text-xs truncate">Quick access from your home screen</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={handleInstall}
            className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Install
          </Button>
        </div>
      </div>
    </div>
  )
}
