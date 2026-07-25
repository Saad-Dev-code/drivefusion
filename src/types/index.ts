export interface User {
  id: string
  email: string
  name: string | null
  avatar: string | null
  created_at: string
}

export interface GoogleAccount {
  id: string
  user_id: string
  google_email: string
  google_name: string
  refresh_token: string
  access_token: string
  expires_at: string
  total_storage: number
  used_storage: number
  available_storage: number
  connected_at: string
}

export interface FileRecord {
  id: string
  user_id: string
  google_account_id: string
  drive_file_id: string
  filename: string
  mime_type: string
  size: number
  virtual_folder_id: string | null
  ai_summary: string | null
  starred: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  tags?: AiTag[]
  google_account?: Pick<GoogleAccount, 'google_email' | 'google_name'>
}

export interface AiTag {
  id: string
  file_id: string
  tag: string
}

export interface VirtualFolder {
  id: string
  user_id: string
  parent_id: string | null
  name: string
  children?: VirtualFolder[]
}

export interface StorageInfo {
  total_storage: number
  used_storage: number
  available_storage: number
  accounts: GoogleAccount[]
}

export interface AiInsight {
  type: 'duplicate' | 'storage' | 'organization' | 'suggestion'
  title: string
  description: string
  severity: 'info' | 'warning' | 'success'
  action?: string
}

export interface SearchResult {
  files: FileRecord[]
  query: string
  ai_transformed?: {
    filename_contains?: string
    mime_type?: string
    min_size?: number
    max_size?: number
    date_range?: { start: string; end: string }
    tags?: string[]
    folder?: string
  }
}

export interface UploadQueueItem {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error'
  error?: string
  result?: FileRecord
}
