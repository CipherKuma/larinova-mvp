const DUPLICATE_TASK_WINDOW_MS = 30_000;

export interface TaskFingerprint {
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  due_date: string | null;
  patient_id: string | null;
  consultation_id: string | null;
  assigned_to: string;
  created_by: string;
}

export function normalizeTaskFingerprint(
  input: TaskFingerprint,
): TaskFingerprint {
  return {
    ...input,
    title: input.title.trim(),
    description: normalizeNullableString(input.description),
    due_date: normalizeNullableString(input.due_date),
    patient_id: normalizeNullableString(input.patient_id),
    consultation_id: normalizeNullableString(input.consultation_id),
  };
}

export function isRecentDuplicateTask(
  candidate: TaskFingerprint & { created_at?: string | null },
  target: TaskFingerprint,
  now = new Date(),
): boolean {
  const normalizedCandidate = normalizeTaskFingerprint(candidate);
  const normalizedTarget = normalizeTaskFingerprint(target);

  if (
    normalizedCandidate.title !== normalizedTarget.title ||
    normalizedCandidate.description !== normalizedTarget.description ||
    normalizedCandidate.type !== normalizedTarget.type ||
    normalizedCandidate.status !== normalizedTarget.status ||
    normalizedCandidate.priority !== normalizedTarget.priority ||
    normalizedCandidate.due_date !== normalizedTarget.due_date ||
    normalizedCandidate.patient_id !== normalizedTarget.patient_id ||
    normalizedCandidate.consultation_id !== normalizedTarget.consultation_id ||
    normalizedCandidate.assigned_to !== normalizedTarget.assigned_to ||
    normalizedCandidate.created_by !== normalizedTarget.created_by
  ) {
    return false;
  }

  if (!candidate.created_at) return true;

  const createdAt = new Date(candidate.created_at).getTime();
  if (Number.isNaN(createdAt)) return false;

  return now.getTime() - createdAt <= DUPLICATE_TASK_WINDOW_MS;
}

function normalizeNullableString(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
