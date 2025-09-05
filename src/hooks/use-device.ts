import { useState, useEffect } from 'react';

export type DeviceType = 'iphone' | 'android' | 'other';

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>('other');

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('iphone');
    } else if (/android/.test(userAgent)) {
      setDeviceType('android');
    } else {
      setDeviceType('other');
    }
  }, []);

  return deviceType;
}