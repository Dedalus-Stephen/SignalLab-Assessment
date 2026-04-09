"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

interface ScenarioRun {
  id: string;
  type: string;
  status: string;
  duration: number | null;
  error: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface RunForm {
  type: string;
  name: string;
}

function statusVariant(status: string): "success" | "error" | "warning" {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
      return "error";
    default:
      return "warning";
  }
}

function typeColor(type: string): string {
  switch (type) {
    case "success":
      return "text-green-600";
    case "validation_error":
      return "text-yellow-600";
    case "system_error":
      return "text-red-600";
    case "slow_request":
      return "text-orange-500";
    case "teapot":
      return "text-purple-600";
    default:
      return "text-gray-600";
  }
}

export default function Home() {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RunForm>({
    defaultValues: { type: "success", name: "" },
  });

  const { data: health } = useQuery({
    queryKey: ["health"],
    queryFn: () => apiFetch<{ status: string; timestamp: string }>("/health"),
  });

  const { data: history = [] } = useQuery({
    queryKey: ["history"],
    queryFn: () => apiFetch<ScenarioRun[]>("/scenarios/history"),
    refetchInterval: 5000,
  });

  const mutation = useMutation({
    mutationFn: (data: RunForm) =>
      apiFetch("/scenarios/run", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data: any) => {
      toast.success(`Scenario completed (${data.duration}ms)`);
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
    onError: (err: Error) => {
      // Teapot and validation errors are "expected" errors
      if (err.message.includes("teapot")) {
        toast.info("🫖 I'm a teapot! (HTTP 418)");
      } else {
        toast.error(err.message || "Scenario failed");
      }
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Scenario Runner */}
        <Card>
          <CardHeader>
            <CardTitle>Run Scenario</CardTitle>
            <CardDescription>
              Select a scenario type and run it to generate observability signals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((data) => mutation.mutate(data))}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Scenario Type
                </label>
                <select
                  {...register("type")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="success">✅ Success</option>
                  <option value="validation_error">⚠️ Validation Error</option>
                  <option value="system_error">❌ System Error</option>
                  <option value="slow_request">🐢 Slow Request</option>
                  <option value="teapot">🫖 Teapot</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Name (optional)
                </label>
                <Input {...register("name")} placeholder="My test run" />
              </div>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full"
              >
                {mutation.isPending ? "Running..." : "Run Scenario"}
              </Button>
            </form>

            {health && (
              <p className="text-xs text-muted-foreground mt-4">
                API: {health.status} — {health.timestamp}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Run History */}
        <Card>
          <CardHeader>
            <CardTitle>Run History</CardTitle>
            <CardDescription>Last 20 scenario runs (auto-refreshes).</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No runs yet. Try running a scenario!
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {history.map((run: ScenarioRun) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between p-3 rounded-md border text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant(run.status)}>
                        {run.status}
                      </Badge>
                      <span className={`font-medium ${typeColor(run.type)}`}>
                        {run.type}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-xs text-right">
                      {run.duration !== null && `${run.duration}ms · `}
                      {new Date(run.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Observability Links */}
      <Card>
        <CardHeader>
          <CardTitle>Observability Links</CardTitle>
          <CardDescription>
            Check these dashboards after running scenarios to see the signals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="http://localhost:3200"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-1 p-3 rounded-md border hover:bg-accent transition-colors"
            >
              <span className="font-medium text-sm">📊 Grafana Dashboard</span>
              <span className="text-xs text-muted-foreground">
                localhost:3200 — Metrics & logs
              </span>
            </a>
            <a
              href="http://localhost:9090"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-1 p-3 rounded-md border hover:bg-accent transition-colors"
            >
              <span className="font-medium text-sm">🔥 Prometheus</span>
              <span className="text-xs text-muted-foreground">
                localhost:9090 — Raw metrics
              </span>
            </a>
            <a
              href="http://localhost:3001/metrics"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-1 p-3 rounded-md border hover:bg-accent transition-colors"
            >
              <span className="font-medium text-sm">📈 /metrics endpoint</span>
              <span className="text-xs text-muted-foreground">
                localhost:3001/metrics — Prometheus format
              </span>
            </a>
            <div className="flex flex-col gap-1 p-3 rounded-md border bg-muted/50">
              <span className="font-medium text-sm">🐛 Sentry</span>
              <span className="text-xs text-muted-foreground">
                Check your Sentry project dashboard for captured exceptions
              </span>
            </div>
          </div>
          <div className="mt-3 p-3 rounded-md bg-muted/50 text-xs text-muted-foreground">
            <strong>Loki query hint:</strong>{" "}
            <code className="bg-background px-1 py-0.5 rounded">
              {'{job="signal-lab"} | json'}
            </code>{" "}
            — use in Grafana → Explore → Loki datasource
          </div>
        </CardContent>
      </Card>
    </div>
  );
}