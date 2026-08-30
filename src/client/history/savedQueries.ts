const SAVED_QUERIES_KEY = "eternal-history-saved-queries";

export interface SavedQuery {
  id: string;
  query: string;
  createdAt: number;
}

export async function getSavedQueries(): Promise<SavedQuery[]> {
  try {
    const result = await chrome.storage.local.get<{
      [SAVED_QUERIES_KEY]: SavedQuery[];
    }>(SAVED_QUERIES_KEY);
    return result[SAVED_QUERIES_KEY] || [];
  } catch (error) {
    console.error("Failed to get saved queries:", error);
    return [];
  }
}

async function savedQueriesToStorage(queries: SavedQuery[]): Promise<void> {
  await chrome.storage.local.set({ [SAVED_QUERIES_KEY]: queries });
}

export async function addSavedQuery(query: string): Promise<void> {
  try {
    const existingQueries = await getSavedQueries();

    // Check if query already exists
    if (existingQueries.some((q) => q.query === query)) {
      return;
    }

    const newQuery: SavedQuery = {
      id: crypto.randomUUID(),
      query,
      createdAt: Date.now(),
    };

    const updatedQueries = [...existingQueries, newQuery];
    await savedQueriesToStorage(updatedQueries);
  } catch (error) {
    console.error("Failed to add saved query:", error);
    throw error;
  }
}

export async function removeSavedQuery(id: string): Promise<void> {
  try {
    const existingQueries = await getSavedQueries();
    const updatedQueries = existingQueries.filter((q) => q.id !== id);
    await savedQueriesToStorage(updatedQueries);
  } catch (error) {
    console.error("Failed to remove saved query:", error);
    throw error;
  }
}
