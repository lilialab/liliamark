import { getVersion } from '@tauri-apps/api/app';
import { isNewerSemver } from '../utils/semver';

export const GITHUB_REPO = 'lilialab/liliamark';

/** 浏览器打开的 Latest Release 页 */
export const RELEASES_LATEST_URL = `https://github.com/${GITHUB_REPO}/releases/latest`;

const RELEASES_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export type AppUpdateResult =
  | {
    status: 'update-available';
    currentVersion: string;
    latestVersion: string;
    releaseUrl: string;
  }
  | { status: 'up-to-date'; currentVersion: string; latestVersion: string }
  | { status: 'unavailable'; reason: string };

type GithubLatestRelease = {
  tag_name?: string;
  html_url?: string;
};

/**
 * 查询 GitHub Latest Release，与当前应用版本比较。
 * 网络失败或响应异常时返回 `unavailable`（自动检查应静默）。
 */
export async function checkAppUpdate(): Promise<AppUpdateResult> {
  const currentVersion = await getVersion();

  let response: Response;
  try {
    response = await fetch(RELEASES_API_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
  } catch (error) {
    return {
      status: 'unavailable',
      reason: error instanceof Error ? error.message : String(error),
    };
  }

  if (!response.ok) {
    return { status: 'unavailable', reason: `HTTP ${response.status}` };
  }

  let payload: GithubLatestRelease;
  try {
    payload = (await response.json()) as GithubLatestRelease;
  } catch (error) {
    return {
      status: 'unavailable',
      reason: error instanceof Error ? error.message : String(error),
    };
  }

  const tag = payload.tag_name?.trim();
  if (!tag) {
    return { status: 'unavailable', reason: 'missing tag_name' };
  }

  const latestVersion = tag.replace(/^[vV]/, '');
  const releaseUrl = payload.html_url?.trim() || RELEASES_LATEST_URL;

  if (isNewerSemver(latestVersion, currentVersion)) {
    return {
      status: 'update-available',
      currentVersion,
      latestVersion,
      releaseUrl,
    };
  }

  return { status: 'up-to-date', currentVersion, latestVersion };
}
