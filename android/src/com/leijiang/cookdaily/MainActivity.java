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

/** Offline assets served from a reserved local origin; external tutorials open in the browser. */
public class MainActivity extends Activity {
  private WebView web;
  private static final String HOST = "appassets.androidplatform.net";
  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    FrameLayout root = new FrameLayout(this);
    root.setBackgroundColor(0xFFFAF7F1);
    web = new WebView(this);
    web.setBackgroundColor(0xFFFAF7F1);
    root.addView(web, new FrameLayout.LayoutParams(-1, -1));
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
    web.setWebChromeClient(new WebChromeClient());
    web.setWebViewClient(new WebViewClient() {
      @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
        Uri uri = req.getUrl();
        if ("https".equals(uri.getScheme()) && HOST.equals(uri.getHost())) {
          String path = uri.getPath();
          if (path == null || path.equals("/")) path = "/index.html";
          if (path.contains("..") || path.contains("\\")) return blocked();
          String file = path.substring(1);
          String mime = file.endsWith(".html") ? "text/html" : file.endsWith(".js") ? "application/javascript" : file.endsWith(".css") ? "text/css" : file.endsWith(".svg") ? "image/svg+xml" : "application/json";
          try { return new WebResourceResponse(mime, "UTF-8", getAssets().open("web/" + file)); }
          catch (Exception e) { return blocked(); }
        }
        return blocked();
      }
      @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
        Uri uri = req.getUrl();
        if ("https".equals(uri.getScheme()) && HOST.equals(uri.getHost())) return false;
        if (req.isForMainFrame() && "https".equals(uri.getScheme())) {
          try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
          catch(ActivityNotFoundException e) { Toast.makeText(MainActivity.this,"未找到可打开教程的浏览器",Toast.LENGTH_SHORT).show(); }
        }
        return true;
      }
    });
    web.loadUrl("https://" + HOST + "/index.html");
  }
  private WebResourceResponse blocked() {
    return new WebResourceResponse("text/plain","UTF-8",404,"Not found",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));
  }
  @Override public void onBackPressed() {
    web.evaluateJavascript("window.appBack ? window.appBack() : false", result -> { if (!"true".equals(result)) finish(); });
  }
  @Override protected void onPause() { super.onPause(); web.onPause(); }
  @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
  @Override protected void onDestroy() { if (web != null) { web.stopLoading(); web.destroy(); } super.onDestroy(); }
}
