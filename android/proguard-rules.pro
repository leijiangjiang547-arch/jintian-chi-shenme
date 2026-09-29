# Public Android entry points and the local JavaScript bridge are invoked reflectively.
-keep public class com.leijiang.cookdaily.MainActivity { public <init>(); }
-keep public class com.leijiang.cookdaily.KitchenTimer { public <init>(); }
-keepclassmembers class * { @android.webkit.JavascriptInterface <methods>; }
-keepattributes RuntimeVisibleAnnotations,InnerClasses,EnclosingMethod
-dontwarn java.lang.invoke.**
