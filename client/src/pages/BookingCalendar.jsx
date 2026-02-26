import { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../api/client';
import { Link } from 'react-router-dom';

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { 'en-US': enUS } });

function toTime(t) {
  if (!t) return '00:00';
  if (typeof t === 'string') return t.length >= 5 ? t.slice(0, 5) : t;
  return '00:00';
}

export default function BookingCalendar() {
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [availabilityForm, setAvailabilityForm] = useState(() => {
    const today = new Date();
    return {
      start_date: format(today, 'yyyy-MM-dd'),
      start_time: '09:00',
      return_date: format(addDays(today, 1), 'yyyy-MM-dd'),
      return_time: '18:00',
    };
  });
  const [availabilityError, setAvailabilityError] = useState('');
  const [freeVehicles, setFreeVehicles] = useState([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    api.get('/bookings').then((r) => setBookings(r.data));
    api.get('/vehicles').then((r) => setVehicles(r.data));
  }, []);

  const events = useMemo(() => {
    return bookings
      .filter((b) => b.status !== 'cancelled')
      .map((b) => ({
        id: b.id,
        title: (b.registration_number || '') + ' – ' + (b.customer_name || ''),
        start: new Date(b.start_date + 'T' + toTime(b.start_time)),
        end: new Date(b.return_date + 'T' + toTime(b.return_time)),
        resourceId: b.vehicle_id,
        status: b.status,
      }));
  }, [bookings]);

  const resources = useMemo(() => {
    return vehicles.map((v) => ({ id: v.id, title: v.registration_number + ' ' + (v.model || '') }));
  }, [vehicles]);

  const handleAvailabilityChange = (e) => {
    const { name, value } = e.target;
    setAvailabilityForm((f) => ({ ...f, [name]: value }));
  };

  const handleCheckAvailability = async () => {
    setAvailabilityError('');
    setChecking(true);
    try {
      const { start_date, start_time, return_date, return_time } = availabilityForm;
      const start = new Date(`${start_date}T${start_time}`);
      const end = new Date(`${return_date}T${return_time}`);
      if (!start_date || !start_time || !return_date || !return_time || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        setAvailabilityError('Please choose a valid start and return date/time');
        setChecking(false);
        return;
      }
      if (end <= start) {
        setAvailabilityError('Return must be after start');
        setChecking(false);
        return;
      }
      const params = new URLSearchParams(availabilityForm);
      const { data } = await api.get('/bookings/availability?' + params.toString());
      const ids = data.free_vehicle_ids || [];
      setFreeVehicles(vehicles.filter((v) => ids.includes(v.id)));
    } catch (err) {
      setAvailabilityError(err.response?.data?.error || 'Could not check availability');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      <h1>Vehicle Availability Calendar</h1>
      <p><Link to="/bookings/new" className="btn">New Booking</Link></p>
      <div className="card calendar-card">
        <Calendar
          localizer={localizer}
          events={events}
          resources={resources.length ? resources : undefined}
          resourceIdAccessor="id"
          resourceTitleAccessor="title"
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          onSelectEvent={(e) => (window.location.href = '/bookings/' + e.id)}
          eventPropGetter={(event) => {
            let className = '';
            if (event.status === 'reserved') className = 'event-reserved';
            else if (event.status === 'active') className = 'event-active';
            else if (event.status === 'completed') className = 'event-completed';
            else if (event.status === 'cancelled') className = 'event-cancelled';
            return { className };
          }}
          views={['month', 'week', 'day']}
          defaultView="week"
        />
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        <h2>Find free vehicles for a period</h2>
        {availabilityError && <p style={{ color: '#c00' }}>{availabilityError}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label>Start date</label>
            <input name="start_date" type="date" value={availabilityForm.start_date} onChange={handleAvailabilityChange} />
          </div>
          <div className="form-group">
            <label>Start time</label>
            <input name="start_time" type="time" value={availabilityForm.start_time} onChange={handleAvailabilityChange} />
          </div>
          <div className="form-group">
            <label>Return date</label>
            <input name="return_date" type="date" value={availabilityForm.return_date} onChange={handleAvailabilityChange} />
          </div>
          <div className="form-group">
            <label>Return time</label>
            <input name="return_time" type="time" value={availabilityForm.return_time} onChange={handleAvailabilityChange} />
          </div>
        </div>
        <button type="button" className="btn" style={{ marginTop: '0.75rem' }} onClick={handleCheckAvailability} disabled={checking}>
          {checking ? 'Checking...' : 'Show free vehicles'}
        </button>
        <div style={{ marginTop: '1rem' }}>
          {freeVehicles.length === 0 ? (
            <p>No free vehicles found for this period (or none loaded yet).</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Registration</th>
                  <th>Type</th>
                  <th>Brand / Model</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {freeVehicles.map((v) => (
                  <tr key={v.id}>
                    <td>{v.registration_number}</td>
                    <td>{v.vehicle_type}</td>
                    <td>{v.brand} {v.model}</td>
                    <td><span className={'badge badge-' + v.status}>{v.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
