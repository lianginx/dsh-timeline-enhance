/**
 * Timeline Enhance host half: registers a user-editable settings namespace
 * so the visual-config surface can discover and persist this bundle's
 * preferences. The browser half owns the card chrome; the host only stores
 * the section.
 */
import z from '@deepseek-ai/schemastery'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'

/** Settings schema for the timeline-enhance bundle. */
const TimelineEnhanceSchema = z.object({
  /** Auto-fold the Agent Loop process blocks after the final answer. */
  autoFold: z.boolean().default(true),
  /** Show fun per-kind tips in the Deep diving status. */
  funTips: z.boolean().default(true),
})

export const inject = ['settings']

/** Register the durable timeline-enhance settings section. */
export function apply(ctx) {
  ctx.settings.register(settingsNamespace('timeline-enhance'), TimelineEnhanceSchema)
}
