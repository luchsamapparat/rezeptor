import { Badge } from '@rezeptor/ui/components/ui/Badge';
import { Button } from '@rezeptor/ui/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@rezeptor/ui/components/ui/Card';
import { Trash2 } from 'lucide-react';
import { Link } from 'react-router';

interface CookbookCardProps {
  id: string;
  title: string;
  authors: string[];
  isbn10?: string | null;
  isbn13?: string | null;
  onRemove?: (id: string) => void | Promise<void>;
  isRemoving?: boolean;
}

export function CookbookCard({
  id,
  title,
  authors,
  isbn10,
  isbn13,
  onRemove,
  isRemoving = false,
}: CookbookCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-muted-foreground text-sm">
          by
          {' '}
          {authors.join(', ')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 flex-wrap mb-4">
          {isbn10 && (
            <Badge variant="secondary">
              ISBN-10:
              {' '}
              {isbn10}
            </Badge>
          )}
          {isbn13 && (
            <Badge variant="outline">
              ISBN-13:
              {' '}
              {isbn13}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="default" size="sm">
            <Link to={id}>View Details</Link>
          </Button>
          {onRemove && (
            <Button
              onClick={() => onRemove(id)}
              disabled={isRemoving}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {isRemoving ? 'Removing...' : 'Remove'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
