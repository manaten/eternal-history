export function dateToFolderNames(date: Date): {
  year: string;
  month: string;
  day: string;
  hour: string;
} {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hour = date.getHours().toString().padStart(2, "0");
  return { year, month, day, hour };
}

export function getDateArray(start: Date, days: number): Date[] {
  return Array.from({ length: Math.abs(days) }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i * Math.sign(days));
    return date;
  });
}
