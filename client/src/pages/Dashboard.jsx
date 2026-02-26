import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
        <Link to="/vehicles" className="card">Vehicles</Link>
        <Link to="/customers" className="card">Customers</Link>
        <Link to="/bookings" className="card">Bookings</Link>
        <Link to="/calendar" className="card">Calendar</Link>
      </div>
    </div>
  );
}
