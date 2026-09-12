import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import type { Extensions } from '@tiptap/react'
// `TextStyle` et `Table` s'importent nommés : depuis TipTap 3 leurs paquets regroupent
// plusieurs extensions et n'exposent plus d'export par défaut, contrairement aux autres.
import { FontSize } from './fontSize'
import { DataBinding } from './dataBinding'

// Source unique des extensions TipTap, partagée par l'éditeur (RichTextEditor) et le renderer
// lecture seule de la preview (RichTextRenderer). Garantit un rendu identique des deux côtés,
// jetons de données live compris.
export function buildRichTextExtensions(apiUrl: string): Extensions {
  return [
    StarterKit, // gras, italique, barré, code, titres, listes, citation, ligne, annuler/rétablir…
    Underline,
    Superscript,
    Subscript,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextStyle, // requis par Color et FontSize
    FontSize,
    Color,
    Highlight.configure({ multicolor: true }),
    Link.configure({ openOnClick: false, autolink: true }),
    Image.configure({ inline: false }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({ placeholder: 'Saisissez votre texte…' }),
    DataBinding.configure({ apiUrl }),
  ]
}
