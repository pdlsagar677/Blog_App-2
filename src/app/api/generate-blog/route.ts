// app/api/generate-blog/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { title } = await req.json();

    if (!title || title.trim().length < 3) {
      return NextResponse.json(
        { error: "Title must be at least 3 characters long." },
        { status: 400 }
      );
    }

    console.log("🤖 Using OpenAI for:", title);

    try {
      // Attempt to generate using OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // cheaper, faster model
        messages: [
          {
            role: "user",
            content: `Write a 500-word blog post about "${title}". 
                      Use natural human-like paragraphs — not markdown headings, 
                      no outlines — just flowing descriptive content.`,
          },
        ],
        max_tokens: 1000,
      });

      const blogContent = completion.choices[0]?.message?.content || "";

      if (!blogContent) {
        throw new Error("No content generated");
      }

      return NextResponse.json({
        content: blogContent,
        description: `An article about ${title}`,
        source: "openai",
      });
    } catch (error: any) {
      // Handle OpenAI quota or rate-limit errors gracefully
      if (
        error.code === "insufficient_quota" ||
        (error.status && error.status === 429)
      ) {
        console.warn("⚠️ OpenAI quota exceeded. Using fallback text.");

        // ✅ Fallback — simple paragraph format
        return NextResponse.json({
          content: `
${title} is a fascinating topic that captures the imagination of many people. 
Although our AI writing service is temporarily unavailable, here’s a short paragraph 
to get you started. ${title} represents beauty, culture, and depth — offering a mix 
of experiences that intrigue travelers and locals alike. From its historical background 
to its modern relevance, there’s always something inspiring about this subject. 
You can expand this introduction with your own details, adding personal insights 
and observations to make it truly yours.`,
          description: `An article about ${title}`,
          source: "fallback",
        });
      }

      console.error("❌ OpenAI API Error:", error);
      throw error;
    }
  } catch (error) {
    console.error("🔥 Server Error:", error);
    return NextResponse.json(
      {
        error:
          "AI service unavailable. Please try again later or write content manually.",
      },
      { status: 500 }
    );
  }
}
