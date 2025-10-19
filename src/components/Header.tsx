import { Button } from './ui/button';
import { useApp } from '../context/AppContext';
import { LogOut, Home, Package, FileText, Shield, User } from 'lucide-react';
import { PLVLogo } from './PLVLogo';

export const Header = () => {
  const { currentUser, setCurrentUser, setCurrentPage, currentPage } = useApp();

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('login');
  };

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  return (
    <header className="bg-primary text-primary-foreground border-b border-primary/10 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <PLVLogo size="sm" />
            <div className="hidden sm:block">
              <h2 className="text-primary-foreground">ReClaim</h2>
              <p className="text-xs text-primary-foreground/80">PLV Lost and Found System</p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            {!isAdmin && (
              <>
                <Button
                  variant={currentPage === 'board' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage('board')}
                  className={currentPage === 'board' ? 'bg-accent text-white hover:bg-accent/90' : 'text-primary-foreground hover:bg-accent hover:text-white transition-all'}
                >
                  <Home className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
                <Button
                  variant={currentPage === 'report' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage('report')}
                  className={currentPage === 'report' ? 'bg-accent text-white hover:bg-accent/90' : 'text-primary-foreground hover:bg-accent hover:text-white transition-all'}
                >
                  <Package className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Report</span>
                </Button>
                <Button
                  variant={currentPage === 'profile' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage('profile')}
                  className={currentPage === 'profile' ? 'bg-accent text-white hover:bg-accent/90' : 'text-primary-foreground hover:bg-accent hover:text-white transition-all'}
                >
                  <User className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
              </>
            )}
            {isAdmin && (
              <>
                <Button
                  variant={currentPage === 'admin' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage('admin')}
                  className={currentPage === 'admin' ? 'bg-accent text-white hover:bg-accent/90' : 'text-primary-foreground hover:bg-accent hover:text-white transition-all'}
                >
                  <Shield className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-destructive hover:text-white"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};