package com.leijiang.cookdaily;

import android.app.*;
import android.content.*;
import android.os.Build;
import android.os.SystemClock;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import org.json.JSONObject;

/** One explicit, user-started kitchen reminder. No polling service or network. */
public class KitchenTimer extends BroadcastReceiver {
  static final String CHANNEL = "kitchen-timer-v1";
  static final int ID = 41;
  static android.content.SharedPreferences prefs(Context c) { return c.getSharedPreferences("kitchen-timer", 0); }
  static void channel(Context c) {
    if(c.getSystemService(NotificationManager.class).getNotificationChannel(CHANNEL) != null) return;
    NotificationChannel ch = new NotificationChannel(CHANNEL, "做菜计时提醒", NotificationManager.IMPORTANCE_HIGH);
    ch.setDescription("步骤计时结束时提醒；请在系统设置中允许声音和振动");
    ch.enableVibration(true);
    ch.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM), new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build());
    c.getSystemService(NotificationManager.class).createNotificationChannel(ch);
  }
  static PendingIntent pending(Context c) {
    return PendingIntent.getBroadcast(c, ID, new Intent(c, KitchenTimer.class).setAction("com.leijiang.cookdaily.TIMER"), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
  }
  static boolean exact(Context c) { return Build.VERSION.SDK_INT < 31 || c.getSystemService(AlarmManager.class).canScheduleExactAlarms(); }
  static boolean notifications(Context c) {
    channel(c);
    NotificationManager n = c.getSystemService(NotificationManager.class);
    return n.areNotificationsEnabled() && n.getNotificationChannel(CHANNEL).getImportance() != NotificationManager.IMPORTANCE_NONE;
  }
  static String status(Context c) {
    try {
      if(!exact(c) && prefs(c).getBoolean("active", false)) cancel(c);
      JSONObject j = new JSONObject();
      j.put("exact", exact(c)); j.put("notifications", notifications(c));
      j.put("active", prefs(c).getBoolean("active", false));
      j.put("token", prefs(c).getString("token", ""));
      j.put("fired", prefs(c).getBoolean("fired", false));
      j.put("remaining", Math.max(0, prefs(c).getLong("elapsedEnd", 0) - SystemClock.elapsedRealtime()));
      return j.toString();
    } catch(Exception e) { return "{}"; }
  }
  static String start(Context c, int seconds, String title, String token) {
    if (seconds < 1 || seconds > 86400 || title == null || title.length() > 200 || token == null || token.length() > 100) return "invalid";
    // Do not silently promise a background alarm when either permission is absent.
    if (!exact(c) || !notifications(c)) { cancel(c); return "foreground"; }
    long end = SystemClock.elapsedRealtime() + seconds * 1000L;
    cancel(c);
    try {
      prefs(c).edit().putString("title", title).putString("token", token).putLong("elapsedEnd", end).putBoolean("active", true).putBoolean("fired", false).commit();
      c.getSystemService(AlarmManager.class).setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, end, pending(c));
      return "native";
    } catch(SecurityException e) { cancel(c); return "foreground"; }
  }
  static void cancel(Context c) {
    c.getSystemService(AlarmManager.class).cancel(pending(c));
    c.getSystemService(NotificationManager.class).cancel(ID);
    prefs(c).edit().putBoolean("active", false).putBoolean("fired", false).apply();
  }
  @Override public void onReceive(Context c, Intent intent) {
    if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) { cancel(c); return; }
    if (!"com.leijiang.cookdaily.TIMER".equals(intent.getAction()) || !prefs(c).getBoolean("active", false)) return;
    // A broadcast already in flight must not fire a replacement timer early.
    if (prefs(c).getLong("elapsedEnd", 0) > SystemClock.elapsedRealtime() + 500) return;
    prefs(c).edit().putBoolean("active", false).putBoolean("fired", true).commit();
    if (!notifications(c)) return;
    PendingIntent open = PendingIntent.getActivity(c, ID, new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    Notification notification = new Notification.Builder(c, CHANNEL)
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm).setContentTitle("计时结束，请检查熟透")
      .setContentText(prefs(c).getString("title", "做菜计时"))
      .setCategory(Notification.CATEGORY_ALARM).setContentIntent(open).setAutoCancel(true).build();
    try { c.getSystemService(NotificationManager.class).notify(ID, notification); } catch(SecurityException ignored) { }
  }
}
