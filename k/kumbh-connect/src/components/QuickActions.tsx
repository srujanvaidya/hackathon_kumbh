import { Button } from '@/components/ui/button';
import { UserPlus, Wallet, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionsProps {
  onRegister: () => void;
  onFund: () => void;
  onCheckBalance: () => void;
}

const QuickActions = ({ onRegister, onFund, onCheckBalance }: QuickActionsProps) => {
  const actions = [
    {
      icon: UserPlus,
      label: 'Register User',
      description: 'Create new user & assign band',
      onClick: onRegister,
      primary: true,
    },
    {
      icon: Wallet,
      label: 'Fund Band',
      description: 'Add money to NFC band',
      onClick: onFund,
      primary: false,
    },
    {
      icon: Search,
      label: 'Check Balance',
      description: 'View band balance & history',
      onClick: onCheckBalance,
      primary: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {actions.map((action, index) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className={cn(
            "flex flex-col items-start p-5 gap-3 rounded-xl border transition-all duration-200",
            "hover:shadow-soft hover:-translate-y-0.5",
            action.primary 
              ? "gradient-saffron text-primary-foreground border-transparent" 
              : "bg-card text-card-foreground border-border hover:border-primary/30"
          )}
        >
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            action.primary ? "bg-primary-foreground/20" : "bg-primary/10"
          )}>
            <action.icon className={cn("w-6 h-6", action.primary ? "" : "text-primary")} />
          </div>
          <div className="text-left">
            <p className="font-semibold">{action.label}</p>
            <p className={cn(
              "text-sm font-normal",
              action.primary ? "opacity-80" : "text-muted-foreground"
            )}>{action.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
