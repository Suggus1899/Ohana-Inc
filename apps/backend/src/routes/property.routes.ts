import { Router } from 'express';
import { 
  getProperties, 
  getPropertyById, 
  getPropertyCountsByType,
  createProperty, 
  updateProperty, 
  deleteProperty, 
  updatePropertyStatus,
  publishProperty,
  getMyProperties,
  assignModerator,
  getZones,
  getLocationSuggestions,
  searchPropertiesByLocation,
  searchPropertiesNearby,
  autocompleteLocations,
  reverseGeocode,
} from '../controllers/property.controller';
import { authenticate, optionalAuth, requireRole, requireVerificationLevel } from '../middleware/auth.middleware';
import { trackBehavior } from '../middleware/tracking.middleware';
import { uploadPropertyMedia } from '../config/storage.config';

const router = Router();

// Public routes
router.get('/', trackBehavior('search'), getProperties);
router.get('/zones', getZones);
router.get('/location-suggestions', getLocationSuggestions);
router.get('/counts/by-type', getPropertyCountsByType);
router.get('/my', authenticate, requireRole(['admin', 'propietario']), getMyProperties);
router.get('/:id', optionalAuth, trackBehavior('view'), getPropertyById);

// Nuevos endpoints de búsqueda con geocoding
router.get('/search/location', trackBehavior('geocode_search'), searchPropertiesByLocation);
router.get('/search/nearby', trackBehavior('nearby_search'), searchPropertiesNearby);
router.get('/search/autocomplete', trackBehavior('autocomplete'), autocompleteLocations);
router.get('/search/reverse', reverseGeocode);

// Protected routes
router.use(authenticate);

// Creation - requires verification level 4 (Biometry approved) for propietarios
// Temporalmente deshabilitado para permitir publicación sin KYC
router.post(
  '/',
  requireRole(['admin', 'propietario']),
  // requireVerificationLevel(4),
  uploadPropertyMedia,
  createProperty
);

// Publish property
router.post('/:id/publish', requireRole(['admin', 'propietario']), publishProperty);

// Update/Delete (Owner or Admin — role check at route level, ownership in controller)
router.put('/:id', requireRole(['admin', 'propietario']), uploadPropertyMedia, updateProperty);
router.delete('/:id', requireRole(['admin', 'propietario']), deleteProperty);

// Status update (Operator or Admin ONLY)
router.patch('/:id/status', requireRole(['admin', 'operator']), updatePropertyStatus);

// Assign moderator (Admin ONLY)
router.post('/:id/assign', requireRole(['admin']), assignModerator);

export default router;
