#!/usr/bin/env python3
"""Configure the generated Capacitor Android shell without building an APK."""

from __future__ import annotations

import argparse
import json
import tempfile
from pathlib import Path
import xml.etree.ElementTree as ET


ANDROID_NS = "http://schemas.android.com/apk/res/android"
EXPECTED_APP_ID = "com.valievcompany.joker"
EXPECTED_WEB_DIR = "www"
APP_BACKGROUND = "#03110f"
REQUIRED_CONFIG_CHANGES = {"orientation", "screenSize"}
STYLE_NAMES = {"AppTheme.NoActionBar", "AppTheme.NoActionBarLaunch"}
STYLE_ITEMS = {
    "android:windowFullscreen": "true",
    "android:windowNoTitle": "true",
    "android:windowActionModeOverlay": "true",
    "android:windowDrawsSystemBarBackgrounds": "true",
    "android:statusBarColor": "@android:color/transparent",
    "android:navigationBarColor": "@android:color/transparent",
    "android:windowLightStatusBar": "false",
    "android:windowLightNavigationBar": "false",
    "android:windowLayoutInDisplayCutoutMode": "shortEdges",
    "android:windowDisablePreview": "true",
    "android:windowBackground": APP_BACKGROUND,
}

ET.register_namespace("android", ANDROID_NS)


MAIN_ACTIVITY = r'''package com.valievcompany.joker;

import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int APP_BACKGROUND = Color.rgb(3, 17, 15);
    private static final long HAPTIC_GAP_MS = 45L;

    private final JokerAndroidBridge jokerAndroidBridge = new JokerAndroidBridge();
    private boolean webBridgeInstalled = false;
    private volatile boolean keepScreenOnRequested = false;
    private long lastHapticAt = 0L;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureWindow();
        configureWebView();
        installBackGuard();
        hideSystemUI();
        getWindow().getDecorView().postDelayed(this::hideSystemUI, 250);
    }

    @Override
    public void onResume() {
        super.onResume();
        configureWebView();
        applyKeepScreenOn(keepScreenOnRequested);
        dispatchNativeLifecycle("foreground");
        hideSystemUI();
    }

    @Override
    public void onPause() {
        dispatchNativeLifecycle("background");
        applyKeepScreenOn(false);
        super.onPause();
    }

    @Override
    protected void onPostResume() {
        super.onPostResume();
        hideSystemUI();
    }

    @Override
    public void onDestroy() {
        applyKeepScreenOn(false);
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().removeJavascriptInterface("JokerAndroid");
        }
        super.onDestroy();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
            getWindow().getDecorView().postDelayed(this::hideSystemUI, 180);
        }
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        hideSystemUI();
    }

    private void configureWindow() {
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().getDecorView().setBackgroundColor(APP_BACKGROUND);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setStatusBarContrastEnforced(false);
            getWindow().setNavigationBarContrastEnforced(false);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams attributes = getWindow().getAttributes();
            attributes.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(attributes);
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            getWindow().getDecorView().setOnSystemUiVisibilityChangeListener(
                visibility -> {
                    if ((visibility & View.SYSTEM_UI_FLAG_FULLSCREEN) == 0) {
                        getWindow().getDecorView().postDelayed(this::hideSystemUI, 120);
                    }
                }
            );
        }
    }

    private void configureWebView() {
        if (getBridge() == null || getBridge().getWebView() == null) {
            return;
        }

        WebView webView = getBridge().getWebView();
        webView.setBackgroundColor(APP_BACKGROUND);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        if (!webBridgeInstalled) {
            webView.addJavascriptInterface(jokerAndroidBridge, "JokerAndroid");
            webBridgeInstalled = true;
        }
    }

    private void installBackGuard() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                handleAndroidBack();
            }
        });
    }

    private void handleAndroidBack() {
        if (getBridge() == null || getBridge().getWebView() == null) {
            moveTaskToBack(true);
            return;
        }

        String script = "(function(){try{"
            + "var event=new CustomEvent('joker-android-back',{cancelable:true});"
            + "if(!window.dispatchEvent(event)){return true;}"
            + "var sheet=document.getElementById('score-sheet');"
            + "if(sheet&&!sheet.hidden){var close=document.getElementById('score-close');"
            + "if(close){close.click();return true;}}"
            + "var rules=document.getElementById('rules-card');"
            + "if(rules&&!rules.hidden){var toggle=document.getElementById('rules-toggle');"
            + "if(toggle){toggle.click();return true;}}"
            + "return !!(window.jokerState&&window.jokerState.started);"
            + "}catch(error){return false;}})()";

        getBridge().getWebView().evaluateJavascript(script, value -> {
            if (!"true".equals(value)) {
                moveTaskToBack(true);
            }
        });
    }

    private void dispatchNativeLifecycle(String lifecycle) {
        if (getBridge() == null || getBridge().getWebView() == null) return;

        WebView webView = getBridge().getWebView();
        String script = "window.dispatchEvent(new CustomEvent('joker-native-lifecycle',"
            + "{detail:{state:'" + lifecycle + "'}}));";
        webView.post(() -> webView.evaluateJavascript(script, null));
    }

    private void setKeepScreenOnRequested(boolean enabled) {
        keepScreenOnRequested = enabled;
        runOnUiThread(() -> applyKeepScreenOn(enabled));
    }

    private void applyKeepScreenOn(boolean enabled) {
        if (enabled) {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        } else {
            getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }
    }

    private void performHaptic(String type) {
        runOnUiThread(() -> {
            long now = SystemClock.uptimeMillis();
            if (now - lastHapticAt < HAPTIC_GAP_MS) return;
            lastHapticAt = now;

            String safeType = type == null ? "selection" : type;
            int feedback;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                switch (safeType) {
                    case "success":
                    case "trick":
                        feedback = HapticFeedbackConstants.CONFIRM;
                        break;
                    case "warning":
                    case "error":
                        feedback = HapticFeedbackConstants.REJECT;
                        break;
                    default:
                        feedback = HapticFeedbackConstants.CLOCK_TICK;
                        break;
                }
            } else if ("warning".equals(safeType) || "error".equals(safeType)) {
                feedback = HapticFeedbackConstants.LONG_PRESS;
            } else {
                feedback = HapticFeedbackConstants.VIRTUAL_KEY;
            }

            View target = getBridge() != null && getBridge().getWebView() != null
                ? getBridge().getWebView()
                : getWindow().getDecorView();
            target.performHapticFeedback(feedback);
        });
    }

    private void hideSystemUI() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                );
            }
            return;
        }

        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
    }

    private final class JokerAndroidBridge {
        @JavascriptInterface
        public void setKeepScreenOn(boolean enabled) {
            setKeepScreenOnRequested(enabled);
        }

        @JavascriptInterface
        public void haptic(String type) {
            performHaptic(type);
        }
    }
}
'''


def android_attr(name: str) -> str:
    return f"{{{ANDROID_NS}}}{name}"


def validate_capacitor_config(root: Path) -> None:
    config_path = root / "capacitor.config.json"
    config = json.loads(config_path.read_text(encoding="utf-8"))
    checks = {
        "appId": config.get("appId") == EXPECTED_APP_ID,
        "webDir": config.get("webDir") == EXPECTED_WEB_DIR,
        "backgroundColor": config.get("backgroundColor") == APP_BACKGROUND,
        "android.backgroundColor": config.get("android", {}).get("backgroundColor") == APP_BACKGROUND,
        "android.zoomEnabled": config.get("android", {}).get("zoomEnabled") is False,
        "server.androidScheme": config.get("server", {}).get("androidScheme") == "https",
    }
    failed = [name for name, ok in checks.items() if not ok]
    if failed:
        raise RuntimeError("Unexpected Capacitor config: " + ", ".join(failed))


def configure_manifest(root: Path) -> None:
    path = root / "android/app/src/main/AndroidManifest.xml"
    tree = ET.parse(path)
    manifest = tree.getroot()
    activity = None
    for candidate in manifest.findall("./application/activity"):
        name = candidate.attrib.get(android_attr("name"))
        if name in {".MainActivity", EXPECTED_APP_ID + ".MainActivity"}:
            activity = candidate
            break
    if activity is None:
        raise RuntimeError("MainActivity is missing from AndroidManifest.xml")

    config_changes = set(activity.attrib.get(android_attr("configChanges"), "").split("|"))
    missing_changes = REQUIRED_CONFIG_CHANGES - config_changes
    if missing_changes:
        raise RuntimeError("Capacitor MainActivity misses configChanges: " + ", ".join(sorted(missing_changes)))

    activity.set(android_attr("screenOrientation"), "sensorLandscape")
    tree.write(path, encoding="utf-8", xml_declaration=True)


def configure_styles(root: Path) -> None:
    path = root / "android/app/src/main/res/values/styles.xml"
    tree = ET.parse(path)
    styles = {
        style.attrib.get("name"): style
        for style in tree.getroot().findall("style")
        if style.attrib.get("name") in STYLE_NAMES
    }
    missing = STYLE_NAMES - styles.keys()
    if missing:
        raise RuntimeError("Generated Android styles are missing: " + ", ".join(sorted(missing)))

    for style in styles.values():
        existing = {item.attrib.get("name"): item for item in style.findall("item")}
        for item_name, item_value in STYLE_ITEMS.items():
            item = existing.get(item_name)
            if item is None:
                item = ET.SubElement(style, "item", {"name": item_name})
            item.text = item_value

    tree.write(path, encoding="utf-8", xml_declaration=True)


def configure_main_activity(root: Path) -> None:
    path = root / "android/app/src/main/java/com/valievcompany/joker/MainActivity.java"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(MAIN_ACTIVITY, encoding="utf-8")


def configure_project(root: Path) -> None:
    validate_capacitor_config(root)
    configure_manifest(root)
    configure_styles(root)
    configure_main_activity(root)


def write_fixture(root: Path) -> None:
    (root / "capacitor.config.json").write_text(
        json.dumps(
            {
                "appId": EXPECTED_APP_ID,
                "appName": "Joker",
                "webDir": EXPECTED_WEB_DIR,
                "backgroundColor": APP_BACKGROUND,
                "android": {"backgroundColor": APP_BACKGROUND, "zoomEnabled": False},
                "server": {"androidScheme": "https"},
            },
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )
    manifest_path = root / "android/app/src/main/AndroidManifest.xml"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(
        '''<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <application>
    <activity android:name=".MainActivity" android:configChanges="orientation|screenSize|keyboardHidden" />
  </application>
</manifest>
''',
        encoding="utf-8",
    )
    styles_path = root / "android/app/src/main/res/values/styles.xml"
    styles_path.parent.mkdir(parents=True, exist_ok=True)
    styles_path.write_text(
        '''<resources>
  <style name="AppTheme.NoActionBar" />
  <style name="AppTheme.NoActionBarLaunch" />
</resources>
''',
        encoding="utf-8",
    )


def self_test() -> None:
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        write_fixture(root)
        configure_project(root)
        tracked = [
            root / "android/app/src/main/AndroidManifest.xml",
            root / "android/app/src/main/res/values/styles.xml",
            root / "android/app/src/main/java/com/valievcompany/joker/MainActivity.java",
        ]
        first = {path: path.read_bytes() for path in tracked}
        configure_project(root)
        second = {path: path.read_bytes() for path in tracked}
        if first != second:
            raise AssertionError("Android wrapper configuration is not idempotent")

        manifest = ET.parse(tracked[0]).getroot()
        activity = manifest.find("./application/activity")
        assert activity is not None
        assert activity.attrib[android_attr("screenOrientation")] == "sensorLandscape"

        styles = ET.parse(tracked[1]).getroot().findall("style")
        for style in styles:
            values = {item.attrib["name"]: item.text for item in style.findall("item")}
            assert values["android:windowBackground"] == APP_BACKGROUND
            assert values["android:windowLayoutInDisplayCutoutMode"] == "shortEdges"

        java = tracked[2].read_text(encoding="utf-8")
        for marker in (
            "getOnBackPressedDispatcher()",
            "joker-android-back",
            "window.jokerState&&window.jokerState.started",
            "setOverScrollMode(View.OVER_SCROLL_NEVER)",
            "BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE",
        ):
            assert marker in java
    print("Android wrapper self-test passed")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    configure_project(Path.cwd())
    print("Android wrapper configured")


if __name__ == "__main__":
    main()
