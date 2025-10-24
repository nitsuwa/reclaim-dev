import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { PLVLogo } from './PLVLogo';
import { toast } from 'sonner@2.0.3';
import { Alert, AlertDescription } from './ui/alert';
import { auth, db } from '../db/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export const LoginPage = () => {
  const { setCurrentUser, setCurrentPage } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const appUser = {
          id: user.uid,
          fullName: userData.fullName,
          studentId: userData.studentId,
          contactNumber: userData.contactNumber,
          email: userData.email,
          role: userData.role || 'user',
        };
        
        toast.success('Login successful!', {
          description: `Welcome back, ${appUser.fullName}!`
        });

        setCurrentUser(appUser);
        if (appUser.role === 'admin') {
          setCurrentPage('admin-dashboard');
        } else {
          setCurrentPage('board');
        }
      } else {
        setError('User data not found.');
      }

    } catch (error: any) {
      setError('Invalid email or password. Please try again.');
      toast.error('Login Failed', {
        description: 'Invalid email or password. Please try again.'
      })
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-[#004d99] to-accent flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => setCurrentPage('landing')}
        className="absolute top-4 left-4 z-20 text-white hover:bg-white/10"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Home
      </Button>

      <Card className="w-full max-w-md shadow-2xl relative z-10 border border-primary/10 bg-white">
        <CardHeader className="space-y-4 pb-6 border-b-0">
          <PLVLogo size="md" />
          <div className="text-center space-y-2">
            <CardTitle className="text-primary">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access the Lost & Found Portal
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                required
                disabled={isLoading}
                className="h-12 border-2 focus:border-accent transition-all shadow-md"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  required
                  disabled={isLoading}
                  className="h-12 pr-10 border-2 focus:border-accent transition-all shadow-md"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 shadow-md transition-all hover:shadow-lg mt-6"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 space-y-4">
            <div className="text-center">
              <button
                type="button"
                onClick={() => setCurrentPage('forgot-password')}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <div className="text-center">
              <span className="text-sm text-muted-foreground">Don't have an account? </span>
              <button
                type="button"
                onClick={() => setCurrentPage('register')}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Register here
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
