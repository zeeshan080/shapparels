import Link from "next/link";
import { getOrders } from "@/lib/db/queries/orders";
import { OrderTable } from "@/components/admin/order-table";
import { ORDER_STATUSES } from "@/lib/constants";

interface OrdersPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const currentStatus = params.status || "all";

  const { orders, total, page, totalPages } = await getOrders({
    status: currentStatus,
    page: params.page ? Number(params.page) : 1,
  });

  const tabs = [
    { label: "All", value: "all" },
    ...ORDER_STATUSES.map((s) => ({
      label: s.charAt(0).toUpperCase() + s.slice(1),
      value: s,
    })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">{total} total orders</p>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/orders${tab.value === "all" ? "" : `?status=${tab.value}`}`}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              currentStatus === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border/50 text-muted-foreground hover:bg-accent"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <OrderTable orders={orders} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/orders?${new URLSearchParams({
                ...(currentStatus !== "all" ? { status: currentStatus } : {}),
                page: p.toString(),
              }).toString()}`}
              className={`flex h-9 w-9 items-center justify-center rounded-md text-sm ${
                p === page
                  ? "bg-primary text-primary-foreground"
                  : "border border-border hover:bg-accent"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
