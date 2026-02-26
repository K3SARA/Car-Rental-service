import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard.jsx';

test('renders main dashboard links', () => {
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );

  expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  expect(screen.getByText(/Vehicles/i)).toBeInTheDocument();
  expect(screen.getByText(/Customers/i)).toBeInTheDocument();
  expect(screen.getByText(/Bookings/i)).toBeInTheDocument();
  expect(screen.getByText(/Calendar/i)).toBeInTheDocument();
});

