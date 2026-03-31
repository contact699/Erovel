"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { updateProfile } from "@/lib/supabase/queries";
import {
  User,
  Lock,
  CreditCard,
  DollarSign,
  Bell,
  BookOpen,
  Trash2,
  Upload,
  Save,
  AlertTriangle,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  // Profile state
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");

  // Account state
  const [email, setEmail] = useState("user@example.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Creator pricing state
  const [subscriptionPrice, setSubscriptionPrice] = useState(
    user?.subscription_price ?? 9.99
  );

  // Creator payout state
  const [payoutMethod, setPayoutMethod] = useState("paxum");
  const [paxumEmail, setPaxumEmail] = useState("");
  const [cryptoWallet, setCryptoWallet] = useState("");

  // Notification preferences
  const [notifications, setNotifications] = useState({
    newFollowers: true,
    tips: true,
    comments: true,
    chapterReleases: false,
  });

  // Content preferences
  const [preferredCategories, setPreferredCategories] = useState<string[]>([
    "romance",
    "fantasy",
  ]);

  // Delete account
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Save handlers (mock)
  const [savingSection, setSavingSection] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-muted mb-6">Please log in to access settings.</p>
        <a href="/login" className="text-accent hover:underline">Log in</a>
      </div>
    );
  }
  const currentUser = user;
  const isCreator = currentUser.role === "creator";

  function handleSave(section: string) {
    setSavingSection(section);
    setTimeout(() => setSavingSection(null), 1000);
  }

  function toggleNotification(key: keyof typeof notifications) {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleCategory(categoryId: string) {
    setPreferredCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Section */}
      <section className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <User size={18} className="text-accent" />
          <h2 className="text-lg font-semibold">Profile</h2>
        </div>

        <div className="flex items-center gap-4">
          <Avatar
            src={currentUser.avatar_url}
            name={currentUser.display_name}
            size="xl"
          />
          <div>
            <Button variant="secondary" size="sm">
              <Upload size={14} />
              Upload Avatar
            </Button>
            <p className="text-xs text-muted mt-1">JPG, PNG. Max 2MB.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Display Name"
            id="display_name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            label="Username"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <Textarea
          label="Bio"
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell readers about yourself..."
          rows={3}
        />

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => handleSave("profile")}
            loading={savingSection === "profile"}
          >
            <Save size={14} />
            Save Profile
          </Button>
        </div>
      </section>

      {/* Account Section */}
      <section className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Lock size={18} className="text-accent" />
          <h2 className="text-lg font-semibold">Account</h2>
        </div>

        <Input
          label="Email"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-medium mb-3">Change Password</h3>
          <div className="space-y-3">
            <Input
              label="Current Password"
              id="current_password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="New Password"
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <Input
                label="Confirm Password"
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => handleSave("account")}
            loading={savingSection === "account"}
          >
            <Save size={14} />
            Save Account
          </Button>
        </div>
      </section>

      {/* Pricing Settings (Creators only) */}
      {isCreator && (
        <section className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-accent" />
            <h2 className="text-lg font-semibold">Pricing</h2>
          </div>

          <p className="text-sm text-muted">
            Set the monthly price readers pay to subscribe to your content.
          </p>

          <Input
            label="Monthly Subscription Price ($)"
            id="subscription_price"
            type="number"
            value={String(subscriptionPrice)}
            onChange={(e) => setSubscriptionPrice(Number(e.target.value))}
            placeholder="9.99"
          />

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={async () => {
                setSavingSection("pricing");
                try {
                  await updateProfile(currentUser.id, {
                    subscription_price: subscriptionPrice,
                  });
                } catch {
                  // handle silently
                } finally {
                  setSavingSection(null);
                }
              }}
              loading={savingSection === "pricing"}
            >
              <Save size={14} />
              Save Pricing
            </Button>
          </div>
        </section>
      )}

      {/* Payout Settings (Creators only) */}
      {isCreator && (
        <section className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-accent" />
            <h2 className="text-lg font-semibold">Payout Settings</h2>
          </div>

          <Select
            label="Payout Method"
            id="payout_method"
            options={[
              { value: "paxum", label: "Paxum" },
              { value: "crypto", label: "Cryptocurrency" },
            ]}
            value={payoutMethod}
            onChange={(e) => setPayoutMethod(e.target.value)}
          />

          {payoutMethod === "paxum" ? (
            <Input
              label="Paxum Email"
              id="paxum_email"
              type="email"
              value={paxumEmail}
              onChange={(e) => setPaxumEmail(e.target.value)}
              placeholder="your@paxum-email.com"
            />
          ) : (
            <Input
              label="Crypto Wallet Address"
              id="crypto_wallet"
              value={cryptoWallet}
              onChange={(e) => setCryptoWallet(e.target.value)}
              placeholder="Enter your wallet address"
            />
          )}

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => handleSave("payout")}
              loading={savingSection === "payout"}
            >
              <Save size={14} />
              Save Payout Settings
            </Button>
          </div>
        </section>
      )}

      {/* Notification Preferences */}
      <section className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-accent" />
          <h2 className="text-lg font-semibold">Notification Preferences</h2>
        </div>

        <p className="text-sm text-muted">
          Choose which email notifications you receive.
        </p>

        <div className="space-y-3">
          {[
            {
              key: "newFollowers" as const,
              label: "New followers",
              desc: "When someone follows your profile",
            },
            {
              key: "tips" as const,
              label: "Tips received",
              desc: "When a reader sends you a tip",
            },
            {
              key: "comments" as const,
              label: "New comments",
              desc: "When someone comments on your story",
            },
            {
              key: "chapterReleases" as const,
              label: "Chapter releases",
              desc: "When a creator you follow publishes a new chapter",
            },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between py-2 cursor-pointer"
            >
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted">{item.desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifications[item.key]}
                onClick={() => toggleNotification(item.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                  notifications[item.key] ? "bg-accent" : "bg-border"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    notifications[item.key]
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </label>
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => handleSave("notifications")}
            loading={savingSection === "notifications"}
          >
            <Save size={14} />
            Save Notifications
          </Button>
        </div>
      </section>

      {/* Content Preferences */}
      <section className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-accent" />
          <h2 className="text-lg font-semibold">Content Preferences</h2>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-3">Preferred Categories</h3>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                  preferredCategories.includes(cat.id)
                    ? "bg-accent/10 text-accent border-accent/30"
                    : "bg-surface border-border text-muted hover:text-foreground hover:border-border"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between py-2 cursor-pointer">
          <div>
            <p className="text-sm font-medium">Dark Mode</p>
            <p className="text-xs text-muted">
              Switch between light and dark themes
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={theme === "dark"}
            onClick={toggleTheme}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
              theme === "dark" ? "bg-accent" : "bg-border"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                theme === "dark" ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </label>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => handleSave("content")}
            loading={savingSection === "content"}
          >
            <Save size={14} />
            Save Preferences
          </Button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-surface border border-danger/30 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-danger" />
          <h2 className="text-lg font-semibold text-danger">Danger Zone</h2>
        </div>

        <p className="text-sm text-muted">
          Once you delete your account, there is no going back. All your stories,
          comments, and data will be permanently removed.
        </p>

        <Button
          variant="danger"
          size="sm"
          onClick={() => setDeleteModalOpen(true)}
        >
          <Trash2 size={14} />
          Delete Account
        </Button>
      </section>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteConfirm("");
        }}
        title="Delete Account"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            This action is <span className="text-danger font-medium">irreversible</span>.
            All your data, stories, and earnings will be permanently deleted.
          </p>
          <Input
            label={`Type "${currentUser.username}" to confirm`}
            id="delete_confirm"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={currentUser.username}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteConfirm("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={deleteConfirm !== currentUser.username}
            >
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
