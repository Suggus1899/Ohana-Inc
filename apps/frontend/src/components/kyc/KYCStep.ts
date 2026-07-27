/**
 * KYC verification flow step indices.
 *
 * Extracted to its own module so KYCFlow.tsx only exports a component
 * (keeps react-refresh/only-export-components happy and Fast Refresh working).
 */

export enum KYCStep {
  ID_FRONT = 0,
  ID_BACK = 1,
  SELFIE = 2,
  SELFIE_WITH_DOC = 3,
  LIVENESS = 4,
  PROCESSING = 5,
}
