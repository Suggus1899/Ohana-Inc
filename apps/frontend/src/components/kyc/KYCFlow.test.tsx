/**
 * KYCFlow Component - Unit Tests
 * 
 * Tests for the KYCFlow component functionality.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { KYCFlow } from './KYCFlow';
import { api } from '@/services/api';

// Mock the retry utility to avoid delays in tests
vi.mock('@/utils/retryWithBackoff', () => ({
  retryWithBackoff: vi.fn((fn) => fn()),
}));

// Mock the API service
vi.mock('@/services/api', () => ({
  api: {
    request: vi.fn(),
    getToken: vi.fn(() => 'mock-token'),
  },
}));

// Mock ConsentScreen component
vi.mock('./ConsentScreen', () => ({
  ConsentScreen: ({ onAccept }: { onAccept: (date: Date) => void }) => (
    <div data-testid="consent-screen">
      <button onClick={() => onAccept(new Date())}>Accept Consent</button>
    </div>
  ),
}));

// Mock WebcamCapture component
vi.mock('./WebcamCapture', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  WebcamCapture: ({ onCapture, onError }: any) => (
    <div data-testid="webcam-capture">
      <button onClick={() => onCapture('mock-image-data')}>Capture</button>
      <button onClick={() => onError('Mock error')}>Trigger Error</button>
    </div>
  ),
}));

describe('KYCFlow', () => {
  const mockOnComplete = vi.fn();
  const mockOnError = vi.fn();
  const mockUserId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock successful API responses by default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api.request as any).mockResolvedValue({
      success: true,
      data: { verificationId: 123, status: 'in_progress' },
    });
  });

  it('renders the component with consent step first', async () => {
    render(
      <KYCFlow
        userId={mockUserId}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    // Should show consent screen first
    expect(screen.getByTestId('consent-screen')).toBeInTheDocument();
  });

  it('initializes verification after consent', async () => {
    render(
      <KYCFlow
        userId={mockUserId}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    // Accept consent
    fireEvent.click(screen.getByText('Accept Consent'));

    await waitFor(() => {
      expect(api.request).toHaveBeenCalled();
    });
  });

  it('displays all 6 step indicators after consent', async () => {
    render(
      <KYCFlow
        userId={mockUserId}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    // Accept consent
    fireEvent.click(screen.getByText('Accept Consent'));

    // Check for all step titles in Spanish
    expect(screen.getAllByText('Cédula - Frontal').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cédula - Reverso').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Selfie').length).toBeGreaterThan(0);
    expect(screen.getByText('Selfie con Cédula')).toBeInTheDocument();
    expect(screen.getByText('Detección de Vida')).toBeInTheDocument();
    expect(screen.getByText('Procesando')).toBeInTheDocument();
  });

  it('shows progress bar after consent', async () => {
    render(
      <KYCFlow
        userId={mockUserId}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    // Accept consent
    fireEvent.click(screen.getByText('Accept Consent'));

    // Check for progress text
    expect(screen.getByText(/Paso 1 de 6/i)).toBeInTheDocument();
  });

  it('saves progress to localStorage after consent', async () => {
    render(
      <KYCFlow
        userId={mockUserId}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    // Accept consent
    fireEvent.click(screen.getByText('Accept Consent'));

    await waitFor(() => {
      const savedProgress = localStorage.getItem('kyc-progress');
      expect(savedProgress).toBeTruthy();
    });
  });

  it('restores progress from localStorage and bypasses consent', () => {
    // Set up saved progress
    const savedProgress = {
      userId: mockUserId,
      currentStep: 2,
      verificationId: 123,
      capturedDocuments: {
        idFront: 'mock-data-1',
        idBack: 'mock-data-2',
      },
    };
    localStorage.setItem('kyc-progress', JSON.stringify(savedProgress));

    render(
      <KYCFlow
        userId={mockUserId}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    // Should skip consent and show step 3 (index 2)
    expect(screen.getByText(/Paso 3 de 6/i)).toBeInTheDocument();
  });

  it('handles initialization error', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api.request as any).mockResolvedValueOnce({
      success: false,
      error: { message: 'Initialization failed' },
    });

    render(
      <KYCFlow
        userId={mockUserId}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    // Accept consent
    fireEvent.click(screen.getByText('Accept Consent'));

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
      expect(screen.getByText(/Error desconocido/i)).toBeInTheDocument();
    });
  });

  it('displays error messages', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api.request as any).mockResolvedValueOnce({
      success: false,
      error: { message: 'Test error message' },
    });

    render(
      <KYCFlow
        userId={mockUserId}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    // Accept consent
    fireEvent.click(screen.getByText('Accept Consent'));

    // Check for first step instructions in Spanish
    expect(
      screen.getByText(/Posiciona tu cédula dentro del marco/i)
    ).toBeInTheDocument();
  });

  it('renders WebcamCapture for document steps after consent', async () => {
    render(
      <KYCFlow
        userId={mockUserId}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    // Accept consent
    fireEvent.click(screen.getByText('Accept Consent'));

    await waitFor(() => {
      expect(screen.getByTestId('webcam-capture')).toBeInTheDocument();
    });
  });
});
