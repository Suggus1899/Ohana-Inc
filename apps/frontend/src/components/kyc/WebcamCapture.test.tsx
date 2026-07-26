/**
 * Unit tests for WebcamCapture component
 * 
 * Tests component rendering, props handling, and user interactions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WebcamCapture } from './WebcamCapture';

// Mock react-webcam
vi.mock('react-webcam', () => ({
  default: vi.fn(() => null),
}));

// Mock ImageQualityValidator
vi.mock('@/utils/ImageQualityValidator', () => ({
  ImageQualityValidator: {
    validateAll: vi.fn(),
    allValidationsPassed: vi.fn(),
    getErrorMessages: vi.fn(),
  },
}));

describe('WebcamCapture', () => {
  const mockOnCapture = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{
            stop: vi.fn(),
          }],
        }),
      },
      writable: true,
    });
  });

  it('renders with id_front document type', () => {
    render(
      <WebcamCapture
        documentType="id_front"
        onCapture={mockOnCapture}
        onError={mockOnError}
      />
    );

    expect(screen.getByText(/Posiciona el frente de tu cédula dentro del marco/i)).toBeInTheDocument();
  });

  it('renders with id_back document type', () => {
    render(
      <WebcamCapture
        documentType="id_back"
        onCapture={mockOnCapture}
        onError={mockOnError}
      />
    );

    expect(screen.getByText(/Posiciona el reverso de tu cédula dentro del marco/i)).toBeInTheDocument();
  });

  it('renders with selfie document type', () => {
    render(
      <WebcamCapture
        documentType="selfie"
        onCapture={mockOnCapture}
        onError={mockOnError}
      />
    );

    expect(screen.getByText(/Posiciona tu rostro dentro del óvalo/i)).toBeInTheDocument();
  });

  it('renders with selfie_with_doc document type', () => {
    render(
      <WebcamCapture
        documentType="selfie_with_doc"
        onCapture={mockOnCapture}
        onError={mockOnError}
      />
    );

    expect(screen.getByText(/Sostén tu cédula junto a tu rostro dentro del marco/i)).toBeInTheDocument();
  });

  it('uses user facing mode by default', () => {
    const { container } = render(
      <WebcamCapture
        documentType="selfie"
        onCapture={mockOnCapture}
        onError={mockOnError}
      />
    );

    // Component should render without errors
    expect(container).toBeInTheDocument();
  });

  it('accepts custom facing mode', () => {
    const { container } = render(
      <WebcamCapture
        documentType="id_front"
        facingMode="environment"
        onCapture={mockOnCapture}
        onError={mockOnError}
      />
    );

    // Component should render without errors
    expect(container).toBeInTheDocument();
  });

  it('shows capture button initially', async () => {
    render(
      <WebcamCapture
        documentType="selfie"
        onCapture={mockOnCapture}
        onError={mockOnError}
      />
    );

    // Wait for camera to be ready
    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: /capturar/i })).toBeInTheDocument();
    });
  });

  it('handles permission denied error', async () => {
    // Mock permission denied
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error('Permission denied')),
      },
      writable: true,
    });

    render(
      <WebcamCapture
        documentType="selfie"
        onCapture={mockOnCapture}
        onError={mockOnError}
      />
    );

    await vi.waitFor(() => {
      expect(screen.getByText(/Se Requiere Permiso de Cámara/i)).toBeInTheDocument();
    });

    expect(mockOnError).toHaveBeenCalledWith(
      expect.stringContaining('Permiso de cámara denegado')
    );
  });
});
