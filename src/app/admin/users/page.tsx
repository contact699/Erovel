"use client";

import { useState, useMemo } from "react";
import { mockProfiles, mockReader } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { Profile } from "@/lib/types";
import {
  Search,
  ExternalLink,
  Ban,
  Pause,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";

const allUsers: Profile[] = [...mockProfiles, mockReader];

function getRoleBadge(role: string) {
  switch (role) {
    case "admin":
      return <Badge variant="danger">admin</Badge>;
    case "creator":
      return <Badge variant="accent">creator</Badge>;
    default:
      return <Badge variant="default">reader</Badge>;
  }
}

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    action: "suspend" | "ban";
    user: Profile | null;
  }>({ open: false, action: "suspend", user: null });
  const [actionedUsers, setActionedUsers] = useState<
    Record<string, "suspended" | "banned">
  >({});

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return allUsers;
    const q = searchQuery.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.display_name.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  function openConfirm(action: "suspend" | "ban", user: Profile) {
    setConfirmModal({ open: true, action, user });
  }

  function executeAction() {
    if (!confirmModal.user) return;
    setActionedUsers((prev) => ({
      ...prev,
      [confirmModal.user!.id]:
        confirmModal.action === "ban" ? "banned" : "suspended",
    }));
    setConfirmModal({ open: false, action: "suspend", user: null });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted mt-1">
            Manage platform users and accounts
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Users table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-hover/50">
                <th className="text-left font-medium text-muted px-5 py-3">
                  User
                </th>
                <th className="text-left font-medium text-muted px-5 py-3">
                  Username
                </th>
                <th className="text-left font-medium text-muted px-5 py-3">
                  Role
                </th>
                <th className="text-left font-medium text-muted px-5 py-3">
                  Verified
                </th>
                <th className="text-left font-medium text-muted px-5 py-3">
                  Stories
                </th>
                <th className="text-left font-medium text-muted px-5 py-3">
                  Joined
                </th>
                <th className="text-left font-medium text-muted px-5 py-3">
                  Status
                </th>
                <th className="text-right font-medium text-muted px-5 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-muted"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const userStatus = actionedUsers[user.id];
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-surface-hover/30 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={user.avatar_url}
                            name={user.display_name}
                            size="sm"
                          />
                          <span className="font-medium">
                            {user.display_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted">
                        @{user.username}
                      </td>
                      <td className="px-5 py-3">{getRoleBadge(user.role)}</td>
                      <td className="px-5 py-3">
                        {user.is_verified ? (
                          <CheckCircle
                            size={16}
                            className="text-success"
                          />
                        ) : (
                          <span className="text-muted text-xs">No</span>
                        )}
                      </td>
                      <td className="px-5 py-3">{user.story_count}</td>
                      <td className="px-5 py-3 text-muted whitespace-nowrap">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        {userStatus === "banned" ? (
                          <Badge variant="danger">Banned</Badge>
                        ) : userStatus === "suspended" ? (
                          <Badge className="bg-yellow-500/10 text-yellow-600">
                            Suspended
                          </Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="View Profile"
                            onClick={() =>
                              window.open(`/creator/${user.username}`, "_blank")
                            }
                          >
                            <ExternalLink size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Suspend"
                            onClick={() => openConfirm("suspend", user)}
                            disabled={!!userStatus}
                          >
                            <Pause size={14} className="text-yellow-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Ban"
                            onClick={() => openConfirm("ban", user)}
                            disabled={userStatus === "banned"}
                          >
                            <Ban size={14} className="text-danger" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {filteredUsers.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted">
              No users found.
            </div>
          ) : (
            filteredUsers.map((user) => {
              const userStatus = actionedUsers[user.id];
              return (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={user.avatar_url}
                      name={user.display_name}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {user.display_name}
                        </span>
                        {user.is_verified && (
                          <ShieldCheck
                            size={14}
                            className="text-success shrink-0"
                          />
                        )}
                      </div>
                      <span className="text-xs text-muted">
                        @{user.username}
                      </span>
                    </div>
                    {getRoleBadge(user.role)}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span>{user.story_count} stories</span>
                    <span>Joined {formatDate(user.created_at)}</span>
                    {userStatus === "banned" ? (
                      <Badge variant="danger">Banned</Badge>
                    ) : userStatus === "suspended" ? (
                      <Badge className="bg-yellow-500/10 text-yellow-600">
                        Suspended
                      </Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        window.open(`/creator/${user.username}`, "_blank")
                      }
                    >
                      <ExternalLink size={13} />
                      Profile
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openConfirm("suspend", user)}
                      disabled={!!userStatus}
                    >
                      <Pause size={13} />
                      Suspend
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => openConfirm("ban", user)}
                      disabled={userStatus === "banned"}
                    >
                      <Ban size={13} />
                      Ban
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirmation modal */}
      <Modal
        open={confirmModal.open}
        onClose={() =>
          setConfirmModal({ open: false, action: "suspend", user: null })
        }
        title={
          confirmModal.action === "ban" ? "Ban User" : "Suspend User"
        }
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Are you sure you want to{" "}
            <span className="font-medium text-foreground">
              {confirmModal.action}
            </span>{" "}
            the user{" "}
            <span className="font-medium text-foreground">
              @{confirmModal.user?.username}
            </span>
            ?
            {confirmModal.action === "ban" &&
              " This action will permanently remove their access to the platform."}
            {confirmModal.action === "suspend" &&
              " This will temporarily restrict their account."}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setConfirmModal({
                  open: false,
                  action: "suspend",
                  user: null,
                })
              }
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={executeAction}
            >
              {confirmModal.action === "ban" ? "Ban User" : "Suspend User"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
