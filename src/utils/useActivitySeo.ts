import { useEffect } from 'react';
import { Activity } from '../types';
import {
  generateActivityPageTitle,
  generateActivityMetaDescription,
  getActivityCanonicalUrl,
  generateActivityJsonLd
} from './seo';

export function updatePageSeo(activity: Activity | null, currentView: 'public' | 'admin'): void {
  if (typeof document === 'undefined') return;

  const origin = window.location.origin;

  if (currentView === 'admin') {
    document.title = '後台管理系統｜亞馬遜國家山岳協會';
    return;
  }

  if (!activity) {
    document.title = '亞馬遜國家山岳協會｜登山活動招生管理系統';
    return;
  }

  // 1. Title
  const pageTitle = generateActivityPageTitle(activity);
  document.title = pageTitle;

  // 2. Meta Description
  const description = generateActivityMetaDescription(activity);
  let descMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!descMeta) {
    descMeta = document.createElement('meta');
    descMeta.name = 'description';
    document.head.appendChild(descMeta);
  }
  descMeta.content = description;

  // 3. Open Graph Tags
  const ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null;
  if (ogTitle) ogTitle.content = pageTitle;

  const ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null;
  if (ogDesc) ogDesc.content = description;

  const canonicalUrl = getActivityCanonicalUrl(origin, activity.id);
  let ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement | null;
  if (!ogUrl) {
    ogUrl = document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    document.head.appendChild(ogUrl);
  }
  ogUrl.content = canonicalUrl;

  if (activity.coverImage) {
    let ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement | null;
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    ogImage.content = activity.coverImage;
  }

  // 4. Canonical Link - 必須指向第三層活動自身網址，絕不 canonical 到首頁
  let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.href = canonicalUrl;

  // 5. Robots tag: 確保無 noindex
  let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
  if (!robotsMeta) {
    robotsMeta = document.createElement('meta');
    robotsMeta.name = 'robots';
    document.head.appendChild(robotsMeta);
  }
  robotsMeta.content = 'index, follow, max-image-preview:large';

  // 6. JSON-LD Structured Data
  let jsonLdScript = document.getElementById('activity-jsonld') as HTMLScriptElement | null;
  if (!jsonLdScript) {
    jsonLdScript = document.createElement('script');
    jsonLdScript.id = 'activity-jsonld';
    jsonLdScript.type = 'application/ld+json';
    document.head.appendChild(jsonLdScript);
  }
  const jsonLdData = generateActivityJsonLd(activity, origin);
  jsonLdScript.textContent = JSON.stringify(jsonLdData);
}

export function useActivitySeo(activity: Activity | null, currentView: 'public' | 'admin') {
  useEffect(() => {
    updatePageSeo(activity, currentView);
  }, [activity, currentView]);
}
