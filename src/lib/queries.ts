import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";

export const useGroupsQuery = () => {
  return useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const groups = await supabase.from("groups").select("*");
      console.log({ groups });
      if (groups.error) {
        throw groups.error;
      }
      return groups.data;
    },
    enabled: true,
  });
};

export const useSubGroupsQuery = (group_id: string) => {
  return useQuery({
    queryKey: ["sub_groups"],
    queryFn: async () => {
      const subGroups = await supabase
        .from("sub_groups")
        .select("*")
        .eq("group_id", group_id);
      console.log({ subGroups });
      if (subGroups.error) {
        throw subGroups.error;
      }
      return subGroups.data;
    },
    enabled: true,
  });
};

export type User = {
  id: string;
  full_name: string;
  group_id: string;
  email: string;
};
export const useRoommatesQuery = (groupId: string) => {
  return useQuery<User[]>({
    queryKey: ["roommates"],
    queryFn: async () => {
      // select users from the group
      const roommates = await supabase
        .from("users")
        .select("*")
        .eq("group_id", groupId);
      if (roommates.error) {
        throw roommates.error;
      }
      return roommates.data;
    },
    enabled: true,
  });
};

export type Expense = {
  id: number;
  description: string;
  amount: number;
  paid_by: { full_name: string; id: string };
  shared_by: User[];
  created_at: string;
};
export const useExpensesQuery = (groupId: string) => {
  return useQuery<Expense[]>({
    queryKey: ["expenses"],
    queryFn: async () => {
      // select spent from the group and all users ids
      const expenses = await supabase
        .from("spent")
        .select(
          `
            id,
            description,
            amount,
            paid_by: users(id, full_name),
            shared_by,
            created_at 
            `,
        )
        .eq("sub_group_id", groupId);

      if (expenses.error) {
        throw expenses.error;
      }

      return expenses.data as unknown as Expense[];
    },
    enabled: true,
  });
};

export const useSession = () => {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: session, error } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }
      return session;
    },
    enabled: true,
  });
};

export interface DueGroup {
  id: string;
  name: string;
  description: string;
  owner: string;
}

export const useDueGroupsQuery = (
  groupId: string,
  ownerId: string | undefined,
) => {
  return useQuery<DueGroup[]>({
    queryKey: ["due_groups"],
    queryFn: async () => {
      const dueGroups = await supabase
        .from("due_groups")
        .select("*")
        .eq("group_id", groupId)
        .eq("owner", ownerId);
      if (dueGroups.error) {
        throw dueGroups.error;
      }
      if (!dueGroups.data || dueGroups.data?.length === 0) {
        return [];
      }
      return dueGroups.data;
    },
    enabled: true,
  });
};
