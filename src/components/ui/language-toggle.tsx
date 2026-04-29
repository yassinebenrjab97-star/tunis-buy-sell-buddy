import React, { useState } from "react"
import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useTranslation } from "react-i18next"

export function LanguageToggle() {
  const { i18n } = useTranslation()
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || "fr")

  const languages = [
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "ar", name: "العربية", flag: "🇹🇳" },
    { code: "en", name: "English", flag: "🇬🇧" },
  ]

  const handleLanguageChange = (languageCode: string) => {
    setCurrentLanguage(languageCode)
    i18n.changeLanguage(languageCode)
    localStorage.setItem('language', languageCode)
    
    // Update HTML dir attribute for RTL support
    document.documentElement.dir = languageCode === 'ar' ? 'rtl' : 'ltr'
  }

  const currentLang = languages.find(lang => lang.code === currentLanguage)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-2">
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline-flex">
            {currentLang?.flag} {currentLang?.name}
          </span>
          <span className="sm:hidden">
            {currentLang?.flag}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover border">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={currentLanguage === language.code ? "bg-accent" : ""}
          >
            <span className="mr-2">{language.flag}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}