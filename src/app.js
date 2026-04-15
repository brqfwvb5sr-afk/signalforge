import { createDocument, search, similarDocuments, suggestTags } from "./core/searchEngine.js";
import { exportDocuments, importDocuments, loadDocuments, saveDocuments } from "./storage.js";

const elements = {
  bodyInput: document.querySelector("#bodyInput"),
  clearSearchButton: document.querySelector("#clearSearchButton"),
  deleteDocumentButton: document.querySelector("#deleteDocumentButton"),
  editorTitle: document.querySelector("#editorTitle"),
  exportButton: document.querySelector("#exportButton"),
  importInput: document.querySelector("#importInput"),
  newDocumentButton: document.querySelector("#newDocumentButton"),
  results: document.querySelector("#results"),
  searchInput: document.querySelector("#searchInput"),
  searchStats: document.querySelector("#searchStats"),
  similarList: document.querySelector("#similarList"),
  tagList: document.querySelector("#tagList"),
  titleInput: document.querySelector("#titleInput")
};

let documents = loadDocuments();
let selectedId = documents[0]?.id || null;

render();

elements.searchInput.addEventListener("input", renderSearch);
elements.clearSearchButton.addEventListener("click", () => {
  elements.searchInput.value = "";
  renderSearch();
});

elements.titleInput.addEventListener("input", () => {
  updateSelectedDocument({ title: elements.titleInput.value });
});

elements.bodyInput.addEventListener("input", () => {
  updateSelectedDocument({ body: elements.bodyInput.value });
});

elements.newDocumentButton.addEventListener("click", () => {
  const doc = createDocument("Untitled document", "");
  documents = [doc, ...documents];
  selectedId = doc.id;
  persistAndRender();
  elements.titleInput.focus();
  elements.titleInput.select();
});

elements.deleteDocumentButton.addEventListener("click", () => {
  if (!selectedId || documents.length <= 1) {
    return;
  }
  documents = documents.filter((doc) => doc.id !== selectedId);
  selectedId = documents[0]?.id || null;
  persistAndRender();
});

elements.exportButton.addEventListener("click", () => exportDocuments(documents));

elements.importInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) {
    return;
  }
  try {
    documents = await importDocuments(file);
    selectedId = documents[0]?.id || null;
    persistAndRender();
  } catch (error) {
    elements.searchStats.textContent = error.message;
  } finally {
    event.target.value = "";
  }
});

function updateSelectedDocument(patch) {
  const now = new Date().toISOString();
  documents = documents.map((doc) => {
    if (doc.id !== selectedId) {
      return doc;
    }
    return { ...doc, ...patch, updatedAt: now };
  });
  persistAndRender(false);
}

function persistAndRender(shouldRenderEditor = true) {
  saveDocuments(documents);
  render(shouldRenderEditor);
}

function render(shouldRenderEditor = true) {
  if (!selectedId && documents.length > 0) {
    selectedId = documents[0].id;
  }
  if (shouldRenderEditor) {
    renderEditor();
  }
  renderSearch();
  renderInsights();
}

function renderEditor() {
  const doc = selectedDocument();
  if (!doc) {
    elements.titleInput.value = "";
    elements.bodyInput.value = "";
    elements.editorTitle.textContent = "No document";
    return;
  }
  elements.titleInput.value = doc.title;
  elements.bodyInput.value = doc.body;
  elements.editorTitle.textContent = doc.title || "Untitled";
  elements.deleteDocumentButton.disabled = documents.length <= 1;
}

function renderSearch() {
  const query = elements.searchInput.value.trim();
  const results = query ? search(documents, query) : documents.map((doc) => ({
    doc,
    score: 0,
    matchedTerms: [],
    snippet: escapeForDisplay(doc.body.slice(0, 180))
  }));

  elements.searchStats.textContent = query
    ? `${results.length} result${results.length === 1 ? "" : "s"} for "${query}".`
    : `${documents.length} document${documents.length === 1 ? "" : "s"} indexed.`;

  elements.results.innerHTML = results.map(renderResult).join("");
  for (const button of elements.results.querySelectorAll("[data-doc-id]")) {
    button.addEventListener("click", () => {
      selectedId = button.dataset.docId;
      render();
    });
  }
}

function renderResult(result) {
  const selected = result.doc.id === selectedId ? " is-selected" : "";
  const score = result.score > 0 ? `<span class="score">${result.score.toFixed(3)}</span>` : "";
  const terms = result.matchedTerms.length
    ? `<span class="terms">${result.matchedTerms.join(", ")}</span>`
    : "";

  return `
    <button type="button" class="result${selected}" data-doc-id="${result.doc.id}">
      <span class="result-title">${escapeForDisplay(result.doc.title)} ${score}</span>
      <span class="snippet">${result.snippet}</span>
      ${terms}
    </button>
  `;
}

function renderInsights() {
  const doc = selectedDocument();
  if (!doc) {
    elements.tagList.innerHTML = "";
    elements.similarList.innerHTML = "";
    return;
  }

  const tags = suggestTags(doc, documents);
  elements.tagList.innerHTML = tags.length
    ? tags.map((tag) => `<span class="pill">${tag}</span>`).join("")
    : `<span class="muted">Add more text to get tags.</span>`;

  const similar = similarDocuments(doc.id, documents);
  elements.similarList.innerHTML = similar.length
    ? similar.map((item) => `
        <button type="button" data-doc-id="${item.doc.id}">
          <span>${escapeForDisplay(item.doc.title)}</span>
          <span>${item.score.toFixed(3)}</span>
        </button>
      `).join("")
    : `<span class="muted">No similar documents yet.</span>`;

  for (const button of elements.similarList.querySelectorAll("[data-doc-id]")) {
    button.addEventListener("click", () => {
      selectedId = button.dataset.docId;
      render();
    });
  }
}

function selectedDocument() {
  return documents.find((doc) => doc.id === selectedId) || null;
}

function escapeForDisplay(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
