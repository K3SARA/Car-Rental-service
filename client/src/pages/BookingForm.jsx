import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';

export default function BookingForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    vehicle_id: '', customer_id: '', start_date: '', start_time: '', return_date: '', return_time: '',
  });

  useEffect(() => {
    api.get('/vehicles').then((r) => setVehicles(r.data));
    api.get('/customers').then((r) => setCustomers(r.data));
    if (isEdit) {
      api.get('/bookings/' + id).then((r) => {
        const b = r.data;
        setForm({
          vehicle_id: b.vehicle_id,
          customer_id: b.customer_id,
          start_date: b.start_date ? b.start_date.slice(0, 10) : '',
          start_time: b.start_time ? (typeof b.start_time === 'string' ? b.start_time.slice(0, 5) : '09:00') : '09:00',
          return_date: b.return_date ? b.return_date.slice(0, 10) : '',
          return_time: b.return_time ? (typeof b.return_time === 'string' ? b.return_time.slice(0, 5) : '18:00') : '18:00',
        });
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { start_date, start_time, return_date, return_time } = form;
    const start = new Date(`${start_date}T${start_time}`);
    const end = new Date(`${return_date}T${return_time}`);
    if (!start_date || !start_time || !return_date || !return_time || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError('Please enter a valid start and return date/time');
      return;
    }
    if (end <= start) {
      setError('Return must be after start');
      return;
    }
    try {
      if (isEdit) {
        await api.patch('/bookings/' + id, form);
      } else {
        await api.post('/bookings', form);
      }
      navigate('/bookings');
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{isEdit ? 'Edit Booking' : 'New Booking'}</h1>
      {error && <p style={{ color: '#c00' }}>{error}</p>}
      <form onSubmit={handleSubmit} className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label>Vehicle *</label>
            <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange} required>
              <option value="">Select vehicle</option>
              {vehicles.filter((v) => v.status === 'available' || isEdit).map((v) => (
                <option key={v.id} value={v.id}>{v.registration_number} – {v.brand} {v.model}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Customer *</label>
            <select name="customer_id" value={form.customer_id} onChange={handleChange} required>
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} – {c.phone}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Start date *</label>
            <input name="start_date" type="date" value={form.start_date} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Start time *</label>
            <input name="start_time" type="time" value={form.start_time} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Return date *</label>
            <input name="return_date" type="date" value={form.return_date} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Return time *</label>
            <input name="return_time" type="time" value={form.return_time} onChange={handleChange} required />
          </div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <button type="submit" className="btn">Save</button>
          <button type="button" className="btn btn-secondary" style={{ marginLeft: '0.5rem' }} onClick={() => navigate('/bookings')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
