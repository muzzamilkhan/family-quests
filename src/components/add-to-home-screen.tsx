"use client";

import { useEffect, useState } from 'react';
import { useDeviceType } from '~/hooks/use-device';
import { useCookie } from '~/hooks/use-cookie';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Smartphone, X, Home } from 'lucide-react';

export function AddToHomeScreen() {
  const deviceType = useDeviceType();
  const [dismissed, setDismissed] = useCookie('addToHomeScreenDismissed', 'false');
  const [visited, setVisited] = useCookie('hasVisited', 'false');
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Only show on mobile devices and if not dismissed and first visit
    if ((deviceType === 'iphone' || deviceType === 'android') &&
        dismissed === 'false' &&
        visited === 'false') {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        setShowPrompt(true);
        setVisited('true');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [deviceType, dismissed, visited, setVisited]);

  const handleDismiss = () => {
    setDismissed('true');
    setShowPrompt(false);
  };

  const handleAddToHomeScreen = () => {
    setDismissed('true');
    setShowPrompt(false);
    // The actual "Add to Home Screen" is handled by the browser
  };

  if (!showPrompt) return null;

  const isIOS = deviceType === 'iphone';
  const title = isIOS ? "Add to Home Screen" : "Install App";
  const instructions = isIOS
    ? "Tap the share button below, then 'Add to Home Screen'"
    : "Tap the menu button (⋮), then 'Add to Home Screen' or 'Install app'";

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <Home className="w-12 h-12 mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground mb-4">
              Get the best experience by adding Family Quests to your home screen!
            </p>
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium mb-2">How to add:</p>
            <p className="text-sm text-muted-foreground">{instructions}</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Maybe Later
            </Button>
            <Button
              onClick={handleAddToHomeScreen}
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Got it!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}