import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Eye, EyeOff, CheckCircle2, AlertCircle, PartyPopper } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import { PLVLogo } from './PLVLogo';
import { toast } from 'sonner@2.0.3';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';

export const RegisterPage = () => {
  const { setCurrentPage } = useApp();
  const [step, setStep] = useState(1); // 1: Form, 2: OTP, 3: Success
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    contactNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    } else if (!/^\d{4}-\d{5}-[A-Z]{2}-\d$/.test(formData.studentId)) {
      newErrors.studentId = 'Invalid format. Use: 2021-00123-VL-0';
    }

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^09\d{9}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Invalid format. Use: 09XXXXXXXXX';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/@plv\.edu\.ph$/.test(formData.email)) {
      newErrors.email = 'Must use PLV email (@plv.edu.ph)';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password) && /[!@#$%^&*]/.test(password)) strength += 25;

    if (strength <= 25) return { strength, label: 'Weak', color: 'bg-destructive' };
    if (strength <= 50) return { strength, label: 'Fair', color: 'bg-accent' };
    if (strength <= 75) return { strength, label: 'Good', color: 'bg-secondary' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      toast.success('OTP sent successfully!', {
        description: `Verification code sent to ${formData.email}`
      });
      setStep(2);
      setIsLoading(false);
    }, 1000);
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter the complete OTP');
      return;
    }

    setIsLoading(true);

    // Simulate OTP verification
    setTimeout(() => {
      const validOTP = '123456'; // Mock OTP
      
      if (otp === validOTP) {
        toast.success('Account created successfully!');
        setStep(3);
      } else {
        toast.error('Invalid OTP', {
          description: 'Please check the code and try again'
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleResendOTP = () => {
    setIsLoading(true);
    setTimeout(() => {
      toast.success('OTP resent!', {
        description: `New code sent to ${formData.email}`
      });
      setIsLoading(false);
    }, 1000);
  };

  const passwordStrength = getPasswordStrength();

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-[#004d99] to-accent flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

        <Card className="w-full max-w-md shadow-2xl relative z-10 border border-primary/10 bg-white">
          <CardContent className="pt-6 text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-accent rounded-full p-6 shadow-md animate-bounce">
                <PartyPopper className="h-16 w-16 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-primary">Account Created Successfully!</h2>
              <p className="text-muted-foreground">
                Welcome to PLV Lost & Found System, {formData.fullName}!
              </p>
            </div>
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
              <p className="text-sm text-foreground">
                You can now log in with your credentials and start using the system.
              </p>
            </div>
            <Button 
              onClick={() => setCurrentPage('login')} 
              className="w-full h-12 bg-accent text-white hover:bg-accent/90 shadow-md"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-[#004d99] to-accent flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      {/* Back Button - Same style as Login */}
      <Button
        variant="ghost"
        onClick={() => step === 1 ? setCurrentPage('landing') : setStep(1)}
        className="absolute top-4 left-4 z-20 text-white hover:bg-white/10"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        {step === 1 ? 'Back to Home' : 'Back'}
      </Button>

      <Card className="w-full max-w-md shadow-2xl relative z-10 border border-primary/10 bg-white max-h-[90vh] overflow-y-auto">
        <CardHeader className="space-y-4 pb-6 border-b-0">
          <PLVLogo size="md" />
          <div className="text-center space-y-2">
            <CardTitle className="text-primary">
              {step === 1 ? 'Create Account' : 'Verify Your Email'}
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? 'Register for PLV Lost & Found System'
                : `Enter the 6-digit code sent to ${formData.email}`
              }
            </CardDescription>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className={`h-2 w-12 rounded-full transition-all ${step >= 1 ? 'bg-accent' : 'bg-muted'}`}></div>
            <div className={`h-2 w-12 rounded-full transition-all ${step >= 2 ? 'bg-accent' : 'bg-muted'}`}></div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Juan Dela Cruz"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({...formData, fullName: e.target.value});
                    setErrors({...errors, fullName: ''});
                  }}
                  className={`h-12 border-2 transition-all ${errors.fullName ? 'border-destructive' : 'focus:border-accent'}`}
                  disabled={isLoading}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID *</Label>
                <Input
                  id="studentId"
                  type="text"
                  placeholder="2021-00123-VL-0"
                  value={formData.studentId}
                  onChange={(e) => {
                    setFormData({...formData, studentId: e.target.value});
                    setErrors({...errors, studentId: ''});
                  }}
                  className={`h-12 border-2 transition-all ${errors.studentId ? 'border-destructive' : 'focus:border-accent'}`}
                  disabled={isLoading}
                />
                {errors.studentId && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.studentId}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number *</Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  placeholder="09123456789"
                  value={formData.contactNumber}
                  onChange={(e) => {
                    setFormData({...formData, contactNumber: e.target.value});
                    setErrors({...errors, contactNumber: ''});
                  }}
                  className={`h-12 border-2 transition-all ${errors.contactNumber ? 'border-destructive' : 'focus:border-accent'}`}
                  disabled={isLoading}
                />
                {errors.contactNumber && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.contactNumber}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">PLV Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="juan.delacruz@plv.edu.ph"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({...formData, email: e.target.value});
                    setErrors({...errors, email: ''});
                  }}
                  className={`h-12 border-2 transition-all ${errors.email ? 'border-destructive' : 'focus:border-accent'}`}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({...formData, password: e.target.value});
                      setErrors({...errors, password: ''});
                    }}
                    className={`h-12 pr-10 border-2 transition-all ${errors.password ? 'border-destructive' : 'focus:border-accent'}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Password strength:</span>
                      <span className={`font-medium ${
                        passwordStrength.strength <= 25 ? 'text-destructive' :
                        passwordStrength.strength <= 50 ? 'text-accent' :
                        passwordStrength.strength <= 75 ? 'text-secondary' :
                        'text-green-600'
                      }`}>{passwordStrength.label}</span>
                    </div>
                    <Progress value={passwordStrength.strength} className="h-2" />
                  </div>
                )}
                {errors.password && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({...formData, confirmPassword: e.target.value});
                      setErrors({...errors, confirmPassword: ''});
                    }}
                    className={`h-12 pr-10 border-2 transition-all ${errors.confirmPassword ? 'border-destructive' : 'focus:border-accent'}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-accent text-white hover:bg-accent/90 shadow-md transition-all hover:shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? 'Sending OTP...' : 'Continue to Verification'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOTPSubmit} className="space-y-6">
              <Alert className="border-accent/50 bg-accent/10">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <AlertDescription>
                  We've sent a 6-digit verification code to your email. Please check your inbox.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <Label className="text-center block">Enter 6-digit OTP</Label>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot 
                          key={index} 
                          index={index} 
                          className="w-12 h-14 text-lg border-2 border-border data-[active=true]:border-accent transition-all"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  For demo purposes, use code: <span className="font-mono font-bold">123456</span>
                </p>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Didn't receive the code?</p>
                <button 
                  type="button" 
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-accent text-white hover:bg-accent/90 shadow-md transition-all hover:shadow-lg"
                disabled={otp.length !== 6 || isLoading}
              >
                {isLoading ? 'Verifying...' : 'Complete Registration'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};