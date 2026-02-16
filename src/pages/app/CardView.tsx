import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { cardApi, CardWithUserDetails } from '@/modules/cards/services/cardApi';
import { toast } from 'sonner';
import { toNumber } from '@/lib/utils';
import { format } from 'date-fns';
import { Edit } from 'lucide-react';

export default function CardView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState<CardWithUserDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    cardApi.get(id)
      .then(setCard)
      .catch(() => toast.error('Failed to load card'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !card) {
    return (
      <div>
        <PageHeader title="Card" backUrl="/admin/cards" />
        <p className="text-muted-foreground py-8">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Card ${card.card_number}`}
        backUrl="/admin/cards"
        actions={
          <Button onClick={() => navigate(`/admin/cards/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        }
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Card Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Card Number</span>
            <span className="font-mono font-medium">{card.card_number}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">User</span>
            <span className="font-medium">
              {card.user_details?.name || card.user_details?.phone || card.user || '—'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Balance</span>
            <span className="font-medium">Rs. {toNumber(card.balance, 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Status</span>
            <StatusBadge status={card.is_active ? 'active' : 'inactive'} />
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Created</span>
            <span className="text-sm">{format(new Date(card.created_at), 'PPpp')}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Updated</span>
            <span className="text-sm">{format(new Date(card.updated_at), 'PPpp')}</span>
          </div>
        </CardContent>
      </Card>
      <div className="mt-4">
        <Button variant="outline" onClick={() => navigate('/admin/cards')}>Back to Cards</Button>
      </div>
    </div>
  );
}
