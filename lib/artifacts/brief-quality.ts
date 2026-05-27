import type { ArtifactHealth } from '@/types'

const ARTIFACT_WEIGHTS: Record<string, number> = {
  product_brief: 20,
  prd:           30,
  architecture:  20,
  decisions:     15,
  current_task:  15,
}

/**
 * Compute 0–100 Mission Brief quality from current artifact health.
 * Skipped artifacts contribute 0; drafts contribute 50%; complete 100%.
 */
export function computeBriefQuality(artifacts: ArtifactHealth[]): number {
  let total = 0

  for (const artifact of artifacts) {
    const weight = ARTIFACT_WEIGHTS[artifact.type] ?? 0
    if (artifact.status === 'complete') {
      total += weight
    } else if (artifact.status === 'draft') {
      total += weight * 0.5
    }
    // 'missing' and 'skipped' contribute 0
  }

  return Math.round(total)
}

export function briefQualityLabel(score: number): string {
  if (score >= 80) return 'גבוהה'
  if (score >= 50) return 'בינונית'
  return 'נמוכה'
}
