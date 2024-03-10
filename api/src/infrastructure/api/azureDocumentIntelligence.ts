import { AzureKeyCredential, DocumentAnalysisClient, FormRecognizerFeature } from "@azure/ai-form-recognizer";
import { getFileSize } from "../util/file";
import { resizeImage } from "../util/image";
import { sanitizeString } from "../util/string";

export const createAzureDocumentAnalysisApiClient = (endpoint: string, key: string) => new DocumentAnalysisClient(
    endpoint,
    new AzureKeyCredential(key)
);

type Metadata = {
    title: string | null;
    pageNumber: number | null;
}

export async function extractMetadata(apiClient: DocumentAnalysisClient, file: File): Promise<Metadata> {
    const result = await analyzeDocument(apiClient, file);

    const title = result.paragraphs?.find(({ role }) => role === 'title')?.content ?? null;
    const pageNumber = result.paragraphs?.filter(({ role, content }) => role === 'pageNumber' && /\d+/.test(content))[0]?.content ?? null;

    return {
        title: (title === null) ? null : sanitizeString(title),
        pageNumber: (pageNumber === null) ? null : parseInt(pageNumber)
    }
}

type Barcode = {
    ean13: string | null;
}

export async function extractBarcode(apiClient: DocumentAnalysisClient, file: File): Promise<Barcode> {
    const result = await analyzeDocument(apiClient, file, ['barcodes']);

    return {
        ean13: result.pages?.[0].barcodes?.find(({ kind }) => kind === 'EAN13')?.value ?? null
    }
}

async function analyzeDocument(apiClient: DocumentAnalysisClient, file: File, features: FormRecognizerFeature[] = []) {
    const document = (getFileSize(file) < 4) ? file : await resizeImage(file, 2048);
    const poller = await apiClient.beginAnalyzeDocument(
        'prebuilt-layout',
        await document.arrayBuffer(),
        { features }
    );
    return poller.pollUntilDone();
}

