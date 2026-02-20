/**
 * GitHub API helpers for Freedom Score calculation
 */

export interface GitHubPR {
  id: number
  number: number
  title: string
  state: string
  merged_at: string | null
  created_at: string
  user: {
    login: string
  }
}

/**
 * Count merged PRs in pdxmation repos for a given week
 */
export async function countMergedPRs(
  since: Date,
  until: Date = new Date()
): Promise<number> {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    console.warn('GITHUB_TOKEN not set, skipping PR count')
    return 0
  }

  const repos = ['openclaw-mission-control'] // Add more repos as needed
  let totalPRs = 0

  for (const repo of repos) {
    try {
      const url = `https://api.github.com/repos/pdxmation/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=100`
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })

      if (!res.ok) {
        console.warn(`Failed to fetch PRs for ${repo}:`, res.status)
        continue
      }

      const prs: GitHubPR[] = await res.json()
      
      // Count PRs merged within the date range by the bot
      const botPRs = prs.filter(pr => {
        if (!pr.merged_at) return false
        const mergedAt = new Date(pr.merged_at)
        const isInRange = mergedAt >= since && mergedAt <= until
        const isBot = pr.user.login.includes('bot') || pr.title.includes('[Bot]')
        return isInRange && isBot
      })

      totalPRs += botPRs.length
    } catch (error) {
      console.error(`Error fetching PRs for ${repo}:`, error)
    }
  }

  return totalPRs
}

/**
 * Get cron job execution hours from Mission Control logs
 * (Stub - implement based on your cron logging)
 */
export async function getAutomationHours(
  since: Date,
  until: Date = new Date()
): Promise<number> {
  // TODO: Implement based on your cron job logging
  // For now, return a placeholder
  return 10 // Default assumption
}
