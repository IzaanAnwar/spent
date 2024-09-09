"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useGroupsQuery } from "@/lib/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { SelectValue } from "@radix-ui/react-select";

export default function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [groupId, setGroupId] = useState("");

  const allGroups = useGroupsQuery();

  const useSignup = useMutation({
    mutationKey: ["signup"],
    mutationFn: async () => {
      if (!fullName || !email || !password) {
        toast.error("Please fill all fields");
        return;
      }
      if (!groupId) {
        toast.error("Please select a group");
        return;
      }
      const res = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            group_id: groupId,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        },
      });
      if (res.error) {
        throw res.error;
      }
      const pgRes = await supabase.from("users").insert({
        email,
        full_name: fullName,
        group_id: groupId,
      });
      if (pgRes.error) {
        throw pgRes.error;
      }
      return res.data;
    },
    onError: (err) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("We have sent you an email to verify your account");
    },
  });

  return (
    <main className="min-h-[90svh] flex flex-col items-center justify-center ">
      <Card className="mx-auto w-full md:max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid  gap-4">
              <Select onValueChange={(e) => setGroupId(e)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {allGroups.data?.map((gr) => (
                    <SelectItem value={gr?.id} key={gr?.id}>
                      {gr?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid  gap-4">
              <Label htmlFor="full-name">Full name</Label>
              <Input
                id="full-name"
                placeholder="Robinson"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              onClick={() => useSignup.mutate()}
              isPending={useSignup.isPending}
            >
              Create an account
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/signin" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
