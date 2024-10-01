"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useDueGroupsQuery,
  useSession,
  useSubGroupsQuery,
} from "@/lib/queries";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, TrashIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [dueName, setDueName] = useState("");
  const [dueDescription, setDueDescription] = useState("");
  const session = useSession();
  const groups = useSubGroupsQuery(
    session.data?.session?.user.user_metadata.group_id,
  );
  const dueGroups = useDueGroupsQuery(
    session.data?.session?.user.user_metadata.group_id,
    session.data?.session?.user.id,
  );
  console.log({ dueGroups });

  const useNewGroup = useMutation({
    mutationKey: ["newSubGroup"],
    mutationFn: async () => {
      if (!name || !description) {
        toast.error("Please fill all fields");
        return;
      }
      if (!session.data?.session?.user.id) {
        throw new Error("Please login to create an expense group");
      }
      const res = await supabase.from("sub_groups").insert({
        name,
        desc: description,
        group_id: session.data?.session?.user.user_metadata.group_id,
      });
      if (res.error) {
        throw res.error;
      }
      return res.data;
    },
    onError: (err) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Group created successfully");
      groups.refetch();
    },
  });

  const useRemoveGroup = useMutation({
    mutationKey: ["removeSubGroup"],
    mutationFn: async (groupId: string) => {
      const { error: sessionError, data: session } =
        await supabase.auth.getUser();
      if (sessionError) {
        throw sessionError;
      }
      if (session.user.email !== process.env.ADMIN_EMAIL) {
        throw new Error("Only the admin can delete a group");
      }

      const res = await supabase.from("sub_groups").delete().eq("id", groupId);
      if (res.error) {
        throw res.error;
      }
      return res.data;
    },
    onError: (err) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Group deleted successfully");
      groups.refetch();
    },
  });

  const useNewDueGroup = useMutation({
    mutationKey: ["newDueGroup"],
    mutationFn: async () => {
      if (!dueName || !dueDescription) {
        toast.error("Please fill all fields");
        return;
      }
      if (!session.data?.session?.user.id) {
        throw new Error("Please login to create a due group");
      }

      const res = await supabase.from("due_groups").insert({
        name: dueName,
        owner: session.data.session.user.id,
        description: dueDescription,
        group_id: session.data?.session?.user.user_metadata.group_id,
      });
      if (res.error) {
        console.error(res.error);
        throw res.error;
      }
      return res.data;
    },
    onError: (err) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Due group created successfully");
      dueGroups.refetch();
      setDueName("");
      setDueDescription("");
    },
  });

  if (session.isPending) {
    return (
      <main className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </main>
    );
  }

  if (
    session.isError ||
    (!session.isPending && !session.data?.session?.user.id)
  ) {
    router.push("/signin");
  }

  return (
    <>
      <div className="min-h-screen p-4 space-y-4">
        <h1 className="text-3xl font-bold ">
          Here are all the expense groups you are in
        </h1>
        <div className="flex space-x-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Create Group</Button>
            </DialogTrigger>
            <DialogContent className="w-full bg-white bg-opacity-100">
              <DialogHeader>
                <DialogTitle>Create Group</DialogTitle>
                <DialogDescription>
                  Create a new group to share expenses with your roommates
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className=" items-center ">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className=" items-center ">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    className="col-span-3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => useNewGroup.mutate()}
                  disabled={useNewGroup.isPending}
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button>Add Due Group</Button>
            </DialogTrigger>
            <DialogContent className="w-full bg-white bg-opacity-100">
              <DialogHeader>
                <DialogTitle>Add Due Group</DialogTitle>
                <DialogDescription>
                  Create a new due group to track who you have lent money to
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className=" items-center ">
                  <Label htmlFor="dueName" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="dueName"
                    value={dueName}
                    onChange={(e) => setDueName(e.target.value)}
                  />
                </div>
                <div className=" items-center ">
                  <Label htmlFor="dueDescription" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="dueDescription"
                    className="col-span-3"
                    value={dueDescription}
                    onChange={(e) => setDueDescription(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => useNewDueGroup.mutate()}
                  disabled={useNewDueGroup.isPending}
                >
                  Add Due Group
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <h2 className="text-2xl font-bold mt-8">Expense Groups</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {groups.data?.map((group) => (
            <Link href={`/dashboard/${group.id}`} key={group.id}>
              <Card className="w-full relative hover:shadow-md">
                <span className="absolute top-4 right-4">
                  <Button
                    variant={"destructive"}
                    size={"icon"}
                    onClick={() => {
                      setSelectedGroup(group.id);
                      useRemoveGroup.mutate(group.id);
                    }}
                    disabled={
                      useRemoveGroup.isPending && selectedGroup === group.id
                    }
                  >
                    <TrashIcon size={20} />
                  </Button>
                </span>
                <CardHeader>
                  <CardTitle>{group.name}</CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
                <CardContent></CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <h2 className="text-2xl font-bold mt-8">Due Groups</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {dueGroups.data?.map((dueGroup) => (
            <Link href={`/dashboard/dues/${dueGroup.id}`} key={dueGroup.id}>
              <Card key={dueGroup.id} className="w-full hover:shadow-md">
                <CardHeader>
                  <CardTitle>{dueGroup.name}</CardTitle>
                  <CardDescription>{dueGroup.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
