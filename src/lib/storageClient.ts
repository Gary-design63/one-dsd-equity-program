// One DSD Equity Platform - Server-side Storage Client
// Calls the blob-storage Supabase Edge Function for file operations
// All operations require authentication

import { supabase, isSupabaseAvailable } from "@/core/supabaseClient";

export interface UploadResult {
  url: string;
}

export interface FileInfo {
  name: string;
  size: number;
  createdAt: string;
}

export async function uploadFile(
  file: File,
  path: string
): Promise<UploadResult> {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error("Storage service unavailable");
  }

  // The blob-storage Edge Function reads action/path from query params.
  // supabase.functions.invoke doesn't support query params, so we build
  // the URL manually using the Supabase project URL.
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    return uploadFileDirect(file, path);
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Not authenticated");
    }

    const fnUrl = new URL(`${supabaseUrl}/functions/v1/blob-storage`);
    fnUrl.searchParams.set("action", "upload");
    fnUrl.searchParams.set("path", path);
    fnUrl.searchParams.set("type", file.type);

    const response = await fetch(fnUrl.toString(), {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": file.type,
        "Content-Length": String(file.size),
        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY || "",
      },
      body: await file.arrayBuffer(),
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return await response.json() as UploadResult;
  } catch (err) {
    // Fallback: use direct Supabase Storage if Edge Function is not deployed
    console.warn("Edge Function unavailable, falling back to direct Supabase Storage:", err);
    return uploadFileDirect(file, path);
  }
}

// Direct Supabase Storage upload (fallback when Edge Functions are not deployed)
async function uploadFileDirect(file: File, path: string): Promise<UploadResult> {
  if (!supabase) throw new Error("Supabase not available");

  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || "anonymous";
  const storagePath = `${userId}/${path}`;

  const { error } = await supabase.storage
    .from("one-dsd-files")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: true,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from("one-dsd-files")
    .getPublicUrl(storagePath);

  return { url: urlData.publicUrl };
}

export async function downloadFile(path: string): Promise<Blob> {
  if (!supabase) throw new Error("Storage service unavailable");

  // Direct Supabase Storage download
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || "anonymous";
  const storagePath = `${userId}/${path}`;

  const { data, error } = await supabase.storage
    .from("one-dsd-files")
    .download(storagePath);

  if (error || !data) throw new Error(`Download failed: ${error?.message || "File not found"}`);
  return data;
}

export async function deleteFile(path: string): Promise<void> {
  if (!supabase) throw new Error("Storage service unavailable");

  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || "anonymous";
  const storagePath = `${userId}/${path}`;

  const { error } = await supabase.storage
    .from("one-dsd-files")
    .remove([storagePath]);

  if (error) throw new Error(`Delete failed: ${error.message}`);
}

export async function listFiles(prefix?: string): Promise<FileInfo[]> {
  if (!supabase) throw new Error("Storage service unavailable");

  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || "anonymous";
  const storagePath = prefix ? `${userId}/${prefix}` : userId;

  const { data, error } = await supabase.storage
    .from("one-dsd-files")
    .list(storagePath);

  if (error) throw new Error(`List failed: ${error.message}`);

  return (data || []).map(f => ({
    name: f.name,
    size: f.metadata?.size || 0,
    createdAt: f.created_at || "",
  }));
}
