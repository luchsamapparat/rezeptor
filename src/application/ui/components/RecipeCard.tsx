import { Badge } from '@rezeptor/ui/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@rezeptor/ui/components/ui/Card';
import { Link } from 'react-router';

interface RecipeCardProps {
  id: string;
  title: string;
  content: string;
  photoUrl?: string;
  pageNumber?: number;
  cookbookTitle?: string;
}

export function RecipeCard({
  id,
  title,
  content,
  photoUrl,
  pageNumber,
  cookbookTitle,
}: RecipeCardProps) {
  const truncatedContent = content.length > 200 ? `${content.substring(0, 200)}...` : content;

  return (
    <Link to={`/recipes/${id}/edit`} className="block">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          {photoUrl && (
            <div className="mb-4 -mt-6 -mx-6">
              <img
                src={photoUrl}
                alt={`Photo of ${title}`}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{truncatedContent}</p>
          <div className="flex gap-2 flex-wrap">
            {pageNumber && (
              <Badge variant="secondary">
                Page
                {' '}
                {pageNumber}
              </Badge>
            )}
            {cookbookTitle && (
              <Badge variant="outline">
                From:
                {' '}
                {cookbookTitle}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
