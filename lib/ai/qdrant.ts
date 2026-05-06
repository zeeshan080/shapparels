import { QdrantClient } from "@qdrant/js-client-rest";

const COLLECTION_NAME = "documents";
const VECTOR_SIZE = 1536;

export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

let collectionEnsured = false;

export async function ensureCollection() {
  if (collectionEnsured) return;

  const collections = await qdrant.getCollections();
  const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);

  if (!exists) {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_SIZE,
        distance: "Cosine",
      },
    });
  }

  const info = await qdrant.getCollection(COLLECTION_NAME);
  const indexed = Object.keys(info.payload_schema ?? {});

  if (!indexed.includes("chunkIndex")) {
    await qdrant.createPayloadIndex(COLLECTION_NAME, {
      field_name: "chunkIndex",
      field_schema: "integer",
    });
  }
  if (!indexed.includes("documentId")) {
    await qdrant.createPayloadIndex(COLLECTION_NAME, {
      field_name: "documentId",
      field_schema: "keyword",
    });
  }

  collectionEnsured = true;
}

export { COLLECTION_NAME };
