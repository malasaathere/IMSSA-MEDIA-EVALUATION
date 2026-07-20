"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { UserPlus, Loader2, CheckCircle2, Copy } from "lucide-react";
import { createUser } from "../../actions/users";
import { Badge } from "../ui/badge";

export function AddUserDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("DESIGNER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ passkey: string; name: string; role: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    setResult(null);
    
    try {
      const res = await createUser(name, role);
      if (res.success && res.passkey) {
        setResult({ passkey: res.passkey, name: res.name || name, role: res.role || role });
      } else {
        setError(res.error || "Failed to create user.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setName("");
    setRole("DESIGNER");
    setResult(null);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) reset();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-white">
          <UserPlus className="mr-2 h-4 w-4" /> Add Team Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-navy-950">Successfully added {result.name}</h3>
              <p className="text-sm text-text-muted mt-1">They have been assigned as a {result.role.replace('_', ' ')}.</p>
            </div>
            
            <div className="mt-4 p-4 bg-slate-50 border border-border rounded-lg w-full">
              <p className="text-xs font-medium text-navy-500 uppercase tracking-wider mb-2">Their Login Passkey</p>
              <div className="flex items-center justify-center space-x-3">
                <span className="text-4xl font-mono tracking-widest text-navy-900 font-bold">{result.passkey}</span>
              </div>
            </div>
            <p className="text-xs text-text-muted">Please share this passkey securely with the user. They will use it to log in.</p>

            <Button onClick={() => setOpen(false)} className="w-full mt-4">Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {error && (
              <div className="bg-red-50 p-3 rounded text-sm text-red-600">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-navy-950">Name</label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kasun"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-navy-950">Role</label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div
                  onClick={() => setRole("DESIGNER")}
                  className={`cursor-pointer rounded-lg border p-4 text-center transition-all ${
                    role === "DESIGNER" ? "border-navy-600 bg-navy-50 ring-1 ring-navy-600" : "border-border hover:border-navy-300"
                  }`}
                >
                  <p className="font-semibold text-navy-900">Designer</p>
                </div>
                <div
                  onClick={() => setRole("VIDEO_EDITOR")}
                  className={`cursor-pointer rounded-lg border p-4 text-center transition-all ${
                    role === "VIDEO_EDITOR" ? "border-navy-600 bg-navy-50 ring-1 ring-navy-600" : "border-border hover:border-navy-300"
                  }`}
                >
                  <p className="font-semibold text-navy-900">Video Editor</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 space-x-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-navy-600 hover:bg-navy-700">
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : "Generate Passkey"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
