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
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { PlusCircle, Search, Calendar } from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
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
import {
  Expense,
  User,
  useExpensesQuery,
  useRoommatesQuery,
  useSession,
} from "@/lib/queries";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Dashboard({ params }: { params: { groupId: string } }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [sharedBy, setSharedBy] = useState<User[]>([]);
  const [filter, setFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const sessionQuery = useSession();

  const roommates = useRoommatesQuery(
    sessionQuery.data?.session?.user.user_metadata.group_id,
  );
  const {
    data: expenses = [],
    isPending: expensePending,
    refetch: refetchExpenses,
  } = useExpensesQuery(params.groupId);

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
        sub_group_id: params.groupId,
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
      refetchExpenses();
    },
  });

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

  if (roommates.isPending || expensePending || sessionQuery.isPending) {
    return (
      <div className="min-h-screen bg-background p-4 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Expense Logs</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Log New Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-md bg-white bg-opacity-100">
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
                  disabled={useAddSpent.isPending}
                >
                  {useAddSpent.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Submit Expense
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
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
          <div className="relative w-full sm:w-48">
            <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <ExpenseList
          expenses={filteredExpenses}
          rowsPerPage={parseInt(rowsPerPage)}
          setRowsPerPage={setRowsPerPage}
        />
        <ExpenseSummary expenses={expenses} users={roommates.data} />
      </div>
    </div>
  );
}

function ExpenseList({
  expenses,
  rowsPerPage,
  setRowsPerPage,
}: {
  expenses: Expense[];
  rowsPerPage: number;
  setRowsPerPage: (value: string) => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const indexOfLastExpense = currentPage * rowsPerPage;
  const indexOfFirstExpense = indexOfLastExpense - rowsPerPage;
  const currentExpenses = expenses.slice(
    indexOfFirstExpense,
    indexOfLastExpense,
  );

  const totalPages = Math.ceil(expenses.length / rowsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader className="bg-gray-50 dark:bg-gray-900">
        <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
          Expense List
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="hidden sm:table-header-group">
              <TableRow className="bg-gray-100 dark:bg-gray-700">
                <TableHead className="w-[100px] font-semibold text-gray-600 dark:text-gray-300">
                  Date
                </TableHead>
                <TableHead className="font-semibold text-gray-600 dark:text-gray-300">
                  Description
                </TableHead>
                <TableHead className="font-semibold text-gray-600 dark:text-gray-300">
                  Amount
                </TableHead>
                <TableHead className="font-semibold text-gray-600 dark:text-gray-300">
                  Paid By
                </TableHead>
                <TableHead className="font-semibold text-gray-600 dark:text-gray-300">
                  Shared By
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentExpenses.map((expense, index) => (
                <TableRow
                  key={expense.id}
                  className={`flex flex-col sm:table-row border-y border-y-gray-300 dark:border-y-gray-700 ${
                    index % 2 === 0
                      ? "bg-gray-50 dark:bg-gray-800"
                      : "bg-white dark:bg-gray-900"
                  }`}
                >
                  <TableCell className="sm:w-[100px] py-4">
                    <span className="sm:hidden font-bold text-gray-600 dark:text-gray-300 mr-2">
                      Date:
                    </span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {moment(expense.created_at).format("DD MMM YYYY")}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="sm:hidden font-bold text-gray-600 dark:text-gray-300 mr-2">
                      Description:
                    </span>
                    <span className="text-gray-800 dark:text-gray-200">
                      {expense.description}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="sm:hidden font-bold text-gray-600 dark:text-gray-300 mr-2">
                      Amount:
                    </span>
                    <Badge
                      variant="outline"
                      className="font-semibold text-green-600 dark:text-green-400 border-green-600 dark:border-green-400"
                    >
                      ₹{expense.amount.toFixed(2)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="sm:hidden font-bold text-gray-600 dark:text-gray-300 mr-2">
                      Paid By:
                    </span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {expense.paid_by?.full_name}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="sm:hidden font-bold text-gray-600 dark:text-gray-300 mr-2">
                      Shared By:
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {expense.shared_by
                        .map((user) => user?.full_name)
                        .join(", ")}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="rowsPerPage">Rows per page:</Label>
            <Select
              value={rowsPerPage.toString()}
              onValueChange={setRowsPerPage}
            >
              <SelectTrigger id="rowsPerPage" className="w-[100px]">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((value) => (
                  <SelectItem key={value} value={value.toString()}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="flex items-center"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center"
            >
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const ExpenseSummary = ({ expenses, users }) => {
  const [expandedUser, setExpandedUser] = useState(null);

  const calculateBalances = () => {
    const balances = {};
    users.forEach((user) => {
      balances[user.id] = { spent: 0, shared: 0, balance: 0 };
    });

    expenses.forEach((expense) => {
      const payer = expense.paid_by.id;
      const amount = expense.amount;
      const sharedBy = expense.shared_by;
      const shareAmount = amount / sharedBy.length;

      balances[payer].spent += amount;

      sharedBy.forEach((user) => {
        balances[user.id].shared += shareAmount;
        if (user.id !== payer) {
          balances[payer].balance += shareAmount;
          balances[user.id].balance -= shareAmount;
        }
      });
    });

    return balances;
  };

  const balances = calculateBalances();

  const calculateOwings = () => {
    const owings = [];
    const userIds = Object.keys(balances);

    for (let i = 0; i < userIds.length; i++) {
      for (let j = i + 1; j < userIds.length; j++) {
        const user1 = userIds[i];
        const user2 = userIds[j];
        const balance = balances[user1].balance - balances[user2].balance;

        if (Math.abs(balance) > 0.01) {
          owings.push({
            from: balance < 0 ? user1 : user2,
            to: balance < 0 ? user2 : user1,
            amount: Math.abs(balance) / 2,
          });
        }
      }
    }

    return owings;
  };

  const owings = calculateOwings();

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-bold">
            Expense Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <Card key={user.id} className="bg-white dark:bg-gray-800">
                <CardHeader
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandedUser(expandedUser === user.id ? null : user.id)
                  }
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{user.full_name}</h3>
                    {expandedUser === user.id ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </CardHeader>
                <CardContent
                  className={`space-y-2 ${
                    expandedUser === user.id ? "" : "hidden sm:block"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Total Spent:
                    </span>
                    <Badge variant="secondary">
                      ₹{balances[user.id].spent.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Shared Expenses:
                    </span>
                    <Badge variant="secondary">
                      ₹{balances[user.id].shared.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Net Balance:
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        balances[user.id].balance > 0
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                      }
                    >
                      {balances[user.id].balance > 0 ? "Is owed " : "Owes "}₹
                      {Math.abs(balances[user.id].balance).toFixed(2)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6 text-center">
            <p className="text-lg font-semibold">
              Total Expenses:{" "}
              <span className="text-2xl font-bold text-primary">
                ₹{totalExpenses.toFixed(2)}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-bold">
            Who Owes Whom
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
            <div className="space-y-4">
              {owings.map((owing, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {users.find((u) => u.id === owing.from).full_name}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                    <span className="font-medium">
                      {users.find((u) => u.id === owing.to).full_name}
                    </span>
                  </div>
                  <Badge variant="secondary">₹{owing.amount.toFixed(2)}</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
