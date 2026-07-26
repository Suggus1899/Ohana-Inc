# KYC Components

This directory contains React components for the KYC (Know Your Customer) identity verification flow.

## Components

### WebcamCapture

A React component for capturing images using the device's webcam. Supports document capture (ID front/back) and selfie capture with built-in quality validation.

#### Features

- **Camera Permission Handling**: Automatically requests camera permissions on mount
- **Visual Guides**: Shows rectangle guides for documents and oval guides for faces
- **Mirrored View**: Displays mirrored view for selfies to help with positioning
- **Quality Validation**: Validates image resolution (min 800x600) and brightness (50-200 range)
- **Preview & Retake**: Allows users to preview captured images and retake if needed
- **JPEG Compression**: Captures images in JPEG format with 90% quality
- **Error Handling**: Gracefully handles permission denied and camera errors
- **Camera Stream Management**: Automatically releases camera stream after capture

#### Props

```typescript
interface WebcamCaptureProps {
  documentType: 'id_front' | 'id_back' | 'selfie' | 'selfie_with_doc';
  facingMode?: 'user' | 'environment'; // Default: 'user'
  onCapture: (imageData: string) => void;
  onError: (error: string) => void;
}
```

#### Usage

```tsx
import { WebcamCapture } from '@/components/kyc';

function MyComponent() {
  const handleCapture = (imageData: string) => {
    console.log('Image captured:', imageData);
    // Upload to backend or process further
  };

  const handleError = (error: string) => {
    console.error('Capture error:', error);
    // Show error to user
  };

  return (
    <WebcamCapture
      documentType="id_front"
      facingMode="environment"
      onCapture={handleCapture}
      onError={handleError}
    />
  );
}
```

#### Document Types

- **id_front**: Front of ID card (uses rectangle guide, environment camera)
- **id_back**: Back of ID card (uses rectangle guide, environment camera)
- **selfie**: User's face (uses oval guide, user-facing camera, mirrored)
- **selfie_with_doc**: User holding ID next to face (uses oval guide, user-facing camera, mirrored)

#### Quality Validation

The component uses `ImageQualityValidator` to validate:

1. **Resolution**: Minimum 800x600 pixels
2. **Brightness**: Range 50-200 (0-255 scale)

If validation fails, the user sees specific error messages and can retake the photo.

#### Camera Permissions

The component handles three permission states:

1. **Granted**: Camera stream is active, user can capture
2. **Denied**: Shows permission required message with instructions
3. **Prompt**: Browser shows permission dialog automatically

#### Error Handling

The component handles various error scenarios:

- Camera permission denied
- Camera hardware not available
- Image capture failure
- Quality validation failure
- Webcam initialization errors

All errors are reported via the `onError` callback with descriptive messages.

#### Accessibility

- Uses semantic HTML elements
- Provides clear visual instructions
- Shows validation feedback with icons
- Keyboard accessible buttons
- Screen reader friendly error messages

#### Requirements Mapping

This component implements the following requirements from the KYC specification:

- **4.1-4.12**: Document capture with webcam
- **6.1-6.10**: Selfie capture with quality validation
- **27.1-27.13**: Camera permission handling and error management

#### Dependencies

- `react-webcam`: Webcam access and image capture
- `lucide-react`: Icons for UI elements
- `@/components/ui/button`: Button component
- `@/components/ui/alert`: Alert component for validation messages
- `@/utils/ImageQualityValidator`: Image quality validation utility

#### Testing

Unit tests are available in `WebcamCapture.test.tsx`. Run tests with:

```bash
npm test -- WebcamCapture.test.tsx
```

#### Examples

See `WebcamCapture.example.tsx` for complete usage examples including:

- Basic ID capture
- Selfie capture
- Complete KYC flow with multiple steps
- Custom error handling and retry logic

---

### KYCFlow

Main orchestrator component for the complete KYC verification flow. Manages a 6-step process with progress tracking, localStorage persistence, and automatic document upload.

#### Features

- **6-Step Flow**: ID front, ID back, selfie, selfie with doc, liveness, processing
- **Progress Bar**: Visual progress indicator with step status (completed/current/pending)
- **Step Indicators**: Color-coded step circles (green=completed, blue=current, gray=pending)
- **localStorage Persistence**: Automatically saves and restores progress
- **Forward-Only Navigation**: Users can only move forward through steps
- **Automatic Upload**: Documents are uploaded immediately after capture
- **Retry Logic**: Exponential backoff retry for failed uploads (max 3 attempts)
- **Upload Progress**: Shows upload progress indicator
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Responsive Design**: Works on desktop and mobile devices

#### Props

```typescript
interface KYCFlowProps {
  userId: number;
  onComplete: () => void;
  onError: (error: Error) => void;
}
```

#### Usage

```tsx
import { KYCFlow } from '@/components/kyc';

function VerificationPage() {
  const { user } = useAuth(); // Get user from auth context

  const handleComplete = () => {
    console.log('Verification completed!');
    // Navigate to success page or refresh user data
    navigate('/verification-success');
  };

  const handleError = (error: Error) => {
    console.error('Verification error:', error);
    // Show error notification
    toast.error(error.message);
  };

  return (
    <KYCFlow
      userId={user.id}
      onComplete={handleComplete}
      onError={handleError}
    />
  );
}
```

#### Flow Steps

1. **ID Front (Step 0)**: Capture front of ID card with environment camera
2. **ID Back (Step 1)**: Capture back of ID card with environment camera
3. **Selfie (Step 2)**: Capture face photo with user-facing camera
4. **Selfie with Doc (Step 3)**: Capture selfie holding ID with user-facing camera
5. **Liveness (Step 4)**: Video recording for liveness detection (placeholder - to be implemented)
6. **Processing (Step 5)**: Backend processes all documents and performs validation

#### Progress Persistence

The component automatically saves progress to localStorage with key `'kyc-progress'`. Progress includes:

- Current step number
- Verification ID
- Captured documents (base64 data)
- User ID

Progress is restored when the component mounts, allowing users to continue from where they left off.

#### Upload Process

For each captured document:

1. User captures image with WebcamCapture
2. Image is validated for quality
3. Image is converted to Blob
4. FormData is created with verificationId, documentType, and file
5. Document is uploaded to `/api/kyc/upload`
6. Upload progress is shown to user
7. On success, move to next step
8. On failure, retry up to 3 times with exponential backoff

#### Error Handling

The component handles various error scenarios:

- **Initialization Failure**: Failed to start verification
- **Upload Failure**: Network errors, server errors
- **Processing Failure**: Backend validation errors
- **Permission Errors**: Camera permission denied (handled by WebcamCapture)

All errors are displayed in a red alert banner and reported via the `onError` callback.

#### API Integration

The component uses the following API endpoints:

- `POST /api/kyc/start`: Initialize verification, get verificationId
- `POST /api/kyc/upload`: Upload document (multipart/form-data)
- `POST /api/kyc/process/:verificationId`: Process all documents

#### State Management

The component manages the following state:

- `currentStep`: Current step number (0-5)
- `verificationId`: Verification ID from backend
- `capturedDocuments`: Object storing captured images
- `isProcessing`: Boolean for processing state
- `isUploading`: Boolean for upload state
- `error`: Error message string
- `uploadProgress`: Upload progress percentage (0-100)
- `retryCount`: Number of retry attempts

#### Requirements Mapping

This component implements the following requirements:

- **26.1-26.12**: Complete KYC flow with progress tracking
- **30.1-30.11**: Document upload with retry logic

#### Styling

The component uses Tailwind CSS and shadcn/ui components:

- `Card`: Container for sections
- `Progress`: Progress bar
- `Button`: Action buttons
- `Alert`: Error and info messages
- `lucide-react`: Icons (Check, Circle, Loader2, AlertCircle)

#### Examples

See `KYCFlow.example.tsx` for complete usage examples including:

- Basic integration
- Integration with auth context
- Modal/dialog usage
- Progress persistence demonstration
- Complete integration with routing and error handling

#### Testing

Unit tests will be added in `KYCFlow.test.tsx`. Run tests with:

```bash
npm test -- KYCFlow.test.tsx
```

---

## Future Components

The following components will be added to this directory:

- **LivenessCapture**: Video recording component for liveness detection (Task 22)
- **KYCReviewPanel**: Operator panel for reviewing verifications (Task 23)
- **DocumentReview**: Component for reviewing captured documents before submission
- **VerificationStatus**: Component showing verification progress and status

## Installation

The KYC components require the following dependencies:

```bash
npm install react-webcam
```

All other dependencies (shadcn/ui components, lucide-react) should already be installed.

## Environment Variables

Configure the API URL in `.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

## API Requirements

The backend must implement the following endpoints:

- `POST /api/kyc/start`: Start verification
- `POST /api/kyc/upload`: Upload document (multipart/form-data)
- `POST /api/kyc/process/:verificationId`: Process verification
- `GET /api/kyc/status`: Get verification status

See the backend KYC specification for detailed API documentation.

## Browser Compatibility

The components require:

- Modern browser with WebRTC support (Chrome, Firefox, Safari, Edge)
- Camera access permission
- JavaScript enabled
- localStorage support

## Security Considerations

- Documents are transmitted over HTTPS
- Images are validated before upload
- Backend encrypts documents with AES-256-GCM
- Progress data in localStorage does not contain sensitive information
- JWT authentication required for all API calls

## Troubleshooting

### Camera not working

- Check browser permissions
- Ensure HTTPS connection (required for camera access)
- Try different browser
- Check if camera is being used by another application

### Upload failing

- Check network connection
- Verify API URL is correct
- Check backend logs for errors
- Ensure JWT token is valid

### Progress not saving

- Check localStorage is enabled
- Check browser storage quota
- Clear localStorage and try again

## Support

For issues or questions, please contact the development team or create an issue in the project repository.
