"use client";

import React, { useState, useEffect } from "react";
import { User, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatRole } from "@/lib/utils";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile fields
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/users/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user);
          setDisplayName(data.user.displayName || "");
          setBio(data.user.bio || "");
          setAvatarUrl(data.user.avatarUrl || "");
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileError(null);
    setSavingProfile(true);

    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio, avatarUrl }),
      });

      const data = await res.json();
      if (res.ok) {
        setProfileMessage("Profile successfully updated!");
        setProfile(data.user);
      } else {
        setProfileError(data.error || "Failed to update profile");
      }
    } catch {
      setProfileError("Network error occurred");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);
    setChangingPassword(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordMessage("Password successfully changed!");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setPasswordError(data.error || "Failed to change password");
      }
    } catch {
      setPasswordError("Network error occurred");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-neutral-400">Loading account settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Account Settings</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Manage your personal profile, credentials, and platform visibility
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-brand-500" />
                Profile Information
              </span>
              {profile && (
                <Badge variant={profile.role === "ADMIN" ? "danger" : profile.role === "DEVELOPER" ? "brand" : "neutral"} size="sm">
                  {formatRole(profile.role)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>

          {profileMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-md flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileMessage}</span>
            </div>
          )}

          {profileError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
              {profileError}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Username</label>
              <input
                type="text"
                disabled
                value={profile?.username || ""}
                className="w-full px-3 py-2 text-xs bg-neutral-100 border border-neutral-300 rounded-md text-neutral-500 cursor-not-allowed font-mono"
              />
              <span className="text-[11px] text-neutral-400">Username cannot be changed.</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Email</label>
              <input
                type="text"
                disabled
                value={profile?.email || ""}
                className="w-full px-3 py-2 text-xs bg-neutral-100 border border-neutral-300 rounded-md text-neutral-500 cursor-not-allowed"
              />
            </div>

            <Input
              label="Display Name"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Morgan"
            />

            <Input
              label="Profile Picture URL"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/profile.jpg"
              helperText="HTTP/HTTPS URLs supported."
            />

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Bio / Description</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                placeholder="Brief developer introduction..."
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900"
              />
              <span className="text-[11px] text-neutral-400">{bio.length}/500 characters</span>
            </div>

            <Button type="submit" size="sm" isLoading={savingProfile}>
              Save Profile Changes
            </Button>
          </form>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-500" />
              Security & Password
            </CardTitle>
          </CardHeader>

          {passwordMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-md flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{passwordMessage}</span>
            </div>
          )}

          {passwordError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
            />

            <Input
              label="New Password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              helperText="At least 8 characters with uppercase, lowercase, and a number."
            />

            <Button type="submit" size="sm" variant="outline" isLoading={changingPassword}>
              Change Password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
