import { useState, useEffect, useCallback } from 'react'
import { accountApi } from '../../api'
import { creditAccountApi } from '../../api'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Input from '../../components/ui/Input'
import FormField from '../../components/ui/FormField'
import MasterModal from '../../components/ui/MasterModal'
import Pagination from '../../components/ui/Pagination'
import SearchableSelect from '../../components/ui/SearchableSelect'
import { useAuth } from '../../context/AuthContext'

const PAGE_SIZE = 20   // accounts per page — 352 total needs pagination

const emptyForm = {
  code: '', name: '', rate_per_km: 0,
  is_independent_centre: false,
  preferred_credit_code: '',
  display_order: 0,
}

export default function AccountsPage() {
  const [accounts, setAccounts]           = useState([])
  const [filtered, setFiltered]           = useState([])  // after client-side search
  const [creditAccounts, setCreditAccounts] = useState([])
  const [loading, setLoading]             = useState(false)
  const [alert, setAlert]                 = useState(null)
  const [search, setSearch]               = useState('')
  const [page, setPage]                   = useState(1)
  const [modalOpen, setModalOpen]         = useState(false)
  const [editingCode, setEditingCode]     = useState(null) // null = creating new
  const [form, setForm]                   = useState(emptyForm)
  const [saving, setSaving]               = useState(false)
  const { user } = useAuth()

  const loadAccounts = useCallback(() => {
    setLoading(true)
    accountApi.list()
      .then(r => {
        setAccounts(r.data)
        setFiltered(r.data)
      })
      .catch(() => setAlert({ message: 'Failed to load accounts.', type: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadAccounts() }, [loadAccounts])

  useEffect(() => {
    creditAccountApi.list()
      .then(r => setCreditAccounts(r.data))
      .catch(() => {})
  }, [])

  // Client-side search — filter already-loaded accounts
  // Better UX than server-side for 352 records (all loaded at once)
  useEffect(() => {
    const q = search.toLowerCase()
    const results = accounts.filter(a =>
      a.code.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q)
    )
    setFiltered(results)
    setPage(1)  // reset to first page on new search
  }, [search, accounts])

  // Paginate filtered results
  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openCreateModal = () => {
    setForm(emptyForm)
    setEditingCode(null)
    setModalOpen(true)
  }

  const openEditModal = (account) => {
    setForm({
      code:                  account.code,
      name:                  account.name,
      rate_per_km:           account.rate_per_km || 0,
      is_independent_centre: account.is_independent_centre || false,
      preferred_credit_code: account.preferred_credit_code || '',
      display_order:         account.display_order || 0,
    })
    setEditingCode(account.code)
    setModalOpen(true)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingCode) {
        await accountApi.update(editingCode, form)
      } else {
        await accountApi.create(form)
      }
      setModalOpen(false)
      setAlert({
        message: `Account ${editingCode ? 'updated' : 'created'} successfully.`,
        type: 'success'
      })
      loadAccounts()
    } catch (err) {
      setAlert({
        message: err.response?.data?.detail || 'Failed to save account.',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (code, name) => {
    if (!window.confirm(`Delete account "${name}" (${code})? This cannot be undone.`))
      return
    accountApi.delete(code)
      .then(() => {
        setAlert({ message: `Account ${code} deleted.`, type: 'success' })
        loadAccounts()
      })
      .catch(() => setAlert({ message: 'Failed to delete account.', type: 'error' }))
  }

  const creditOptions = creditAccounts.map(c => ({ value: c.code, label: c.name }))

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700">
          Account Master
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({filtered.length} of {accounts.length})
          </span>
        </h3>
        {user?.is_admin && (
          <Button onClick={openCreateModal}>+ Add Account</Button>
        )}
      </div>

      {alert && (
        <Alert message={alert.message} type={alert.type}
               onClose={() => setAlert(null)} />
      )}

      {/* Search bar */}
      <div className="bg-white rounded-lg shadow-sm p-3">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by code or name... (type to filter all 352 accounts)"
          autoFocus
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-gray-400">Loading accounts...</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Account Name
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                    Rate/KM
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Credit A/C
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Indep.
                  </th>
                  {user?.is_admin && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageData.length === 0 ? (
                  <tr>
                    <td colSpan={6}
                        className="px-4 py-6 text-center text-gray-400 text-sm">
                      No accounts match your search.
                    </td>
                  </tr>
                ) : (
                  pageData.map((account, i) => (
                    <tr key={account.code}
                        className={i % 2 === 0 ? 'hover:bg-gray-50'
                                               : 'bg-gray-50 hover:bg-gray-100'}>
                      <td className="px-4 py-2 font-mono text-xs font-medium">
                        {account.code}
                      </td>
                      <td className="px-4 py-2 text-sm">{account.name}</td>
                      <td className="px-4 py-2 text-right text-xs">
                        {account.rate_per_km > 0 ? `₹${account.rate_per_km}` : '—'}
                      </td>
                      <td className="px-4 py-2 text-xs font-mono">
                        {account.preferred_credit_code || '—'}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {account.is_independent_centre ? '✓' : ''}
                      </td>
                      {user?.is_admin && (
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              className="text-xs px-2 py-1"
                              onClick={() => openEditModal(account)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              className="text-xs px-2 py-1"
                              onClick={() => handleDelete(account.code, account.name)}
                            >
                              Del
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-100">
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <MasterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCode ? `Edit Account — ${editingCode}` : 'Add New Account'}
      >
        <form onSubmit={handleSave} className="space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Account Code *">
              <Input
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="e.g. 2101"
                maxLength={4}
                required
                disabled={Boolean(editingCode)}  // can't change code when editing
              />
            </FormField>
            <FormField label="Display Order">
              <Input
                type="number"
                name="display_order"
                value={form.display_order}
                onChange={handleChange}
                min={0}
              />
            </FormField>
          </div>

          <FormField label="Account Name *">
            <Input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full account name"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Rate per KM (₹)">
              <Input
                type="number"
                name="rate_per_km"
                value={form.rate_per_km}
                onChange={handleChange}
                min={0}
                step="0.01"
              />
            </FormField>
            <FormField label="Preferred Credit Account">
              <SearchableSelect
                options={creditOptions}
                value={form.preferred_credit_code}
                onChange={v => setForm(f => ({ ...f, preferred_credit_code: v }))}
                placeholder="Select credit A/C..."
              />
            </FormField>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="indep"
              name="is_independent_centre"
              checked={form.is_independent_centre}
              onChange={handleChange}
              className="h-4 w-4 rounded text-blue-600"
            />
            <label htmlFor="indep" className="text-sm text-gray-700">
              Independent Centre
            </label>
          </div>

          <div className="flex gap-3 pt-2 border-t">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingCode ? 'Update Account' : 'Add Account'}
            </Button>
            <Button type="button" variant="secondary"
                    onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>

        </form>
      </MasterModal>
    </div>
  )
}