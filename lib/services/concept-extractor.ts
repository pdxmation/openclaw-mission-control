import OpenAI from 'openai'
import { z } from 'zod'

// Lazy-load OpenAI client to avoid build-time errors
let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI()
  }
  return _openai
}

// Concept category types
export type ConceptCategory = 'decision' | 'idea' | 'learning' | 'task' | 'concept'

// Concept interface
export interface Concept {
  id: string
  title: string
  summary: string
  importance: number // 0-1
  tags: string[]
  category: ConceptCategory
}

// Zod schema for concept validation
const ConceptSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(2000),
  importance: z.number().min(0).max(1),
  tags: z.array(z.string()),
  category: z.enum(['decision', 'idea', 'learning', 'task', 'concept'])
})

const ConceptsResponseSchema = z.object({
  concepts: z.array(ConceptSchema)
})

export interface ExtractConceptsOptions {
  minImportance?: number
  maxConcepts?: number
}

/**
 * Extract key concepts from conversation text using AI
 * 
 * @param conversationText - The conversation text to analyze
 * @param options - Options for extraction
 * @returns Array of extracted concepts
 */
export async function extractConcepts(
  conversationText: string,
  options: ExtractConceptsOptions = {}
): Promise<Concept[]> {
  const { minImportance = 0.7, maxConcepts = 10 } = options

  if (!conversationText || conversationText.trim().length < 50) {
    return []
  }

  const prompt = `Analyze the following conversation and extract the most important concepts, ideas, decisions, and learnings.

For each concept, provide:
1. A clear, concise title (max 5 words)
2. A brief summary (1-3 sentences)
3. An importance score (0.0-1.0) based on:
   - Long-term value
   - Actionability
   - Novelty/insight
   - Connection to other concepts
4. Relevant tags (2-5 tags)
5. Category: decision | idea | learning | task | concept

Focus on extracting only high-value concepts that would be worth documenting in a knowledge base. Skip routine or trivial exchanges.

Conversation:
---
${conversationText.slice(0, 15000)}${conversationText.length > 15000 ? '\n[truncated]' : ''}
---

Respond with a JSON object containing a "concepts" array. Each concept should have: title, summary, importance (number 0-1), tags (string array), and category.

Example response:
{
  "concepts": [
    {
      "title": "API Rate Limiting Strategy",
      "summary": "We decided to implement token bucket rate limiting with Redis for the public API endpoints.",
      "importance": 0.85,
      "tags": ["api", "redis", "performance", "architecture"],
      "category": "decision"
    }
  ]
}`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert knowledge extraction system. Extract valuable concepts from conversations with high accuracy. Return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      console.warn('No content in AI response for concept extraction')
      return []
    }

    const parsed = JSON.parse(content)
    const validated = ConceptsResponseSchema.parse(parsed)

    // Add IDs and filter by importance
    const concepts: Concept[] = validated.concepts
      .filter((c) => c.importance >= minImportance)
      .slice(0, maxConcepts)
      .map((c) => ({
        ...c,
        id: `concept_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        tags: c.tags.map((t) => t.toLowerCase().replace(/\s+/g, '-'))
      }))

    return concepts
  } catch (error) {
    console.error('Error extracting concepts:', error)
    return []
  }
}

/**
 * Generate a conversation summary
 * 
 * @param conversationText - The conversation text to summarize
 * @returns Summary object with key points
 */
export async function generateConversationSummary(
  conversationText: string
): Promise<{
  summary: string
  keyTopics: string[]
  keyDecisions: string[]
  importance: number
}> {
  if (!conversationText || conversationText.trim().length < 50) {
    return {
      summary: 'No significant conversation recorded.',
      keyTopics: [],
      keyDecisions: [],
      importance: 0
    }
  }

  const prompt = `Analyze this conversation and provide a structured summary:

1. Overall summary (2-4 sentences capturing the main purpose and outcome)
2. Key topics discussed (array of 3-7 topic strings)
3. Key decisions made (array of decision strings, empty if none)
4. Overall importance score (0.0-1.0) based on:
   - Strategic significance
   - Amount of actionable information
   - Depth of discussion

Conversation:
---
${conversationText.slice(0, 15000)}${conversationText.length > 15000 ? '\n[truncated]' : ''}
---

Respond with JSON in this format:
{
  "summary": "string",
  "keyTopics": ["string"],
  "keyDecisions": ["string"],
  "importance": number
}`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a conversation summarization expert. Create concise, accurate summaries. Return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return {
        summary: 'Unable to generate summary.',
        keyTopics: [],
        keyDecisions: [],
        importance: 0
      }
    }

    const parsed = JSON.parse(content)
    return {
      summary: parsed.summary || 'No summary available.',
      keyTopics: parsed.keyTopics || [],
      keyDecisions: parsed.keyDecisions || [],
      importance: parsed.importance || 0
    }
  } catch (error) {
    console.error('Error generating conversation summary:', error)
    return {
      summary: 'Error generating summary.',
      keyTopics: [],
      keyDecisions: [],
      importance: 0
    }
  }
}
