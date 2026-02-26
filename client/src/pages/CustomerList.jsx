import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = search ? '?search=' + encodeURIComponent(search) : '';
    api.get('/customers' + q).then((r) => setCustomers(r.data));
  }, [search]);

  return (
    <div>
      <h1>Customers</h1>
      <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ marginBottom: 0, flex: '1 1 200px' }}>
          <label>Search (name, phone, NIC)</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
        </div>
        <Link to="/customers/new" className="btn">Add Customer</Link>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>NIC / Passport</th>
              <th>Flagged</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.nic_or_passport}</td>
                <td>{c.is_flagged ? 'Yes' : 'No'}</td>
                <td><Link to={'/customers/' + c.id + '/edit'}>Edit</Link> | <Link to={'/bookings?customer_id=' + c.id}>History</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
