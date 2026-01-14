import { NFCUser } from '@/types/nfc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, CreditCard, User, Phone, IndianRupee, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsersListProps {
  users: NFCUser[];
  onToggleBlock: (bandId: string) => void;
  onFund: (bandId: string) => void;
  onDelete?: (bandId: string) => void;
  showDelete?: boolean;
}

const UsersList = ({ users, onToggleBlock, onFund, onDelete, showDelete }: UsersListProps) => {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Registered Users
        </h2>
        <Badge variant="secondary" className="bg-secondary text-secondary-foreground">{users.length} users</Badge>
      </div>

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className={cn(
              'bg-secondary/50 rounded-lg p-4 border border-border transition-all hover:border-primary/20',
              user.isBlocked && 'opacity-60'
            )}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{user.name}</p>
                  {user.isBlocked && (
                    <Badge variant="destructive" className="text-xs">Blocked</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {user.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    {user.bandId}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className={cn(
                    'font-bold flex items-center gap-0.5',
                    user.balance > 0 ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    <IndianRupee className="w-4 h-4" />
                    {user.balance.toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="subtle"
                    onClick={() => onFund(user.bandId)}
                    disabled={user.isBlocked}
                  >
                    <IndianRupee className="w-4 h-4" />
                    <span className="hidden sm:inline">Fund</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={user.isBlocked ? 'success' : 'destructive'}
                    onClick={() => onToggleBlock(user.bandId)}
                  >
                    {user.isBlocked ? (
                      <>
                        <Unlock className="w-4 h-4" />
                        <span className="hidden sm:inline">Unblock</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span className="hidden sm:inline">Block</span>
                      </>
                    )}
                  </Button>
                  {showDelete && onDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(user.bandId)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No users registered yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersList;
