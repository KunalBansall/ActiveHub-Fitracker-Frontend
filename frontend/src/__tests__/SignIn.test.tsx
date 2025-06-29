// src/__tests__/SignIn.test.tsx

import { render, screen } from '@testing-library/react';
import SignIn from '../pages/SignIn';

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  // Mock process.env for tests
  process.env = {
    ...originalEnv,
    VITE_API_URL: 'http://localhost:3000'
  };
});

afterEach(() => {
  // Restore original process.env
  process.env = originalEnv;
});

test('renders sign in page title', () => {
  render(<SignIn />);
  expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
});
