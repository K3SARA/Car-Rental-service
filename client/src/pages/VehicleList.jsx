import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [filter, setFilter] = useState({ status: '', vehicle_type: '' });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.status) params.set('status', filter.status);
    if (filter.vehicle_type) params.set('vehicle_type', filter.vehicle_type);
    api.get('/vehicles?' + params).then((r) => setVehicles(r.data));
  }, [filter.status, filter.vehicle_type]);

  return (
    <div>
      <h1>Vehicles</h1>
      <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Status</label>
          <select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}>
            <option value="">All</option>
            <option value="available">Available</option>
            <option value="rented">Rented</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Type</label>
          <select value={filter.vehicle_type} onChange={(e) => setFilter((f) => ({ ...f, vehicle_type: e.target.value }))}>
            <option value="">All</option>
            <option value="car">Car</option>
            <option value="van">Van</option>
            <option value="bike">Bike</option>
            <option value="tuk_tuk">Tuk-tuk</option>
          </select>
        </div>
        <Link to="/vehicles/new" className="btn">Add Vehicle</Link>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Registration</th>
              <th>Type</th>
              <th>Brand / Model</th>
              <th>Year</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td>{v.registration_number}</td>
                <td>{v.vehicle_type}</td>
                <td>{v.brand} {v.model}</td>
                <td>{v.year}</td>
                <td><span className={'badge badge-' + v.status}>{v.status}</span></td>
                <td><Link to={'/vehicles/' + v.id + '/edit'}>Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
