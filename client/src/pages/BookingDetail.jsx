import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';

function toTime(t) {
  if (!t) return '';
  if (typeof t === 'string') return t.slice(0, 5);
  return t;
}

export default function BookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState({ amount: '', method: 'cash' });

  useEffect(() => {
    api.get('/bookings/' + id).then((r) => setBooking(r.data));
  }, [id]);

  const calculateTotal = () => {
    if (!booking) return null;
    const v = booking;
    const daily = parseFloat(v.daily_rate) || 0;
    const hourly = parseFloat(v.hourly_rate) || 0;
    const distRate = parseFloat(v.distance_rate_per_km) || 0;
    const start = new Date(v.start_date + 'T' + toTime(v.start_time));
    const end = new Date(v.return_date + 'T' + toTime(v.return_time));
    const hours = (end - start) / (1000 * 60 * 60);
    const days = Math.floor(hours / 24);
    const extraHours = hours % 24;
    let total = days * daily + extraHours * hourly;
    if (v.mileage_before != null && v.mileage_after != null && distRate > 0) {
      total += (v.mileage_after - v.mileage_before) * distRate;
    }
    return Math.round(total * 100) / 100;
  };

  const refetch = () => api.get('/bookings/' + id).then((r) => setBooking(r.data));

  const handleUpdateTotal = async () => {
    const total = calculateTotal();
    if (total == null) return;
    setError('');
    try {
      await api.patch('/bookings/' + id, { total_amount: total });
      refetch();
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amount = parseFloat(payment.amount);
    if (!amount || amount <= 0) return;
    setError('');
    try {
      const paid = (parseFloat(booking.paid_amount) || 0) + amount;
      const payment_status = paid >= (parseFloat(booking.total_amount) || 0) ? 'paid' : 'partial';
      await api.patch('/bookings/' + id, { paid_amount: paid, payment_status, payment_method: payment.method });
      setPayment({ amount: '', method: 'cash' });
      refetch();
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed');
    }
  };

  const handleStatusChange = async (status) => {
    setError('');
    try {
      const payload = { status };
      if (status === 'completed') {
        const ma = booking.mileage_after;
        const mb = booking.mileage_before;
        if (ma != null) payload.mileage_after = ma;
        if (mb != null) payload.mileage_before = mb;
      }
      await api.patch('/bookings/' + id, payload);
      refetch();
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    }
  };

  const handleMileageSave = async () => {
    setError('');
    try {
      await api.patch('/bookings/' + id, { mileage_before: booking.mileage_before, mileage_after: booking.mileage_after });
      refetch();
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    }
  };

  if (!booking) return <div>Loading...</div>;

  const total = booking.total_amount != null ? parseFloat(booking.total_amount) : calculateTotal();
  const paid = parseFloat(booking.paid_amount) || 0;
  const due = total != null ? total - paid : null;

  return (
    <div>
      <h1>Booking</h1>
      {error && <p style={{ color: '#c00' }}>{error}</p>}
      <div className="card">
        <p><strong>Vehicle:</strong> {booking.registration_number} – {booking.brand} {booking.model}</p>
        <p><strong>Customer:</strong> {booking.customer_name} – {booking.customer_phone}</p>
        <p><strong>Start:</strong> {booking.start_date} {toTime(booking.start_time)}</p>
        <p><strong>Return:</strong> {booking.return_date} {toTime(booking.return_time)}</p>
        <p><strong>Status:</strong> <span className={'badge badge-' + booking.status}>{booking.status}</span></p>
        <p><strong>Mileage:</strong> Before {booking.mileage_before ?? '–'} / After {booking.mileage_after ?? '–'}</p>
        <div style={{ marginTop: '0.5rem' }}>
          <input type="number" placeholder="Mileage before" value={booking.mileage_before ?? ''} onChange={(e) => setBooking((b) => ({ ...b, mileage_before: e.target.value || null }))} />
          <input type="number" placeholder="Mileage after" value={booking.mileage_after ?? ''} onChange={(e) => setBooking((b) => ({ ...b, mileage_after: e.target.value || null }))} style={{ marginLeft: '0.5rem' }} />
          <button type="button" className="btn btn-secondary" style={{ marginLeft: '0.5rem' }} onClick={handleMileageSave}>Save mileage</button>
        </div>
        <hr />
        <p><strong>Total:</strong> {total != null ? total : '–'} {booking.total_amount == null && <button type="button" className="btn" onClick={handleUpdateTotal}>Calculate</button>}</p>
        <p><strong>Paid:</strong> {paid} | <strong>Due:</strong> {due != null ? due : '–'}</p>
        <p><strong>Payment status:</strong> {booking.payment_status} | Method: {booking.payment_method || '–'}</p>
        <form onSubmit={handleRecordPayment} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
          <input type="number" step="0.01" placeholder="Amount" value={payment.amount} onChange={(e) => setPayment((p) => ({ ...p, amount: e.target.value }))} />
          <select value={payment.method} onChange={(e) => setPayment((p) => ({ ...p, method: e.target.value }))}>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank transfer</option>
          </select>
          <button type="submit" className="btn">Record payment</button>
        </form>
        <hr />
        <div style={{ marginTop: '0.5rem' }}>
          {booking.status === 'reserved' && <button type="button" className="btn" onClick={() => handleStatusChange('active')}>Mark Active</button>}
          {booking.status === 'active' && <button type="button" className="btn" onClick={() => handleStatusChange('completed')}>Mark Completed</button>}
          {(booking.status === 'reserved' || booking.status === 'active') && <button type="button" className="btn btn-danger" style={{ marginLeft: '0.5rem' }} onClick={() => handleStatusChange('cancelled')}>Cancel</button>}
        </div>
      </div>
      <div className="card">
        <h3>Invoice / Receipt</h3>
        <div id="invoice-print">
          <p>Vehicle: {booking.registration_number} – {booking.brand} {booking.model}</p>
          <p>Customer: {booking.customer_name}, {booking.customer_phone}</p>
          <p>Period: {booking.start_date} {toTime(booking.start_time)} to {booking.return_date} {toTime(booking.return_time)}</p>
          <p>Total: {total != null ? total : '–'}</p>
          <p>Paid: {paid}</p>
          <p>Balance: {due != null ? due : '–'}</p>
        </div>
        <button type="button" className="btn" onClick={() => window.print()}>Print</button>
      </div>
      <p><Link to="/bookings">Back to list</Link> | <Link to={'/bookings/' + id + '/edit'}>Edit</Link></p>
    </div>
  );
}
