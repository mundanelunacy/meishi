const APP_SHARE_TITLE = "Meishi";
const APP_SHARE_TEXT =
  "Scan business cards and keep contact details organized with Meishi.";

type NavigatorShareLike = Pick<Navigator, "share"> & {
  canShare?: Navigator["canShare"];
};

export type SiteShareLink = {
  href: string;
  label: string;
};

export function getAppShareUrl(currentUrl: string = window.location.href) {
  return new URL("/", currentUrl).toString();
}

export function canUseNativeSiteShare(
  navigatorLike: NavigatorShareLike = navigator,
) {
  return typeof navigatorLike.share === "function";
}

export async function shareSiteUrl(
  url: string,
  navigatorLike: NavigatorShareLike = navigator,
) {
  if (!canUseNativeSiteShare(navigatorLike)) {
    return false;
  }

  const shareData = {
    text: APP_SHARE_TEXT,
    title: APP_SHARE_TITLE,
    url,
  };

  if (
    typeof navigatorLike.canShare === "function" &&
    !navigatorLike.canShare(shareData)
  ) {
    return false;
  }

  await navigatorLike.share(shareData);
  return true;
}

export function buildSiteShareLinks(url: string): SiteShareLink[] {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(APP_SHARE_TEXT);
  const encodedTitle = encodeURIComponent(APP_SHARE_TITLE);

  return [
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      label: "Email",
      href: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
    },
  ];
}

export async function copySiteShareUrl(url: string) {
  if (
    !navigator.clipboard ||
    typeof navigator.clipboard.writeText !== "function"
  ) {
    return false;
  }

  await navigator.clipboard.writeText(url);
  return true;
}

export function isShareCancellationError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
