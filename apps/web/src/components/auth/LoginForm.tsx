"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 p-4">
      <Card className="w-full max-w-md bg-navy-900 text-white border-navy-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gold-500">IMSSA Media Evaluation</CardTitle>
          <CardDescription className="text-navy-300">Sign in to your Appwrite Education account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy-200">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-2 rounded-md bg-navy-800 border border-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="name@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy-200">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-2 rounded-md bg-navy-800 border border-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="••••••••"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gold-600 hover:bg-gold-500 text-navy-950 font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
