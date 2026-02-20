'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ProfileData {
  id: string
  name: string
  email: string
  telegram: string | null
  github: string | null
  timezone: string | null
  wakeTime: string | null
  location: string | null
  communicationStyle: string | null
  workStartTime: string | null
  workEndTime: string | null
  preferences: unknown
  shortTermGoals: string[]
  mediumTermGoals: string[]
  longTermGoals: string[]
  techStack: string[]
  currentFocus: string | null
  myMission: string | null
  notes: string | null
}

interface Business {
  id: string
  name: string
  description: string | null
  industry: string | null
  isPrimary: boolean
  createdAt: Date
  updatedAt: Date
}

interface Product {
  id: string
  name: string
  description: string | null
  url: string
  scrapedData: string | null
  createdAt: Date
  updatedAt: Date
  businessId: string
}

interface ProfileFormProps {
  initialProfile: ProfileData
  initialBusinesses: Business[]
}

function listToText(list: string[] | null | undefined) {
  return (list || []).join('\n')
}

function textToList(text: string) {
  return text
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean)
}

export function ProfileForm({ initialProfile, initialBusinesses }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    name: initialProfile.name || '',
    email: initialProfile.email || '',
    telegram: initialProfile.telegram || '',
    github: initialProfile.github || '',
    timezone: initialProfile.timezone || '',
    wakeTime: initialProfile.wakeTime || '',
    location: initialProfile.location || '',
    communicationStyle: initialProfile.communicationStyle || '',
    workStartTime: initialProfile.workStartTime || '',
    workEndTime: initialProfile.workEndTime || '',
    preferences: initialProfile.preferences ? JSON.stringify(initialProfile.preferences, null, 2) : '',
    shortTermGoals: listToText(initialProfile.shortTermGoals),
    mediumTermGoals: listToText(initialProfile.mediumTermGoals),
    longTermGoals: listToText(initialProfile.longTermGoals),
    techStack: listToText(initialProfile.techStack),
    currentFocus: initialProfile.currentFocus || '',
    myMission: initialProfile.myMission || '',
    notes: initialProfile.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Business management state
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses)
  const [showBusinessModal, setShowBusinessModal] = useState(false)
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null)
  const [businessForm, setBusinessForm] = useState({
    name: '',
    description: '',
    industry: '',
    isPrimary: false,
  })
  const [businessLoading, setBusinessLoading] = useState(false)

  // Product management state
  const [products, setProducts] = useState<Record<string, Product[]>>({})
  const [loadingProducts, setLoadingProducts] = useState<Record<string, boolean>>({})
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null)
  const [productForm, setProductForm] = useState({
    name: '',
    url: '',
    description: '',
  })
  const [productLoading, setProductLoading] = useState(false)
  const [scrapingProductId, setScrapingProductId] = useState<string | null>(null)

  const fetchProducts = async (businessId: string) => {
    if (products[businessId]) return // Already loaded

    setLoadingProducts(prev => ({ ...prev, [businessId]: true }))
    try {
      const res = await fetch(`/api/profile/businesses/${businessId}/products`)
      if (res.ok) {
        const data = await res.json()
        setProducts(prev => ({ ...prev, [businessId]: data }))
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoadingProducts(prev => ({ ...prev, [businessId]: false }))
    }
  }

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusinessLoading(true)
    setError(null)

    try {
      if (editingBusiness) {
        // Update existing business
        const res = await fetch(`/api/profile/businesses/${editingBusiness.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(businessForm),
        })

        if (!res.ok) {
          const message = await res.json().catch(() => ({ error: 'Update failed' }))
          setError(message.error || 'Failed to update business')
          return
        }

        const updatedBusiness = await res.json()
        setBusinesses(businesses.map(b => b.id === updatedBusiness.id ? updatedBusiness : b))
        setSuccess('Business updated successfully')
      } else {
        // Create new business
        const res = await fetch('/api/profile/businesses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(businessForm),
        })

        if (!res.ok) {
          const message = await res.json().catch(() => ({ error: 'Create failed' }))
          setError(message.error || 'Failed to create business')
          return
        }

        const newBusiness = await res.json()
        setBusinesses([newBusiness, ...businesses])
        setSuccess('Business created successfully')
      }

      setShowBusinessModal(false)
      setEditingBusiness(null)
      setBusinessForm({ name: '', description: '', industry: '', isPrimary: false })
    } catch (err) {
      console.error('Business operation failed:', err)
      setError('Operation failed')
    } finally {
      setBusinessLoading(false)
    }
  }

  const handleEditBusiness = (business: Business) => {
    setEditingBusiness(business)
    setBusinessForm({
      name: business.name,
      description: business.description || '',
      industry: business.industry || '',
      isPrimary: business.isPrimary,
    })
    setShowBusinessModal(true)
  }

  const handleDeleteBusiness = async (businessId: string) => {
    if (!confirm('Are you sure you want to delete this business?')) return

    setBusinessLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/profile/businesses/${businessId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const message = await res.json().catch(() => ({ error: 'Delete failed' }))
        setError(message.error || 'Failed to delete business')
        return
      }

      setBusinesses(businesses.filter(b => b.id !== businessId))
      // Remove products for this business
      setProducts(prev => {
        const newProducts = { ...prev }
        delete newProducts[businessId]
        return newProducts
      })
      setSuccess('Business deleted successfully')
    } catch (err) {
      console.error('Delete business failed:', err)
      setError('Delete failed')
    } finally {
      setBusinessLoading(false)
    }
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentBusinessId) return

    setProductLoading(true)
    setError(null)

    try {
      if (editingProduct) {
        // Update existing product
        const res = await fetch(`/api/profile/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productForm),
        })

        if (!res.ok) {
          const message = await res.json().catch(() => ({ error: 'Update failed' }))
          setError(message.error || 'Failed to update product')
          return
        }

        const updatedProduct = await res.json()
        setProducts(prev => ({
          ...prev,
          [currentBusinessId]: prev[currentBusinessId]?.map(p => 
            p.id === updatedProduct.id ? updatedProduct : p
          ) || [updatedProduct]
        }))
        setSuccess('Product updated successfully')
      } else {
        // Create new product
        const res = await fetch(`/api/profile/businesses/${currentBusinessId}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productForm),
        })

        if (!res.ok) {
          const message = await res.json().catch(() => ({ error: 'Create failed' }))
          setError(message.error || 'Failed to create product')
          return
        }

        const newProduct = await res.json()
        setProducts(prev => ({
          ...prev,
          [currentBusinessId]: [newProduct, ...(prev[currentBusinessId] || [])]
        }))
        setSuccess('Product created successfully')
      }

      setShowProductModal(false)
      setEditingProduct(null)
      setCurrentBusinessId(null)
      setProductForm({ name: '', url: '', description: '' })
    } catch (err) {
      console.error('Product operation failed:', err)
      setError('Operation failed')
    } finally {
      setProductLoading(false)
    }
  }

  const handleAddProduct = (businessId: string) => {
    setCurrentBusinessId(businessId)
    setEditingProduct(null)
    setProductForm({ name: '', url: '', description: '' })
    setShowProductModal(true)
  }

  const handleEditProduct = (businessId: string, product: Product) => {
    setCurrentBusinessId(businessId)
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      url: product.url,
      description: product.description || '',
    })
    setShowProductModal(true)
  }

  const handleDeleteProduct = async (businessId: string, productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    setProductLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/profile/products/${productId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const message = await res.json().catch(() => ({ error: 'Delete failed' }))
        setError(message.error || 'Failed to delete product')
        return
      }

      setProducts(prev => ({
        ...prev,
        [businessId]: prev[businessId]?.filter(p => p.id !== productId) || []
      }))
      setSuccess('Product deleted successfully')
    } catch (err) {
      console.error('Delete product failed:', err)
      setError('Delete failed')
    } finally {
      setProductLoading(false)
    }
  }

  const handleScrapeProduct = async (businessId: string, productId: string) => {
    setScrapingProductId(productId)
    setError(null)

    try {
      const res = await fetch(`/api/profile/products/${productId}/scrape`, {
        method: 'POST',
      })

      if (!res.ok) {
        const message = await res.json().catch(() => ({ error: 'Scrape failed' }))
        setError(message.error || 'Failed to scrape product')
        return
      }

      const data = await res.json()
      setProducts(prev => ({
        ...prev,
        [businessId]: prev[businessId]?.map(p => 
          p.id === productId ? data.product : p
        ) || []
      }))
      setSuccess('Product info scraped successfully')
    } catch (err) {
      console.error('Scrape product failed:', err)
      setError('Scrape failed')
    } finally {
      setScrapingProductId(null)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    let preferencesValue: unknown = null
    if (formData.preferences.trim()) {
      try {
        preferencesValue = JSON.parse(formData.preferences)
      } catch {
        setError('Preferences must be valid JSON.')
        setSaving(false)
        return
      }
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      telegram: formData.telegram.trim() || null,
      github: formData.github.trim() || null,
      timezone: formData.timezone.trim() || null,
      wakeTime: formData.wakeTime.trim() || null,
      location: formData.location.trim() || null,
      communicationStyle: formData.communicationStyle.trim() || null,
      workStartTime: formData.workStartTime.trim() || null,
      workEndTime: formData.workEndTime.trim() || null,
      preferences: preferencesValue,
      shortTermGoals: textToList(formData.shortTermGoals),
      mediumTermGoals: textToList(formData.mediumTermGoals),
      longTermGoals: textToList(formData.longTermGoals),
      techStack: textToList(formData.techStack),
      currentFocus: formData.currentFocus.trim() || null,
      myMission: formData.myMission.trim() || null,
      notes: formData.notes.trim() || null,
    }

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const message = await res.json().catch(() => ({ error: 'Save failed' }))
        setError(message.error || 'Save failed')
        return
      }

      setSuccess('Profile updated')
    } catch (err) {
      console.error('Profile update failed:', err)
      setError('Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Keep your personal and work details up to date.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Telegram</label>
            <input
              value={formData.telegram}
              onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              placeholder="@username"
            />
          </div>
          <div>
            <label className="text-sm font-medium">GitHub</label>
            <input
              value={formData.github}
              onChange={(e) => setFormData({ ...formData, github: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              placeholder="github.com/you"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Timezone</label>
            <input
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              placeholder="America/Los_Angeles"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Location</label>
            <input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              placeholder="City, Country"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work Style</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Wake Time</label>
            <input
              value={formData.wakeTime}
              onChange={(e) => setFormData({ ...formData, wakeTime: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              placeholder="07:00"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Communication Style</label>
            <input
              value={formData.communicationStyle}
              onChange={(e) => setFormData({ ...formData, communicationStyle: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              placeholder="Direct, async, concise"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Work Start</label>
            <input
              value={formData.workStartTime}
              onChange={(e) => setFormData({ ...formData, workStartTime: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              placeholder="09:00"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Work End</label>
            <input
              value={formData.workEndTime}
              onChange={(e) => setFormData({ ...formData, workEndTime: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              placeholder="18:00"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Preferences (JSON)</label>
            <textarea
              value={formData.preferences}
              onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg font-mono text-sm"
              rows={4}
              placeholder='{ "focusMode": true }'
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Goals & Mission</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Short Term</label>
            <textarea
              value={formData.shortTermGoals}
              onChange={(e) => setFormData({ ...formData, shortTermGoals: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              rows={4}
              placeholder="One per line"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Medium Term</label>
            <textarea
              value={formData.mediumTermGoals}
              onChange={(e) => setFormData({ ...formData, mediumTermGoals: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              rows={4}
              placeholder="One per line"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Long Term</label>
            <textarea
              value={formData.longTermGoals}
              onChange={(e) => setFormData({ ...formData, longTermGoals: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              rows={4}
              placeholder="One per line"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="text-sm font-medium">My Mission</label>
            <textarea
              value={formData.myMission}
              onChange={(e) => setFormData({ ...formData, myMission: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              rows={4}
              placeholder="Describe your personal mission, purpose, or guiding principles..."
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Your personal mission statement helps your AI assistant understand your core values and long-term direction.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tech Stack & Focus</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Tech Stack</label>
            <textarea
              value={formData.techStack}
              onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              rows={4}
              placeholder="One per line"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Current Focus</label>
            <textarea
              value={formData.currentFocus}
              onChange={(e) => setFormData({ ...formData, currentFocus: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              rows={4}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Businesses</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingBusiness(null)
              setBusinessForm({ name: '', description: '', industry: '', isPrimary: false })
              setShowBusinessModal(true)
            }}
          >
            + Add Business
          </Button>
        </CardHeader>
        <CardContent>
          {businesses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No businesses added yet.</p>
              <p className="text-sm">Add your first business to track goals and activities.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {businesses.map((business) => (
                <div
                  key={business.id}
                  className="border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Business Info */}
                  <div className="flex items-start justify-between p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{business.name}</h3>
                        {business.isPrimary && (
                          <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                            Primary
                          </span>
                        )}
                      </div>
                      {business.industry && (
                        <p className="text-sm text-muted-foreground">{business.industry}</p>
                      )}
                      {business.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {business.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditBusiness(business)}
                        disabled={businessLoading}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteBusiness(business.id)}
                        disabled={businessLoading}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Products Section */}
                  <div className="border-t border-border px-4 py-3">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium">Products</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddProduct(business.id)}
                      >
                        + Add Product
                      </Button>
                    </div>

                    {/* Load products on expand */}
                    {!products[business.id] && !loadingProducts[business.id] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => fetchProducts(business.id)}
                      >
                        Load products
                      </Button>
                    )}

                    {loadingProducts[business.id] && (
                      <p className="text-sm text-muted-foreground">Loading products...</p>
                    )}

                    {products[business.id]?.length === 0 && (
                      <p className="text-sm text-muted-foreground">No products yet.</p>
                    )}

                    {products[business.id] && products[business.id].length > 0 && (
                      <div className="space-y-2">
                        {products[business.id].map((product) => (
                          <div
                            key={product.id}
                            className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{product.name}</span>
                                <a
                                  href={product.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline truncate max-w-[200px]"
                                >
                                  {product.url}
                                </a>
                              </div>
                              {product.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {product.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleScrapeProduct(business.id, product.id)}
                                disabled={scrapingProductId === product.id}
                              >
                                {scrapingProductId === product.id ? 'Scraping...' : 'Scrape Info'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleEditProduct(business.id, product)}
                                disabled={productLoading}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                onClick={() => handleDeleteProduct(business.id, product.id)}
                                disabled={productLoading}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Modal */}
      {showBusinessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingBusiness ? 'Edit Business' : 'Add Business'}
              </h2>
              <form onSubmit={handleBusinessSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name *</label>
                  <input
                    type="text"
                    value={businessForm.name}
                    onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
                    placeholder="Business name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Industry</label>
                  <input
                    type="text"
                    value={businessForm.industry}
                    onChange={(e) => setBusinessForm({ ...businessForm, industry: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
                    placeholder="e.g., Technology, Retail, Healthcare"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={businessForm.description}
                    onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
                    rows={3}
                    placeholder="Brief description of your business"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrimary"
                    checked={businessForm.isPrimary}
                    onChange={(e) => setBusinessForm({ ...businessForm, isPrimary: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <label htmlFor="isPrimary" className="text-sm font-medium cursor-pointer">
                    Set as primary business
                  </label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBusinessModal(false)}
                    disabled={businessLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={businessLoading}>
                    {businessLoading ? 'Saving...' : editingBusiness ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name *</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
                    placeholder="Product name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">URL *</label>
                  <input
                    type="url"
                    value={productForm.url}
                    onChange={(e) => setProductForm({ ...productForm, url: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
                    placeholder="https://example.com/product"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Website URL for the product (used for scraping)
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
                    rows={3}
                    placeholder="Product description (auto-filled by scraping)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional. Use &quot;Scrape Info&quot; to auto-fill from the website.
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowProductModal(false)}
                    disabled={productLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={productLoading}>
                    {productLoading ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
