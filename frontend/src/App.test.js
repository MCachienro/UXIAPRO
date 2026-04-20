import { render, screen } from '@testing-library/react';
import axios from 'axios';
import App from './App';

jest.mock('axios');

test('renders expo search input', async () => {
  axios.get.mockResolvedValueOnce({
    data: [{ id: 1, nom: 'Expo Test', descripcio: null, estat: 'INIT' }],
  });

  render(<App />);
  const headerElement = screen.getByText(/uxia expos/i);
  expect(headerElement).toBeInTheDocument();

  const searchInput = await screen.findByLabelText(/buscador d/i);
  expect(searchInput).toBeInTheDocument();
  expect(searchInput.value).toBe('');
});
