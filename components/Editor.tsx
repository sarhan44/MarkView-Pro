import React from 'react';

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  visible: boolean;
}

export const Editor: React.FC<EditorProps> = ({ content, onChange, visible }) => {
  if (!visible) return null;

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Markdown Editor
      </div>
      <textarea
        className="flex-1 w-full p-6 resize-none focus:outline-none font-mono text-sm leading-relaxed text-gray-800 bg-white"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your markdown here..."
        spellCheck={false}
      />
    </div>
  );
};
