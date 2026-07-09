// components/payment-form.tsx
"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Payment, usePaymentsStore } from "@/store/paymnet";

export function PaymentForm() {
  const addPayment = usePaymentsStore((state) => state.addPayment);

  const [email, setEmail] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [status, setStatus] = React.useState("pending");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedAmount = Number(amount);

    if (!email.trim()) return;
    if (!amount || Number.isNaN(parsedAmount)) return;

    const newPayment: Payment = {
      id: crypto.randomUUID(),
      email: email.trim(),
      amount: parsedAmount,
      status,
    };

    addPayment(newPayment);

    setEmail("");
    setAmount("");
    setStatus("pending");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-end"
    >
      <div className="grid gap-1">
        <label className="text-sm font-medium">Email</label>
        <Input
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium">Amount</label>
        <Input
          type="number"
          placeholder="100"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium">Status</label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <Button type="submit">Add payment</Button>
    </form>
  );
}
