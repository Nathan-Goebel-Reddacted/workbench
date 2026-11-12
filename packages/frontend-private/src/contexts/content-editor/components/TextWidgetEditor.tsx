import { RichTextEditor } from './RichTextEditor'
import type { TextContent } from '@content'

type Props = {
  value: TextContent
  onChange: (next: TextContent) => void
}

export function TextWidgetEditor({ value, onChange }: Props) {
  return <RichTextEditor html={value.html} onChange={html => onChange({ html })} />
}
