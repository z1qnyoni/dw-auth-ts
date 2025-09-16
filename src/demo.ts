import { dw } from "./docuwareApi.js";
import type { DocuWareFileCabinetList } from "./types.js";

async function main() {
  const { data } = await dw.get<DocuWareFileCabinetList>("/FileCabinets");

  if (Array.isArray(data?.FileCabinet)) {
    console.log("FileCabinets count:", data.FileCabinet.length);
    console.log(
      data.FileCabinet.slice(0, 5).map(fc => `${fc.Id}  ${fc.Name}`).join("\n")
    );
  } else {
    console.log("Raw response:", data);
  }
}

main().catch((e) => {
  const status = e?.response?.status;
  const body = e?.response?.data;
  console.error("DocuWare error:", status ?? e.message);
  if (body) console.error(body);
  process.exit(1);
});