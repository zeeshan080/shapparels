import { getContactMessages } from "@/lib/db/queries/contact";
import { MessageList } from "@/components/admin/message-list";

interface MessagesPageProps {
  searchParams: Promise<{ filter?: string; page?: string }>;
}

export default async function AdminMessagesPage({ searchParams }: MessagesPageProps) {
  const params = await searchParams;
  const filter = params.filter || "all";

  const { messages, total, page, totalPages } = await getContactMessages({
    page: params.page ? Number(params.page) : 1,
    unreadOnly: filter === "unread",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">{total} total messages</p>
      </div>

      <MessageList
        messages={messages}
        filter={filter}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
