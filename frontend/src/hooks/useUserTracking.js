import { useEffect, useMemo, useState } from 'react';

const CONSENT_KEY = 'uxia_tracking_consent';
const USER_KEY = 'uxia_tracking_user';
const INTENTS_KEY = 'uxia_tracking_intents';
const MAX_INTENTS = 50;

const safeParse = (rawValue, fallback) => {
  if (!rawValue) return fallback;
  try {
    return JSON.parse(rawValue);
  } catch (_) {
    return fallback;
  }
};

const buildVisitorId = () => {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const useUserTracking = () => {
  const [consent, setConsent] = useState(() => localStorage.getItem(CONSENT_KEY));
  const [user, setUser] = useState(() => safeParse(localStorage.getItem(USER_KEY), null));
  const [intents, setIntents] = useState(() => safeParse(localStorage.getItem(INTENTS_KEY), []));

  useEffect(() => {
    if (consent !== 'accepted') {
      return;
    }

    const nowIso = new Date().toISOString();
    const existing = safeParse(localStorage.getItem(USER_KEY), null);
    const nextUser = existing || {
      visitorId: buildVisitorId(),
      firstSeenAt: nowIso,
      source: 'frontend-localstorage',
    };

    nextUser.lastSeenAt = nowIso;
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, [consent]);

  const acceptCookies = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setConsent('accepted');
  };

  const rejectCookies = () => {
    localStorage.setItem(CONSENT_KEY, 'rejected');
    setConsent('rejected');
  };

  const saveIntent = (intentPayload) => {
    if (consent !== 'accepted') {
      return;
    }

    const intent = {
      ...intentPayload,
      trackedAt: new Date().toISOString(),
    };

    setIntents((previous) => {
      const next = [intent, ...previous].slice(0, MAX_INTENTS);
      localStorage.setItem(INTENTS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const visitorId = useMemo(() => user?.visitorId || null, [user]);

  return {
    consent,
    hasConsent: consent === 'accepted',
    visitorId,
    user,
    intents,
    acceptCookies,
    rejectCookies,
    saveIntent,
  };
};
