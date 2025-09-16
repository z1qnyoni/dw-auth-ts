import "dotenv/config";
import { DocuWareClient } from "./DocuWareClient.js";
import { resolve } from "node:path";

async function main() {
  const client = new DocuWareClient({
    platformUrl: process.env.DW_PLATFORM_URL!,
    username: process.env.DW_USERNAME!,
    password: process.env.DW_PASSWORD!,
  });

  // 1) Cabinets
  const cabs = await client.listFileCabinets();
  console.log("Cabinets:", cabs.map(c => `${c.name}${c.isBasket ? " (basket)" : ""}`).join(", "));

  // 2) Choose normal cabinet (without basket)
  const target = cabs.find(c => !c.isBasket && ["amministrazione","hr","international"].includes(c.name.toLowerCase()));
  if (!target) {
    console.log("No non-basket cabinet found among Amministrazione/HR/International.");
    return;
  }
  console.log(`Using cabinet: ${target.name} (${target.id})`);

  // 3) Documents
  const docs = await client.listDocuments(target.id, 50, 1);
  console.log(`Docs on page 1: ${docs.length}`);
  if (!docs.length) return;

  // 4) Fields first document
  const first = docs[0];
  const fields = await client.getDocumentFields(target.id, first.id);
  console.log("First doc id:", first.id);
  console.log("Fields (first 10):", fields.slice(0, 10));

  // 5) download PDF first document
  const out = resolve(`download_${first.id}.pdf`);
  const ok = await client.downloadPdf(target.id, first.id, out);
  console.log("Downloaded:", ok ? out : "not saved");
}

main().catch(e => {
  console.error("Error:", e.message);
  process.exit(1);
});
