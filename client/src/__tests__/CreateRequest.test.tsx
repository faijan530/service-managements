import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreateRequest from '../pages/CreateRequest';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    token: 'fake-token'
  })
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('CreateRequest Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create request form correctly', () => {
    renderWithRouter(<CreateRequest />);
    
    expect(screen.getByText('Create New Request')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create request/i })).toBeInTheDocument();
  });

  it('handles AI analysis click and population', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        summary: 'Summarized description',
        suggestedCategory: 'SOFTWARE',
        suggestedPriority: 'HIGH'
      }
    });

    renderWithRouter(<CreateRequest />);

    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    
    fireEvent.change(titleInput, { target: { value: 'Fix my PC' } });
    fireEvent.change(descriptionInput, { target: { value: 'It is broken and wont turn on.' } });

    const aiButton = screen.getByRole('button', { name: /analyze with ai/i });
    fireEvent.click(aiButton);

    expect(aiButton).toHaveTextContent(/analyzing/i);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/ai/analyze-request',
        { title: 'Fix my PC', description: 'It is broken and wont turn on.' },
        expect.any(Object)
      );
    });
  });
});
