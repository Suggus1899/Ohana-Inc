import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createPropertyReview,
  getPropertyReviews,
  getMyPropertyReview,
  updatePropertyReview,
  deletePropertyReview,
  createUserReview,
  getUserReviews,
  getUserReviewBetween,
  updateUserReview,
  deleteUserReview,
  getOwnerPropertiesReviews,
} from '../controllers/review.controller';

const router = Router();

// === Property Reviews ===
router.post('/property', authenticate, createPropertyReview);
router.get('/property/:propertyId', getPropertyReviews);
router.get('/property/:propertyId/my', authenticate, getMyPropertyReview);
router.put('/property/:id', authenticate, updatePropertyReview);
router.delete('/property/:id', authenticate, deletePropertyReview);
router.get('/owner-properties/:ownerId', getOwnerPropertiesReviews);

// === User Reviews ===
router.post('/user', authenticate, createUserReview);
router.get('/user/:userId', getUserReviews);
router.get('/user/:userId/between', authenticate, getUserReviewBetween);
router.put('/user/:id', authenticate, updateUserReview);
router.delete('/user/:id', authenticate, deleteUserReview);

export default router;