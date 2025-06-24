
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: any;
  created_at: string;
}

export const useUserActivities = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['user-activities', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error fetching user activities:', error);
        throw error;
      }
      
      return data as UserActivity[];
    },
    enabled: !!user,
  });

  const logActivityMutation = useMutation({
    mutationFn: async (activityType: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          activity_type: activityType,
          ip_address: null,
          user_agent: navigator.userAgent,
          device_info: {
            platform: navigator.platform,
            language: navigator.language,
            screen: {
              width: screen.width,
              height: screen.height
            }
          }
        });

      if (error) {
        console.error('Error logging activity:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-activities'] });
    },
  });

  // Set up real-time subscription for user activities
  useEffect(() => {
    if (!user) return;

    let channel: any = null;

    const setupChannel = () => {
      channel = supabase
        .channel(`user-activities-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_activities',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            console.log('User activity change detected, refreshing...');
            queryClient.invalidateQueries({ queryKey: ['user-activities'] });
          }
        )
        .subscribe();
    };

    setupChannel();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, queryClient]);

  const logActivity = (activityType: string) => {
    logActivityMutation.mutate(activityType);
  };

  return {
    activities,
    isLoading,
    logActivity,
  };
};
