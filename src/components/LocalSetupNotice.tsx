import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type LocalSetupNoticeProps = {
  title?: string;
  message?: string;
};

export function LocalSetupNotice({
  title = "Local setup needs backend variables",
  message = "The app could not connect to the backend configuration for this local run.",
}: LocalSetupNoticeProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-2xl rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>

            <div className="mt-5 rounded-lg border bg-muted/40 p-4">
              <p className="text-sm font-medium text-foreground">Create or update a root .env file:</p>
              <pre className="mt-3 overflow-x-auto rounded-md bg-background p-3 text-xs text-foreground"><code>{`VITE_SUPABASE_URL=your_backend_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_PROJECT_ID=your_project_id

SUPABASE_URL=your_backend_url
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_PROJECT_ID=your_project_id`}</code></pre>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload after updating .env
              </Button>
              <Button type="button" variant="outline" asChild>
                <a href="/auth">Open sign in</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}