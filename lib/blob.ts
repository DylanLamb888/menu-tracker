import { put, del } from "@vercel/blob";

export async function uploadPdf(file: File, menuId: string): Promise<{ url: string; filename: string }> {
  const filename = `menus/${menuId}/${Date.now()}-${file.name}`;

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
  await del(url);
}
