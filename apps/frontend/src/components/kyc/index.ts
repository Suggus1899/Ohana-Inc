/**
 * KYC Components
 * 
 * Export all KYC-related components for the identity verification flow.
 */

export { WebcamCapture } from './WebcamCapture';
export type { WebcamCaptureProps, DocumentType } from './WebcamCapture';

export { KYCFlow, KYCStep } from './KYCFlow';
export type { KYCFlowProps } from './KYCFlow';

export { LivenessCapture } from './LivenessCapture';
export type { LivenessCaptureProps } from './LivenessCapture';

export { ConsentScreen } from './ConsentScreen';
export type { ConsentScreenProps } from './ConsentScreen';

export { default as KYCReviewPanel } from './KYCReviewPanel';

export { VerificationBadge } from './VerificationBadge';

export { VerificationRestrictionAlert } from './VerificationRestrictionAlert';

export { KYCErrorBoundary } from './KYCErrorBoundary';
