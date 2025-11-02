import { Button } from '@rezeptor/ui/components/ui/Button';
import { Link } from 'react-router';

interface PageHeaderAction {
  label: string;
  to?: string;
  onClick?: () => void;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
}

interface PageHeaderProps {
  title: string;
  actions?: PageHeaderAction[];
}

export function PageHeader({ title, actions = [] }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      {actions.length > 0 && (
        <div className="flex gap-2">
          {actions.map((action, index) =>
            action.to
              ? (
                  <Button key={index} variant={action.variant || 'default'} asChild>
                    <Link to={action.to}>{action.label}</Link>
                  </Button>
                )
              : (
                  <Button
                    key={index}
                    variant={action.variant || 'default'}
                    onClick={action.onClick}
                  >
                    {action.label}
                  </Button>
                ))}
        </div>
      )}
    </div>
  );
}
