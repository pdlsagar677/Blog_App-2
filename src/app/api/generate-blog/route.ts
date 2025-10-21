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
            content: `Write a 500-word, SEO-friendly blog post about "${title}" in markdown format. Include intro, key points, and conclusion.`,
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
      // Check for OpenAI quota or rate-limit errors
      if (
        error.code === "insufficient_quota" ||
        (error.status && error.status === 429)
      ) {
        console.warn("⚠️ OpenAI quota exceeded. Using fallback content.");
        // Return fallback content
        return NextResponse.json({
          content: `
## ${title}

It seems our AI content generator has reached its quota.  
But here’s a helpful outline to get you started manually:

### Introduction
Describe the importance and charm of ${title}. 

### Main Section
- Key features or attractions related to ${title}.
- Historical or cultural background.
- Tips for readers or travelers.

### Conclusion
Summarize why ${title} is worth exploring or learning about.

_(Generated using fallback template due to API quota limits.)_
          `,
          description: `An article outline about ${title}`,
          source: "fallback",
        });
      }

      // Other unknown errors
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
