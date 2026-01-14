import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  highlight?: boolean;
}

const StatsCard = ({ title, value, icon: Icon, trend, highlight = false }: StatsCardProps) => {
  return (
    <div 
      className={cn(
        'rounded-xl p-4 border transition-all duration-200',
        highlight 
          ? 'gradient-saffron text-primary-foreground border-transparent' 
          : 'bg-card border-border'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            'text-xs font-medium mb-1',
            highlight ? 'opacity-80' : 'text-muted-foreground'
          )}>
            {title}
          </p>
          <p className="text-xl font-bold">{value}</p>
          {trend && (
            <p className={cn(
              'text-xs mt-1',
              highlight ? 'opacity-80' : 'text-success'
            )}>
              {trend}
            </p>
          )}
        </div>
        <div className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center',
          highlight ? 'bg-primary-foreground/20' : 'bg-primary/10'
        )}>
          <Icon className={cn('w-4 h-4', highlight ? '' : 'text-primary')} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
