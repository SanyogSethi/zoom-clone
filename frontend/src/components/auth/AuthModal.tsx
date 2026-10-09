"use client";

import React, { useState, useEffect } from "react";
import { X, LogIn, UserPlus, Shield, UserCheck, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { User } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [tab, setTab] = useState<"login" | "register" | "profiles">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<User[]>([]);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      api
        .getAuthProfiles()
        .then((res) => setProfiles(res))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await api.login({ email, password });
      localStorage.setItem("zoom_auth_token", res.access_token);
      localStorage.setItem("zoom_user", JSON.stringify(res.user));
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await api.register({ email, display_name: displayName, password });
      localStorage.setItem("zoom_auth_token", res.access_token);
      localStorage.setItem("zoom_user", JSON.stringify(res.user));
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to register account.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchProfile = (p: User) => {
    const devToken = `user_${p.id}`;
    localStorage.setItem("zoom_auth_token", devToken);
    localStorage.setItem("zoom_user", JSON.stringify(p));
    onAuthSuccess(p);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-[#242424] border border-neutral-700/70 rounded-2xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700/60 bg-[#1E1E1E]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0B5CFF] flex items-center justify-center text-white font-bold text-sm">
              Z
            </div>
            <div>
              <h2 className="font-semibold text-base text-neutral-100">Sign in to Zoom</h2>
              <p className="text-xs text-neutral-400">Manage your profile & meeting identity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-700/60 bg-[#1A1A1A] text-xs font-medium">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 py-3 text-center border-b-2 transition-all ${
              tab === "login"
                ? "border-[#0B5CFF] text-[#0B5CFF] font-semibold"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 py-3 text-center border-b-2 transition-all ${
              tab === "register"
                ? "border-[#0B5CFF] text-[#0B5CFF] font-semibold"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
          <button
            onClick={() => setTab("profiles")}
            className={`flex-1 py-3 text-center border-b-2 transition-all ${
              tab === "profiles"
                ? "border-[#0B5CFF] text-[#0B5CFF] font-semibold"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            Switch Profile
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sanyog@example.com"
                  className="w-full px-3.5 py-2 bg-[#1A1A1A] border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#0B5CFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-[#1A1A1A] border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#0B5CFF]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-[#0B5CFF] hover:bg-[#004FE0] text-white font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? "Signing in..." : "Sign In"}</span>
              </button>
            </form>
          )}

          {/* Register Form */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2 bg-[#1A1A1A] border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#0B5CFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3.5 py-2 bg-[#1A1A1A] border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#0B5CFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Password (Min 6 chars)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-[#1A1A1A] border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#0B5CFF]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-[#0B5CFF] hover:bg-[#004FE0] text-white font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? "Creating Account..." : "Create Account"}</span>
              </button>
            </form>
          )}

          {/* Dev Profile Switcher */}
          {tab === "profiles" && (
            <div className="space-y-2">
              <p className="text-xs text-neutral-400 mb-2">
                Select a profile to switch active user in this browser profile / window:
              </p>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSwitchProfile(p)}
                    className="w-full flex items-center justify-between p-2.5 bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-neutral-700/60 rounded-xl text-left transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={p.display_name} size="sm" />
                      <div>
                        <div className="text-xs font-medium text-white">{p.display_name}</div>
                        <div className="text-[10px] text-neutral-400">{p.email}</div>
                      </div>
                    </div>
                    {p.id === 1 && (
                      <span className="text-[10px] bg-[#0B5CFF]/20 text-[#0B5CFF] px-2 py-0.5 rounded-full font-semibold">
                        Host Default
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
