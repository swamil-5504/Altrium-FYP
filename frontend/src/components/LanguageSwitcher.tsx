import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const currentLanguage = language.startsWith("hi")
    ? "hi"
    : language.startsWith("mr")
      ? "mr"
      : "en";

  return (
    <div className="flex items-center gap-2">
      <Select value={currentLanguage} onValueChange={setLanguage}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder={t("common.language")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">{t("common.english")}</SelectItem>
          <SelectItem value="hi">{t("common.hindi")}</SelectItem>
          <SelectItem value="mr">{t("common.marathi")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
