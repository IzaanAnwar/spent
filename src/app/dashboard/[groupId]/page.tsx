"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { PlusCircle, Search, Calendar } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Expense,
  User,
  useExpensesQuery,
  useRoommatesQuery,
} from "@/lib/queries";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import moment from "moment";

export default function Dashboard({ params }: { params: { groupId: string } }) {
  console.log({ params });
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [sharedBy, setSharedBy] = useState<User[]>([]);
  const [filter, setFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const roommates = useRoommatesQuery(params.groupId);
  const { data: expenses = [] } = useExpensesQuery(params.groupId);

  const useAddSpent = useMutation({
    mutationKey: ["addSpent"],
    mutationFn: async () => {
      if (!description || !amount || !paidBy) {
        toast.error("Please fill all fields");
        return;
      }
      if (!sharedBy.length) {
        toast.error("Please select at least one roommate");
        return;
      }
      const res = await supabase.from("spent").insert({
        description,
        amount,
        paid_by: paidBy,
        shared_by: sharedBy,
        group_id: params.groupId,
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
      toast.success("Expense logged successfully");
    },
  });

  const userMap = new Map(roommates.data?.map((user) => [user.id, user]));
  const filteredExpenses = expenses.filter(
    (expense) =>
      (expense.description.toLowerCase().includes(filter.toLowerCase()) ||
        expense.paid_by?.full_name
          .toLowerCase()
          .includes(filter.toLowerCase()) ||
        expense.shared_by.some((person) =>
          person.full_name.toLowerCase().includes(filter.toLowerCase()),
        )) &&
      (dateFilter === "" || expense.created_at.includes(dateFilter)),
  );

  const calculateTotals = (expenses: Expense[]) => {
    const totals: Record<string, { spent: number; owed: number }> = {};

    expenses.forEach((expense) => {
      const payer = userMap.get(expense.paid_by.id);
      if (!payer) return;

      const sharedAmount = expense.amount / expense.shared_by.length;

      if (!totals[payer.id]) totals[payer.id] = { spent: 0, owed: 0 };
      totals[payer.id].spent += expense.amount;

      expense.shared_by.forEach((person) => {
        if (!totals[person.id]) totals[person.id] = { spent: 0, owed: 0 };
        if (person.id !== payer.id) {
          totals[person.id].owed += sharedAmount;
          totals[payer.id].owed -= sharedAmount;
        }
      });
    });

    return totals;
  };

  const calculateBalances = (
    totals: Record<string, { spent: number; owed: number }>,
  ) => {
    const balances: Record<string, Record<string, number>> = {};
    const roommates = Object.keys(totals);
    roommates.forEach((payer) => {
      balances[payer] = {};
      roommates.forEach((receiver) => {
        if (payer !== receiver) {
          const amount = totals[payer].owed - totals[receiver].owed;
          if (amount > 0) {
            balances[payer][receiver] = amount;
          }
        }
      });
    });

    return balances;
  };

  const totals = calculateTotals(expenses);
  const balances = calculateBalances(totals);

  console.log({ sharedBy });
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto p-4 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Expense Logs</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Log New Expense</Button>
            </DialogTrigger>
            <DialogContent className="w-full bg-white bg-opacity-100">
              <DialogHeader>
                <DialogTitle>Log Your Expenses</DialogTitle>
                <DialogDescription>
                  Enter the details of your shared expense
                </DialogDescription>
              </DialogHeader>

              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What was bought?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paidBy">Paid by</Label>
                    <Select value={paidBy} onValueChange={setPaidBy}>
                      <SelectTrigger id="paidBy">
                        <SelectValue placeholder="Select a roommate" />
                      </SelectTrigger>
                      <SelectContent>
                        {roommates.data?.map((roommate) => (
                          <SelectItem key={roommate.id} value={roommate.id}>
                            {roommate.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Shared by</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {roommates.data?.map((roommate) => (
                        <div
                          key={roommate.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`shared-${roommate.id}`}
                            checked={sharedBy.includes(roommate)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSharedBy([...sharedBy, roommate]);
                              } else {
                                setSharedBy(
                                  sharedBy.filter((r) => r.id !== roommate.id),
                                );
                              }
                            }}
                          />
                          <Label htmlFor={`shared-${roommate.id}`}>
                            {roommate.full_name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              <DialogFooter>
                <Button
                  className="w-full"
                  onClick={() => useAddSpent.mutate()}
                  isPending={useAddSpent.isPending}
                >
                  Submit Expense
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex space-x-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search expenses..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="relative w-48">
            <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <ExpenseList expenses={filteredExpenses} />
        <SummarySection totals={totals} userMap={userMap} />
        <BalancesSection balances={balances} userMap={userMap} />
      </div>
    </div>
  );
}

function ExpenseList({ expenses }: { expenses: Expense[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense List</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Paid By</TableHead>
              <TableHead>Shared By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {moment(expense.created_at).format("DD MMM YYYY")}
                </TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>₹{expense.amount.toFixed(2)}</TableCell>
                <TableCell>{expense.paid_by?.full_name}</TableCell>
                <TableCell>
                  {expense.shared_by.map((user) => user?.full_name).join(", ")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
function SummarySection({
  totals,
  userMap,
}: {
  totals: Record<string, { spent: number; owed: number }>;
  userMap: Map<string, User>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(totals).map(([userId, { spent, owed }]) => {
            const user = userMap.get(userId);
            if (!user) return null;
            return (
              <Card key={userId} className="flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="text-lg">{user.full_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Spent
                      </p>
                      <p className="text-xl font-bold">₹{spent.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p
                        className={`text-xl font-bold ${owed < 0 ? "text-red-500" : "text-green-500"}`}
                      >
                        {owed < 0 ? "-" : ""}₹{Math.abs(owed).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function BalancesSection({
  balances,
  userMap,
}: {
  balances: Record<string, Record<string, number>>;
  userMap: Map<string, User>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Balances Between Roommates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(balances).flatMap(([payerId, receivers]) =>
            Object.entries(receivers).map(([receiverId, amount]) => {
              const payer = userMap.get(payerId);
              const receiver = userMap.get(receiverId);
              if (!payer || !receiver) return null;
              return (
                <Card
                  key={`${payerId}-${receiverId}`}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center">
                    <div>
                      <p className="font-medium">{payer.full_name}</p>
                      <p className="text-sm text-muted-foreground">owes</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-right">
                      <p className="font-medium">{receiver.full_name}</p>
                      <p className="text-sm font-bold">₹{amount.toFixed(2)}</p>
                    </div>
                  </div>
                </Card>
              );
            }),
          )}
        </div>
      </CardContent>
    </Card>
  );
}
