import { getCronJobs } from "@/lib/cron-jobs/actions";
import { CronJobsClient } from "./CronJobsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CronJobsPage() {
  const jobs = await getCronJobs();

  const serializedJobs = jobs.map((job) => ({
    ...job,
    nextRunAt: job.nextRunAt.toISOString(),
    lastRunAt: job.lastRunAt ? job.lastRunAt.toISOString() : null,
    scheduleAt: job.scheduleAt ? job.scheduleAt.toISOString() : null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  }));

  return <CronJobsClient jobs={serializedJobs} />;
}
