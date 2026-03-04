import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, List, ListOrdered, Heading2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  return (
    <div className="flex flex-wrap gap-1 border border-input rounded-t-md bg-muted/40 p-1">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  className,
  minHeight = '120px',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none min-h-[80px] px-3 py-2 focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      const from = editor.state.selection.from;
      editor.commands.setContent(value || '', false);
      editor.commands.setTextSelection(from);
    }
  }, [value, editor]);

  return (
    <div className={cn('rounded-md border border-input overflow-hidden', className)}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} style={{ minHeight }} />
    </div>
  );
}
