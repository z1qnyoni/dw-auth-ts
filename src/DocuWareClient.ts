import axios, { AxiosInstance } from "axios";
import { XMLParser } from "fast-xml-parser";

export type Cabinet = { id: string; name: string; isBasket: boolean };
export type DwField = { FieldName?: string; Item?: any } & Record<string, any>;
export type DwDoc = { id: string; fields?: DwField[] };

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

export interface DocuWareClientOptions {
  platformUrl: string;   // https://host/DocuWare/Platform
  username: string;
  password: string;
  timeoutMs?: number;    // default 60s
  accept?: "xml" | "json"; // default xml
  retries?: number;        // default 2 (with exponential backoff)
}

export class DocuWareClient {
  readonly http: AxiosInstance;
  readonly retries: number;

  constructor(opts: DocuWareClientOptions) {
    const baseURL = opts.platformUrl.replace(/\/$/, "");
    const basic = Buffer.from(`${opts.username}:${opts.password}`).toString("base64");
    this.retries = opts.retries ?? 2;

    this.http = axios.create({
      baseURL,
      timeout: opts.timeoutMs ?? 60000,
      headers: {
        Authorization: `Basic ${basic}`,
        Accept: opts.accept === "json" ? "application/json" : "application/xml",
      },
    });
  }

  // ----- helpers -----

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let err: any;
    for (let i = 0; i <= this.retries; i++) {
      try {
        return await fn();
      } catch (e: any) {
        // do not retry 4xx, except 429; retry network/5xx/429
        const status = e?.response?.status;
        if (status && status !== 429 && status < 500) throw this.prettyError(e);
        err = e;
        await new Promise(r => setTimeout(r, 300 * Math.pow(2, i)));
      }
    }
    throw this.prettyError(err);
  }

  private parseXml(data: any) {
    try { return parser.parse(String(data)); } catch { return null; }
  }

  private prettyError(e: any) {
    const status = e?.response?.status;
    const raw = e?.response?.data;
    const xml = typeof raw === "string" ? this.parseXml(raw) : null;
    const msgXml = xml?.Error?.Message || xml?.["s:Error"]?.["s:Message"];
    const excXml = xml?.Error?.Exception || xml?.["s:Error"]?.["s:Exception"];

    const message =
      (typeof raw === "string" ? undefined : raw?.message) ||
      msgXml ||
      excXml ||
      e?.message ||
      "DocuWare error";

    // special text about licenses
    if ((msgXml || excXml)?.toString().toLowerCase().includes("licenses")) {
      return new Error(`DocuWare licenses are in use. Free a client license and retry. (HTTP ${status})`);
    }
    return new Error(`${message}${status ? ` (HTTP ${status})` : ""}`);
  }

  // ----- API -----

  async listFileCabinets(): Promise<Cabinet[]> {
    const res = await this.withRetry(() => this.http.get("/FileCabinets"));
    const root = this.parseXml(res.data);
    let list = root?.FileCabinets?.FileCabinet ?? [];
    if (!Array.isArray(list)) list = [list];
    return list.map((fc: any) => ({
      id: fc.Id,
      name: fc.Name,
      isBasket: String(fc.IsBasket).toLowerCase() === "true",
    }));
  }

  async listDocuments(cabinetId: string, count = 50, page = 1): Promise<DwDoc[]> {
    const res = await this.withRetry(() =>
      this.http.get(`/FileCabinets/${cabinetId}/Documents`, { params: { count, page } })
    );
    const root = this.parseXml(res.data);

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

  async getDocumentFields(cabinetId: string, docId: string): Promise<DwField[]> {
    const res = await this.withRetry(() =>
      this.http.get(`/FileCabinets/${cabinetId}/Documents/${docId}/Fields`)
    );
    const root = this.parseXml(res.data);
    let fields = root?.Fields?.Field ?? root?.Field ?? [];
    if (!Array.isArray(fields)) fields = [fields];
    return fields;
  }

  /** Download PDF/original. Returns true if the file was saved */
  async downloadPdf(cabinetId: string, docId: string, filePath: string): Promise<boolean> {
    const candidates = [
      `/FileCabinets/${cabinetId}/Documents/${docId}/File`,
      `/Documents/${docId}/File`,
      `/FileCabinets/${cabinetId}/Documents/${docId}/Sections/0/File`,
    ];

    const fs = await import("node:fs");
    for (const p of candidates) {
      try {
        const res = await this.withRetry(() =>
          this.http.get(p, { responseType: "stream" })
        );
        await new Promise<void>((resolve, reject) => {
          const ws = fs.createWriteStream(filePath);
          (res.data as NodeJS.ReadableStream).pipe(ws);
          ws.on("finish", resolve);
          ws.on("error", reject);
        });
        return true;
      } catch (e: any) {
        if (e?.message?.includes("HTTP 404")) continue; // try next path
        // if not 404 - pass further
        throw e;
      }
    }
    throw new Error("No suitable file endpoint found (tried several variants).");
  }
}
