import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import { api } from '~/lib/trpc-provider';

export function useRealtimeUpdates() {
  const queryClient = useQueryClient();
  const utils = api.useUtils();

  useEffect(() => {
    // Set up aggressive polling for real-time feel
    const pollInterval = setInterval(() => {
      // Invalidate key queries that need real-time updates
      void utils.quest.getMyQuests.invalidate();
      void utils.quest.getPendingCompletions.invalidate();
      void utils.user.getProfile.invalidate();
      void utils.user.getPointsLeaderboard.invalidate();
      void utils.quest.getAll.invalidate();
    }, 2000); // Poll every 2 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [utils]);

  // Function to manually invalidate specific queries
  const invalidateQuests = () => {
    void utils.quest.getMyQuests.invalidate();
    void utils.quest.getAll.invalidate();
    void utils.quest.getPendingCompletions.invalidate();
  };

  const invalidateUserData = () => {
    void utils.user.getProfile.invalidate();
    void utils.user.getPointsLeaderboard.invalidate();
  };

  const invalidateAll = () => {
    void utils.invalidate();
  };

  return {
    invalidateQuests,
    invalidateUserData,
    invalidateAll,
  };
}

// Hook for parents to get real-time pending completions
export function useRealtimePendingCompletions() {
  const { data, ...query } = api.quest.getPendingCompletions.useQuery(
    undefined,
    {
      refetchInterval: 3000, // Refetch every 3 seconds
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }
  );

  return { data, ...query };
}

// Hook for children to get real-time quest updates
export function useRealtimeMyQuests() {
  const { data, ...query } = api.quest.getMyQuests.useQuery(
    undefined,
    {
      refetchInterval: 3000, // Refetch every 3 seconds
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }
  );

  return { data, ...query };
}

// Hook for real-time points/profile updates
export function useRealtimeProfile() {
  const { data, ...query } = api.user.getProfile.useQuery(
    undefined,
    {
      refetchInterval: 5000, // Refetch every 5 seconds
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }
  );

  return { data, ...query };
}

// Hook for real-time leaderboard updates
export function useRealtimeLeaderboard() {
  const { data, ...query } = api.user.getPointsLeaderboard.useQuery(
    undefined,
    {
      refetchInterval: 5000, // Refetch every 5 seconds
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }
  );

  return { data, ...query };
}