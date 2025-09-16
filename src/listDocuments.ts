import { dwBasic } from "./dwBasicApi.js";
import { XMLParser } from "fast-xml-parser";

export interface DwDoc { id: string; fields?: any[]; }

export async function listDocuments(cabinetId: string, count = 50, page = 1): Promise<DwDoc[]> {
  const { data } = await dwBasic.get(`/FileCabinets/${cabinetId}/Documents`, {
    params: { count, page }
  });

  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
  const root = parser.parse(String(data));

  // in different versions the structure is different; normalize
  const items = root?.Documents?.Items?.Document
             ?? root?.Documents?.Document
             ?? [];

  const arr = Array.isArray(items) ? items : [items];
  return arr
    .filter(Boolean)
    .map((d: any) => ({
      id: d?.Id ?? d?.Document?.Id ?? d,
      fields: d?.Fields?.Field, // if received
    }));
}
