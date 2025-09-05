import { useState, useEffect } from 'react';

export function useCookie(name: string, defaultValue: string = ''): [string, (value: string, days?: number) => void] {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const cookieValue = getCookie(name);
    if (cookieValue !== null) {
      setValue(cookieValue);
    }
  }, [name]);

  const setCookieValue = (newValue: string, days: number = 365) => {
    setCookie(name, newValue, days);
    setValue(newValue);
  };

  return [value, setCookieValue];
}

function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = name + "=" + value + ";expires=" + expires.toUTCString() + ";path=/";
}