/// <reference types="jest" />
// Jest setup file
import dotenv from 'dotenv';
dotenv.config();

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.ENCRYPTION_KEY = 'REDACTED';

// Increase timeout for property tests
jest.setTimeout(30000);

// Mock native dependencies to bypass compilation issues in test environments
jest.mock('canvas', () => ({
  Canvas: class {},
  Image: class {},
  ImageData: class {},
  loadImage: jest.fn(),
}), { virtual: true });

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
