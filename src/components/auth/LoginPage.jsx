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
import { Wrench } from "lucide-react";

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState("admin");
  const { login } = useAutoAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    login(selectedRole);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
              <Wrench className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Auto Pro Tech</CardTitle>
          <CardDescription>Service Management System</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">Select User Role</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="mechanic">Mechanic</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              For development: Choose a role to login as that user
            </p>
          </div>

          <Button onClick={handleLogin} className="w-full" size="lg">
            Login
          </Button>

          <div className="text-xs text-muted-foreground text-center border-t pt-4">
            <p>Development Mode</p>
            <p>No authentication required</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
