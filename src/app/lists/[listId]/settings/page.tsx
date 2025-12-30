"use client";

import { InviteLink } from "@/components/lists/invite-link";
import { MemberList } from "@/components/lists/member-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Footer } from "@/components/ui/footer";
import Header from "@/components/ui/header";
import { Input } from "@/components/ui/input";
import { useListDetail } from "@/hooks/use-list-detail";
import { useLists } from "@/hooks/use-lists";
import { useSession } from "@/lib/auth-client";
import { entryApi } from "@/lib/api/fetchers";
import { downloadCSV, entriesToCSV } from "@/lib/csv-export";
import { ArrowLeft, Download, LogOut, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ListSettingsPage = () => {
  const router = useRouter();
  const params = useParams();
  const listId = params.listId as string;
  const { data: session } = useSession();

  const { list, isLoading, error, updateList, isUpdating } =
    useListDetail(listId);
  const { deleteList, leaveList } = useLists();
  const [name, setName] = useState("");
  const [nameInitialized, setNameInitialized] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const isOwner = list?.role === "owner";
  const canEdit = list?.role === "owner" || list?.role === "member";

  useEffect(() => {
    if (error) {
      router.push("/lists");
    }
  }, [error, router]);

  if (list && !nameInitialized) {
    setName(list.name);
    setNameInitialized(true);
  }

  const handleSave = async () => {
    if (!name.trim() || name === list?.name) return;
    await updateList({ name: name.trim() });
  };

  const handleRegenerateInvite = async () => {
    await updateList({ regenerateInviteCode: true });
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this list? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    const success = await deleteList(listId);
    if (success) {
      router.push("/lists");
    }
    setIsDeleting(false);
  };

  const handleLeave = async () => {
    if (
      !confirm(
        "Are you sure you want to leave this list? You will lose access to all entries."
      )
    ) {
      return;
    }

    setIsLeaving(true);
    const success = await leaveList(listId);
    if (success) {
      router.push("/lists");
    }
    setIsLeaving(false);
  };

  const handleExport = async () => {
    if (!list) return;

    setIsExporting(true);
    try {
      const entries = await entryApi.getByList(listId);
      const csv = entriesToCSV(entries);
      const filename = `${list.name.replace(/[^a-z0-9]/gi, "_")}_export_${new Date().toISOString().split("T")[0]}.csv`;
      downloadCSV(csv, filename);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export entries. Please try again.");
    }
    setIsExporting(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Link
          href="/lists"
          className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lists
        </Link>

        <h1 className="mb-8 text-2xl font-bold">List Settings</h1>

        {isLoading ? (
          <p className="text-zinc-500">Loading...</p>
        ) : !list || !session ? (
          <p className="text-zinc-500">Error! Something went wrong...</p>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General</CardTitle>
                <CardDescription>
                  {isOwner ? "Update your list name" : "View list details"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    List Name
                  </label>
                  {isOwner ? (
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  ) : (
                    <p className="text-lg font-medium">{list.name}</p>
                  )}
                </div>
                {isOwner && (
                  <Button
                    onClick={handleSave}
                    disabled={isUpdating || !name.trim() || name === list.name}
                  >
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle>Invite Link</CardTitle>
                  <CardDescription>
                    Share this link to invite others to your list
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <InviteLink
                    inviteCode={list.inviteCode}
                    onRegenerate={handleRegenerateInvite}
                    showRegenerate
                  />
                </CardContent>
              </Card>
            )}

            {canEdit && (
              <Card>
                <CardHeader>
                  <CardTitle>Export Data</CardTitle>
                  <CardDescription>
                    Download all entries and watch history as a CSV file
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    disabled={isExporting}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isExporting ? "Exporting..." : "Export to CSV"}
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Members</CardTitle>
                <CardDescription>
                  {isOwner
                    ? "Manage who has access to this list"
                    : "View who has access to this list"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MemberList
                  listId={listId}
                  currentUserRole={list.role}
                  currentUserId={session.user.id}
                />
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>
                  {isOwner
                    ? "Permanently delete this list and all its entries"
                    : "Leave this list and lose access to all entries"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isOwner ? (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? "Deleting..." : "Delete List"}
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={handleLeave}
                    disabled={isLeaving}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLeaving ? "Leaving..." : "Leave List"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ListSettingsPage;
