"use client";

import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CronJob {
  id: string;
  agentId: string;
  name: string;
  enabled: boolean;
  scheduleKind: string;
  scheduleExpr: string | null;
  scheduleEveryMs: number | null;
  scheduleTz: string | null;
  payloadMessage: string | null;
  nextRunAt: string;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  lastDurationMs: number | null;
  consecutiveErrors: number;
}

export default function CronJobsPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Fetch cron jobs
  useEffect(() => {
    fetchCronJobs();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchCronJobs, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchCronJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (agentFilter !== "all") {
        params.set("agent", agentFilter);
      }
      
      const res = await fetch(`/api/cron-jobs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch cron jobs");
      
      const data = await res.json();
      setJobs(data.jobs);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get unique agents for filter
  const agents = Array.from(new Set(jobs.map((j) => j.agentId)));

  // Filter jobs by agent and date
  const filteredJobs = jobs.filter((job) => {
    if (agentFilter !== "all" && job.agentId !== agentFilter) return false;
    if (selectedDate) {
      const jobDate = new Date(job.nextRunAt);
      return (
        jobDate.getDate() === selectedDate.getDate() &&
        jobDate.getMonth() === selectedDate.getMonth() &&
        jobDate.getFullYear() === selectedDate.getFullYear()
      );
    }
    return true;
  });

  // Get job status badge
  const getStatusBadge = (job: CronJob) => {
    if (!job.enabled) {
      return <Badge variant="secondary">⚪ Disabled</Badge>;
    }
    if (job.consecutiveErrors > 0) {
      return <Badge variant="destructive">🔴 Error</Badge>;
    }
    const nextRun = new Date(job.nextRunAt);
    const now = new Date();
    const isToday =
      nextRun.getDate() === now.getDate() &&
      nextRun.getMonth() === now.getMonth() &&
      nextRun.getFullYear() === now.getFullYear();
    
    if (isToday) {
      return <Badge className="bg-green-500">🟢 Today</Badge>;
    }
    return <Badge variant="outline">🔵 Scheduled</Badge>;
  };

  // Format schedule display
  const formatSchedule = (job: CronJob) => {
    if (job.scheduleKind === "cron" && job.scheduleExpr) {
      return `Cron: ${job.scheduleExpr}`;
    }
    if (job.scheduleKind === "every" && job.scheduleEveryMs) {
      const minutes = Math.round(job.scheduleEveryMs / 60000);
      return `Every ${minutes} min`;
    }
    if (job.scheduleKind === "at" && job.nextRunAt) {
      return `Once: ${new Date(job.nextRunAt).toLocaleString()}`;
    }
    return job.scheduleKind;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cron Jobs</h1>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {agents.map((agent) => (
              <SelectItem key={agent} value={agent}>
                {agent}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Job List */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedDate && (
                <span>
                  Jobs on {selectedDate.toLocaleDateString()}
                  {agentFilter !== "all" && ` (${agentFilter})`}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No cron jobs found
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {filteredJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => setSelectedJob(job)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="font-semibold">{job.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatSchedule(job)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Agent: {job.agentId}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(job)}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-muted-foreground">
                                Next: {new Date(job.nextRunAt).toLocaleTimeString()}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {job.lastRunStatus && `Last: ${job.lastRunStatus}`}
                                {job.lastDurationMs && ` • ${job.lastDurationMs}ms`}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Job Detail Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedJob?.name}</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Agent</h4>
                  <p className="text-muted-foreground">{selectedJob.agentId}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Status</h4>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedJob)}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Schedule</h4>
                <p className="text-muted-foreground">{formatSchedule(selectedJob)}</p>
                {selectedJob.scheduleTz && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Timezone: {selectedJob.scheduleTz}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Next Run</h4>
                  <p className="text-muted-foreground">
                    {new Date(selectedJob.nextRunAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Last Run</h4>
                  <p className="text-muted-foreground">
                    {selectedJob.lastRunAt
                      ? new Date(selectedJob.lastRunAt).toLocaleString()
                      : "Never"}
                  </p>
                </div>
              </div>

              {selectedJob.lastRunStatus && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Last Status</h4>
                    <Badge
                      variant={
                        selectedJob.lastRunStatus === "ok" ? "default" : "destructive"
                      }
                    >
                      {selectedJob.lastRunStatus}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Duration</h4>
                    <p className="text-muted-foreground">
                      {selectedJob.lastDurationMs
                        ? `${selectedJob.lastDurationMs}ms`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              )}

              {selectedJob.consecutiveErrors > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1 text-red-500">
                    ⚠️ Consecutive Errors
                  </h4>
                  <p className="text-red-500">{selectedJob.consecutiveErrors}</p>
                </div>
              )}

              {selectedJob.payloadMessage && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Payload</h4>
                  <ScrollArea className="h-32 border rounded-md p-3 bg-muted">
                    <pre className="text-xs whitespace-pre-wrap">
                      {selectedJob.payloadMessage}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
