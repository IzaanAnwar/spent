"use client";

import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  InvalidateQueryFilters,
} from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/lib/queries";
import { toast } from "sonner";
import { Loader2, Pencil, Trash, Plus } from "lucide-react";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface Dues {
  id: string;
  created_at: string;
  amount: number;
  to_receive: boolean;
  status: "due" | "paid";
  due_group_id: string;
  recipient: string;
  description: string;
}

export default function MoneyTracker({
  params,
}: {
  params: { dueGroup: string };
}) {
  const session = useSession();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [toReceive, setToReceive] = useState(true);
  const [status, setStatus] = useState("due");
  const [recipient, setRecipient] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Dues | null>(
    null,
  );
  console.log({ params });
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["dues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dues")
        .select("*")
        .eq("due_group_id", params.dueGroup)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Dues[];
    },
  });

  const addTransaction = useMutation({
    mutationFn: async (
      newTransaction: Omit<
        Dues,
        "id" | "created_at" | "due_group_id" | "status"
      >,
    ) => {
      const { data, error } = await supabase
        .from("dues")
        .insert({
          ...newTransaction,
          status: "due",
          due_group_id: params.dueGroup,
        })
        .single();
      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dues"],
      });
      toast.success("Transaction added successfully");
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to add transaction: ${error.message}`);
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async (updatedTransaction: Partial<Dues>) => {
      const { data, error } = await supabase
        .from("dues")
        .update(updatedTransaction)
        .eq("id", updatedTransaction.id)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dues"] });
      toast.success("Transaction updated successfully");
      setSelectedTransaction(null);
    },
    onError: (error) => {
      toast.error(`Failed to update transaction: ${error.message}`);
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dues").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dues"] });
      toast.success("Transaction deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete transaction: ${error.message}`);
    },
  });

  const resetForm = () => {
    setAmount("");
    setToReceive(true);
    setStatus("due");
    setRecipient("");
    setDescription("");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  let totalTransactions = 0;
  if (transactions) {
    for (let i = 0; i < transactions.length; i++) {
      totalTransactions += transactions[i].amount;
    }
  }
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-8 text-3xl font-bold">Money Tracker</h1>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-4">
            <Plus className="mr-2 h-4 w-4" /> Add New Transaction
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
            <DialogDescription>
              Record a new borrowed or lent amount
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addTransaction.mutate({
                amount: parseInt(amount),
                to_receive: toReceive,
                recipient,
                description,
              });
            }}
          >
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  placeholder="Enter amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="type">Type</Label>
                <Select
                  onValueChange={(value) => setToReceive(value === "receive")}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="receive">To Receive</SelectItem>
                    <SelectItem value="give">To Give</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="recipient">To Whom</Label>
                <Input
                  id="recipient"
                  placeholder="Enter recipient's name"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter transaction description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit" isPending={addTransaction.isPending}>
                Add Transaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>View and manage your transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>To Whom</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(new Date(transaction.created_at), "PPP")}
                  </TableCell>
                  <TableCell>{transaction.amount}</TableCell>
                  <TableCell>
                    {transaction.to_receive ? "To Receive" : "To Give"}
                  </TableCell>
                  <TableCell>{transaction.status}</TableCell>
                  <TableCell>{transaction.recipient}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setSelectedTransaction(transaction)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-white">
                          <DialogHeader>
                            <DialogTitle>Edit Transaction</DialogTitle>
                            <DialogDescription>
                              Make changes to the transaction here. Click save
                              when you're done.
                            </DialogDescription>
                          </DialogHeader>
                          {selectedTransaction && (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                updateTransaction.mutate(selectedTransaction);
                              }}
                            >
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label
                                    htmlFor="edit-amount"
                                    className="text-right"
                                  >
                                    Amount
                                  </Label>
                                  <Input
                                    id="edit-amount"
                                    type="number"
                                    value={selectedTransaction.amount}
                                    onChange={(e) =>
                                      setSelectedTransaction({
                                        ...selectedTransaction,
                                        amount: parseInt(e.target.value),
                                      })
                                    }
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label
                                    htmlFor="edit-type"
                                    className="text-right"
                                  >
                                    Type
                                  </Label>
                                  <Select
                                    onValueChange={(value) =>
                                      setSelectedTransaction({
                                        ...selectedTransaction,
                                        to_receive: value === "receive",
                                      })
                                    }
                                    defaultValue={
                                      selectedTransaction.to_receive
                                        ? "receive"
                                        : "give"
                                    }
                                  >
                                    <SelectTrigger
                                      id="edit-type"
                                      className="col-span-3"
                                    >
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                      <SelectItem value="receive">
                                        To Receive
                                      </SelectItem>
                                      <SelectItem value="give">
                                        To Give
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label
                                    htmlFor="edit-status"
                                    className="text-right"
                                  >
                                    Status
                                  </Label>
                                  <Select
                                    onValueChange={(value) =>
                                      setSelectedTransaction({
                                        ...selectedTransaction,
                                        status: value,
                                      })
                                    }
                                    defaultValue={selectedTransaction.status}
                                  >
                                    <SelectTrigger
                                      id="edit-status"
                                      className="col-span-3"
                                    >
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                      <SelectItem value="due">Due</SelectItem>
                                      <SelectItem value="paid">Paid</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label
                                    htmlFor="edit-recipient"
                                    className="text-right"
                                  >
                                    To Whom
                                  </Label>
                                  <Input
                                    id="edit-recipient"
                                    value={selectedTransaction.recipient}
                                    onChange={(e) =>
                                      setSelectedTransaction({
                                        ...selectedTransaction,
                                        recipient: e.target.value,
                                      })
                                    }
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label
                                    htmlFor="edit-description"
                                    className="text-right"
                                  >
                                    Description
                                  </Label>
                                  <Textarea
                                    id="edit-description"
                                    value={selectedTransaction.description}
                                    onChange={(e) =>
                                      setSelectedTransaction({
                                        ...selectedTransaction,
                                        description: e.target.value,
                                      })
                                    }
                                    className="col-span-3"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  type="submit"
                                  isPending={updateTransaction.isPending}
                                >
                                  Save changes
                                </Button>
                              </DialogFooter>
                            </form>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="destructive"
                        size="icon"
                        isPending={deleteTransaction.isPending}
                        onClick={() => deleteTransaction.mutate(transaction.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter>
          <p className="text-center">
            Total transactions: {totalTransactions.toFixed(2)}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
