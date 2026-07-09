import { PaymentForm } from "@/components/form";
import { DataTable } from "@/components/ui/data-table";
import React from "react";

type Props = {};

const Page = (props: Props) => {
  const columns = [
    {
      accessorKey: "status",
      header: "Status",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "amount",
      header: "Amount",
    },
  ];

  return (
    <div>
      <PaymentForm />

      <DataTable columns={columns} />
    </div>
  );
};

export default Page;
