export const en = {
  // App confirmation dialogs
  "app.confirmDeleteHistoryItem": 'Are you sure you want to delete "{title}"?',
  "app.deleteHistoryItemFailed":
    "Failed to delete history item. Please try again.",
  "app.confirmRemoveQuery": "Are you sure you want to remove this query?",

  // Search box
  searchPlaceholder: "Search history...",
  saveQuery: "Save query",

  // History item
  deleteItem: "Delete item",

  // Saved queries
  searchForQuery: "Search for: {query}",
  removeSavedQuery: "Remove saved query",

  // Help button
  openHelp: "Open help",
  help: "Help",

  // Help modal
  howToUse: "How to use",
  closeModal: "Close modal",
  aboutThisExtension: "About This Extension",
  aboutDescription:
    "Eternal History is a Chrome extension that provides unlimited browser history storage by serializing history data into Chrome bookmarks with hierarchical folder organization. The extension replaces the New Tab page with a searchable history interface, allowing you to easily find and manage your browsing history.",
  searchSyntax: "Search Syntax",
  searchSyntaxDescription:
    "You can use the following search operators to refine your results:",
  searchExactPhrase: "Exact phrase search (use quotes)",
  searchExactPhraseExample: '"exact phrase"',
  searchExclude: "Exclude terms (use minus sign)",
  searchExcludeExample: "-unwanted",
  searchSite: "Search within specific site",
  searchSiteExample: "site:example.com",
  searchMultiple: "Combine multiple operators",
  searchMultipleExample: '"important document" -draft site:company.com',
  savingQueries: "Saving Queries",
  savingQueriesDescription:
    'Click the "+" button next to the search box to save frequently used queries for quick access.',
} as const;
