const RANK_CONFIG = {
  commits: { median: 250, weight: 2, allCommitsMedian: 1000 },
  prs: { median: 50, weight: 3 },
  issues: { median: 25, weight: 1 },
  reviews: { median: 2, weight: 1 },
  stars: { median: 50, weight: 4 },
  followers: { median: 10, weight: 1 },
};

const THRESHOLDS = [1, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];
const LEVELS = ["S", "A+", "A", "A-", "B+", "B", "B-", "C+", "C"];

/**
 * Calculates the exponential cdf.
 *
 * @param {number} x The value.
 * @returns {number} The exponential cdf.
 */
function exponentialCdf(x) {
  return 1 - Math.pow(2, -x);
}

/**
 * Calculates the log normal cdf approximation.
 *
 * @param {number} x The value.
 * @returns {number} The log normal cdf.
 */
function logNormalCdf(x) {
  return x / (1 + x);
}

/**
 * Calculates the users rank.
 *
 * @param {object} params Parameters on which the user's rank depends.
 * @param {boolean} params.all_commits Whether `include_all_commits` was used.
 * @param {number} params.commits Number of commits.
 * @param {number} params.prs The number of pull requests.
 * @param {number} params.issues The number of issues.
 * @param {number} params.reviews The number of reviews.
 * @param {number} params.stars The number of stars.
 * @param {number} params.followers The number of followers.
 * @returns {{ level: string, percentile: number }} The users rank.
 */
function calculateRank({
  all_commits,
  commits,
  prs,
  issues,
  reviews,
  stars,
  followers,
}) {
  const {
    commits: COMMITS,
    prs: PRS,
    issues: ISSUES,
    reviews: REVIEWS,
    stars: STARS,
    followers: FOLLOWERS,
  } = RANK_CONFIG;

  const commitsMedian = all_commits ? COMMITS.allCommitsMedian : COMMITS.median;

  const totalWeight =
    COMMITS.weight +
    PRS.weight +
    ISSUES.weight +
    REVIEWS.weight +
    STARS.weight +
    FOLLOWERS.weight;

  const rank =
    1 -
    (COMMITS.weight * exponentialCdf(commits / commitsMedian) +
      PRS.weight * exponentialCdf(prs / PRS.median) +
      ISSUES.weight * exponentialCdf(issues / ISSUES.median) +
      REVIEWS.weight * exponentialCdf(reviews / REVIEWS.median) +
      STARS.weight * logNormalCdf(stars / STARS.median) +
      FOLLOWERS.weight * logNormalCdf(followers / FOLLOWERS.median)) /
      totalWeight;

  const percentile = Math.max(0, Math.min(100, rank * 100));
  const thresholdIndex = THRESHOLDS.findIndex((t) => percentile <= t);
  const level = LEVELS[Math.max(0, thresholdIndex)];

  return { level, percentile };
}

export { calculateRank };
export default calculateRank;
