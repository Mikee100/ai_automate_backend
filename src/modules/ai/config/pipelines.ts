/**
 * Humanizer pipeline step names and default order.
 * Locked default; overridable per brand via brandConfig.pipeline.
 */

export type PipelineStep = 'NATURALNESS' | 'SOFTEN' | 'CHUNK' | 'EMOTION' | 'EMOJI' | 'VARIATION';

export const DEFAULT_PIPELINE: PipelineStep[] = [
  'NATURALNESS',
  'SOFTEN',
  'CHUNK',
  'EMOTION',
  'EMOJI',
  'VARIATION',
];
