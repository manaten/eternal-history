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
  aboutDescription: `Eternal History is a Chrome extension that stores unlimited browser history data in the bookmarks area. Unlike Chrome's standard history, your data is permanently preserved and never deleted, with advanced search capabilities to help you find any site you've visited.`,
  searchSyntax: "Search Syntax",
  searchPhrase:
    "Regular text search. Searches for strings contained in both titles and URLs.",
  searchExclude:
    "Exclude search. Filters out results containing the specified string.",
  searchSite:
    " Domain search. Returns only sites that contain the specified domain.",
  searchMultiple:
    "Combined search. All syntax types can be used together for complex queries.",
  savingQueries: "Saving Queries",
  savingQueriesDescription:
    'Click the "+" button next to the search box to save frequently used queries for quick access.',
} as const;
