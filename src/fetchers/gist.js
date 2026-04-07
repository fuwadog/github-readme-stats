// @ts-check

import { retryer } from "../common/retryer.js";
import { MissingParamError } from "../common/error.js";
import { request } from "../common/http.js";

const QUERY = `
query gistInfo($gistName: String!) {
    viewer {
        gist(name: $gistName) {
            description
            owner {
                login
            }
            stargazerCount
            forks {
                totalCount
            }
            files {
                name
                language {
                    name
                }
                size
            }
        }
    }
}
`;

/**
 * Gist data fetcher.
 *
 * @param {object} variables Fetcher variables.
 * @param {string} token GitHub token.
 * @returns {Promise<import('axios').AxiosResponse>} The response.
 */
const fetcher = async (variables, token) => {
  return await request(
    { query: QUERY, variables },
    { Authorization: `token ${token}` },
  );
};

/**
 * @typedef {{ name: string; language: { name: string; }, size: number }} GistFile Gist file.
 */

/**
 * This function calculates the primary language of a gist by files size.
 *
 * @param {GistFile[]} files Files.
 * @returns {string} Primary language.
 */
const calculatePrimaryLanguage = (files) => {
  /** @type {Record<string, number>} */
  const languages = {};

  for (const file of files) {
    if (file.language) {
      if (languages[file.language.name]) {
        languages[file.language.name] += file.size;
      } else {
        languages[file.language.name] = file.size;
      }
    }
  }

  let primaryLanguage = Object.keys(languages)[0] || "Unknown";
  for (const language in languages) {
    if (languages[language] > languages[primaryLanguage]) {
      primaryLanguage = language;
    }
  }

  return primaryLanguage;
};

/**
 * @typedef {import('./types').GistData} GistData Gist data.
 */

/**
 * Fetch GitHub gist information by given username and ID.
 *
 * @param {string} id GitHub gist ID.
 * @returns {Promise<GistData>} Gist data.
 */
const fetchGist = async (id) => {
  if (!id) {
    throw new MissingParamError(["id"], "/api/gist?id=GIST_ID");
  }
  let res;
  try {
    res = await retryer(fetcher, { gistName: id });
  } catch (err) {
    throw new Error(err.message || "Could not fetch gist.");
  }

  if (res.data.errors && res.data.errors.length > 0) {
    throw new Error(res.data.errors[0].message);
  }
  if (!res.data.data?.viewer?.gist) {
    throw new Error("Gist not found");
  }
  const data = res.data.data.viewer.gist;
  if (!data.files) {
    return {
      name: "Gist",
      nameWithOwner: "",
      description: data.description,
      language: "",
      starsCount: data.stargazerCount ?? 0,
      forksCount: data.forks?.totalCount ?? 0,
    };
  }
  const files = Array.isArray(data.files)
    ? data.files
    : Object.values(data.files);
  const firstFile = files?.[0];
  return {
    name: firstFile?.name || "Gist",
    nameWithOwner: `${data.owner.login}/${firstFile?.name || "Gist"}`,
    description: data.description,
    language: calculatePrimaryLanguage(files || []),
    starsCount: data.stargazerCount ?? 0,
    forksCount: data.forks?.totalCount ?? 0,
  };
};

export { fetchGist };
export default fetchGist;
