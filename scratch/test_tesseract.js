import Tesseract from "tesseract.js";

async function runTest() {
  console.log("Creating Tesseract worker...");
  const worker = await Tesseract.createWorker("eng");
  console.log("Worker created successfully!");
  await worker.terminate();
}

runTest().catch(console.error);
