import { supabase } from "./base";
import { apiLogger } from "../logger-safe";

export async function uploadFile(
  bucket: string,
  file: File,
  folderPath: string = "",
  customFileName?: string,
): Promise<{ path: string | null; error: Error | null }> {
  try {
    if (!file) throw new Error("No file provided");
    if (!supabase) throw new Error("Supabase client is not initialized");

    const fileName = customFileName || `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
    if (error) throw error;

    return { path: data?.path || null, error: null };
  } catch (error) {
    apiLogger.error("Error uploading file:", error);
    return { path: null, error: error as Error };
  }
}

export function getPublicImageUrl(bucketName: string, filePath: string): string | null {
  if (!supabase) return null;
  let cleanedFilePath = filePath;
  if (cleanedFilePath.startsWith("documents/")) {
    cleanedFilePath = cleanedFilePath.substring("documents/".length);
  }
  const { data } = supabase.storage.from(bucketName).getPublicUrl(cleanedFilePath);
  return data.publicUrl || null;
}

export async function uploadDeliveryDocument(documentData: {
  delivery_id: string;
  document_type: string;
  document_url: string;
  verification_status?: string;
  expiry_date?: string;
  notes?: string;
}) {
  try {
    const { data, error } = await supabase!
      .from("delivery_documents")
      .insert([{
        delivery_id: documentData.delivery_id,
        document_type: documentData.document_type,
        document_url: documentData.document_url,
        verification_status: documentData.verification_status || "pending",
        expiry_date: documentData.expiry_date,
        notes: documentData.notes,
        uploaded_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (e) {
    apiLogger.error("Error uploading delivery document record:", e);
    return null;
  }
}
