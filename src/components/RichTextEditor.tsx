import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Typography from '@tiptap/extension-typography';
import Image from '@tiptap/extension-image';
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered, 
  Underline as UnderlineIcon, Link as LinkIcon, Highlighter, 
  CheckSquare, Code, Quote, Undo, Redo, Image as ImageIcon
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder = 'Start writing...' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Typography,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[var(--color-primary)] underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full h-auto border border-white/10',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] p-6 bg-white/2 border border-white/10 rounded-2xl font-sans text-lg leading-relaxed selection:bg-[var(--color-primary)]/30',
      },
    },
  });

  // Sync content if it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="space-y-4">
      {/* Primary Toolbar */}
      <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl flex-wrap sticky top-0 z-20 backdrop-blur-xl">
        <div className="flex gap-1 pr-2 border-r border-white/10 mr-1">
          <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} icon={<Bold size={18} />} />
          <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} icon={<Italic size={18} />} />
          <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} icon={<UnderlineIcon size={18} />} />
          <MenuButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} icon={<Strikethrough size={18} />} />
        </div>

        <div className="flex gap-1 pr-2 border-r border-white/10 mr-1">
          <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} icon={<Heading1 size={18} />} />
          <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} icon={<Heading2 size={18} />} />
          <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} icon={<Quote size={18} />} />
        </div>

        <div className="flex gap-1 pr-2 border-r border-white/10 mr-1">
          <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} icon={<List size={18} />} />
          <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} icon={<ListOrdered size={18} />} />
          <MenuButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} icon={<CheckSquare size={18} />} />
        </div>

        <div className="flex gap-1 pr-2 border-r border-white/10 mr-1">
          <MenuButton onClick={setLink} active={editor.isActive('link')} icon={<LinkIcon size={18} />} />
          <MenuButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} icon={<Highlighter size={18} />} />
          <MenuButton onClick={addImage} icon={<ImageIcon size={18} />} />
          <MenuButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} icon={<Code size={18} />} />
        </div>

        <div className="flex gap-1 ml-auto">
          <MenuButton onClick={() => editor.chain().focus().undo().run()} icon={<Undo size={18} />} />
          <MenuButton onClick={() => editor.chain().focus().redo().run()} icon={<Redo size={18} />} />
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function MenuButton({ onClick, active = false, icon }: { onClick: () => void; active?: boolean; icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick} 
      className={`p-2 rounded-xl transition-all duration-200 ${
        active 
          ? 'bg-[var(--color-primary)] text-[var(--color-background)] shadow-neon' 
          : 'text-white/60 hover:text-white hover:bg-white/10'
      }`}
    >
      {icon}
    </button>
  );
}
