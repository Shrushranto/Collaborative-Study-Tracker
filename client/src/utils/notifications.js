import { toast } from './toast.js';

export async function requestPermission() {
  if (!('Notification' in window)) {
    toast.error('This browser does not support desktop notification');
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }
  
  return Notification.permission;
}

// Minimal local scheduling for reminders if push isn't available
// This just uses setTimeout internally and needs the tab to be open
let reminderTimeout = null;

export function scheduleLocalReminder(timeString) {
  if (reminderTimeout) {
    clearTimeout(reminderTimeout);
    reminderTimeout = null;
  }
  
  if (!timeString) return;
  
  const [hours, minutes] = timeString.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return;

  function scheduleNext() {
    const now = new Date();
    const target = new Date(now);
    target.setHours(hours, minutes, 0, 0);
    
    if (now > target) {
      target.setDate(target.getDate() + 1);
    }
    
    const delay = target.getTime() - now.getTime();
    
    reminderTimeout = setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification("Study Reminder", {
          body: "It's time for your daily study session!",
          icon: '/vite.svg'
        });
      } else {
        toast.info("It's time for your daily study session!");
      }
      // Schedule the next day's reminder
      scheduleNext();
    }, delay);
  }
  
  scheduleNext();
}

// Initial setup
export function initNotifications() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
  }
  
  const savedTime = localStorage.getItem('study-tracker-reminder-time');
  if (savedTime) {
    scheduleLocalReminder(savedTime);
  }
}
