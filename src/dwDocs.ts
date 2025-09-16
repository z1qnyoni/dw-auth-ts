import { dwBasic } from "./dwBasicApi.js";
import { toXml } from "./xml.js";
import { createWriteStream } from "node:fs";

export interface Cabinet { id: string; name: string; isBasket: boolean; }
export interface DwDoc { id: string; fields?: any[] }

export async function listFileCabinets(): Promise<Cabinet[]> {
  const { data } = await dwBasic.get("/FileCabinets");
  const root = toXml(data);
  let list = root?.FileCabinets?.FileCabinet ?? [];
  if (!Array.isArray(list)) list = [list];
  return list.map((fc: any) => ({
    id: fc.Id,
    name: fc.Name,
    isBasket: String(fc.IsBasket).toLowerCase() === "true",
  }));
}

/** First/any page of documents in the cabinet */
export async function listDocuments(cabinetId: string, count = 50, page = 1): Promise<DwDoc[]> {
  const { data } = await dwBasic.get(`/FileCabinets/${cabinetId}/Documents`, { params: { count, page } });
  const root = toXml(data);

  const items =
    root?.Documents?.Items?.Document ??
    root?.Documents?.Document ??
    root?.Items?.Document ?? [];

  const arr = Array.isArray(items) ? items : [items];
  return arr.filter(Boolean).map((d: any) => ({
    id: d?.Id ?? d?.Document?.Id ?? d,
    fields: d?.Fields?.Field,
  }));
}

/** Fields (indexes) of the document */
export async function getDocumentFields(cabinetId: string, docId: string): Promise<any[]> {
  const { data } = await dwBasic.get(`/FileCabinets/${cabinetId}/Documents/${docId}/Fields`);
  const root = toXml(data);
  let fields = root?.Fields?.Field ?? root?.Field ?? [];
  if (!Array.isArray(fields)) fields = [fields];
  return fields;
}

/**
 * Download PDF (or original) to disk.
 * By default try standard PDF endpoint.
 * If it returns 404, try alternative paths, encountered in different versions of DocuWare.
 */
export async function downloadPdf(cabinetId: string, docId: string, filePath: string): Promise<string> {
  const tryPaths = [
    `/FileCabinets/${cabinetId}/Documents/${docId}/File`,          // often PDF/render
    `/Documents/${docId}/File`,                                     // alternative path
    `/FileCabinets/${cabinetId}/Documents/${docId}/Sections/0/File` // section 0 (sometimes original is needed)
  ];

  for (const p of tryPaths) {
    try {
      const res = await dwBasic.get(p, { responseType: "stream" });
      await new Promise<void>((resolve, reject) => {
        const ws = createWriteStream(filePath);
        (res.data as NodeJS.ReadableStream).pipe(ws);
        ws.on("finish", () => resolve());
        ws.on("error", reject);
      });
      return filePath;
    } catch (e: any) {
      if (e?.response?.status !== 404) throw e; // if not 404 — pass further
    }
  }
  throw new Error("No suitable file endpoint found (tried several variants).");
}
