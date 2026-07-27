/// <reference types="jest" />
// Jest setup file
import dotenv from 'dotenv';
dotenv.config();

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.ENCRYPTION_KEY = 'REDACTED';
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test_dummy_key';

// Increase timeout for property tests
jest.setTimeout(30000);

// Mock native dependencies to bypass compilation issues in test environments
// Note: canvas is installed and works, so we don't mock it here.
// Tests that need canvas (e.g., liveness-detection) use the real implementation.
jest.mock('@tensorflow/tfjs-node', () => ({}), { virtual: true });
jest.mock('@vladmandic/face-api', () => ({
  env: { monkeyPatch: jest.fn() },
  nets: {
    ssdMobilenetv1: { loadFromDisk: jest.fn() },
    faceLandmark68Net: { loadFromDisk: jest.fn() }
  },
  detectSingleFace: jest.fn().mockReturnThis(),
  withFaceLandmarks: jest.fn()
}), { virtual: true });

// Mock Resend to avoid real API calls and missing API key errors
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'mock-email-id' }),
    },
  })),
}));
