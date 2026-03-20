import { formatNaira } from "@/shared/lib/utils";
import { Customer } from "@/shared/types";
import { Avatar } from "@/shared/ui/Avatar";

export function CustomerChip({ customer }: { customer: Customer }) {
  const isPaid = !customer.totalDebt || customer.totalDebt === 0;
  return (
    <div className="fcim-customer-chip">
      <Avatar name={customer.name} />
      <div>
        <div className="fcim-customer-name">{customer.name}</div>
        <div className={`fcim-customer-debt ${isPaid ? "paid" : ""}`}>
          {isPaid ? "All cleared" : `₦${formatNaira(customer.totalDebt ?? 0)}`}
        </div>
      </div>
    </div>
  );
}