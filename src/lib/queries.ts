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
        .eq("group_id", groupId);

      if (expenses.error) {
        throw expenses.error;
      }
      console.log({ expenses: expenses.data });

      return expenses.data as unknown as Expense[];
    },
    enabled: true,
  });
};
