/**
 * KYC Verification Metadata Types
 * 
 * Defines the structure of metadata stored in the ocrData JSONB field
 * of kyc_verifications table.
 * 
 * Requirements: 4.4
 */

/**
 * Liveness Analysis Metadata
 * 
 * Stores the result of liveness detection analysis
 */
export interface LivenessAnalysisMetadata {
  isLive: boolean;
  blinkCount: number;
  headMovementRange: number;
  averageFaceConfidence: number;
  framesAnalyzed: number;
  qualityScore: number;
  failureReason?: string;
  timestamp: string;
}

/**
 * Liveness Debug Metadata
 * 
 * Stores detailed debugging information for liveness analysis
 * (optional, for troubleshooting)
 */
export interface LivenessDebugMetadata {
  blinkTimestamps: number[];
  earSequence: number[];
  angleSequence: number[];
}

/**
 * Complete KYC Verification Metadata
 * 
 * Extends the ocrData field with liveness analysis results
 */
export interface KYCVerificationMetadata {
  // OCR fields (existing)
  fullName?: string;
  documentNumber?: string;
  dateOfBirth?: string;
  nationality?: string;
  expirationDate?: string;
  confidence?: number;
  
  // Liveness analysis (new)
  livenessAnalysis?: LivenessAnalysisMetadata;
  
  // Liveness debug data (optional, new)
  livenessDebug?: LivenessDebugMetadata;
  
  // Allow additional fields
  [key: string]: any;
}
