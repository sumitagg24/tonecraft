const CHUNK_SIZE = 2000;
const CHUNK_OVERLAP = 200;

export interface TextChunk {
  index: number;
  content: string;
}

export function chunkText(text: string): TextChunk[] {
  const normalized = text.replace(/\n{3,}/g, "\n\n").trim();
  if (!normalized) return [];

  const chunks: TextChunk[] = [];
  const paragraphs = normalized.split(/\n\n+/);

  let buffer = "";
  let index = 0;

  const flush = () => {
    const content = buffer.trim();
    if (content) {
      chunks.push({ index, content });
      index += 1;
      buffer = "";
    }
  };

  for (const para of paragraphs) {
    if ((buffer + "\n\n" + para).length > CHUNK_SIZE && buffer.length > 0) {
      flush();
      // Carry the tail of the previous chunk for context continuity
      const prev = chunks[chunks.length - 1];
      if (prev) {
        const tail = prev.content.slice(-CHUNK_OVERLAP);
        if (tail.length > 0) buffer = tail + "\n\n";
      }
    }
    buffer = buffer ? buffer + "\n\n" + para : para;
  }
  flush();

  return chunks;
}

export function searchScore(query: string, content: string): number {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return 0;

  const docTokens = tokenize(content);
  const docSize = docTokens.length;
  if (docSize === 0) return 0;

  const docFreq = new Map<string, number>();
  for (const t of docTokens) docFreq.set(t, (docFreq.get(t) ?? 0) + 1);

  let score = 0;
  for (const t of qTokens) {
    const tf = docFreq.get(t) ?? 0;
    if (tf === 0) continue;
    score += Math.log1p(tf) * (1 + 2 / (1 + docSize / 500));
  }

  // Prefer chunks with higher token density relative to query
  return score / (1 + Math.log1p(docSize));
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}
