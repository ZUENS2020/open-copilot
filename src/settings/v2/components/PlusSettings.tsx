import { Badge } from "@/components/ui/badge";
import React from "react";

export function PlusSettings() {
  return (
    <section className="tw-flex tw-flex-col tw-gap-4 tw-rounded-lg tw-bg-secondary tw-p-4">
      <div className="tw-flex tw-items-center tw-gap-2 tw-text-xl tw-font-bold">
        <span>Copilot Plus</span>
        <Badge variant="outline" className="tw-text-muted">
          Discontinued
        </Badge>
      </div>
      <div className="tw-flex tw-flex-col tw-gap-2 tw-text-sm tw-text-muted">
        <div>
          Copilot Plus has been discontinued. Please use the Custom API provider to configure your own API keys.
        </div>
        <div>
          Go to <strong>API Keys</strong> in Basic Settings to set up your custom API key.
        </div>
      </div>
    </section>
  );
}
