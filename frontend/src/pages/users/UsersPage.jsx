import { useState, useEffect, useCallback } from 'react'
import { userApi, creditAccountApi } from '../../api'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Input from '../../components/ui/Input'
import FormField from '../../components/ui/FormField'
import MasterModal from '../../components/ui/MasterModal'
import Pagination from '../../components/ui/Pagination'
import SearchableSelect from '../../components/ui/SearchableSelect'
import { useAuth } from '../../context/AuthContext'

const PAGE_SIZE = 20

const emptyForm = {
  code: '', formal_name: '', common_name: '',
  rate_per_km: 0, is_independent_centre: false,
  preferred_credit_code: '', display_order: 0,
}

export default function UsersPage() {
  const [users, setUsers]                   = useState([])
  const [filtered, setFiltered]             = useState([])
  const [creditAccounts, setCreditAccounts] = useState([])
  const [loading, setLoading]               = useState(false)
  const [alert, setAlert]                   = useState(null)
  const [search, setSearch]                 = useState('')
  const [page, setPage]                     = useState(1)
  const [modalOpen, setModalOpen]           = useState(false)
  const [editingCode, setEditingCode]       = useState(null)
  const [form, setForm]                     = useState(emptyForm)
  const [saving, setSaving]                 = useState(false)
  const { user: currentUser } = useAuth()

  const loadUsers = useCallback(() => {
    setLoading(true)
    userApi.list()
      .then(r => { setUsers(r.data); setFiltered(r.data) })
      .catch(() => setAlert({ message: 'Failed to load users.', type: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  useEffect(() => {
    creditAccountApi.list().then(r => setCreditAccounts(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      users.filter(u =>
        u.code.toLowerCase().includes(q) ||
        u.formal_name.toLowerCase().includes(q) ||
        (u.common_name || '').toLowerCase().includes(q)
      )
    )
    setPage(1)
  }, [search, users])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openCreateModal = () => {
    setForm(emptyForm)
    setEditingCode(null)
    setModalOpen(true)
  }

  const openEditModal = (u) => {
    setForm({
      code:                  u.code,
      formal_name:           u.formal_name,
      common_name:           u.common_name || '',
      rate_per_km:           u.rate_per_km || 0,
      is_independent_centre: u.is_independent_centre || false,
      preferred_credit_code: u.preferred_credit_code || '',
      display_order:         u.display_order || 0,
    })
    setEditingCode(u.code)
    setModalOpen(true)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingCode) {
        await userApi.update(editingCode, form)
      } else {
        await userApi.create(form)
      }
      setModalOpen(false)
      setAlert({
        message: `User ${editingCode ? 'updated' : 'created'} successfully.`,
        type: 'success'
      })
      loadUsers()
    } catch (err) {
      setAlert({
        message: err.response?.data?.detail || 'Failed to save user.',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (code, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return
    userApi.delete(code)
      .then(() => {
        setAlert({ message: `User ${code} deleted.`, type: 'success' })
        loadUsers()
      })
      .catch(() => setAlert({ message: 'Failed to delete user.', type: 'error' }))
  }

  const creditOptions = creditAccounts.map(c => ({ value: c.code, label: c.name }))

  return (
    <div className="space-y-4">

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700">
          User / Passenger Master
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({filtered.length} of {users.length})
          </span>
        </h3>
        {currentUser?.is_admin && (
          <Button onClick={openCreateModal}>+ Add User</Button>
        )}
      </div>

      {alert && (
        <Alert message={alert.message} type={alert.type}
               onClose={() => setAlert(null)} />
      )}

      <div className="bg-white rounded-lg shadow-sm p-3">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by code or name..."
          autoFocus
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-gray-400">Loading users...</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Formal Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Common Name</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Rate/KM</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Credit A/C</th>
                  {currentUser?.is_admin && (
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
                      No users match your search.
                    </td>
                  </tr>
                ) : (
                  pageData.map((u, i) => (
                    <tr key={u.code}
                        className={i % 2 === 0 ? 'hover:bg-gray-50'
                                               : 'bg-gray-50 hover:bg-gray-100'}>
                      <td className="px-4 py-2 font-mono text-xs">{u.code}</td>
                      <td className="px-4 py-2 text-sm">{u.formal_name}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {u.common_name || '—'}
                      </td>
                      <td className="px-4 py-2 text-right text-xs">
                        {u.rate_per_km > 0 ? `₹${u.rate_per_km}` : '—'}
                      </td>
                      <td className="px-4 py-2 text-xs font-mono">
                        {u.preferred_credit_code || '—'}
                      </td>
                      {currentUser?.is_admin && (
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              className="text-xs px-2 py-1"
                              onClick={() => openEditModal(u)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              className="text-xs px-2 py-1"
                              onClick={() => handleDelete(u.code, u.formal_name)}
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

            <div className="px-4 py-3 border-t border-gray-100">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <MasterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCode ? `Edit User — ${editingCode}` : 'Add New User'}
      >
        <form onSubmit={handleSave} className="space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <FormField label="User Code *">
              <Input
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="e.g. 0001"
                maxLength={4}
                required
                disabled={Boolean(editingCode)}
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

          <FormField label="Formal Name *">
            <Input
              name="formal_name"
              value={form.formal_name}
              onChange={handleChange}
              placeholder="e.g. REV.SW.PRABHANANDAJI"
              required
            />
          </FormField>

          <FormField label="Common Name">
            <Input
              name="common_name"
              value={form.common_name}
              onChange={handleChange}
              placeholder="e.g. Prabhanandaji"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Special Rate per KM (₹)">
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
                placeholder="Select..."
              />
            </FormField>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="user_indep"
              name="is_independent_centre"
              checked={form.is_independent_centre}
              onChange={handleChange}
              className="h-4 w-4 rounded text-blue-600"
            />
            <label htmlFor="user_indep" className="text-sm text-gray-700">
              Independent Centre
            </label>
          </div>

          <div className="flex gap-3 pt-2 border-t">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingCode ? 'Update User' : 'Add User'}
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