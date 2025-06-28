export type ParsedSearchQuery = {
  term: string;
  type: "text" | "site";
};

/**
 * 検索クエリを解析して各タームの種類を識別します。
 */
export function parseSearchQuery(query: string): Array<ParsedSearchQuery> {
  const terms = query
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0);

  const parsedTerms = terms
    .map((term) => {
      if (term.toLowerCase().startsWith("site:")) {
        const siteTerm = term.slice(5).toLowerCase();
        if (siteTerm.length > 0) {
          return { term: siteTerm, type: "site" } as const;
        }
        return null;
      }
      return { term: term.toLowerCase(), type: "text" } as const;
    })
    .filter((item) => item !== null)
    // テキスト検索語を長い順にソート (最も長い単語でまず検索するため)
    .sort((a, b) => b.term.length - a.term.length);

  return parsedTerms;
}
