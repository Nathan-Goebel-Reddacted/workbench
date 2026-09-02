import type { CSSProperties } from 'react'
import { useCallback, useState } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import { buildRichTextExtensions } from '@atelier/content-renderer'
import { DataBindingPicker } from './DataBindingPicker'
import { FileUpload } from '../../pages/project-detail/FileUpload'

const FONT_SIZES = ['12', '14', '16', '18', '20', '24', '30', '36', '48']

type Props = {
  html: string
  onChange: (html: string) => void
  apiUrl: string
}

export function RichTextEditor({ html, onChange, apiUrl }: Props) {
  const editor = useEditor({
    extensions: buildRichTextExtensions(apiUrl),
    content: html,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  if (!editor) return null

  return (
    <div style={wrapStyle}>
      <Toolbar editor={editor} apiUrl={apiUrl} />
      <EditorContent editor={editor} className="rich-text-editor" style={contentStyle} />
      <style>{editorCss}</style>
    </div>
  )
}

function Toolbar({ editor, apiUrl }: { editor: Editor; apiUrl: string }) {
  const setLink = useCallback(() => {
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL du lien', previous ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImageByUrl = useCallback(() => {
    const url = window.prompt('URL de l’image', 'https://')
    if (!url) return
    editor.chain().focus().setImage({ src: url }).run()
  }, [editor])

  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div style={toolbarStyle}>
      <ToolbarButton
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Gras"
      >
        <b>B</b>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italique"
      >
        <i>I</i>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Souligné"
      >
        <u>U</u>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Barré"
      >
        <s>S</s>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('superscript')}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        title="Exposant"
      >
        x²
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('subscript')}
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        title="Indice"
      >
        x₂
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="Code en ligne"
      >
        {'</>'}
      </ToolbarButton>

      <span style={dividerStyle} />

      <select
        style={sizeSelectStyle}
        title="Taille du texte"
        value={sizeValueOf(editor.getAttributes('textStyle').fontSize as string | undefined)}
        onChange={e => {
          const v = e.target.value
          if (v === '') editor.chain().focus().unsetFontSize().run()
          else editor.chain().focus().setFontSize(`${v}px`).run()
        }}
      >
        <option value="">Taille</option>
        {FONT_SIZES.map(size => (
          <option key={size} value={size}>
            {size} px
          </option>
        ))}
      </select>

      <label style={colorLabelStyle} title="Couleur du texte">
        <span style={{ color: (editor.getAttributes('textStyle').color as string) || 'var(--color-text)' }}>A</span>
        <input
          type="color"
          style={colorInputStyle}
          // <input type="color"> n'accepte qu'un hex littéral : une var CSS y serait ignorée.
          value={(editor.getAttributes('textStyle').color as string) || '#000000'}
          onChange={e => editor.chain().focus().setColor(e.target.value).run()}
        />
      </label>
      <ToolbarButton
        active={false}
        onClick={() => editor.chain().focus().unsetColor().run()}
        title="Réinitialiser la couleur"
      >
        A⨯
      </ToolbarButton>
      <label style={colorLabelStyle} title="Surlignage">
        <span>🖍</span>
        <input
          type="color"
          style={colorInputStyle}
          value={(editor.getAttributes('highlight').color as string) || '#ffff00'}
          onChange={e => editor.chain().focus().setHighlight({ color: e.target.value }).run()}
        />
      </label>
      <ToolbarButton
        active={false}
        onClick={() => editor.chain().focus().unsetHighlight().run()}
        title="Retirer le surlignage"
      >
        🖍⨯
      </ToolbarButton>

      <span style={dividerStyle} />

      <ToolbarButton
        active={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        title="Aligner à gauche"
      >
        ⯇
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        title="Centrer"
      >
        ≡
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        title="Aligner à droite"
      >
        ⯈
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive({ textAlign: 'justify' })}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        title="Justifier"
      >
        ☰
      </ToolbarButton>

      <span style={dividerStyle} />

      <ToolbarButton
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Liste à puces"
      >
        • Liste
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Liste numérotée"
      >
        1. Liste
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('taskList')}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        title="Liste de tâches"
      >
        ☑
      </ToolbarButton>

      <span style={dividerStyle} />

      <ToolbarButton
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Citation"
      >
        ❝
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Bloc de code"
      >
        {'{ }'}
      </ToolbarButton>
      <ToolbarButton
        active={false}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Ligne horizontale"
      >
        ―
      </ToolbarButton>
      <ToolbarButton active={editor.isActive('link')} onClick={setLink} title="Lien">
        🔗
      </ToolbarButton>

      <span style={dividerStyle} />

      <FileUpload
        apiUrl={apiUrl}
        accept="image/*"
        label="🖼️"
        onUploaded={url => editor.chain().focus().setImage({ src: url }).run()}
      />
      <ToolbarButton active={false} onClick={addImageByUrl} title="Image par URL">
        🖼️ URL
      </ToolbarButton>
      <ToolbarButton
        active={false}
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Insérer un tableau"
      >
        ▦
      </ToolbarButton>
      <ToolbarButton
        active={false}
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        title="Ajouter une colonne"
      >
        ▦+col
      </ToolbarButton>
      <ToolbarButton
        active={false}
        onClick={() => editor.chain().focus().addRowAfter().run()}
        title="Ajouter une ligne"
      >
        ▦+lig
      </ToolbarButton>
      <ToolbarButton
        active={false}
        onClick={() => editor.chain().focus().deleteColumn().run()}
        title="Supprimer la colonne"
      >
        ▦−col
      </ToolbarButton>
      <ToolbarButton active={false} onClick={() => editor.chain().focus().deleteRow().run()} title="Supprimer la ligne">
        ▦−lig
      </ToolbarButton>
      <ToolbarButton
        active={false}
        onClick={() => editor.chain().focus().deleteTable().run()}
        title="Supprimer le tableau"
      >
        ▦⨯
      </ToolbarButton>

      <span style={dividerStyle} />

      <ToolbarButton
        active={false}
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
        title="Annuler"
      >
        ↶
      </ToolbarButton>
      <ToolbarButton
        active={false}
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
        title="Rétablir"
      >
        ↷
      </ToolbarButton>
      <ToolbarButton
        active={false}
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        title="Effacer le formatage"
      >
        ⌫fmt
      </ToolbarButton>

      <button
        type="button"
        style={dataBtnStyle}
        onClick={() => setPickerOpen(true)}
        title="Insérer une donnée live (projet, feature, ticket)"
      >
        ＋ Donnée
      </button>

      {pickerOpen && (
        <DataBindingPicker
          apiUrl={apiUrl}
          onInsert={attrs => editor.chain().focus().insertDataBinding(attrs).run()}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}

function sizeValueOf(fontSize: string | undefined): string {
  if (!fontSize) return ''
  const n = fontSize.replace('px', '').trim()
  return FONT_SIZES.includes(n) ? n : ''
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
  disabled,
}: {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{ ...toolBtnStyle, ...(active ? toolBtnActiveStyle : null), ...(disabled ? toolBtnDisabledStyle : null) }}
    >
      {children}
    </button>
  )
}

const wrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  overflow: 'hidden',
  backgroundColor: 'var(--color-bg)',
}
const toolbarStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.375rem 0.5rem',
  borderBottom: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
}
const toolBtnStyle: CSSProperties = {
  minWidth: '28px',
  height: '28px',
  padding: '0 0.5rem',
  fontSize: '0.8125rem',
  lineHeight: 1,
  color: 'var(--color-text)',
  backgroundColor: 'transparent',
  border: '1px solid transparent',
  borderRadius: '4px',
  cursor: 'pointer',
}
const toolBtnActiveStyle: CSSProperties = {
  color: 'var(--color-primary)',
  borderColor: 'var(--color-border)',
  backgroundColor: 'var(--color-bg)',
}
const toolBtnDisabledStyle: CSSProperties = { opacity: 0.4, cursor: 'default' }
const sizeSelectStyle: CSSProperties = {
  height: '28px',
  padding: '0 0.35rem',
  fontSize: '0.8125rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '4px',
  cursor: 'pointer',
}
const colorLabelStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.15rem',
  height: '28px',
  padding: '0 0.35rem',
  fontSize: '0.8125rem',
  border: '1px solid transparent',
  borderRadius: '4px',
  cursor: 'pointer',
}
const colorInputStyle: CSSProperties = {
  width: '18px',
  height: '18px',
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
}
const dividerStyle: CSSProperties = {
  width: '1px',
  alignSelf: 'stretch',
  backgroundColor: 'var(--color-border)',
  margin: '0 0.125rem',
}
const dataBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  marginLeft: 'auto',
  height: '28px',
  padding: '0 0.7rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--color-primary)',
  backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
  border: '1px solid var(--color-primary)',
  borderRadius: '5px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}
const contentStyle: CSSProperties = { padding: '0.5rem 0.75rem', flex: 1, minHeight: '160px', overflowY: 'auto' }

const editorCss = `
.rich-text-editor .ProseMirror { outline: none; color: var(--color-text); font-size: 0.875rem; line-height: 1.5; min-height: 100%; }
.rich-text-editor .ProseMirror p { margin: 0 0 0.5rem; }
.rich-text-editor .ProseMirror h1 { font-size: 1.4rem; margin: 0.5rem 0; }
.rich-text-editor .ProseMirror h2 { font-size: 1.15rem; margin: 0.5rem 0; }
.rich-text-editor .ProseMirror h3 { font-size: 1rem; margin: 0.5rem 0; }
.rich-text-editor .ProseMirror h4 { font-size: 0.9rem; margin: 0.5rem 0; }
.rich-text-editor .ProseMirror ul, .rich-text-editor .ProseMirror ol { padding-left: 1.25rem; margin: 0 0 0.5rem; }
.rich-text-editor .ProseMirror a { color: var(--color-primary); text-decoration: underline; }
.rich-text-editor .ProseMirror blockquote { border-left: 3px solid var(--color-border); padding-left: 0.75rem; color: var(--color-text-muted); margin: 0 0 0.5rem; }
.rich-text-editor .ProseMirror pre { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 6px; padding: 0.6rem 0.75rem; font-size: 0.8rem; overflow-x: auto; }
.rich-text-editor .ProseMirror code { font-family: monospace; }
.rich-text-editor .ProseMirror hr { border: none; border-top: 1px solid var(--color-border); margin: 0.75rem 0; }
.rich-text-editor .ProseMirror img { max-width: 100%; height: auto; border-radius: 4px; }
.rich-text-editor .ProseMirror img.ProseMirror-selectednode { outline: 2px solid var(--color-primary); }
.rich-text-editor .ProseMirror table { border-collapse: collapse; width: 100%; margin: 0 0 0.5rem; }
.rich-text-editor .ProseMirror th, .rich-text-editor .ProseMirror td { border: 1px solid var(--color-border); padding: 0.35rem 0.5rem; vertical-align: top; }
.rich-text-editor .ProseMirror th { background: var(--color-surface); font-weight: 600; }
.rich-text-editor .ProseMirror .selectedCell { background: color-mix(in srgb, var(--color-primary) 15%, transparent); }
.rich-text-editor .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0.5rem; }
.rich-text-editor .ProseMirror ul[data-type="taskList"] li { display: flex; gap: 0.4rem; align-items: flex-start; }
.rich-text-editor .ProseMirror ul[data-type="taskList"] li > label { margin-top: 0.15rem; }
.rich-text-editor .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: var(--color-text-muted); float: left; height: 0; pointer-events: none; }
`
