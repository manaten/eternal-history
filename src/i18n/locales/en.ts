export const en = {
  // App confirmation dialogs
  "app.confirmDeleteHistoryItem": 'Are you sure you want to delete "{title}"?',
  "app.deleteHistoryItemFailed":
    "Failed to delete history item. Please try again.",
  "app.confirmRemoveQuery": "Are you sure you want to remove this query?",

  // Search box
  "searchBox.placeholder": "Search history...",
  "searchBox.saveQuery": "Save query",

  // History item
  "historyItem.deleteItem": "Delete item",

  // Saved queries
  "savedQueries.searchForQuery": "Search for: {query}",
  "savedQueries.removeSavedQuery": "Remove saved query",

  // Help button
  "helpButton.openHelp": "Open help",
  "helpButton.help": "Help",

  // Help modal
  "helpModal.howToUse": "How to use",
  "helpModal.closeModal": "Close modal",
  "helpModal.aboutThisExtension": "About This Extension",
  "helpModal.aboutDescription": `Eternal History is a Chrome extension that stores unlimited browser history data in the bookmarks area. Unlike Chrome's standard history, your data is permanently preserved and never deleted, with advanced search capabilities to help you find any site you've visited.`,
  "helpModal.searchSyntax": "Search Syntax",
  "helpModal.searchPhrase":
    "Regular text search. Searches for strings contained in both titles and URLs.",
  "helpModal.searchExclude":
    "Exclude search. Filters out results containing the specified string.",
  "helpModal.searchSite":
    " Domain search. Returns only sites that contain the specified domain.",
  "helpModal.searchMultiple":
    "Combined search. All syntax types can be used together for complex queries.",
  "helpModal.savingQueries": "Saving Queries",
  "helpModal.savingQueriesDescription":
    'Click the "+" button next to the search box to save frequently used queries for quick access.',
} as const;
