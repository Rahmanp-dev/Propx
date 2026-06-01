'use client'

import { useState, useEffect } from 'react'
import {
    getPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    updatePaymentInstructions,
    type PaymentMethodEntry,
} from '@/lib/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    CheckCircle, Loader2, Plus, Trash2, Star, Smartphone,
    Building2, X,
} from 'lucide-react'

interface PaymentConfigFormProps {
    initialData: {
        upiId: string | null
        bankName: string | null
        accountNumber: string | null
        ifscCode: string | null
        accountHolder: string | null
        paymentInstructions: string | null
        paymentMethods: any
    } | null
}

type FormMode = 'idle' | 'add-upi' | 'add-bank'

export function PaymentConfigForm({ initialData }: PaymentConfigFormProps) {
    const [methods, setMethods] = useState<PaymentMethodEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formMode, setFormMode] = useState<FormMode>('idle')

    // UPI form fields
    const [upiLabel, setUpiLabel] = useState('')
    const [upiId, setUpiId] = useState('')

    // Bank form fields
    const [bankLabel, setBankLabel] = useState('')
    const [bankName, setBankName] = useState('')
    const [accountNumber, setAccountNumber] = useState('')
    const [ifscCode, setIfscCode] = useState('')
    const [accountHolder, setAccountHolder] = useState('')

    // Payment instructions
    const [paymentInstructions, setPaymentInstructions] = useState(
        initialData?.paymentInstructions || ''
    )
    const [instructionsSaving, setInstructionsSaving] = useState(false)
    const [instructionsSaved, setInstructionsSaved] = useState(false)

    useEffect(() => {
        loadMethods()
    }, [])

    async function loadMethods() {
        setLoading(true)
        const result = await getPaymentMethods()
        if (result.data) {
            setMethods(result.data)
        }
        setLoading(false)
    }

    function resetForm() {
        setFormMode('idle')
        setUpiLabel('')
        setUpiId('')
        setBankLabel('')
        setBankName('')
        setAccountNumber('')
        setIfscCode('')
        setAccountHolder('')
        setError(null)
    }

    async function handleAddUpi() {
        if (!upiId.trim()) {
            setError('UPI ID is required')
            return
        }
        setSaving(true)
        setError(null)

        const result = await addPaymentMethod({
            type: 'UPI',
            label: upiLabel.trim() || upiId.trim(),
            upiId: upiId.trim(),
        })

        setSaving(false)
        if (result.error) {
            setError(result.error)
        } else {
            resetForm()
            await loadMethods()
            flashSaved()
        }
    }

    async function handleAddBank() {
        if (!accountNumber.trim() || !ifscCode.trim()) {
            setError('Account number and IFSC code are required')
            return
        }
        setSaving(true)
        setError(null)

        const result = await addPaymentMethod({
            type: 'BANK',
            label: bankLabel.trim() || bankName.trim() || 'Bank Account',
            bankName: bankName.trim(),
            accountNumber: accountNumber.trim(),
            ifscCode: ifscCode.trim(),
            accountHolder: accountHolder.trim(),
        })

        setSaving(false)
        if (result.error) {
            setError(result.error)
        } else {
            resetForm()
            await loadMethods()
            flashSaved()
        }
    }

    async function handleRemove(methodId: string) {
        setActionLoading(methodId)
        const result = await removePaymentMethod(methodId)
        setActionLoading(null)
        if (result.error) {
            setError(result.error)
        } else {
            await loadMethods()
        }
    }

    async function handleSetDefault(methodId: string) {
        setActionLoading(methodId)
        const result = await setDefaultPaymentMethod(methodId)
        setActionLoading(null)
        if (result.error) {
            setError(result.error)
        } else {
            await loadMethods()
        }
    }

    async function handleSaveInstructions() {
        setInstructionsSaving(true)
        const result = await updatePaymentInstructions(paymentInstructions)
        setInstructionsSaving(false)
        if (result.error) {
            setError(result.error)
        } else {
            setInstructionsSaved(true)
            setTimeout(() => setInstructionsSaved(false), 3000)
        }
    }

    function flashSaved() {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading payment methods...
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Existing Payment Methods */}
            <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Payment Methods
                </h3>

                {methods.length === 0 && formMode === 'idle' && (
                    <div className="p-4 rounded-lg border border-dashed border-muted-foreground/30 text-center">
                        <p className="text-sm text-muted-foreground">
                            No payment methods configured. Add a UPI ID or bank account below.
                        </p>
                    </div>
                )}

                {methods.map((method) => (
                    <div
                        key={method.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                        <div className="flex-shrink-0">
                            {method.type === 'UPI' ? (
                                <Smartphone className="h-5 w-5 text-blue-500" />
                            ) : (
                                <Building2 className="h-5 w-5 text-purple-500" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">
                                    {method.label}
                                </span>
                                {method.isDefault && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-500/15 text-amber-500">
                                        <Star className="h-3 w-3 fill-current" />
                                        Default
                                    </span>
                                )}
                                <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                    {method.type}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {method.type === 'UPI'
                                    ? method.upiId
                                    : `${method.bankName || ''} · ****${method.accountNumber?.slice(-4) || ''}`
                                }
                            </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {!method.isDefault && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSetDefault(method.id)}
                                    disabled={actionLoading === method.id}
                                    title="Set as default"
                                    className="h-8 w-8 p-0"
                                >
                                    {actionLoading === method.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Star className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemove(method.id)}
                                disabled={actionLoading === method.id}
                                title="Remove"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                                {actionLoading === method.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                )}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Buttons */}
            {formMode === 'idle' && (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFormMode('add-upi')}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add UPI ID
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFormMode('add-bank')}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Bank Account
                    </Button>
                </div>
            )}

            {/* Add UPI Form */}
            {formMode === 'add-upi' && (
                <div className="p-4 rounded-lg border bg-card space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-blue-500" />
                            Add UPI ID
                        </h4>
                        <Button variant="ghost" size="sm" onClick={resetForm} className="h-8 w-8 p-0">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="upiLabel">Label</Label>
                            <Input
                                id="upiLabel"
                                placeholder="e.g., Personal GPay"
                                value={upiLabel}
                                onChange={(e) => setUpiLabel(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newUpiId">UPI ID *</Label>
                            <Input
                                id="newUpiId"
                                placeholder="yourname@upi"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                e.g., yourname@okaxis, 9848012345@ybl
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleAddUpi} disabled={saving} size="sm">
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                    Saving...
                                </>
                            ) : (
                                'Add UPI ID'
                            )}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={resetForm}>
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Add Bank Account Form */}
            {formMode === 'add-bank' && (
                <div className="p-4 rounded-lg border bg-card space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-purple-500" />
                            Add Bank Account
                        </h4>
                        <Button variant="ghost" size="sm" onClick={resetForm} className="h-8 w-8 p-0">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="bankLabel">Label</Label>
                            <Input
                                id="bankLabel"
                                placeholder="e.g., SBI Current A/c"
                                value={bankLabel}
                                onChange={(e) => setBankLabel(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newBankName">Bank Name</Label>
                            <Input
                                id="newBankName"
                                placeholder="State Bank of India"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newAccountHolder">Account Holder Name</Label>
                            <Input
                                id="newAccountHolder"
                                placeholder="Your Name"
                                value={accountHolder}
                                onChange={(e) => setAccountHolder(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newAccountNumber">Account Number *</Label>
                            <Input
                                id="newAccountNumber"
                                placeholder="1234567890"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newIfscCode">IFSC Code *</Label>
                            <Input
                                id="newIfscCode"
                                placeholder="SBIN0001234"
                                value={ifscCode}
                                onChange={(e) => setIfscCode(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleAddBank} disabled={saving} size="sm">
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                    Saving...
                                </>
                            ) : (
                                'Add Bank Account'
                            )}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={resetForm}>
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Success / Error Messages */}
            {saved && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Payment method added
                </span>
            )}
            {error && (
                <span className="text-sm text-red-500">{error}</span>
            )}

            {/* Custom Instructions */}
            <div className="space-y-2 border-t pt-6">
                <Label htmlFor="paymentInstructions">Custom Payment Instructions</Label>
                <textarea
                    id="paymentInstructions"
                    placeholder="Any special instructions for tenants (e.g., 'Please include flat number in payment note')"
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    className="w-full min-h-[80px] px-3 py-2 bg-transparent border border-input rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleSaveInstructions}
                        disabled={instructionsSaving}
                        size="sm"
                        variant="outline"
                    >
                        {instructionsSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                Saving...
                            </>
                        ) : (
                            'Save Instructions'
                        )}
                    </Button>
                    {instructionsSaved && (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Saved
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
