#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from pathlib import Path

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
    protected void onPause() {
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
    protected void onDestroy() {
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

REQUIRED_MARKERS = (
    'addJavascriptInterface(jokerAndroidBridge, "JokerAndroid")',
    'joker-native-lifecycle',
    'FLAG_KEEP_SCREEN_ON',
    'HapticFeedbackConstants.CONFIRM',
    '@JavascriptInterface',
)


def patch(root: Path) -> None:
    path = root / 'tools/configure_android_wrapper.py'
    source = path.read_text(encoding='utf-8')

    pattern = re.compile(r"MAIN_ACTIVITY = r'''.*?'''\n\n\ndef android_attr", re.S)
    replacement = "MAIN_ACTIVITY = r'''" + MAIN_ACTIVITY + "'''\n\n\ndef android_attr"
    source, count = pattern.subn(replacement, source, count=1)
    if count != 1:
        raise RuntimeError(f'Expected one MAIN_ACTIVITY template, replaced {count}')

    anchor = '            "BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE",\n'
    if anchor not in source:
        raise RuntimeError('Self-test marker anchor changed unexpectedly')

    missing = [marker for marker in REQUIRED_MARKERS if marker not in source]
    if missing:
        insertion = ''.join(f"            {marker!r},\n" for marker in missing)
        source = source.replace(anchor, anchor + insertion, 1)

    path.write_text(source, encoding='utf-8')


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=Path.cwd())
    args = parser.parse_args()
    patch(args.root)
    print('Android lifecycle configurator patched')


if __name__ == '__main__':
    main()
