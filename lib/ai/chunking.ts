const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const SEPARATORS = ["\n\n", "\n", ". ", " "];

export function chunkText(text: string): string[] {
  const chunks: string[] = [];
  const trimmed = text.trim();

  if (trimmed.length <= CHUNK_SIZE) {
    return trimmed.length > 0 ? [trimmed] : [];
  }

  let start = 0;

  while (start < trimmed.length) {
    let end = start + CHUNK_SIZE;

    if (end >= trimmed.length) {
      chunks.push(trimmed.slice(start).trim());
      break;
    }

    let splitAt = -1;
    for (const sep of SEPARATORS) {
      const lastIndex = trimmed.lastIndexOf(sep, end);
      if (lastIndex > start) {
        splitAt = lastIndex + sep.length;
        break;
      }
    }

    if (splitAt === -1) {
      splitAt = end;
    }

    const chunk = trimmed.slice(start, splitAt).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    start = splitAt - CHUNK_OVERLAP;
    if (start < 0) start = 0;
    if (start >= splitAt) start = splitAt;
  }

  return chunks;
}
