import { LocaleProvider } from "@/i18n/LocaleProvider";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}
