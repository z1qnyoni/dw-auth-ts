import { XMLParser } from "fast-xml-parser";
export const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
export const toXml = (data: any) => parser.parse(String(data));