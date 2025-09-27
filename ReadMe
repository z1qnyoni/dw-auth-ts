# DocuWare Authentication & API Client (TypeScript)

A lightweight TypeScript client to **authenticate programmatically with DocuWare** (without user interaction) and interact with the DocuWare Platform API.  
Designed for **backend service-to-service integrations**: log in automatically, access file cabinets, list and fetch documents, and download files.

---

## 🔑 Why This Approach

DocuWare does not support a standard OAuth2 Client Credentials flow.  
The recommended way for backend integrations is:

- Use a **service user** with **Basic Authentication** (username + password).
- Establish a session programmatically → receive cookies/headers.
- Reuse those session tokens for further API calls.
- No WebClient login or browser JWTs involved.
- Configuration handled via environment variables.

This ensures stable, automated server-side access.

---

## 📂 Project Structure


```
.
├── src/
│   ├── DocuWareClient.ts    # Main reusable API client
│   ├── dwBasicApi.ts        # Low-level API wrapper
│   ├── dwDocs.ts            # Document-related utilities  
│   ├── listDocuments.ts     # Document listing functions
│   ├── listFileCabinets.ts  # File cabinet utilities
│   ├── xml.ts               # XML parsing helpers
│   └── demo.ts              # Example script using the client
├── .env                     # Local environment variables (ignored in Git)
├── .env.example             # Example env file for contributors
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-org/dw-auth-ts.git
cd dw-auth-ts
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a .env file

Copy the example and fill in your real values:

```bash
cp .env.example .env
```

Only `.env.example` should be tracked in Git.

---

## 🚀 Usage

### Run the demo script

```bash
npm run dev
```

This will:

1. Authenticate to DocuWare
2. List all available file cabinets
3. Show how to query documents from a cabinet
4. Download a PDF from the first document

**Example output:**

```
Cabinets: International, HR, Amministrazione, ...
Using cabinet: International (cab-123)
Docs on page 1: 15
First doc id: doc-456
Downloaded: download_doc-456.pdf
```

---

## 🛠 Available Functions

The `DocuWareClient` class currently supports:

### Authentication
- Establish a session using Basic Auth (`DW_USERNAME` + `DW_PASSWORD`).

### File Cabinets  
- `listFileCabinets()` - List all file cabinets
- Fetch details of a single cabinet

### Documents
- `listDocuments(cabinetId, count, page)` - Query documents in a given file cabinet
- `getDocumentFields(cabinetId, docId)` - Get document metadata/fields
- `downloadPdf(cabinetId, docId, filePath)` - Download document as PDF

More functions can be added by wrapping additional DocuWare API endpoints inside `DocuWareClient`.

---

## 🧑‍💻 Development

- **TypeScript** is used with strict typing.
- API logic is isolated in `DocuWareClient` for reusability.
- `.env` keeps secrets out of source control.
- **Build**: `npm run build` 
- **Start**: `npm start` (runs compiled JS)

---

## 📌 Next Steps

- Add more high-level methods to `DocuWareClient` (upload, update, delete documents).
- Implement error handling & retries for production use.
- Integrate into your backend services.

---

## 📖 References

- [DocuWare Platform API Documentation](https://help.docuware.com/en-US/Platform/)
- [DocuWare Authentication Overview](https://help.docuware.com/en-US/Platform/en/dwplatform.htm#Topics/t_DW_REST_API_Authentication_e.htm)
