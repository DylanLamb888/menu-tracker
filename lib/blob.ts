import { put, del } from "@vercel/blob";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";

const USE_LOCAL_STORAGE = !process.env.BLOB_READ_WRITE_TOKEN;

export async function uploadPdf(file: File, menuId: string): Promise<{ url: string; filename: string }> {
  const timestamp = Date.now();
  const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

  if (USE_LOCAL_STORAGE) {
    // Local development: save to public/uploads directory
    const uploadDir = join(process.cwd(), "public", "uploads", menuId);
    await mkdir(uploadDir, { recursive: true });

    const localFilename = `${timestamp}-${safeFilename}`;
    const filePath = join(uploadDir, localFilename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return {
      url: `/uploads/${menuId}/${localFilename}`,
      filename: file.name,
    };
  }

  // Production: use Vercel Blob
  const filename = `menus/${menuId}/${timestamp}-${safeFilename}`;

  const blob = await put(filename, file, {
    access: "public",
    contentType: "application/pdf",
  });

  return {
    url: blob.url,
    filename: file.name,
  };
}

export async function deletePdf(url: string): Promise<void> {
  if (USE_LOCAL_STORAGE) {
    // Local development: delete from public/uploads
    if (url.startsWith("/uploads/")) {
      const filePath = join(process.cwd(), "public", url);
      try {
        await unlink(filePath);
      } catch {
        // File may not exist, ignore
      }
    }
    return;
  }

  // Production: delete from Vercel Blob
  await del(url);
}
