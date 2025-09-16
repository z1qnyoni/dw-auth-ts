import { dwBasic } from "./dwBasicApi.js";
import { XMLParser } from "fast-xml-parser";

export interface Cabinet { id: string; name: string; isBasket: boolean; }

export async function listFileCabinets(): Promise<Cabinet[]> {
  const { data } = await dwBasic.get("/FileCabinets"); // XML
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
  const root = parser.parse(String(data));

  // root -> FileCabinets -> FileCabinet (array or object)
  let list = root?.FileCabinets?.FileCabinet ?? [];
  if (!Array.isArray(list)) list = [list];

  return list.map((fc: any) => ({
    id: fc.Id,
    name: fc.Name,
    isBasket: String(fc.IsBasket).toLowerCase() === "true",
  }));
}