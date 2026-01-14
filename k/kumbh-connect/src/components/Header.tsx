import { Waves, Store, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  showSellerLink?: boolean;
}

const Header = ({ showSellerLink }: HeaderProps) => {
  return (
    <header className="w-full bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-saffron flex items-center justify-center shadow-soft">
            <Waves className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Kumbh Pay
            </h1>
            <p className="text-xs text-muted-foreground">Band Management</p>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          {showSellerLink && (
            <Link to="/seller">
              <Button variant="outline" size="sm">
                <Store className="w-4 h-4 mr-2" />
                Seller Terminal
              </Button>
            </Link>
          )}
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            System Online
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
