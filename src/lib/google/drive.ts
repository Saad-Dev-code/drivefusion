import { Readable } from 'stream'
import { google } from 'googleapis'
import { decrypt } from '@/lib/utils/encryption'
import { createClient } from '@/lib/supabase/server'
import { refreshAccessToken } from './oauth'

async function getAuthClient(accountId: string) {
  const supabase = await createClient()
  const { data: account } = await supabase
    .from('google_accounts')
    .select('*')
    .eq('id', accountId)
    .single()

  if (!account) throw new Error('Account not found')

  const refreshToken = decrypt(account.refresh_token)

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  oauth2Client.setCredentials({ refresh_token: refreshToken })

  return google.drive({ version: 'v3', auth: oauth2Client })
}

export async function listFiles(accountId: string, query?: string) {
  const drive = await getAuthClient(accountId)
  const response = await drive.files.list({
    q: query || "trashed = false",
    pageSize: 100,
    fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)',
  })
  return response.data.files || []
}

export async function uploadFile(
  accountId: string,
  fileBuffer: Buffer,
  metadata: { name: string; mimeType: string }
) {
  const drive = await getAuthClient(accountId)
  const response = await drive.files.create({
    requestBody: {
      name: metadata.name,
      mimeType: metadata.mimeType,
    },
    media: {
      mimeType: metadata.mimeType,
      body: Readable.from(fileBuffer),
    },
    fields: 'id, name, mimeType, size, modifiedTime',
  })
  return response.data
}

export async function downloadFile(accountId: string, fileId: string) {
  const drive = await getAuthClient(accountId)
  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  )
  return response.data
}

export async function renameFile(accountId: string, fileId: string, newName: string) {
  const drive = await getAuthClient(accountId)
  const response = await drive.files.update({
    fileId,
    requestBody: { name: newName },
    fields: 'id, name, modifiedTime',
  })
  return response.data
}

export async function deleteFile(accountId: string, fileId: string) {
  const drive = await getAuthClient(accountId)
  await drive.files.delete({ fileId })
}

export async function getStorageQuota(accountId: string) {
  const drive = await getAuthClient(accountId)
  const response = await drive.about.get({
    fields: 'storageQuota',
  })
  return response.data.storageQuota
}
