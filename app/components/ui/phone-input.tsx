"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface Country {
  name: string;
  iso: string;
  dial: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  // Priority countries first
  { name: "India", iso: "IN", dial: "91", flag: "🇮🇳" },
  { name: "Indonesia", iso: "ID", dial: "62", flag: "🇮🇩" },
  // Alphabetical
  { name: "Afghanistan", iso: "AF", dial: "93", flag: "🇦🇫" },
  { name: "Albania", iso: "AL", dial: "355", flag: "🇦🇱" },
  { name: "Algeria", iso: "DZ", dial: "213", flag: "🇩🇿" },
  { name: "Argentina", iso: "AR", dial: "54", flag: "🇦🇷" },
  { name: "Armenia", iso: "AM", dial: "374", flag: "🇦🇲" },
  { name: "Australia", iso: "AU", dial: "61", flag: "🇦🇺" },
  { name: "Austria", iso: "AT", dial: "43", flag: "🇦🇹" },
  { name: "Azerbaijan", iso: "AZ", dial: "994", flag: "🇦🇿" },
  { name: "Bahrain", iso: "BH", dial: "973", flag: "🇧🇭" },
  { name: "Bangladesh", iso: "BD", dial: "880", flag: "🇧🇩" },
  { name: "Belarus", iso: "BY", dial: "375", flag: "🇧🇾" },
  { name: "Belgium", iso: "BE", dial: "32", flag: "🇧🇪" },
  { name: "Bolivia", iso: "BO", dial: "591", flag: "🇧🇴" },
  { name: "Brazil", iso: "BR", dial: "55", flag: "🇧🇷" },
  { name: "Bulgaria", iso: "BG", dial: "359", flag: "🇧🇬" },
  { name: "Cambodia", iso: "KH", dial: "855", flag: "🇰🇭" },
  { name: "Canada", iso: "CA", dial: "1", flag: "🇨🇦" },
  { name: "Chile", iso: "CL", dial: "56", flag: "🇨🇱" },
  { name: "China", iso: "CN", dial: "86", flag: "🇨🇳" },
  { name: "Colombia", iso: "CO", dial: "57", flag: "🇨🇴" },
  { name: "Croatia", iso: "HR", dial: "385", flag: "🇭🇷" },
  { name: "Czech Republic", iso: "CZ", dial: "420", flag: "🇨🇿" },
  { name: "Denmark", iso: "DK", dial: "45", flag: "🇩🇰" },
  { name: "Ecuador", iso: "EC", dial: "593", flag: "🇪🇨" },
  { name: "Egypt", iso: "EG", dial: "20", flag: "🇪🇬" },
  { name: "Ethiopia", iso: "ET", dial: "251", flag: "🇪🇹" },
  { name: "Finland", iso: "FI", dial: "358", flag: "🇫🇮" },
  { name: "France", iso: "FR", dial: "33", flag: "🇫🇷" },
  { name: "Georgia", iso: "GE", dial: "995", flag: "🇬🇪" },
  { name: "Germany", iso: "DE", dial: "49", flag: "🇩🇪" },
  { name: "Ghana", iso: "GH", dial: "233", flag: "🇬🇭" },
  { name: "Greece", iso: "GR", dial: "30", flag: "🇬🇷" },
  { name: "Hungary", iso: "HU", dial: "36", flag: "🇭🇺" },
  { name: "Iran", iso: "IR", dial: "98", flag: "🇮🇷" },
  { name: "Iraq", iso: "IQ", dial: "964", flag: "🇮🇶" },
  { name: "Ireland", iso: "IE", dial: "353", flag: "🇮🇪" },
  { name: "Israel", iso: "IL", dial: "972", flag: "🇮🇱" },
  { name: "Italy", iso: "IT", dial: "39", flag: "🇮🇹" },
  { name: "Japan", iso: "JP", dial: "81", flag: "🇯🇵" },
  { name: "Jordan", iso: "JO", dial: "962", flag: "🇯🇴" },
  { name: "Kazakhstan", iso: "KZ", dial: "76", flag: "🇰🇿" },
  { name: "Kenya", iso: "KE", dial: "254", flag: "🇰🇪" },
  { name: "Kuwait", iso: "KW", dial: "965", flag: "🇰🇼" },
  { name: "Laos", iso: "LA", dial: "856", flag: "🇱🇦" },
  { name: "Latvia", iso: "LV", dial: "371", flag: "🇱🇻" },
  { name: "Lebanon", iso: "LB", dial: "961", flag: "🇱🇧" },
  { name: "Libya", iso: "LY", dial: "218", flag: "🇱🇾" },
  { name: "Lithuania", iso: "LT", dial: "370", flag: "🇱🇹" },
  { name: "Malaysia", iso: "MY", dial: "60", flag: "🇲🇾" },
  { name: "Mexico", iso: "MX", dial: "52", flag: "🇲🇽" },
  { name: "Morocco", iso: "MA", dial: "212", flag: "🇲🇦" },
  { name: "Myanmar", iso: "MM", dial: "95", flag: "🇲🇲" },
  { name: "Nepal", iso: "NP", dial: "977", flag: "🇳🇵" },
  { name: "Netherlands", iso: "NL", dial: "31", flag: "🇳🇱" },
  { name: "New Zealand", iso: "NZ", dial: "64", flag: "🇳🇿" },
  { name: "Nigeria", iso: "NG", dial: "234", flag: "🇳🇬" },
  { name: "Norway", iso: "NO", dial: "47", flag: "🇳🇴" },
  { name: "Oman", iso: "OM", dial: "968", flag: "🇴🇲" },
  { name: "Pakistan", iso: "PK", dial: "92", flag: "🇵🇰" },
  { name: "Peru", iso: "PE", dial: "51", flag: "🇵🇪" },
  { name: "Philippines", iso: "PH", dial: "63", flag: "🇵🇭" },
  { name: "Poland", iso: "PL", dial: "48", flag: "🇵🇱" },
  { name: "Portugal", iso: "PT", dial: "351", flag: "🇵🇹" },
  { name: "Qatar", iso: "QA", dial: "974", flag: "🇶🇦" },
  { name: "Romania", iso: "RO", dial: "40", flag: "🇷🇴" },
  { name: "Russia", iso: "RU", dial: "7", flag: "🇷🇺" },
  { name: "Saudi Arabia", iso: "SA", dial: "966", flag: "🇸🇦" },
  { name: "Serbia", iso: "RS", dial: "381", flag: "🇷🇸" },
  { name: "Singapore", iso: "SG", dial: "65", flag: "🇸🇬" },
  { name: "Slovakia", iso: "SK", dial: "421", flag: "🇸🇰" },
  { name: "Somalia", iso: "SO", dial: "252", flag: "🇸🇴" },
  { name: "South Africa", iso: "ZA", dial: "27", flag: "🇿🇦" },
  { name: "South Korea", iso: "KR", dial: "82", flag: "🇰🇷" },
  { name: "Spain", iso: "ES", dial: "34", flag: "🇪🇸" },
  { name: "Sri Lanka", iso: "LK", dial: "94", flag: "🇱🇰" },
  { name: "Sudan", iso: "SD", dial: "249", flag: "🇸🇩" },
  { name: "Sweden", iso: "SE", dial: "46", flag: "🇸🇪" },
  { name: "Switzerland", iso: "CH", dial: "41", flag: "🇨🇭" },
  { name: "Syria", iso: "SY", dial: "963", flag: "🇸🇾" },
  { name: "Taiwan", iso: "TW", dial: "886", flag: "🇹🇼" },
  { name: "Tanzania", iso: "TZ", dial: "255", flag: "🇹🇿" },
  { name: "Thailand", iso: "TH", dial: "66", flag: "🇹🇭" },
  { name: "Tunisia", iso: "TN", dial: "216", flag: "🇹🇳" },
  { name: "Turkey", iso: "TR", dial: "90", flag: "🇹🇷" },
  { name: "Uganda", iso: "UG", dial: "256", flag: "🇺🇬" },
  { name: "Ukraine", iso: "UA", dial: "380", flag: "🇺🇦" },
  { name: "United Arab Emirates", iso: "AE", dial: "971", flag: "🇦🇪" },
  { name: "United Kingdom", iso: "GB", dial: "44", flag: "🇬🇧" },
  { name: "United States", iso: "US", dial: "1", flag: "🇺🇸" },
  { name: "Uruguay", iso: "UY", dial: "598", flag: "🇺🇾" },
  { name: "Uzbekistan", iso: "UZ", dial: "998", flag: "🇺🇿" },
  { name: "Venezuela", iso: "VE", dial: "58", flag: "🇻🇪" },
  { name: "Vietnam", iso: "VN", dial: "84", flag: "🇻🇳" },
  { name: "Yemen", iso: "YE", dial: "967", flag: "🇾🇪" },
  { name: "Zimbabwe", iso: "ZW", dial: "263", flag: "🇿🇼" },
];

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "Phone number",
  disabled = false,
  className,
}: PhoneInputProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedIso, setSelectedIso] = React.useState("IN");
  const [phoneNumber, setPhoneNumber] = React.useState("");

  const selectedCountry =
    COUNTRIES.find((c) => c.iso === selectedIso) ?? COUNTRIES[0];

  const handleCountrySelect = (iso: string) => {
    setSelectedIso(iso);
    setOpen(false);
    const country = COUNTRIES.find((c) => c.iso === iso);
    if (country) {
      onChange?.(`+${country.dial}${phoneNumber}`);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/[^0-9\s\-()]/g, "");
    setPhoneNumber(num);
    onChange?.(`+${selectedCountry.dial}${num}`);
  };

  return (
    <div
      className={cn(
        "flex h-10 w-full rounded-lg border border-border/60 bg-background/50 transition-all focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary/50",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 border-r border-border/60 text-sm hover:bg-white/5 rounded-l-lg transition-colors shrink-0 focus:outline-none"
          >
            <span className="text-base leading-none">
              {selectedCountry.flag}
            </span>
            <span className="text-muted-foreground text-xs">
              +{selectedCountry.dial}
            </span>
            <ChevronDown className="h-3 w-3 opacity-40" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search country or code..." />
            <CommandList className="max-h-[220px]">
              <CommandEmpty className="py-4 text-sm text-muted-foreground text-center">
                No country found.
              </CommandEmpty>
              <CommandGroup>
                {COUNTRIES.map((country) => (
                  <CommandItem
                    key={country.iso}
                    value={`${country.name} +${country.dial} ${country.iso}`}
                    onSelect={() => handleCountrySelect(country.iso)}
                    className="cursor-pointer"
                  >
                    <span className="mr-2 text-base">{country.flag}</span>
                    <span className="flex-1 text-sm">{country.name}</span>
                    <span className="text-muted-foreground text-xs mr-2">
                      +{country.dial}
                    </span>
                    {selectedIso === country.iso && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:cursor-not-allowed min-w-0"
      />
    </div>
  );
}
