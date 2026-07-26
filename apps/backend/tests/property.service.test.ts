/// <reference types="jest" />
import { PropertyService } from '../src/services/property.service';
import Property from '../src/models/Property';
import Favorite from '../src/models/Favorite';
import PropertyView from '../src/models/PropertyView';
import { mediaProcessingService } from '../src/services/media-processing.service';

jest.mock('../src/models/Property');
jest.mock('../src/models/Favorite');
jest.mock('../src/models/PropertyView');
jest.mock('../src/services/media-processing.service', () => ({
  mediaProcessingService: {
    processImages: jest.fn(),
    processVideo: jest.fn(),
    toPublicUrl: jest.fn((p: string) => '/' + p),
  },
}));

const MockProperty = Property as jest.Mocked<typeof Property>;
const MockFavorite = Favorite as jest.Mocked<typeof Favorite>;
const MockPropertyView = PropertyView as jest.Mocked<typeof PropertyView>;
const MockMedia = mediaProcessingService as jest.Mocked<typeof mediaProcessingService>;

const makeProperty = (overrides: Partial<any> = {}): any => ({
  id: 1,
  authorId: 10,
  title: 'Test Property',
  status: 'pending',
  images: [],
  videoUrl: null,
  update: jest.fn().mockResolvedValue(undefined),
  increment: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('PropertyService', () => {
  let service: PropertyService;

  beforeEach(() => {
    service = new PropertyService();
    jest.clearAllMocks();
  });

  // ─── createProperty ───────────────────────────────────────────────────────

  describe('createProperty', () => {
    it('crea propiedad sin multimedia (borrador)', async () => {
      const mockProp = makeProperty();
      (MockProperty.create as jest.Mock).mockResolvedValue(mockProp);

      const result = await service.createProperty({
        authorId: 10,
        title: 'Casa en Caracas',
        description: 'Desc',
        type: 'Casa',
        listingType: 'Alquiler',
        price: 500,
        priceType: 'monthly',
        lat: 10.5, lng: -66.9,
        address: 'Dirección', location: 'Caracas',
        city: 'Caracas', state: 'Miranda', zipCode: '1060',
        bedrooms: 3, bathrooms: 2, area: 100,
        furnished: false, features: [],
      });

      expect(result).toBe(mockProp);
      expect(MockProperty.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending', authorId: 10 })
      );
    });

    it('procesa imágenes y las guarda al crear', async () => {
      const mockProp = makeProperty({ update: jest.fn().mockResolvedValue(undefined) });
      (MockProperty.create as jest.Mock).mockResolvedValue(mockProp);
      MockMedia.processImages.mockResolvedValue({
        processedPaths: ['uploads/properties/images/img-1.webp'],
        thumbnailPaths: ['uploads/properties/thumbnails/img-1-thumb.webp'],
      });

      await service.createProperty({
        authorId: 10, title: 'Casa', description: 'Desc', type: 'Casa',
        listingType: 'Alquiler', price: 500, priceType: 'monthly',
        lat: 10.5, lng: -66.9, address: 'Dir', location: 'Loc',
        city: '', state: '', zipCode: '',
        bedrooms: 2, bathrooms: 1, area: 80, furnished: false, features: [],
        imagePaths: ['tmp/image1.jpg'],
      });

      expect(MockMedia.processImages).toHaveBeenCalledWith(['tmp/image1.jpg']);
      expect(MockProperty.create).toHaveBeenCalledWith(
        expect.objectContaining({ images: ['/uploads/properties/images/img-1.webp'] })
      );
    });
  });

  // ─── publishProperty ──────────────────────────────────────────────────────

  describe('publishProperty', () => {
    it('publica correctamente con 5+ imágenes y video', async () => {
      const mockProp = makeProperty({
        images: ['a', 'b', 'c', 'd', 'e'],
        videoUrl: '/uploads/video.mp4',
        update: jest.fn().mockResolvedValue(undefined),
      });
      (MockProperty.findByPk as jest.Mock).mockResolvedValue(mockProp);

      await service.publishProperty(1, 10);

      expect(mockProp.update).toHaveBeenCalledWith({ status: 'approved' });
    });

    it('lanza error si tiene menos de 5 imágenes', async () => {
      const mockProp = makeProperty({
        images: ['a', 'b'],
        videoUrl: '/video.mp4',
      });
      (MockProperty.findByPk as jest.Mock).mockResolvedValue(mockProp);

      await expect(service.publishProperty(1, 10)).rejects.toThrow(
        'Se requieren mínimo 5 imágenes'
      );
    });

    it('lanza error si no hay video', async () => {
      const mockProp = makeProperty({
        images: ['a', 'b', 'c', 'd', 'e'],
        videoUrl: null,
      });
      (MockProperty.findByPk as jest.Mock).mockResolvedValue(mockProp);

      await expect(service.publishProperty(1, 10)).rejects.toThrow(
        'Se requiere exactamente 1 video'
      );
    });

    it('lanza error si el propietario no es el dueño', async () => {
      const mockProp = makeProperty({ authorId: 99 });
      (MockProperty.findByPk as jest.Mock).mockResolvedValue(mockProp);

      await expect(service.publishProperty(1, 10)).rejects.toThrow('No autorizado');
    });

    it('lanza error si la propiedad está alquilada o vendida', async () => {
      const mockProp = makeProperty({ status: 'rented' });
      (MockProperty.findByPk as jest.Mock).mockResolvedValue(mockProp);

      await expect(service.publishProperty(1, 10)).rejects.toThrow('no es editable');
    });

    it('lanza error si la propiedad no existe', async () => {
      (MockProperty.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(service.publishProperty(999, 10)).rejects.toThrow('no encontrada');
    });
  });

  // ─── getOwnerProperties ───────────────────────────────────────────────────

  describe('getOwnerProperties', () => {
    it('devuelve propiedades del propietario paginadas', async () => {
      const mockRows = [makeProperty(), makeProperty({ id: 2 })];
      (MockProperty.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockRows,
        count: 2,
      });

      const result = await service.getOwnerProperties(10, 1, 12);

      expect(result.count).toBe(2);
      expect(MockProperty.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { authorId: 10 }, limit: 12, offset: 0 })
      );
    });
  });

  // ─── updateProperty ───────────────────────────────────────────────────────

  describe('updateProperty', () => {
    it('actualiza propiedad si el propietario es correcto', async () => {
      const mockProp = makeProperty();
      (MockProperty.findByPk as jest.Mock).mockResolvedValue(mockProp);

      await service.updateProperty(1, 10, { title: 'Nuevo título' });

      expect(mockProp.update).toHaveBeenCalledWith({ title: 'Nuevo título' });
    });

    it('rechaza actualización si no es el dueño', async () => {
      (MockProperty.findByPk as jest.Mock).mockResolvedValue(makeProperty({ authorId: 99 }));

      await expect(service.updateProperty(1, 10, {})).rejects.toThrow('No autorizado');
    });
  });

  // ─── favoritos ────────────────────────────────────────────────────────────

  describe('favorites', () => {
    it('agrega a favoritos si la propiedad existe', async () => {
      (MockProperty.findByPk as jest.Mock).mockResolvedValue(makeProperty());
      (MockFavorite.findOrCreate as jest.Mock).mockResolvedValue([{}, true]);

      await service.addToFavorites(5, 1);

      expect(MockFavorite.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 5, propertyId: 1 } })
      );
    });

    it('lanza error al agregar favorito si propiedad no existe', async () => {
      (MockProperty.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(service.addToFavorites(5, 999)).rejects.toThrow('no encontrada');
    });

    it('elimina de favoritos', async () => {
      (MockFavorite.destroy as jest.Mock).mockResolvedValue(1);

      await service.removeFromFavorites(5, 1);

      expect(MockFavorite.destroy).toHaveBeenCalledWith({ where: { userId: 5, propertyId: 1 } });
    });
  });

  // ─── getPropertyById ──────────────────────────────────────────────────────

  describe('getPropertyById', () => {
    it('incrementa vistas al obtener propiedad', async () => {
      const mockProp = makeProperty();
      (MockProperty.findByPk as jest.Mock).mockResolvedValue(mockProp);
      (MockPropertyView.findOrCreate as jest.Mock).mockResolvedValue([{}, true]);

      await service.getPropertyById(1, 5);

      expect(mockProp.increment).toHaveBeenCalledWith('views');
    });

    it('lanza error si no existe', async () => {
      (MockProperty.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(service.getPropertyById(999)).rejects.toThrow('no encontrada');
    });
  });
});
