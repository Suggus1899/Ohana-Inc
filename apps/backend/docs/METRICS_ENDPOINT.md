# Metrics Endpoint Documentation

## Overview

This document describes the implementation of the GET `/api/kyc/admin/metrics` endpoint as specified in task 29.2 and requirement 33.11.

## Endpoint Details

### Route
```
GET /api/kyc/admin/metrics
```

### Authentication
- **Required**: Yes (JWT Bearer token)
- **Role Required**: `operator`

### Query Parameters
- `dateFrom` (optional): Start date for filtering metrics (ISO 8601 format)
- `dateTo` (optional): End date for filtering metrics (ISO 8601 format)

**Note**: Date filtering is not yet implemented in the MetricsService. This is marked as a TODO for future enhancement.

### Response Format

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "verificationMetrics": {
      "averageCompletionTime": 24.5,
      "approvalRate": 75.5,
      "rejectionRate": 24.5,
      "totalVerifications": 100,
      "approvedCount": 75,
      "rejectedCount": 25
    },
    "rejectionReasons": [
      {
        "reason": "Documento ilegible",
        "count": 10,
        "percentage": 40
      }
    ],
    "operatorMetrics": [
      {
        "operatorId": 2,
        "averageReviewTime": 2.5,
        "totalReviews": 50,
        "approvedCount": 40,
        "rejectedCount": 10
      }
    ],
    "pendingMetrics": {
      "pendingCount": 15,
      "oldestPendingDate": "2024-01-01T00:00:00.000Z",
      "averageWaitTime": 12.5
    },
    "componentSuccessRates": {
      "faceMatchSuccessRate": 85.5,
      "livenessSuccessRate": 90.2,
      "ocrSuccessRate": 95.0,
      "totalAttempts": 200,
      "faceMatchSuccessCount": 171,
      "livenessSuccessCount": 180,
      "ocrSuccessCount": 190
    },
    "fraudScoreDistribution": [
      {
        "range": "0-10",
        "count": 50,
        "percentage": 50
      }
    ],
    "generatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses

**401 Unauthorized**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No token provided"
  }
}
```

**403 Forbidden**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Solo operadores pueden acceder a las métricas"
  }
}
```

## Implementation Details

### Files Modified

1. **apps/backend/src/controllers/kyc.controller.ts**
   - Added `getMetrics` function
   - Imports `MetricsService`
   - Validates authentication and operator role
   - Calls `metricsService.getAllMetrics()`

2. **apps/backend/src/routes/kyc.routes.ts**
   - Added route: `router.get('/admin/metrics', authenticate, requireRole(['operator']), getMetrics)`
   - Imported `getMetrics` function

3. **apps/backend/tests/controllers/kyc.controller.test.ts**
   - Added test suite for `getMetrics`
   - Tests authentication validation
   - Tests operator role validation
   - Tests successful metrics retrieval

4. **apps/backend/tests/integration/metrics-endpoint.test.ts**
   - Created integration test file
   - Tests endpoint without authentication

### Metrics Provided

The endpoint returns aggregated metrics from the `MetricsService`:

1. **Verification Metrics** (Req 33.1-33.3)
   - Average completion time
   - Approval rate
   - Rejection rate

2. **Rejection Reasons** (Req 33.4)
   - Most common rejection reasons with counts and percentages

3. **Operator Metrics** (Req 33.5)
   - Average review time per operator
   - Total reviews, approvals, and rejections per operator

4. **Pending Metrics** (Req 33.6)
   - Count of pending verifications
   - Oldest pending verification date
   - Average wait time

5. **Component Success Rates** (Req 33.7-33.9)
   - Face match success rate
   - Liveness detection success rate
   - OCR success rate

6. **Fraud Score Distribution** (Req 33.10)
   - Distribution of fraud scores in 10-point ranges

## Usage Example

### Using cURL
```bash
curl -X GET \
  http://localhost:3000/api/kyc/admin/metrics \
  -H 'Authorization: Bearer REDACTED'
```

### Using JavaScript/TypeScript
```typescript
const response = await fetch('/api/kyc/admin/metrics', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.data.verificationMetrics);
```

## Future Enhancements

1. **Date Range Filtering**: Implement filtering by `dateFrom` and `dateTo` in the `MetricsService`
2. **Caching**: Add caching layer for metrics to improve performance
3. **Real-time Updates**: Consider WebSocket support for real-time metrics updates
4. **Export Functionality**: Add ability to export metrics as CSV or PDF

## Requirements Satisfied

- ✅ **Requisito 33.11**: Endpoint provides aggregated metrics dashboard
- ✅ Authentication validation (JWT)
- ✅ Operator role validation
- ✅ Returns all aggregated metrics
- ⚠️ Date range filtering (TODO - not yet implemented in MetricsService)

## Testing

Run the tests with:
```bash
npm test -- kyc.controller.test.ts --testNamePattern="getMetrics"
```

Or run all tests:
```bash
npm test
```
