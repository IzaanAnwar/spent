"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGroupsQuery } from "@/lib/queries";

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
import { TrashIcon } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const groups = useGroupsQuery();

  const useNewGroup = useMutation({
    mutationKey: ["newGroup"],
    mutationFn: async () => {
      if (!name || !description) {
        toast.error("Please fill all fields");
        return;
      }
      const res = await supabase.from("groups").insert({
        name,
        description,
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
    mutationKey: ["removeGroup"],
    mutationFn: async (groupId: string) => {
      const { error: sessionError, data: session } =
        await supabase.auth.getUser();
      if (sessionError) {
        throw sessionError;
      }
      if (session.user.email !== process.env.ADMIN_EMAIL) {
        throw new Error("Only the admin can delete a group");
      }

      const res = await supabase.from("groups").delete().eq("id", groupId);
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

  return (
    <>
      <div className="min-h-screen p-4 space-y-4">
        <h1 className="text-3xl font-bold ">
          Here are all the groups you have created
        </h1>
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
                isPending={useNewGroup.isPending}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                    isPending={
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
      </div>
    </>
  );
}
