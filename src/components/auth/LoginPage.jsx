import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAutoAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Wrench, 
  User, 
  Lock, 
  ShieldCheck, 
  ArrowRight,
  ChevronRight,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import apiClient from "@/api/client";
import { notify } from "@/lib/notify";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusField, setFocusField] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Password Reset State
  const [needsReset, setNeedsReset] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [resetStaff, setResetStaff] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  const { login } = useAutoAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      notify.error("Please enter your username and password");
      return;
    }
    setLoggingIn(true);
    const result = await login(username, password);
    setLoggingIn(false);

    if (result.success) {
      notify.success(`Welcome back, ${result.user.name}!`);
      navigate("/");
    } else if (result.needsReset) {
      // Show password reset screen
      setResetToken(result.resetToken);
      setResetStaff(result.staff);
      setNeedsReset(true);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      notify.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      notify.error("Passwords do not match");
      return;
    }
    setResetting(true);
    try {
      const res = await apiClient.post('/auth/staff/set-new-password', {
        resetToken,
        newPassword,
      });
      if (res.data.success) {
        notify.success("Password changed successfully! Please login again.");
        // Reset back to login form
        setNeedsReset(false);
        setResetToken(null);
        setResetStaff(null);
        setPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to reset password");
    }
    setResetting(false);
  };

  const handleBackToLogin = () => {
    setNeedsReset(false);
    setResetToken(null);
    setResetStaff(null);
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background">
      {/* Left Side: Branding */}
      <div className="relative hidden md:flex md:w-1/2 lg:w-3/5 bg-primary overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-black/20" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-black/10 rounded-full blur-2xl" />
        <div className="relative z-10 max-w-lg text-primary-foreground space-y-6">
          <div className="inline-flex p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Wrench className="w-12 h-12" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight">
            AutoCare <br /> 
            <span className="text-white/80">AutoProTech.</span>
          </h1>
          <p className="text-lg text-primary-foreground/80 leading-relaxed">
            The management system designed specifically for modern auto repair shops and service centers.
          </p>
          <div className="flex gap-4 pt-4">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-primary bg-primary-foreground/20" />
              ))}
            </div>
            <p className="text-sm self-center font-medium">Trusted by AutoProTech</p>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-slate-50/50">
        <Card className="w-full max-w-[450px] shadow-xl border-none md:border md:bg-white animate-in fade-in zoom-in-95 duration-500">
          {needsReset ? (
            <>
              <CardHeader className="space-y-1 pb-8">
                <div className="md:hidden flex justify-center mb-4">
                  <div className="p-3 rounded-xl bg-primary">
                    <Wrench className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">Change Password</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {resetStaff?.fullName || 'Staff'}, you need to set a new password.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-semibold">New Password</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <Lock className={`w-4 h-4 ${focusField === 'newpass' ? 'text-primary' : 'text-slate-400'}`} />
                      </div>
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter your new password"
                        className="pl-10 pr-10 h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                        onFocus={() => setFocusField('newpass')}
                        onBlur={() => setFocusField(null)}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] font-medium text-slate-400">Minimum 6 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <ShieldCheck className={`w-4 h-4 ${focusField === 'confirm' ? 'text-primary' : 'text-slate-400'}`} />
                      </div>
                      <Input
                        id="confirmPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Re-enter your new password"
                        className="pl-10 h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                        onFocus={() => setFocusField('confirm')}
                        onBlur={() => setFocusField(null)}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20"
                    size="lg"
                    disabled={resetting}
                  >
                    {resetting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Changing Password...</>
                    ) : (
                      <><ShieldCheck className="w-4 h-4 mr-2" /> Set New Password</>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-xs text-slate-400 hover:text-slate-600"
                    onClick={handleBackToLogin}
                  >
                    <ChevronRight className="w-3 h-3 mr-1 rotate-180" />
                    Back to Login
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1 pb-8">
                <div className="md:hidden flex justify-center mb-4">
                  <div className="p-3 rounded-xl bg-primary">
                    <Wrench className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold tracking-tight text-center md:text-left">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-center md:text-left text-base">
                  Enter your credentials to access your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Username Input */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-semibold">Username</Label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200">
                        <User className={`w-4 h-4 ${focusField === 'user' ? 'text-primary' : 'text-slate-400'}`} />
                      </div>
                      <Input
                        id="username"
                        placeholder="Enter your username"
                        className="pl-10 h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                        onFocus={() => setFocusField('user')}
                        onBlur={() => setFocusField(null)}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200">
                        <Lock className={`w-4 h-4 ${focusField === 'pass' ? 'text-primary' : 'text-slate-400'}`} />
                      </div>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                        onFocus={() => setFocusField('pass')}
                        onBlur={() => setFocusField(null)}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
                    size="lg"
                    disabled={loggingIn}
                  >
                    {loggingIn ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing In...</>
                    ) : (
                      <>Sign In <ArrowRight className="w-4 h-4" /></>
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}