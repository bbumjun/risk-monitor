import { getSupabase } from "./client";
import { RiskStatus } from "@/types/indicator";

interface UpsertSnapshotParams {
  indicatorId: string;
  value: number;
  normalizedRisk: number;
  status: RiskStatus;
  timestamp: string;
}

interface UpsertCompositeParams {
  score: number;
  status: RiskStatus;
  breakdown: {
    category: string;
    score: number;
    weight: number;
  }[];
  timestamp: string;
}

interface LogIngestionRunParams {
  startedAt: string;
  completedAt: string;
  status: string;
  indicatorsUpdated: number;
  errors: Record<string, unknown>[];
}

export async function upsertSnapshot(snapshot: UpsertSnapshotParams) {
  const { error } = await getSupabase().from("indicator_snapshots").upsert(
    {
      indicator_id: snapshot.indicatorId,
      value: snapshot.value,
      normalized_risk: snapshot.normalizedRisk,
      status: snapshot.status,
      timestamp: snapshot.timestamp,
    },
    {
      onConflict: "indicator_id,timestamp",
    }
  );

  if (error) throw error;
}

export async function upsertComposite(composite: UpsertCompositeParams) {
  const { error } = await getSupabase().from("composite_snapshots").insert({
    score: composite.score,
    status: composite.status,
    breakdown: composite.breakdown,
    timestamp: composite.timestamp,
  });

  if (error) throw error;
}

export async function getLatestSnapshots() {
  const { data, error } = await getSupabase()
    .from("indicator_snapshots")
    .select("*")
    .order("timestamp", { ascending: false });

  if (error) throw error;

  const latestByIndicator = new Map<string, (typeof data)[number]>();
  for (const row of data ?? []) {
    if (!latestByIndicator.has(row.indicator_id)) {
      latestByIndicator.set(row.indicator_id, row);
    }
  }

  return Array.from(latestByIndicator.values());
}

export async function getIndicatorHistory(indicatorId: string, days: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await getSupabase()
    .from("indicator_snapshots")
    .select("*")
    .eq("indicator_id", indicatorId)
    .gte("timestamp", cutoffDate.toISOString())
    .order("timestamp", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getCompositeHistory(days: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await getSupabase()
    .from("composite_snapshots")
    .select("*")
    .gte("timestamp", cutoffDate.toISOString())
    .order("timestamp", { ascending: true });

  if (error) throw error;
  return data;
}

export async function logIngestionRun(run: LogIngestionRunParams) {
  const { error } = await getSupabase().from("ingestion_runs").insert({
    started_at: run.startedAt,
    completed_at: run.completedAt,
    status: run.status,
    indicators_updated: run.indicatorsUpdated,
    errors: run.errors,
  });

  if (error) throw error;
}
