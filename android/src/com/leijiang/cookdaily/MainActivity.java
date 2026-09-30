package com.leijiang.cookdaily;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.net.Uri;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.*;
import android.widget.FrameLayout;
import android.widget.Toast;
import java.io.ByteArrayInputStream;
import java.util.Collections;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.provider.Settings;
import android.provider.AlarmClock;
import android.app.NotificationManager;
import android.widget.TextView;
import org.json.JSONObject;
import java.io.*;
import java.nio.charset.StandardCharsets;

/** Offline assets served from a reserved local origin; external tutorials open in the browser. */
public class MainActivity extends Activity {
  private WebView web;
  private String backup;
  private static final String HOST = "appassets.androidplatform.net";
  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    FrameLayout root = new FrameLayout(this);
    root.setBackgroundColor(0xFFFAF7F1);
    web = new WebView(this);
    web.setBackgroundColor(0xFFFAF7F1);
    root.addView(web, new FrameLayout.LayoutParams(-1, -1));
    TextView loading = new TextView(this);
    loading.setText("今天吃什么\n正在准备你的厨房…");
    loading.setTextColor(0xFF627755); loading.setTextSize(20); loading.setGravity(android.view.Gravity.CENTER);
    loading.setBackgroundColor(0xFFFAF7F1);
    root.addView(loading, new FrameLayout.LayoutParams(-1, -1));
    setContentView(root);
    if (android.os.Build.VERSION.SDK_INT >= 35) {
      getWindow().setDecorFitsSystemWindows(false);
      root.setOnApplyWindowInsetsListener((view, insets) -> {
        android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.ime());
        view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
        return WindowInsets.CONSUMED;
      });
    }
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setCacheMode(WebSettings.LOAD_NO_CACHE);
    s.setAllowFileAccess(false);
    s.setAllowContentAccess(false);
    s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    s.setSupportMultipleWindows(false);
    s.setJavaScriptCanOpenWindowsAutomatically(false);
    WebView.setWebContentsDebuggingEnabled(false);
    KitchenTimer.channel(this);
    web.addJavascriptInterface(new NativeKitchen(), "Kitchen");
    web.setWebChromeClient(new WebChromeClient());
    web.setWebViewClient(new WebViewClient() {
      @Override public void onPageFinished(WebView view, String url) { root.removeView(loading); }
      @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
        Uri uri = req.getUrl();
        if ("https".equals(uri.getScheme()) && HOST.equals(uri.getHost())) {
          String path = uri.getPath();
          if (path == null || path.equals("/")) path = "/index.html";
          if (path.contains("..") || path.contains("\\")) return blocked();
          String file = path.substring(1);
          String mime = file.endsWith(".html") ? "text/html" : file.endsWith(".js") ? "application/javascript" : file.endsWith(".css") ? "text/css" : file.endsWith(".png") ? "image/png" : file.endsWith(".svg") ? "image/svg+xml" : "application/json";
          try { return new WebResourceResponse(mime, file.endsWith(".png") ? null : "UTF-8", getAssets().open("web/" + file)); }
          catch (Exception e) { return blocked(); }
        }
        return blocked();
      }
      @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
        Uri uri = req.getUrl();
        if ("https".equals(uri.getScheme()) && HOST.equals(uri.getHost())) return false;
        if (req.isForMainFrame() && ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme()))) {
          try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
          catch(ActivityNotFoundException | SecurityException e) { Toast.makeText(MainActivity.this,"未找到可打开教程的浏览器",Toast.LENGTH_SHORT).show(); }
        }
        if (req.isForMainFrame() && !"https".equals(uri.getScheme()) && !"http".equals(uri.getScheme())) Toast.makeText(MainActivity.this,"此链接格式暂不支持，请使用教程搜索入口",Toast.LENGTH_SHORT).show();
        return true;
      }
    });
    web.loadUrl("https://" + HOST + "/index.html");
  }
  private WebResourceResponse blocked() {
    return new WebResourceResponse("text/plain","UTF-8",404,"Not found",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));
  }
  private void message(String text) { runOnUiThread(() -> { if(web != null) web.evaluateJavascript("window.nativeMessage && window.nativeMessage(" + JSONObject.quote(text) + ")", null); }); }
  private void launch(Intent i, int request) {
    try { if(request == 0) startActivity(i); else startActivityForResult(i, request); }
    catch (ActivityNotFoundException | SecurityException e) { message("这台设备没有可用的系统入口，请在系统设置中操作"); }
  }
  /** This bridge is exposed only to packaged content; all other origins are blocked. */
  public class NativeKitchen {
    @JavascriptInterface public String timerStatus() { return KitchenTimer.status(MainActivity.this); }
    @JavascriptInterface public boolean systemDark() { return (getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES; }
    @JavascriptInterface public void appearance(boolean dark) { runOnUiThread(() -> {
      int color = dark ? 0xFF1C201C : 0xFFFAF7F1;
      web.setBackgroundColor(color); ((View)web.getParent()).setBackgroundColor(color);
      getWindow().setStatusBarColor(color); getWindow().setNavigationBarColor(color);
      getWindow().getDecorView().setSystemUiVisibility(dark ? 0 : View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
    }); }
    @JavascriptInterface public String startTimer(int seconds, String title, String token) { return KitchenTimer.start(MainActivity.this, seconds, title, token); }
    @JavascriptInterface public void cancelTimer() { KitchenTimer.cancel(MainActivity.this); }
    @JavascriptInterface public void exactSettings() { runOnUiThread(() -> {
      if(android.os.Build.VERSION.SDK_INT >= 31) launch(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + getPackageName())), 0);
      else message("系统已支持精确计时");
    }); }
    @JavascriptInterface public void notificationSettings() { runOnUiThread(() -> {
      if(android.os.Build.VERSION.SDK_INT >= 33 && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED && !getPreferences(0).getBoolean("askedNotifications", false)) {
        getPreferences(0).edit().putBoolean("askedNotifications", true).apply();
        requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 70);
      } else launch(new Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName()).putExtra(Settings.EXTRA_CHANNEL_ID, KitchenTimer.CHANNEL), 0);
    }); }
    @JavascriptInterface public void systemTimer(int seconds, String title) {
      if(seconds < 1 || seconds > 86400) return;
      runOnUiThread(() -> launch(new Intent(AlarmClock.ACTION_SET_TIMER).putExtra(AlarmClock.EXTRA_LENGTH, seconds).putExtra(AlarmClock.EXTRA_MESSAGE, title).putExtra(AlarmClock.EXTRA_SKIP_UI, false), 0));
    }
    @JavascriptInterface public void cooking(boolean active) { runOnUiThread(() -> {
      if(active) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
      else { getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON); setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED); }
    }); }
    @JavascriptInterface public void landscape(boolean enabled) { runOnUiThread(() -> setRequestedOrientation(enabled ? ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE : ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED)); }
    @JavascriptInterface public void exportBackup(String json) {
      if(json == null || json.length() > 1000000) { message("备份内容过大，未导出"); return; }
      runOnUiThread(() -> { backup = json; launch(new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/json").putExtra(Intent.EXTRA_TITLE, "今天吃什么-备份-" + new java.text.SimpleDateFormat("yyyyMMdd-HHmmss", java.util.Locale.ROOT).format(new java.util.Date()) + ".json"), 71); });
    }
    @JavascriptInterface public void importBackup() { runOnUiThread(() -> launch(new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*"), 72)); }
  }
  @Override protected void onActivityResult(int request, int result, Intent data) {
    super.onActivityResult(request, result, data);
    if(result != RESULT_OK || data == null || data.getData() == null) { if(request == 71) backup = null; return; }
    Uri uri = data.getData();
    if(request == 71 && backup != null) {
      final String content = backup; backup = null;
      new Thread(() -> { try (OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
        if(out == null) throw new IOException(); out.write(content.getBytes(StandardCharsets.UTF_8)); message("备份已保存，请妥善保管此文件");
      } catch(Exception e) { message("备份保存失败，请重新选择保存位置"); } }).start();
    } else if(request == 72) {
      new Thread(() -> { try(InputStream in = getContentResolver().openInputStream(uri); ByteArrayOutputStream bytes = new ByteArrayOutputStream()) {
        if(in == null) throw new IOException(); byte[] chunk = new byte[4096]; int n;
        while((n = in.read(chunk)) != -1) { if(bytes.size() + n > 1000000) throw new IOException(); bytes.write(chunk, 0, n); }
        String content = new String(bytes.toByteArray(), StandardCharsets.UTF_8);
        runOnUiThread(() -> { if(web != null) web.evaluateJavascript("window.receiveBackup && window.receiveBackup(" + JSONObject.quote(content) + ")", null); });
      } catch(Exception e) { message("无法读取备份，请选择小于1MB的菜谱备份 JSON 文件"); } }).start();
    }
  }
  @Override public void onBackPressed() {
    web.evaluateJavascript("window.appBack ? window.appBack() : false", result -> { if (!"true".equals(result)) finish(); });
  }
  @Override public void onRequestPermissionsResult(int request, String[] permissions, int[] results) {
    super.onRequestPermissionsResult(request, permissions, results);
    if(web != null) web.evaluateJavascript("window.nativeResume && window.nativeResume()", null);
  }
  @Override protected void onPause() { super.onPause(); web.onPause(); }
  @Override protected void onResume() { super.onResume(); if (web != null) { web.onResume(); web.evaluateJavascript("window.nativeResume && window.nativeResume()", null); } }
  @Override protected void onDestroy() { if (web != null) { web.stopLoading(); web.destroy(); web = null; } super.onDestroy(); }
}
