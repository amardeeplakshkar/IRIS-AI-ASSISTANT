import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const backendForm = new FormData();
    backendForm.append("file", new Blob([buffer], { type: "audio/mpeg" }), "audio.mp3");
    backendForm.append("model", "openai-audio");

    const response = await fetch("https://text.pollinations.ai/transcriptions", {
      method: "POST",
      body: backendForm,
    });

    const text = await response.text(); // use .text() instead of .json()
    console.log("Raw response from transcription API:", text);
    
    return NextResponse.json({ error: "Invalid JSON response from API", raw: text }, { status: 500 });
    
  } catch (error) {
    console.error("Error in /api/speech-to-text:", error);
    return NextResponse.json({ error: "Internal Server Error", details: String(error) }, { status: 500 });
  }
}
