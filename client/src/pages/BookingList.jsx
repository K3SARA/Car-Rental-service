import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';

export default function BookingList() {
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customer_id') || '';
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState({ status: '', vehicle_id: '', customer_id: customerId });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.status) params.set('status', filter.status);
    if (filter.vehicle_id) params.set('vehicle_id', filter.vehicle_id);
    if (filter.customer_id) params.set('customer_id', filter.customer_id);
    api.get('/bookings?' + params).then((r) => setBookings(r.data));
  }, [filter.status, filter.vehicle_id, filter.customer_id]);

  return (
    <div>
      <h1>Bookings</h1>
      <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Status</label>
          <select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}>
            <option value="">All</option>
            <option value="reserved">Reserved</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Customer ID</label>
          <input placeholder="UUID" value={filter.customer_id} onChange={(e) => setFilter((f) => ({ ...f, customer_id: e.target.value }))} />
        </div>
        <Link to="/bookings/new" className="btn">New Booking</Link>
        <Link to="/calendar" className="btn btn-secondary">Calendar</Link>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Customer</th>
              <th>Start</th>
              <th>Return</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>{b.registration_number} {b.brand} {b.model}</td>
                <td>{b.customer_name} {b.customer_phone}</td>
                <td>{b.start_date} {b.start_time}</td>
                <td>{b.return_date} {b.return_time}</td>
                <td><span className={'badge badge-' + b.status}>{b.status}</span></td>
                <td>{b.payment_status} {b.paid_amount != null && '(' + b.paid_amount + ')'}</td>
                <td><Link to={'/bookings/' + b.id}>View</Link> | <Link to={'/bookings/' + b.id + '/edit'}>Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
