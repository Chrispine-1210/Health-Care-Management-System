import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type ConsentLevel = "all" | "essential";

type CookieConsent = {
  level: ConsentLevel;
  acceptedAt: string;
  version: number;
};

const COOKIE_CONSENT_KEY = "thandizo_cookie_consent";
const COOKIE_CONSENT_VERSION = 1;

function saveConsent(level: ConsentLevel) {
  const value: CookieConsent = {
    level,
    acceptedAt: new Date().toISOString(),
    version: COOKIE_CONSENT_VERSION,
  };

  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("thandizo:cookie-consent", { detail: value }));
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) {
      setVisible(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<CookieConsent>;
      setVisible(parsed.version !== COOKIE_CONSENT_VERSION);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl space-y-1">
          <p className="text-sm font-semibold">Cookie Notice</p>
          <p className="text-sm text-muted-foreground">
            We use essential cookies to keep accounts secure and remember core preferences. Optional cookies help us improve the experience, but we do not enable marketing cookies by default.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => {
              saveConsent("essential");
              setVisible(false);
            }}
            data-testid="button-cookie-essential"
          >
            Essential Only
          </Button>
          <Button
            onClick={() => {
              saveConsent("all");
              setVisible(false);
            }}
            data-testid="button-cookie-accept-all"
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}
