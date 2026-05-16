import { HistoryItem } from "./HistoryItem";

/**
 * 履歴アイテムの永続化を抽象化するポート。
 *
 * このインターフェースは「履歴をどう保存するか」の実装詳細から独立した
 * ドメイン契約を表します。実装 (アダプタ) は infra/ 配下に置かれます。
 *
 * - 保存先の例: Chrome bookmarks, IndexedDB, テスト用の in-memory ストア
 * - 検索の一次フィルタは `searchCandidates` で実装側に委譲し、
 *   ドメイン側ではそれをさらに絞り込む形で純粋ロジックを構成します。
 */
export interface HistoryStore {
  initialize(): Promise<void>;
  insert(items: HistoryItem[]): Promise<void>;
  delete(item: HistoryItem): Promise<void>;
  getRecent(days: number): Promise<HistoryItem[]>;
  /**
   * 一次検索: 実装側の高速インデックス (例: chrome.bookmarks.search) を
   * 利用して、与えられたタームを含む可能性のある候補を返します。
   * 厳密なフィルタリング・グルーピング・並び替えは呼び出し側の責務です。
   */
  searchCandidates(term: string): Promise<HistoryItem[]>;
}
