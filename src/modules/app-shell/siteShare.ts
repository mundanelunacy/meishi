export type SiteShareCopy = {
  title: string;
  text: string;
  labels: {
    facebook: string;
    x: string;
    linkedIn: string;
    email: string;
  };
};

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
  copy: SiteShareCopy,
  navigatorLike: NavigatorShareLike = navigator,
) {
  if (!canUseNativeSiteShare(navigatorLike)) {
    return false;
  }

  const shareData = {
    text: copy.text,
    title: copy.title,
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

export function buildSiteShareLinks(
  url: string,
  copy: SiteShareCopy,
): SiteShareLink[] {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(copy.text);
  const encodedTitle = encodeURIComponent(copy.title);

  return [
    {
      label: copy.labels.facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: copy.labels.x,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      label: copy.labels.linkedIn,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      label: copy.labels.email,
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
