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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Wrench, 
  User, 
  Lock, 
  ShieldCheck, 
  ArrowRight,
  ChevronRight 
} from "lucide-react";

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // States for icon highlighting on focus
  const [focusField, setFocusField] = useState(null);

  const { login } = useAutoAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    // Prevent form refresh if wrapped in form tag
    if(e) e.preventDefault();
    login(selectedRole);
    navigate("/");
  };

  return (
    /* --- Main Container: Split Layout --- */
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background">
      
      {/* --- Left Side: Branding/Visual Sidebar (Hidden on small mobile if needed, but here made responsive) --- */}
      <div className="relative hidden md:flex md:w-1/2 lg:w-3/5 bg-primary overflow-hidden items-center justify-center p-12">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-black/20" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-black/10 rounded-full blur-2xl" />
        
        {/* Sidebar Content */}
        <div className="relative z-10 max-w-lg text-primary-foreground space-y-6">
          <div className="inline-flex p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Wrench className="w-12 h-12" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight">
            AutoCare <br /> 
            <span className="text-white/80">Auto Service.</span>
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

      {/* --- Right Side: Login Form Area --- */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-slate-50/50">
        <Card className="w-full max-w-[450px] shadow-xl border-none md:border md:bg-white animate-in fade-in zoom-in-95 duration-500">
          <CardHeader className="space-y-1 pb-8">
            <div className="md:hidden flex justify-center mb-4">
               {/* Mobile Logo */}
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
              
              {/* --- Role Selection Section --- */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">System Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200 focus:ring-primary">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className={`w-4 h-4 ${focusField === 'role' ? 'text-primary' : 'text-slate-400'} transition-colors`} />
                      <SelectValue placeholder="Select access level" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="staff">Front Desk Staff</SelectItem>
                    <SelectItem value="mechanic">Service Mechanic</SelectItem>
                    <SelectItem value="cashier">Accountant / Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* --- Username Input --- */}
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
                  />
                </div>
              </div>

              {/* --- Password Input --- */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                  <Button variant="link" className="px-0 font-medium text-xs text-primary h-auto">
                    Forgot password?
                  </Button>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200">
                    <Lock className={`w-4 h-4 ${focusField === 'pass' ? 'text-primary' : 'text-slate-400'}`} />
                  </div>
                  <Input 
                    id="password"
                    type="password"
                    placeholder="••••••••" 
                    className="pl-10 h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                    onFocus={() => setFocusField('pass')}
                    onBlur={() => setFocusField(null)}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* --- Submit Button --- */}
              <Button 
                type="submit"
                className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]" 
                size="lg"
              >
                Sign In
                <ArrowRight className="w-4 h-4" />
              </Button>

              {/* --- Dev Mode Footer --- */}
              <div className="pt-6 mt-6 border-t border-slate-100">
                <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest font-bold text-slate-400">
                  <span className="w-8 h-[1px] bg-slate-200"></span>
                  Development Mode
                  <span className="w-8 h-[1px] bg-slate-200"></span>
                </div>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  Auto-authentication enabled. No password verification required for testing.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}