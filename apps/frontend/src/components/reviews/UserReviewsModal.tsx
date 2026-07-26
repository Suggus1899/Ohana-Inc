import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import api, { UserReview, Pagination } from '@/services/api';
import ReviewCard from './ReviewCard';

interface UserReviewsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  userName: string;
  userRole?: string;
}

const UserReviewsModal = ({
  isOpen,
  onOpenChange,
  userId,
  userName,
  userRole,
}: UserReviewsModalProps) => {
  const isOwnerRole = userRole === 'propietario' || userRole === 'admin';
  const [activeTab, setActiveTab] = useState<'owner' | 'tenant' | 'properties'>('owner');
  const [reviews, setReviews] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);

  const fetchReviews = async (reset = false) => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      let response;
      if (activeTab === 'properties') {
        response = await api.getOwnerPropertiesReviews(userId, currentPage, 10);
      } else {
        response = await api.getUserReviews(userId, currentPage, 10, activeTab);
      }

      if (response.success && response.data) {
        const newReviews = (response.data as any).reviews || [];
        if (reset) {
          setReviews(newReviews);
        } else {
          setReviews((prev) => [...prev, ...newReviews]);
        }
        setPagination((response.data as any).pagination || null);
      }
    } catch (error) {
      console.error('Error fetching user reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch when modal opens, tab changes, or page changes
  useEffect(() => {
    if (isOpen) {
      setPage(1);
      fetchReviews(true);
    } else {
      setReviews([]);
      setPagination(null);
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (isOpen && page > 1) {
      fetchReviews(false);
    }
  }, [page]);

  const handleLoadMore = () => {
    if (pagination && page < pagination.pages) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl font-bold">Reseñas de {userName}</DialogTitle>
          <DialogDescription>
            Historial de calificaciones y comentarios recibidos.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'owner' | 'tenant' | 'properties')}
          className="flex-1 flex flex-col min-h-0 mt-4"
        >
          <TabsList className={`grid w-full mb-4 ${isOwnerRole ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="owner">Como Propietario</TabsTrigger>
            <TabsTrigger value="tenant">Como Inquilino</TabsTrigger>
            {isOwnerRole && <TabsTrigger value="properties">De mis Propiedades</TabsTrigger>}
          </TabsList>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0">
            <TabsContent value="owner" className="mt-0 space-y-4 focus-visible:ring-0 focus-visible:outline-none">
              {activeTab === 'owner' && reviews.length > 0 ? (
                reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    type="user"
                    isOwner={false}
                  />
                ))
              ) : activeTab === 'owner' && !isLoading ? (
                <div className="text-center py-12 border rounded-lg border-dashed bg-muted/40">
                  <p className="text-muted-foreground">No hay reseñas todavía como propietario</p>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="tenant" className="mt-0 space-y-4 focus-visible:ring-0 focus-visible:outline-none">
              {activeTab === 'tenant' && reviews.length > 0 ? (
                reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    type="user"
                    isOwner={false}
                  />
                ))
              ) : activeTab === 'tenant' && !isLoading ? (
                <div className="text-center py-12 border rounded-lg border-dashed bg-muted/40">
                  <p className="text-muted-foreground">No hay reseñas todavía como inquilino</p>
                </div>
              ) : null}
            </TabsContent>

            {isOwnerRole && (
              <TabsContent value="properties" className="mt-0 space-y-4 focus-visible:ring-0 focus-visible:outline-none">
                {activeTab === 'properties' && reviews.length > 0 ? (
                  reviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      type="property"
                      isOwner={false}
                    />
                  ))
                ) : activeTab === 'properties' && !isLoading ? (
                  <div className="text-center py-12 border rounded-lg border-dashed bg-muted/40">
                    <p className="text-muted-foreground">No hay reseñas todavía de tus propiedades</p>
                  </div>
                ) : null}
              </TabsContent>
            )}

            {isLoading && (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {pagination && page < pagination.pages && !isLoading && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" onClick={handleLoadMore}>
                  Cargar más reseñas
                </Button>
              </div>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserReviewsModal;
