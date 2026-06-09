import type { ChatSessionDetail } from '@/api/knowledge-base';

export interface ContentPart {
  createdAt: string;
  type: 'text' | 'tool_call';
  content?: string;
  toolName?: string;
  toolCallId?: string;
  status?: 'running' | 'completed';
  resultPreview?: string;
  resultFull?: string;
  durationMs?: number;
}

export interface UiMessage {
  key: string;
  role: 'user' | 'assistant';
  content: string;
  parts: ContentPart[];
  loading: boolean;
  hasMaterial: boolean;
  materialType: 'file' | 'inline' | 'knowledge' | undefined;
  fileName: string | undefined;
  inlineText: string | undefined;
  knowledgeScopeLabel: string | undefined;
  phase: string | undefined;
  fileIds: string[];
  fileNames: string[];
  createdAt: string;
}

export interface AttachedFile {
  id: string;
  name: string;
}

export interface KnowledgeScope {
  libraryId?: string;
  folderId?: string;
  includeSubfolders?: boolean;
  label: string;
}

export type MaterialRefs =
  ChatSessionDetail['messages'][number]['materialRefs'];
