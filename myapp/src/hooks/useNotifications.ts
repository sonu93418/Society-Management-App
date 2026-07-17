import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../store/auth.store';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useInAppNotification } from '../components/ui/InAppNotification';
import { NotificationManager } from '../services/NotificationManager';

export const useNotifications = () => {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const { showInAppNotification } = useInAppNotification();

  // Effect 1: Initialize NotificationManager channels and token listener
  useEffect(() => {
    if (!token || !user?.id) {
      // Shutdown notification listeners if unauthenticated
      NotificationManager.shutdown();
      return;
    }

    NotificationManager.initNotifications(user.id, token);
  }, [token, user?.id]);

  // Effect 2: Bind foreground & tapped listeners
  useEffect(() => {
    // Foreground callback handler
    NotificationManager.onNotificationReceived('use-notifications-hook', (notification) => {
      console.log('📩 useNotifications: Received foreground event:', notification);
      
      const { title, body, data } = notification.request.content;
      const category = data?.category || 'general';

      showInAppNotification({
        title: title || 'New Notification',
        body: body || '',
        category: category as any,
        data: data as any,
      });

      // Invalidate key query keys to update UI in real-time
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    });

    // Deep link tap handler callback
    NotificationManager.onNotificationTapped('use-notifications-hook', (response) => {
      console.log('👆 useNotifications: User tapped notification response:', response);
      
      const data = response.notification.request.content.data;
      if (data) {
        const category = data.category;
        const ticketId = data.ticketId;
        const role = user?.role || 'resident';

        if (role === 'resident') {
          if (category === 'visitor') {
            router.push('/(resident)/visitors');
          } else if (category === 'complaint') {
            if (ticketId) {
              router.push(`/(resident)/helpdesk/${ticketId}`);
            } else {
              router.push('/(resident)/helpdesk');
            }
          } else if (category === 'notice') {
            router.push('/(resident)/notices');
          } else if (category === 'poll') {
            router.push('/(resident)/polls');
          } else if (category === 'booking') {
            router.push('/(resident)/amenities');
          } else if (category === 'payment') {
            router.push('/(resident)/payments');
          } else {
            router.push('/(resident)');
          }
        } else if (role === 'admin') {
          if (category === 'complaint') {
            if (ticketId) {
              router.push(`/(resident)/helpdesk/${ticketId}`);
            } else {
              router.push('/(admin)/manage');
            }
          } else if (category === 'visitor') {
            router.push('/(admin)/manage');
          } else {
            router.push('/(admin)');
          }
        } else if (role === 'guard') {
          router.push('/(guard)');
        }
      }
    });

    return () => {
      NotificationManager.offNotificationReceived('use-notifications-hook');
      NotificationManager.offNotificationTapped('use-notifications-hook');
    };
  }, [queryClient, user, showInAppNotification]);
};
