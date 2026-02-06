import 'dotenv/config';
// Using built-in fetch (Node 18+)

const HF_API_KEY = process.env.HF_API_KEY;
const HF_MODEL = process.env.HF_MODEL || 'meta-llama/Meta-Llama-3-8B-Instruct';

// Common English words for basic validation (expanded list)
const COMMON_WORDS = new Set([
  // Common tech/project words
  'app', 'web', 'site', 'website', 'application', 'system', 'tool', 'platform', 'service',
  'api', 'database', 'server', 'client', 'frontend', 'backend', 'fullstack', 'mobile',
  'android', 'ios', 'react', 'vue', 'angular', 'node', 'python', 'java', 'javascript',
  'typescript', 'html', 'css', 'sql', 'mongodb', 'firebase', 'aws', 'cloud', 'docker',
  'game', 'chat', 'blog', 'shop', 'store', 'ecommerce', 'dashboard', 'admin', 'user',
  'login', 'authentication', 'payment', 'booking', 'tracker', 'manager', 'generator',
  'converter', 'calculator', 'analyzer', 'monitor', 'portfolio', 'resume', 'weather',
  'music', 'video', 'photo', 'image', 'file', 'document', 'note', 'task', 'todo', 'list',
  'calendar', 'event', 'social', 'network', 'media', 'news', 'feed', 'search', 'filter',
  'chart', 'graph', 'data', 'analytics', 'report', 'export', 'import', 'upload', 'download',
  // Common English words
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall',
  'can', 'need', 'make', 'made', 'get', 'got', 'go', 'going', 'come', 'came', 'take', 'took',
  'see', 'saw', 'know', 'knew', 'think', 'thought', 'want', 'use', 'used', 'find', 'found',
  'give', 'gave', 'tell', 'told', 'work', 'call', 'try', 'ask', 'put', 'keep', 'let', 'begin',
  'seem', 'help', 'show', 'hear', 'play', 'run', 'move', 'live', 'believe', 'hold', 'bring',
  'happen', 'write', 'provide', 'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue',
  'set', 'learn', 'change', 'lead', 'understand', 'watch', 'follow', 'stop', 'create', 'speak',
  'read', 'allow', 'add', 'spend', 'grow', 'open', 'walk', 'win', 'offer', 'remember', 'love',
  'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send', 'expect', 'build', 'stay',
  'fall', 'cut', 'reach', 'kill', 'remain', 'suggest', 'raise', 'pass', 'sell', 'require',
  'report', 'decide', 'pull', 'develop', 'project', 'student', 'school', 'university',
  'college', 'education', 'learning', 'course', 'class', 'online', 'free', 'new', 'old',
  'good', 'bad', 'great', 'small', 'big', 'large', 'high', 'low', 'long', 'short', 'own',
  'other', 'same', 'different', 'important', 'public', 'private', 'real', 'best', 'better',
  'simple', 'easy', 'hard', 'difficult', 'fast', 'quick', 'slow', 'early', 'late', 'young',
  'personal', 'local', 'global', 'national', 'international', 'main', 'major', 'minor',
  'full', 'complete', 'basic', 'advanced', 'modern', 'traditional', 'smart', 'intelligent',
  'automated', 'automatic', 'manual', 'custom', 'secure', 'safe', 'open', 'source',
  'for', 'with', 'on', 'at', 'by', 'from', 'about', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'between', 'under', 'over', 'out', 'up', 'down', 'off',
  'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'who', 'what', 'which', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both',
  'few', 'more', 'most', 'some', 'any', 'no', 'not', 'only', 'just', 'also', 'very',
  'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while', 'of', 'to', 'in'
]);

/**
 * Validates if a string contains readable text (not gibberish)
 * @param {string} text - The text to validate
 * @returns {{ isValid: boolean, reason: string }}
 */
function validateReadableText(text) {
  if (!text || typeof text !== 'string') {
    return { isValid: false, reason: 'Empty or invalid text' };
  }

  const trimmed = text.trim();

  // Check minimum length
  if (trimmed.length < 3) {
    return { isValid: false, reason: 'Text too short' };
  }

  // Check for only special characters or numbers
  if (/^[^a-zA-Z]+$/.test(trimmed)) {
    return { isValid: false, reason: 'No alphabetic characters found' };
  }

  // Extract words (only alphabetic, 2+ chars)
  const words = trimmed.toLowerCase().match(/[a-z]{2,}/g) || [];

  if (words.length === 0) {
    return { isValid: false, reason: 'No valid words found' };
  }

  // Check consonant-to-vowel ratio for gibberish detection
  const vowels = 'aeiou';
  let totalVowels = 0;
  let totalConsonants = 0;

  for (const word of words) {
    for (const char of word) {
      if (vowels.includes(char)) {
        totalVowels++;
      } else if (/[a-z]/.test(char)) {
        totalConsonants++;
      }
    }
  }

  // Gibberish typically has very low vowel ratio
  const vowelRatio = totalVowels / (totalVowels + totalConsonants);
  if (vowelRatio < 0.15 || vowelRatio > 0.8) {
    return { isValid: false, reason: 'Unusual character distribution (likely gibberish)' };
  }

  // Check for repeated character patterns (e.g., "aaaa", "abab")
  if (/(.)\1{3,}/.test(trimmed.toLowerCase())) {
    return { isValid: false, reason: 'Repeated character pattern detected' };
  }

  // Check if at least one word is recognizable
  let recognizedWords = 0;
  for (const word of words) {
    if (COMMON_WORDS.has(word) || word.length >= 4) {
      // Accept common words OR longer words (likely real words)
      // For longer words, do additional vowel check per word
      const wordVowels = (word.match(/[aeiou]/g) || []).length;
      const wordVowelRatio = wordVowels / word.length;
      if (COMMON_WORDS.has(word) || (wordVowelRatio >= 0.2 && wordVowelRatio <= 0.7)) {
        recognizedWords++;
      }
    }
  }

  // Require at least 30% of words to be recognizable for short texts
  // or at least 1 word for very short inputs
  const minRecognized = Math.max(1, Math.floor(words.length * 0.3));
  if (recognizedWords < minRecognized) {
    return { isValid: false, reason: 'Text does not contain enough recognizable words' };
  }

  return { isValid: true, reason: 'Text appears valid' };
}

/**
 * Pre-validates a project before AI scoring
 * @param {Object} project - Project object with title and description
 * @returns {{ isValid: boolean, reason: string }}
 */
function preValidateProject(project) {
  if (!project) {
    return { isValid: false, reason: 'No project data' };
  }

  const title = project.title || '';
  const description = project.description || '';

  // Validate title
  const titleValidation = validateReadableText(title);
  if (!titleValidation.isValid) {
    return { isValid: false, reason: `Invalid title: ${titleValidation.reason}` };
  }

  // Validate description (more lenient - can be empty for some projects)
  if (description && description.trim().length > 0) {
    const descValidation = validateReadableText(description);
    if (!descValidation.isValid && description.trim().length > 5) {
      // Only reject if description is long enough to evaluate
      return { isValid: false, reason: `Invalid description: ${descValidation.reason}` };
    }
  }

  return { isValid: true, reason: 'Project passed pre-validation' };
}

const SCORING_SYSTEM_PROMPT = `
You are a Scoring API. Receive a JSON profile and return a JSON score.

RUBRIC:
1. VALIDITY CHECK (Strict):
   - Mark a project as "isValid": false ONLY if it is nonsensical (e.g., "asdf", "...", "123"). 
   - CRITICAL: If a project has "verificationStatus": "verified" OR "rejected", it MUST be "isValid": true regardless of description length. We want an AI score for BOTH cases.
   - Valid projects MUST describe a technical implementation or a real-world tool.

2. PROJECTS (Individual Score 0-100):
   - Evaluate each legitimate project. If isValid is false, score MUST be 0.
   - SCORING GUIDE:
     * 90-100: Exceptional depth, clear architecture, production-ready tech stack.
     * 70-89: Good implementation, clear description, solid tech choices.
     * 40-69: Basic projects (e.g., Simple websites, CRUD apps, low complexity).
     * 10-39: Extremely minimal or trivial implementations.
   - VERIFIED/REJECTED PROJECTS:
     * If a project is "verified", you MUST give it a baseline implementation score of at least 60.
     * If a project is "rejected" by a company, you MUST still score it fairly based on its content. Do NOT penalize it just for the rejection, but do NOT give it the verification bonus.
     * Fill out ALL categories (Innovation, Complexity, etc.) for these projects.
   - DEDUCTIONS:
     * -15 pts if technologies list is empty or generic (e.g. just "Web").
     * CRITICAL: Do NOT leave Innovation, Complexity, or Usability at 0 if projects exist. Guess based on tech stack if needed.

3. OVERALL USER SCORE (0-100):
   - Only COUNT "isValid": true projects. One valid project is better than 10 spam ones.
   - PROJECTS (Max 60): Base pts for quantity (1st: 20 pts, 2nd: +15, 3rd+: +15) + Quality pts (Avg Project Score / 10).
   - SKILLS (Max 20): 1-3 (10 pts), 4-6 (15 pts), 7+ (20 pts). Treat 1-3 skills as a positive "good start".
   - ACHIEVEMENTS (Max 20): Evaluate prestige/difficulty.
   - ACTIVITY (Max 5): AI should ignore this, it's calculated deterministically.

RESPONSE FORMAT:
{
  "projectEvaluations": [
    { "title": "string", "isValid": boolean, "score": number, "feedback": "string" }
  ],
  "breakdown": {
    "innovation": number,
    "implementation": number, 
    "complexity": number,
    "documentation": number,
    "usability": number,
    "skills": number,
    "achievements": number
  },
  "summary": "Short overall feedback.",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendations": ["string"]
}

CRITICAL: In the "projectEvaluations" array, the "title" MUST EXACTLY MATCH one of the titles provided in the input JSON. Do NOT change capitalizing or add words to the title.

IMPORTANT: Output ONLY valid JSON. No Markdown. No code blocks. No Explanations.
`;

function cleanModelOutput(text = '') {
  // Try to find JSON within markdown code blocks first
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  let content = jsonBlockMatch ? jsonBlockMatch[1] : text;

  // Find first '{' and last '}'
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');

  if (start !== -1 && end !== -1 && end > start) {
    return content.substring(start, end + 1);
  }
  return content.trim();
}

/**
 * Normalizes a string for robust comparison (lowercase, alphanumeric only)
 */
function normalizeTitle(title) {
  if (!title) return '';
  return title.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

/**
 * Calculates score for Activity (Deterministic 0-5)
 */
function calculateActivityScore(activity) {
  if (!activity) return 0;
  // Simple logic: 1 point per login/submission/pageview batch
  // Cap at 5
  let score = 0;
  if (activity.loginsLast30Days > 0) score += Math.min(3, activity.loginsLast30Days); // Up to 3 pts for logins
  if (activity.submissionsCount > 0) score += 1; // 1 pt for having submissions
  if (activity.pagesViewed > 10) score += 1; // 1 pt for engagement

  return Math.min(5, score);
}

/**
 * Calculates score for Achievements (Deterministic Fallback)
 */
function calculateAchievementFallback(achievements = []) {
  if (!achievements || achievements.length === 0) return 0;
  return Math.min(15, achievements.length * 5);
}

export async function scoreWithHF(profile) {
  if (!HF_API_KEY) throw new Error('HF_API_KEY is not set');

  // PRE-VALIDATION: Check projects for gibberish before sending to AI
  const preValidatedProjects = [];
  const rejectedProjects = [];

  for (const project of (profile.projects || [])) {
    const validation = preValidateProject(project);
    if (validation.isValid) {
      preValidatedProjects.push(project);
    } else {
      console.log(`[hfClient] Pre-validation REJECTED project "${project.title}": ${validation.reason}`);
      rejectedProjects.push({
        title: project.title,
        isValid: false,
        score: 0,
        feedback: `Project rejected: ${validation.reason}. Please provide a meaningful project title and description.`
      });
    }
  }

  // Create a modified profile with only valid projects for AI
  const validatedProfile = {
    ...profile,
    projects: preValidatedProjects
  };

  const projectCount = preValidatedProjects.length;
  const skillCount = (profile.skills || []).length;
  const achievementCount = (profile.achievements || []).length;

  // If ALL projects are rejected, return early with deterministic fallback
  if (projectCount === 0 && rejectedProjects.length > 0) {
    console.log(`[hfClient] All projects rejected during pre-validation.`);
    const activityScore = calculateActivityScore(profile.activity);
    const achievementScore = calculateAchievementFallback(profile.achievements || []);

    let skillScore = 0;
    if (skillCount >= 7) skillScore = 20;
    else if (skillCount >= 4) skillScore = 15;
    else if (skillCount >= 1) skillScore = 10;

    return {
      overall_score: Math.min(100, activityScore + achievementScore + skillScore),
      projectEvaluations: rejectedProjects,
      breakdown: {
        innovation: 0, implementation: 0, complexity: 0, documentation: 0, usability: 0,
        skills: skillScore,
        achievements: achievementScore,
        activity: activityScore,
        portfolio: 0
      },
      summary: `All submitted projects were rejected due to invalid or unreadable content. Please submit projects with meaningful titles and descriptions.`,
      strengths: skillCount > 0 ? [`Has ${skillCount} skill(s) listed`] : [],
      weaknesses: ['No valid projects submitted'],
      recommendations: ['Submit legitimate projects with clear titles and detailed descriptions']
    };
  }

  try {
    const body = {
      model: HF_MODEL,
      messages: [
        { role: 'system', content: SCORING_SYSTEM_PROMPT },
        { role: 'user', content: 'Evaluation Data: ' + JSON.stringify(validatedProfile) }
      ],
      temperature: 0.0,
      seed: 42,
      max_tokens: 800
    };

    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error(`HF error: ${response.status}`);
    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';
    console.log('[hfClient] Raw LLM Response:', rawContent);
    const cleanedJson = cleanModelOutput(rawContent);

    const scores = JSON.parse(cleanedJson);
    console.log(`[hfClient] ProjectCount: ${projectCount}, SkillCount: ${skillCount}`);

    // Ensure evaluations array exists
    if (!Array.isArray(scores.projectEvaluations)) {
      scores.projectEvaluations = (validatedProfile.projects || []).map(p => ({
        title: p.title,
        score: 20, // Low fallback
        feedback: "Project submitted for review."
      }));
    }

    // Merge pre-rejected projects back into evaluations
    if (rejectedProjects.length > 0) {
      scores.projectEvaluations = [...scores.projectEvaluations, ...rejectedProjects];
    }

    // --- BLENDING LOGIC: Mix AI score with Company score for verified projects ---
    if (Array.isArray(scores.projectEvaluations)) {
      console.log(`[hfClient] Processing ${scores.projectEvaluations.length} AI evaluations for blending...`);
      scores.projectEvaluations = scores.projectEvaluations.map(evalObj => {
        const rawAiTitle = evalObj.title || '';
        const normalizedAiTitle = normalizeTitle(rawAiTitle);

        // Use a more flexible matching: exact, normalization, or contains
        const profileProj = (profile.projects || []).find(p => {
          if (!p.title) return false;
          const dbTitle = p.title;
          const normalizedDbTitle = normalizeTitle(dbTitle);

          return normalizedDbTitle === normalizedAiTitle ||
            dbTitle.toLowerCase().includes(rawAiTitle.toLowerCase()) ||
            rawAiTitle.toLowerCase().includes(dbTitle.toLowerCase());
        });

        if (profileProj) {
          console.log(`[hfClient] Matched AI evaluation "${evalObj.title}" to DB project "${profileProj.title}"`);
          if (profileProj.verificationStatus === 'verified' && profileProj.companyScore !== null) {
            const aiScore = Number(evalObj.score) || 0;
            const companyScore = Number(profileProj.companyScore);
            const blendedScore = Math.round((aiScore * 0.5) + (companyScore * 0.5));

            console.log(`[hfClient] SUCCESS: Blending score for "${profileProj.title}": AI(${aiScore}) + Company(${companyScore}) = ${blendedScore}`);

            return {
              ...evalObj,
              title: profileProj.title, // Use DB title for consistency
              isValid: true, // Force validity as it's verified by a company
              score: blendedScore,
              rawAiScore: aiScore, // Preserve original AI evaluation
              feedback: (evalObj.feedback || '') + ` (Note: Balanced with company score of ${companyScore}/100)`
            };
          } else {
            // Not verified but matched - still set rawAiScore
            evalObj.rawAiScore = Number(evalObj.score) || 0;
          }
        } else {
          console.warn(`[hfClient] FAILED to match AI evaluation "${evalObj.title}" to any project in profile.`);
          evalObj.rawAiScore = Number(evalObj.score) || 0;
        }
        return evalObj;
      });
    }
    // --- END BLENDING LOGIC ---

    // --- BREAKDOWN BLENDING: Apply company influence to profile-level metrics ---
    // If we have verified projects, we should blend the overall implementation/complexity fields
    const verifiedProjects = (profile.projects || []).filter(p => p.verificationStatus === 'verified' && p.companyScore !== null);
    if (verifiedProjects.length > 0 && scores.breakdown) {
      const avgCompanyScore = verifiedProjects.reduce((sum, p) => sum + Number(p.companyScore), 0) / verifiedProjects.length;

      // We blend 'implementation' and 'complexity' because they are most affected by company verification
      if (scores.breakdown.implementation !== undefined) {
        const aiImpl = Number(scores.breakdown.implementation) || 0;
        scores.breakdown.implementation = Math.round((aiImpl * 0.5) + (avgCompanyScore * 0.5));
      }
      if (scores.breakdown.complexity !== undefined) {
        const aiComp = Number(scores.breakdown.complexity) || 0;
        // Complexity is 70% AI, 30% Company (since AI is better at judging technical complexity)
        scores.breakdown.complexity = Math.round((aiComp * 0.7) + (avgCompanyScore * 0.3));
      }

      // Ensure other fields aren't 0 if we have verified work
      if ((scores.breakdown.innovation || 0) < 40) scores.breakdown.innovation = 40;
      if ((scores.breakdown.usability || 0) < 50) scores.breakdown.usability = 50;
      if ((scores.breakdown.documentation || 0) < 50) scores.breakdown.documentation = 50;

      console.log(`[hfClient] Blended overall breakdown metrics using avg company score: ${avgCompanyScore}`);
    }
    // --- END BREAKDOWN BLENDING ---

    // STRUCTURE GUARD & TYPE CASTING
    if (!scores.breakdown) {
      scores.breakdown = { innovation: 0, implementation: 0, complexity: 0, documentation: 0, usability: 0, skills: 0, achievements: 0 };
    } else {
      const fields = ['innovation', 'implementation', 'complexity', 'documentation', 'usability', 'skills', 'achievements'];
      fields.forEach(f => {
        scores.breakdown[f] = Number(scores.breakdown[f] || 0);
      });
    }

    // Calculate Deterministic Activity Score (0-5)
    const activityScore = Number(calculateActivityScore(profile.activity));
    scores.breakdown.activity = activityScore;

    // Calculate Deterministic Skill Score (Override AI)
    let skillScore = 0;
    // Granular scoring: 10 base + 2 per skill, capped at 20 (reached at 6 skills)
    if (skillCount >= 6) {
      skillScore = 20;
    } else if (skillCount >= 1) {
      skillScore = 10 + (skillCount - 1) * 2;
    }

    scores.breakdown.skills = skillScore;

    // Achievements: Fallback
    if (scores.breakdown.achievements === undefined || isNaN(scores.breakdown.achievements)) {
      scores.breakdown.achievements = Number(calculateAchievementFallback(profile.achievements));
    }

    // Portfolio Score Calculation (Rubric: Base based on count + Quality bonus)
    // Only count VALID projects
    const validEvaluations = scores.projectEvaluations.filter(e => e.isValid !== false);
    const validProjectCount = validEvaluations.length;

    let baseScore = 0;
    if (validProjectCount >= 1) baseScore = 20;
    if (validProjectCount >= 2) baseScore += 15;
    if (validProjectCount >= 3) baseScore += 15;

    // Quality bonus is max 10 points
    // Verified projects contribute more to the quality bonus
    const totalQualityPoints = validEvaluations.reduce((sum, p) => {
      const basePoints = (Number(p.score) || 0);
      // Find matching project in profile to check verification
      const profileProj = (profile.projects || []).find(proj => proj.title === p.title);
      const isVerified = profileProj && profileProj.verificationStatus === 'verified';
      return sum + (isVerified ? basePoints * 1.2 : basePoints); // 20% boost in quality weighted contribution for verified
    }, 0);

    const avgProjectQuality = validProjectCount > 0 ? (totalQualityPoints / validProjectCount) : 0;
    const qualityBonus = Math.min(10, (avgProjectQuality / 100) * 10);

    scores.breakdown.portfolio = Math.min(60, baseScore + qualityBonus);

    // Final Overall Score (Capped at 100)
    scores.overall_score = Math.min(100, Math.round(
      scores.breakdown.portfolio +
      (scores.breakdown.skills || 0) +
      (scores.breakdown.achievements || 0) +
      (scores.breakdown.activity || 0)
    ));

    if (!scores.summary) scores.summary = "Evaluation completed.";
    if (!Array.isArray(scores.strengths)) scores.strengths = [];
    if (!Array.isArray(scores.weaknesses)) scores.weaknesses = [];
    if (!Array.isArray(scores.recommendations)) scores.recommendations = [];

    // --- CLEANUP LOGIC: Remove generic "harsh" feedback if data exists ---
    const isLackingSkills = (w) => (w.toLowerCase().includes('skill') && (w.toLowerCase().includes('lack') || w.toLowerCase().includes('no ')));
    const isLackingAchievements = (w) => (w.toLowerCase().includes('achievement') && (w.toLowerCase().includes('lack') || w.toLowerCase().includes('no ')));

    if (skillCount > 0) {
      scores.weaknesses = scores.weaknesses.filter(w => !isLackingSkills(w));
      if (scores.summary) {
        scores.summary = scores.summary.replace(/however, it lacks.*?skills\./gi, '').trim();
      }
    }
    if (achievementCount > 0) {
      scores.weaknesses = scores.weaknesses.filter(w => !isLackingAchievements(w));
    }
    // --- END CLEANUP LOGIC ---

    return scores;
  } catch (err) {
    console.error('[hfClient] AI Error:', err);

    // Fallback: Deterministic Calculation
    const activityScore = calculateActivityScore(profile.activity); // Max 5
    const achievementScore = calculateAchievementFallback(profile.achievements || []); // Max 15

    const profileProjects = profile.projects || [];
    const projectCount = profileProjects.length;

    // Deterministic Project Score (Max 60)
    let projectScore = 0;
    if (projectCount === 1) projectScore = 30;
    else if (projectCount === 2) projectScore = 45;
    else if (projectCount >= 3) projectScore = 60;

    // Deterministic Skill Score (Max 20)
    let skillScore = 0;
    const skillCount = (profile.skills || []).length;
    if (skillCount >= 7) skillScore = 20;
    else if (skillCount >= 4) skillScore = 15;
    else if (skillCount >= 1) skillScore = 10;

    const total = activityScore + achievementScore + projectScore + skillScore;

    // Create fallback evaluations for each project so they don't stay 'pending'
    const fallbackEvaluations = profileProjects.map(p => ({
      title: p.title,
      isValid: true,
      score: 50, // Neutral fallback score
      feedback: "AI scoring temporarily unavailable. Provided a default score."
    }));

    return {
      overall_score: Math.min(100, total),
      projectEvaluations: fallbackEvaluations,
      breakdown: {
        innovation: 50, implementation: 50, complexity: 50, documentation: 50, usability: 50,
        skills: skillScore,
        achievements: achievementScore,
        activity: activityScore,
        portfolio: projectScore
      },
      summary: `Score calculated based on quantitative fallback data. AI Evaluation unavailable: ${err.message}`,
      strengths: [], weaknesses: [], recommendations: []
    };
  }
}
