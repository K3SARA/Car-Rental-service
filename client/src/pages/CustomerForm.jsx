import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';

export default function CustomerForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', phone: '', nic_or_passport: '', address: '', is_flagged: false, notes: '',
  });
  const [licenseFile, setLicenseFile] = useState(null);

  useEffect(() => {
    if (isEdit) {
      api.get('/customers/' + id).then((r) => {
        setForm({
          name: r.data.name || '',
          phone: r.data.phone || '',
          nic_or_passport: r.data.nic_or_passport || '',
          address: r.data.address || '',
          is_flagged: !!r.data.is_flagged,
          notes: r.data.notes || '',
        });
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isEdit) {
        await api.patch('/customers/' + id, form);
        if (licenseFile) {
          const fd = new FormData();
          fd.append('file', licenseFile);
          fd.append('customer_id', id);
          await api.post('/uploads/license-photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
      } else {
        const { data } = await api.post('/customers', form);
        if (licenseFile) {
          const fd = new FormData();
          fd.append('file', licenseFile);
          fd.append('customer_id', data.id);
          await api.post('/uploads/license-photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
      }
      navigate('/customers');
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{isEdit ? 'Edit Customer' : 'Add Customer'}</h1>
      {error && <p style={{ color: '#c00' }}>{error}</p>}
      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label>Name *</label>
          <input name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>NIC / Passport</label>
          <input name="nic_or_passport" value={form.nic_or_passport} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Address</label>
          <textarea name="address" value={form.address} onChange={handleChange} rows={3} />
        </div>
        <div className="form-group">
          <label>
            <input name="is_flagged" type="checkbox" checked={form.is_flagged} onChange={handleChange} /> Flagged (risky)
          </label>
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} />
        </div>
        <div className="form-group">
          <label>Driving license photo</label>
          <input type="file" accept="image/*" onChange={(e) => setLicenseFile(e.target.files?.[0])} />
        </div>
        <div style={{ marginTop: '1rem' }}>
          <button type="submit" className="btn">Save</button>
          <button type="button" className="btn btn-secondary" style={{ marginLeft: '0.5rem' }} onClick={() => navigate('/customers')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
