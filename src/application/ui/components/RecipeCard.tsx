import { Badge } from '@rezeptor/ui/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@rezeptor/ui/components/ui/Card';
import { Link } from 'react-router';

interface RecipeCardProps {
  id: string;
  title: string;
  instructions: string;
  ingredients: Array<{
    quantity: string | null;
    unit: string | null;
    name: string;
    notes: string | null;
  }>;
  photoUrl?: string;
  pageNumber?: number;
  cookbookTitle?: string;
}

export function RecipeCard({
  id,
  title,
  instructions,
  ingredients,
  photoUrl,
  pageNumber,
  cookbookTitle,
}: RecipeCardProps) {
  const truncatedInstructions = instructions.length > 150 ? `${instructions.substring(0, 150)}...` : instructions;
  const ingredientSummary = ingredients.length > 0
    ? `${ingredients.length} ingredient${ingredients.length === 1 ? '' : 's'}`
    : 'No ingredients listed';

  return (
    <Link to={`/admin/recipes/${id}/edit`} className="block">
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
          <div className="text-muted-foreground mb-2 text-sm">
            <strong>{ingredientSummary}</strong>
          </div>
          <p className="text-muted-foreground mb-4">{truncatedInstructions}</p>
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
