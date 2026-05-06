"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUploadForm } from "@/components/admin/rag/document-upload-form";
import { DocumentList } from "@/components/admin/rag/document-list";
import { ChatInterface } from "@/components/chat/chat-interface";
import { useDocuments } from "@/hooks/use-documents";

export default function AdminAiChatPage() {
  const { documents, isLoading, uploadFile, deleteDocument } = useDocuments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">AI Chat</h1>
        <p className="text-muted-foreground">
          Upload knowledge documents and chat with the admin assistant.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">
                Knowledge Base
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DocumentUploadForm onUpload={uploadFile} />
              <DocumentList
                documents={documents}
                isLoading={isLoading}
                onDelete={deleteDocument}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="flex h-[700px] flex-col overflow-hidden p-0">
          <ChatInterface variant="widget" role="admin" />
        </Card>
      </div>
    </div>
  );
}
