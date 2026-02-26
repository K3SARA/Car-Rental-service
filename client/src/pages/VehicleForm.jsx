import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';

export default function VehicleForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    registration_number: '', vehicle_type: 'car', model: '', brand: '', year: '',
    fuel_type: '', transmission: '', mileage: 0, insurance_expiry: '', license_expiry: '',
    status: 'available', daily_rate: '', hourly_rate: '', distance_rate_per_km: '',
  });
  const [photoFile, setPhotoFile] = useState(null);

  useEffect(() => {
    if (isEdit) {
      api.get('/vehicles/' + id).then((r) => {
        const v = r.data;
        setForm({
          registration_number: v.registration_number || '',
          vehicle_type: v.vehicle_type || 'car',
          model: v.model || '',
          brand: v.brand || '',
          year: v.year ?? '',
          fuel_type: v.fuel_type || '',
          transmission: v.transmission || '',
          mileage: v.mileage ?? 0,
          insurance_expiry: v.insurance_expiry ? v.insurance_expiry.slice(0, 10) : '',
          license_expiry: v.license_expiry ? v.license_expiry.slice(0, 10) : '',
          status: v.status || 'available',
          daily_rate: v.daily_rate ?? '',
          hourly_rate: v.hourly_rate ?? '',
          distance_rate_per_km: v.distance_rate_per_km ?? '',
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
    const payload = { ...form, year: form.year ? parseInt(form.year, 10) : null, mileage: parseInt(form.mileage, 10) || 0 };
    if (!form.insurance_expiry) payload.insurance_expiry = null;
    if (!form.license_expiry) payload.license_expiry = null;
    try {
      if (isEdit) {
        await api.patch('/vehicles/' + id, payload);
      } else {
        const { data } = await api.post('/vehicles', payload);
        if (photoFile) {
          const fd = new FormData();
          fd.append('file', photoFile);
          fd.append('vehicle_id', data.id);
          await api.post('/uploads/vehicle-photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
      }
      navigate('/vehicles');
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</h1>
      {error && <p style={{ color: '#c00' }}>{error}</p>}
      <form onSubmit={handleSubmit} className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label>Registration number *</label>
            <input name="registration_number" value={form.registration_number} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select name="vehicle_type" value={form.vehicle_type} onChange={handleChange}>
              <option value="car">Car</option>
              <option value="van">Van</option>
              <option value="bike">Bike</option>
              <option value="tuk_tuk">Tuk-tuk</option>
            </select>
          </div>
          <div className="form-group">
            <label>Brand</label>
            <input name="brand" value={form.brand} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Model</label>
            <input name="model" value={form.model} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Year</label>
            <input name="year" type="number" min="1980" max="2100" value={form.year} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Fuel type</label>
            <input name="fuel_type" value={form.fuel_type} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Transmission</label>
            <input name="transmission" value={form.transmission} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Mileage</label>
            <input name="mileage" type="number" min="0" value={form.mileage} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Insurance expiry</label>
            <input name="insurance_expiry" type="date" value={form.insurance_expiry} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>License expiry</label>
            <input name="license_expiry" type="date" value={form.license_expiry} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div className="form-group">
            <label>Daily rate</label>
            <input name="daily_rate" type="number" min="0" step="0.01" value={form.daily_rate} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Hourly rate</label>
            <input name="hourly_rate" type="number" min="0" step="0.01" value={form.hourly_rate} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Distance rate per km</label>
            <input name="distance_rate_per_km" type="number" min="0" step="0.01" value={form.distance_rate_per_km} onChange={handleChange} />
          </div>
          {!isEdit && (
            <div className="form-group">
              <label>Photo</label>
              <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0])} />
            </div>
          )}
        </div>
        <div style={{ marginTop: '1rem' }}>
          <button type="submit" className="btn">Save</button>
          <button type="button" className="btn btn-secondary" style={{ marginLeft: '0.5rem' }} onClick={() => navigate('/vehicles')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
