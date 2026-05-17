import { GroupingOptions } from "./GroupingOptions";

export interface SearchOptions extends GroupingOptions {
  /** 結果の最大件数。lastVisitTime 降順で先頭から N 件を返す (未指定時は無制限) */
  limit?: number;
}
