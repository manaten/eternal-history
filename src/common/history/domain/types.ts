export type HistoryItem = {
  id: string;
  url: string;
  title: string;
  visitCount: number;
  lastVisitTime: number;
  domain: string;
  favicon?: string;
};

export type ParsedSearchQuery = {
  term: string;
  type: "text" | "site" | "exclude";
};

export interface GroupingOptions {
  groupByUrl?: boolean;
  groupByTitle?: boolean;
}

export interface SearchOptions extends GroupingOptions {
  /** 結果の最大件数。lastVisitTime 降順で先頭から N 件を返す (未指定時は無制限) */
  limit?: number;
}

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
  /**
   * 永続化層を初期化する。他のすべてのメソッドを呼ぶ前に必ず実行する必要がある。
   * 冪等で、複数回呼んでも安全。
   */
  initialize(): Promise<void>;

  /**
   * 履歴アイテムを永続化する。同一 URL の既存エントリがある場合は内容を更新する。
   * @throws 初期化前に呼ぶと `"Storage not initialized"`
   */
  insert(items: HistoryItem[]): Promise<void>;

  /**
   * 履歴アイテムを削除する。
   * アダプタの裁量で、自前ストアからの削除に加えてブラウザ標準履歴 (Chrome の場合は
   * `chrome.history`) への連動削除を行うことがある。
   * @throws 初期化前に呼ぶと `"Storage not initialized"`
   */
  delete(item: HistoryItem): Promise<void>;

  /**
   * 直近 `days` 日分の履歴を `lastVisitTime` 降順で返す。
   * 初期化前に呼ばれた場合は空配列を返す。
   */
  getRecent(days: number): Promise<HistoryItem[]>;

  /**
   * 全履歴を返す。WordIndex の (再) 構築に使う。
   * 件数オーダー 10 万を想定しており、決して軽い処理ではない。
   * @throws 初期化前に呼ぶと `"Storage not initialized"`
   */
  getAll(): Promise<HistoryItem[]>;

  /**
   * 一次検索: 実装側の高速インデックス (例: chrome.bookmarks.search) を
   * 利用して、与えられたタームを含む可能性のある候補を返す。
   * 厳密なフィルタリング・グルーピング・並び替えは呼び出し側 (`searchHistories`) の責務。
   * 初期化前に呼ばれた場合は空配列を返す。
   */
  searchCandidates(term: string): Promise<HistoryItem[]>;
}
