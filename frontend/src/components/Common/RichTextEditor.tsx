import React from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Box } from '@mui/material';
import { Editor as TinyMCEEditor } from 'tinymce';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  placeholder?: string;
  readOnly?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  onFocus,
  placeholder = 'הזן תוכן...',
  readOnly = false,
}) => {
  return (
    <Box sx={{ width: '100%', direction: 'rtl' }}>
      <Editor
        apiKey="ayi8tk45jgk1n91b74nkyrrm77x3w29efyb0cyg38yryh2cl"
        value={value}
        disabled={readOnly}
        onEditorChange={(content: string) => onChange(content)}
        onFocus={() => onFocus && onFocus()}
        init={{
          min_height: 500,
          max_height: 800,
          menubar: false,
          directionality: 'rtl',
          language: 'he_IL',
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
            'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'table', 'help', 'wordcount', 'directionality',
            'autoresize'
          ],
          toolbar:
            'undo redo | formatselect | bold italic underline strikethrough | ' +
            'forecolor backcolor | alignright aligncenter alignleft | ' +
            'bullist numlist | outdent indent | ltr rtl | ' +
            'link | removeformat | help',
          content_style: `
            body { 
              font-family: Arial, sans-serif; 
              font-size: 16px; 
              direction: rtl;
              text-align: right;
            }
            p { 
              margin: 0 0 12px 0;
              direction: rtl;
              text-align: right;
            }
            ul, ol {
              padding-right: 40px;
              padding-left: 0;
              text-align: right;
              direction: rtl;
            }
            li {
              text-align: right;
              direction: rtl;
            }
          `,
          placeholder: placeholder,
          setup: (editor: TinyMCEEditor) => {
            editor.on('init', () => {
              editor.getBody().setAttribute('dir', 'rtl');
            });
          },
        }}
      />
    </Box>
  );
};

export default RichTextEditor;
