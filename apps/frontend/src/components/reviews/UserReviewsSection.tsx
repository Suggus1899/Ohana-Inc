import { useState, useEffect, useCallback } from 'react';
import { Loader2, MessageSquare, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import api, { UserReview, PropertyReview } from '@/services/api';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';
import { toast } from 'sonner';

interface UserReviewsSectionProps {
  userId: number;
  userName: string;
}

const PAGE_SIZE = 5;

export default function UserReviewsSection({ userId, userName }: UserReviewsSectionProps) {
  const { user } = useAuth();
  const role = user?.role;

  // User reviews state
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Property reviews state (only for propietario)
  const [propReviews, setPropReviews] = useState<PropertyReview[]>([]);
  const [propPage, setPropPage] = useState(1);
  const [propTotalPages, setPropTotalPages] = useState(1);
  const [propTotal, setPropTotal] = useState(0);
  const [propLoading, setPropLoading] = useState(false);

  const isOwner = role === 'propietario';

  const fetchReviews = useCallback(async (pageNum: number, append = false) => {
    setLoading(true);
    try {
      const response = await api.getUserReviews(userId, pageNum, PAGE_SIZE);
      if (response.success && response.data) {
        if (append) {
          setReviews(prev => [...prev, ...response.data!.reviews]);
        } else {
          setReviews(response.data.reviews);
        }
        setTotal(response.data.pagination.total);
        setTotalPages(response.data.pagination.totalPages);
        setPage(pageNum);
      }
    } catch {
      toast.error('No se pudieron cargar las reseñas');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchPropertyReviews = useCallback(async (pageNum: number, append = false) => {
    setPropLoading(true);
    try {
      const response = await api.getOwnerPropertiesReviews(userId, pageNum, PAGE_SIZE);
      if (response.success && response.data) {
        if (append) {
          setPropReviews(prev => [...prev, ...response.data!.reviews]);
        } else {
          setPropReviews(response.data.reviews);
        }
        setPropTotal(response.data.pagination.total);
        setPropTotalPages(response.data.pagination.totalPages);
        setPropPage(pageNum);
      }
    } catch {
      toast.error('No se pudieron cargar las reseñas de propiedades');
    } finally {
      setPropLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchReviews(1);
    if (isOwner) {
      fetchPropertyReviews(1);
    }
  }, [fetchReviews, fetchPropertyReviews, isOwner]);

  const handleEdit = (review: UserReview) => {
    setEditingReviewId(review.id);
  };

  const handleUpdateReview = async (data: { rating: number; comment?: string }) => {
    if (!editingReviewId) return;
    setSubmitting(true);
    try {
      const response = await api.updateUserReview(editingReviewId, data);
      if (response.success) {
        toast.success('Reseña actualizada');
        setEditingReviewId(null);
        fetchReviews(1);
      } else {
        toast.error(response.error?.message || 'No se pudo actualizar la reseña');
      }
    } catch {
      toast.error('No se pudo actualizar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: number) => {
    try {
      const response = await api.deleteUserReview(reviewId);
      if (response.success) {
        toast.success('Reseña eliminada');
        fetchReviews(1);
      } else {
        toast.error(response.error?.message || 'No se pudo eliminar la reseña');
      }
    } catch {
      toast.error('No se pudo eliminar la reseña');
    }
  };

  const hasMore = page < totalPages;
  const hasMoreProp = propPage < propTotalPages;

  const renderReviewList = (
    reviewList: UserReview[],
    loadMore: () => void,
    hasMoreItems: boolean,
    isLoading: boolean
  ) => (
    <div className="space-y-4">
      {reviewList.map((review) => (
        <div key={review.id}>
          {editingReviewId === review.id ? (
            <Card>
              <CardContent className="p-6">
                <ReviewForm
                  targetName={userName}
                  initialRating={review.rating}
                  initialComment={review.comment || ''}
                  onSubmit={handleUpdateReview}
                  onCancel={() => setEditingReviewId(null)}
                  isEditing
                  isLoading={submitting}
                />
              </CardContent>
            </Card>
          ) : (
            <ReviewCard
              review={review}
              type="user"
              isOwner={user?.id === review.reviewerId}
              onEdit={user?.id === review.reviewerId ? () => handleEdit(review) : undefined}
              onDelete={user?.id === review.reviewerId ? () => handleDelete(review.id) : undefined}
            />
          )}
        </div>
      ))}
      {hasMoreItems && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={loadMore} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Cargar más reseñas
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* User Reviews Section */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Reseñas como {isOwner ? 'propietario' : 'usuario'}
            </CardTitle>
            <CardDescription>
              {total} reseña{total !== 1 ? 's' : ''} de otros usuarios
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loading && page === 1 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="font-medium mb-2">Aún no hay reseñas</h4>
              <p className="text-sm text-muted-foreground">
                Aún no has recibido reseñas de otros usuarios
              </p>
            </div>
          ) : (
            renderReviewList(reviews, () => fetchReviews(page + 1, true), hasMore, loading)
          )}
        </CardContent>
      </Card>

      {/* Property Reviews Section - only for propietario */}
      {isOwner && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Home className="h-5 w-5" />
                Reseñas de tus propiedades
              </CardTitle>
              <CardDescription>
                {propTotal} reseña{propTotal !== 1 ? 's' : ''} en tus propiedades
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {propLoading && propPage === 1 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : propReviews.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="font-medium mb-2">Aún no hay reseñas</h4>
                <p className="text-sm text-muted-foreground">
                  Tus propiedades aún no han recibido reseñas
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {propReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    type="property"
                    isOwner={false}
                  />
                ))}
                {hasMoreProp && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => fetchPropertyReviews(propPage + 1, true)}
                      disabled={propLoading}
                    >
                      {propLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Cargar más reseñas
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
