import { sampleDocuments } from "./core/sampleData.js";

const STORAGE_KEY = "lexicore.documents.v1";

export function loadDocuments() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return sampleDocuments;
    }
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return sampleDocuments;
    }
    return parsed;
  } catch {
    return sampleDocuments;
  }
}

export function saveDocuments(documents) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}

export function exportDocuments(documents) {
  const blob = new Blob([JSON.stringify(documents, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lexicore-documents.json";
  link.click();
  URL.revokeObjectURL(url);
}

export async function importDocuments(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error("Import file must contain a JSON array.");
  }
  return parsed.map((doc) => ({
    id: String(doc.id || crypto.randomUUID()),
    title: String(doc.title || "Untitled"),
    body: String(doc.body || ""),
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString()
  }));
}
