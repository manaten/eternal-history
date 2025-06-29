import { en } from "./locales/en";
import { ja } from "./locales/ja";

type MessageKey = keyof typeof en;

const isJapanese = navigator.language.startsWith("ja");
const messages = isJapanese ? ja : en;

export const t = (
  key: MessageKey,
  replacement?: Record<string, string>,
): string => {
  const message = messages[key];
  if (!replacement) {
    return message;
  }

  return Object.entries(replacement).reduce<string>(
    (mes, [key, value]) => mes.replaceAll(`{${key}}`, value),
    message,
  );
};
