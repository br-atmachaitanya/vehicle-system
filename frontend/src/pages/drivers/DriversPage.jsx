import { useState, useEffect, useCallback } from 'react'
import { driverApi } from '../../api'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Input from '../../components/ui/Input'
import FormField from '../../components/ui/FormField'
import MasterModal from '../../components/ui/MasterModal'
import { useAuth } from '../../context/AuthContext'

// Drivers are few (22) — no pagination needed
const emptyForm = { code: '', name: '', display_order: 0 }

export default function DriversPage() {
  const [drivers, setDrivers]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [alert, setAlert]       = useState(null)
  const [search, setSearch]     = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCode, setEditingCode] = useState(null)
  const [form, setForm]         = useState(emptyForm)
  const [saving, setSaving]     = useState(false)
  const { user } = useAuth()

  const loadDrivers = useCallback(() => {
    setLoading(true)
    driverApi.list()
      .then(r => setDrivers(r.data))
      .catch(() => setAlert({ message: 'Failed to load drivers.', type: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadDrivers() }, [loadDrivers])

  // Client-side filter — only 22 drivers
  const filtered = drivers.filter(d =>
    d.code.toLowerCase().includes(search.toLowerCase()) ||
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  const openCreateModal = () => {
    setForm(emptyForm)
    setEditingCode(null)
    setModalOpen(true)
  }

  const openEditModal = (driver) => {
    setForm({ code: driver.code, name: driver.name, display_order: driver.display_order })
    setEditingCode(driver.code)
    setModalOpen(true)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingCode) {
        await driverApi.update(editingCode, form)
      } else {
        await driverApi.create(form)
      }
      setModalOpen(false)
      setAlert({
        message: `Driver ${editingCode ? 'updated' : 'created'} successfully.`,
        type: 'success'
      })
      loadDrivers()
    } catch (err) {
      setAlert({
        message: err.response?.data?.detail || 'Failed to save driver.',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (code, name) => {
    if (!window.confirm(`Delete driver "${name}"?`)) return
    driverApi.delete(code)
      .then(() => {
        setAlert({ message: `Driver ${code} deleted.`, type: 'success' })
        loadDrivers()
      })
      .catch(() => setAlert({ message: 'Failed to delete driver.', type: 'error' }))
  }

  return (
    <div className="space-y-4">

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700">
          Driver Master ({filtered.length})
        </h3>
        {user?.is_admin && (
          <Button onClick={openCreateModal}>+ Add Driver</Button>
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
          placeholder="Search drivers..."
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-gray-400">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Driver Name
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  Order
                </th>
                {user?.is_admin && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4}
                      className="px-4 py-6 text-center text-gray-400 text-sm">
                    No drivers found.
                  </td>
                </tr>
              ) : (
                filtered.map((driver, i) => (
                  <tr key={driver.code}
                      className={i % 2 === 0 ? 'hover:bg-gray-50'
                                             : 'bg-gray-50 hover:bg-gray-100'}>
                    <td className="px-4 py-2 font-mono font-medium text-sm">
                      {driver.code}
                    </td>
                    <td className="px-4 py-2">{driver.name}</td>
                    <td className="px-4 py-2 text-right text-xs text-gray-500">
                      {driver.display_order}
                    </td>
                    {user?.is_admin && (
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            className="text-xs px-2 py-1"
                            onClick={() => openEditModal(driver)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            className="text-xs px-2 py-1"
                            onClick={() => handleDelete(driver.code, driver.name)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <MasterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCode ? `Edit Driver — ${editingCode}` : 'Add New Driver'}
      >
        <form onSubmit={handleSave} className="space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Driver Code *">
              <Input
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="e.g. BS"
                maxLength={5}
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

          <FormField label="Full Name *">
            <Input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Driver's full name"
              required
            />
          </FormField>

          <div className="flex gap-3 pt-2 border-t">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingCode ? 'Update Driver' : 'Add Driver'}
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