"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

interface ScenarioRun {
  id: string;
  type: string;
  status: string;
  duration: number | null;
  error: string | null;
  createdAt: string;
}

interface RunForm {
  type: string;
  name: string;
}

function statusVariant(status: string) {
  switch (status) {
    case "completed": return "success" as const;
    case "failed": return "error" as const;
    default: return "warning" as const;
  }
}

export default function Home() {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<RunForm>({
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
    onSuccess: () => {
      toast.success("Scenario completed");
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Scenario failed");
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Scenario Runner */}
      <Card>
        <CardHeader>
          <CardTitle>Run Scenario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Scenario Type</label>
              <select
                {...register("type")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="success">Success</option>
                <option value="validation_error">Validation Error</option>
                <option value="system_error">System Error</option>
                <option value="slow_request">Slow Request</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Name (optional)</label>
              <Input {...register("name")} placeholder="My test run" />
            </div>
            <Button type="submit" disabled={mutation.isPending} className="w-full">
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
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No runs yet. Try running a scenario!</p>
          ) : (
            <div className="space-y-2">
              {history.map((run: ScenarioRun) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-3 rounded-md border text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
                    <span className="font-medium">{run.type}</span>
                  </div>
                  <div className="text-muted-foreground text-xs">
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
  );
}
