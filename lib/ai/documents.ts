import { qdrant, ensureCollection, COLLECTION_NAME } from "./qdrant";
import { parseFile } from "./parsers";
import { chunkText } from "./chunking";
import { generateEmbeddings } from "./embeddings";
import type { DocumentMetadata, DocumentDetail } from "./types";

function generateId(): string {
  return crypto.randomUUID();
}

export async function uploadDocument(file: File): Promise<DocumentMetadata> {
  await ensureCollection();

  const documentId = generateId();
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name;
  const fileType = fileName.split(".").pop()?.toLowerCase() || "unknown";
  const fileSize = file.size;
  const uploadedAt = new Date().toISOString();

  const text = await parseFile(buffer, fileName);

  const chunks = chunkText(text);
  if (chunks.length === 0) {
    throw new Error("No content could be extracted from the file");
  }

  const embeddings = await generateEmbeddings(chunks);

  const points = chunks.map((chunkText, index) => ({
    id: generateId(),
    vector: embeddings[index],
    payload: {
      documentId,
      documentName: fileName,
      chunkIndex: index,
      chunkText,
      totalChunks: chunks.length,
      uploadedAt,
      fileType,
      fileSize,
      status: "ready",
    },
  }));

  await qdrant.upsert(COLLECTION_NAME, { points });

  return {
    documentId,
    documentName: fileName,
    fileType,
    fileSize,
    totalChunks: chunks.length,
    uploadedAt,
    status: "ready",
  };
}

export async function listDocuments(): Promise<DocumentMetadata[]> {
  await ensureCollection();

  const result = await qdrant.scroll(COLLECTION_NAME, {
    filter: {
      must: [{ key: "chunkIndex", match: { value: 0 } }],
    },
    with_payload: true,
    limit: 100,
  });

  return result.points.map((point) => {
    const p = point.payload as Record<string, unknown>;
    return {
      documentId: p.documentId as string,
      documentName: p.documentName as string,
      fileType: p.fileType as string,
      fileSize: p.fileSize as number,
      totalChunks: p.totalChunks as number,
      uploadedAt: p.uploadedAt as string,
      status: p.status as "processing" | "ready" | "error",
    };
  });
}

export async function getDocument(documentId: string): Promise<DocumentDetail | null> {
  await ensureCollection();

  const result = await qdrant.scroll(COLLECTION_NAME, {
    filter: {
      must: [{ key: "documentId", match: { value: documentId } }],
    },
    with_payload: true,
    limit: 1000,
  });

  if (result.points.length === 0) return null;

  const points = result.points.sort((a, b) => {
    const aIndex = (a.payload as Record<string, unknown>).chunkIndex as number;
    const bIndex = (b.payload as Record<string, unknown>).chunkIndex as number;
    return aIndex - bIndex;
  });

  const first = points[0].payload as Record<string, unknown>;

  return {
    documentId: first.documentId as string,
    documentName: first.documentName as string,
    fileType: first.fileType as string,
    fileSize: first.fileSize as number,
    totalChunks: first.totalChunks as number,
    uploadedAt: first.uploadedAt as string,
    status: first.status as "processing" | "ready" | "error",
    chunks: points.map((point) => {
      const p = point.payload as Record<string, unknown>;
      return {
        chunkIndex: p.chunkIndex as number,
        chunkText: p.chunkText as string,
      };
    }),
  };
}

export async function deleteDocument(documentId: string): Promise<void> {
  await ensureCollection();

  await qdrant.delete(COLLECTION_NAME, {
    filter: {
      must: [{ key: "documentId", match: { value: documentId } }],
    },
  });
}
