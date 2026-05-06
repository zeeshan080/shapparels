export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  role?: "user" | "admin";
}

export interface DocumentMetadata {
  documentId: string;
  documentName: string;
  fileType: string;
  fileSize: number;
  totalChunks: number;
  uploadedAt: string;
  status: "processing" | "ready" | "error";
}

export interface DocumentDetail extends DocumentMetadata {
  chunks: DocumentChunk[];
}

export interface DocumentChunk {
  chunkIndex: number;
  chunkText: string;
}
