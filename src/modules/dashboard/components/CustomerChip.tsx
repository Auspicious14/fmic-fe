import { formatCurrency, cn } from "@/shared/lib/utils";
import { Customer } from "@/shared/types";
import { Avatar } from "@/shared/ui/Avatar";
import { ChevronRight } from "lucide-react";

export function CustomerChip({ customer }: { customer: Customer }) {
  const balance = customer.totalDebt ?? customer.outstandingBalance ?? 0;
  const isPaid = balance <= 0;
  
  return (
    <div className="fcim-debtor-card">
      <Avatar name={customer.name} className="w-12 h-12 rounded-xl" />
      <div className="fcim-debtor-info">
        <div className="fcim-debtor-name">{customer.name}</div>
        <div className={cn("fcim-debtor-balance", isPaid && "paid")}>
          {isPaid ? "ALL CLEARED" : formatCurrency(balance)}
        </div>
        <div className="fcim-debtor-meta">
          {customer.tag || "REGULAR CUSTOMER"}
        </div>
      </div>
      <div className="p-2 bg-elevated rounded-xl text-muted">
        <ChevronRight size={16} />
      </div>
    </div>
  );
}