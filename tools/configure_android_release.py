#!/usr/bin/env python3
"""Apply deterministic release metadata, security flags, and launcher art.

This script configures a generated Capacitor Android project. It never builds an
APK/AAB and never handles signing secrets.
"""

from __future__ import annotations

import argparse
import json
import re
import tempfile
from pathlib import Path
import xml.etree.ElementTree as ET

ANDROID_NS = "http://schemas.android.com/apk/res/android"
ET.register_namespace("android", ANDROID_NS)

RELEASE_CONFIG_PATH = Path("android-release.json")
WEBVIEW_DEBUG_MARKER = "// JOKER_RELEASE_WEBVIEW_DEBUG_GUARD"

LEGACY_ICON = '''<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path android:fillColor="#03110F" android:pathData="M0,0h108v108h-108z" />
    <path android:fillColor="#F4F7F5" android:pathData="M31,15C25,15 21,19 21,25L21,83C21,89 25,93 31,93L77,93C83,93 87,89 87,83L87,25C87,19 83,15 77,15Z" />
    <path android:fillColor="#15352F" android:pathData="M34,22C30,22 28,24 28,28L28,80C28,84 30,86 34,86L74,86C78,86 80,84 80,80L80,28C80,24 78,22 74,22Z" />
    <path android:fillColor="#E23A8E" android:pathData="M54,31L59,43L72,44L62,52L65,65L54,58L43,65L46,52L36,44L49,43Z" />
    <path android:fillColor="#F4F7F5" android:pathData="M39,72L47,72L47,79L39,79ZM61,72L69,72L69,79L61,79Z" />
</vector>
'''

FOREGROUND_ICON = '''<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path android:fillColor="#F4F7F5" android:pathData="M34,20C29,20 26,23 26,28L26,80C26,85 29,88 34,88L74,88C79,88 82,85 82,80L82,28C82,23 79,20 74,20Z" />
    <path android:fillColor="#15352F" android:pathData="M38,27C35,27 33,29 33,32L33,76C33,79 35,81 38,81L70,81C73,81 75,79 75,76L75,32C75,29 73,27 70,27Z" />
    <path android:fillColor="#E23A8E" android:pathData="M54,34L58,44L69,45L61,52L63,63L54,57L45,63L47,52L39,45L50,44Z" />
</vector>
'''

MONOCHROME_ICON = '''<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path android:fillColor="#FFFFFFFF" android:pathData="M34,20C29,20 26,23 26,28L26,80C26,85 29,88 34,88L74,88C79,88 82,85 82,80L82,28C82,23 79,20 74,20ZM54,34L58,44L69,45L61,52L63,63L54,57L45,63L47,52L39,45L50,44Z" />
</vector>
'''

ADAPTIVE_ICON = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/joker_launcher_background" />
    <foreground android:drawable="@drawable/joker_launcher_foreground" />
</adaptive-icon>
'''

ADAPTIVE_ICON_V33 = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/joker_launcher_background" />
    <foreground android:drawable="@drawable/joker_launcher_foreground" />
    <monochrome android:drawable="@drawable/joker_launcher_monochrome" />
</adaptive-icon>
'''

COLORS_XML = '''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="joker_launcher_background">#03110F</color>
</resources>
'''


def android_attr(name: str) -> str:
    return f"{{{ANDROID_NS}}}{name}"


def load_release_config(root: Path) -> dict:
    path = root / RELEASE_CONFIG_PATH
    config = json.loads(path.read_text(encoding="utf-8"))
    required = {
        "applicationId": str,
        "appName": str,
        "versionCode": int,
        "versionName": str,
        "minimumPlayTargetSdk": int,
        "artifact": str,
        "allowedPermissions": list,
    }
    for key, expected_type in required.items():
        value = config.get(key)
        if not isinstance(value, expected_type):
            raise RuntimeError(f"Invalid release config field: {key}")
    if config["versionCode"] < 1:
        raise RuntimeError("versionCode must be positive")
    if not re.fullmatch(r"\d+\.\d+\.\d+", config["versionName"]):
        raise RuntimeError("versionName must use semantic x.y.z form")
    if config["minimumPlayTargetSdk"] < 35:
        raise RuntimeError("minimumPlayTargetSdk must be at least API 35")
    if config["artifact"] != "aab":
        raise RuntimeError("Google Play release artifact must be aab")
    if config["allowedPermissions"] != ["android.permission.INTERNET"]:
        raise RuntimeError("Unexpected permission allowlist")
    return config


def validate_source_metadata(root: Path, config: dict) -> None:
    capacitor = json.loads((root / "capacitor.config.json").read_text(encoding="utf-8"))
    package = json.loads((root / "package.json").read_text(encoding="utf-8"))
    checks = {
        "capacitor appId": capacitor.get("appId") == config["applicationId"],
        "capacitor appName": capacitor.get("appName") == config["appName"],
        "package version": package.get("version") == config["versionName"],
        "private package": package.get("private") is True,
    }
    failed = [name for name, valid in checks.items() if not valid]
    if failed:
        raise RuntimeError("Release metadata mismatch: " + ", ".join(failed))


def set_string(resources: ET.Element, name: str, value: str) -> None:
    item = next((node for node in resources.findall("string") if node.attrib.get("name") == name), None)
    if item is None:
        item = ET.SubElement(resources, "string", {"name": name})
    item.text = value


def configure_strings(root: Path, config: dict) -> None:
    path = root / "android/app/src/main/res/values/strings.xml"
    tree = ET.parse(path)
    resources = tree.getroot()
    set_string(resources, "app_name", config["appName"])
    set_string(resources, "title_activity_main", config["appName"])
    set_string(resources, "package_name", config["applicationId"])
    set_string(resources, "custom_url_scheme", config["applicationId"])
    tree.write(path, encoding="utf-8", xml_declaration=True)


def configure_manifest(root: Path, config: dict) -> None:
    path = root / "android/app/src/main/AndroidManifest.xml"
    tree = ET.parse(path)
    manifest = tree.getroot()
    application = manifest.find("application")
    if application is None:
        raise RuntimeError("Android application node is missing")

    requested_permissions = {
        node.attrib.get(android_attr("name"))
        for node in manifest.findall("uses-permission")
        if node.attrib.get(android_attr("name"))
    }
    allowed = set(config["allowedPermissions"])
    unexpected = sorted(requested_permissions - allowed)
    missing = sorted(allowed - requested_permissions)
    if unexpected or missing:
        details = []
        if unexpected:
            details.append("unexpected=" + ",".join(unexpected))
        if missing:
            details.append("missing=" + ",".join(missing))
        raise RuntimeError("Manifest permission contract failed: " + " ".join(details))

    values = {
        "label": "@string/app_name",
        "icon": "@mipmap/ic_launcher",
        "roundIcon": "@mipmap/ic_launcher_round",
        "allowBackup": "false",
        "fullBackupContent": "false",
        "usesCleartextTraffic": "false",
        "appCategory": "game",
    }
    for name, value in values.items():
        application.set(android_attr(name), value)

    tree.write(path, encoding="utf-8", xml_declaration=True)


def configure_gradle(root: Path, config: dict) -> None:
    path = root / "android/app/build.gradle"
    text = path.read_text(encoding="utf-8")

    application_match = re.search(r'applicationId\s+["\']([^"\']+)["\']', text)
    if not application_match or application_match.group(1) != config["applicationId"]:
        raise RuntimeError("Generated applicationId does not match release config")

    text, code_count = re.subn(r"(?m)^(\s*)versionCode\s+\d+\s*$", rf"\g<1>versionCode {config['versionCode']}", text)
    text, name_count = re.subn(r'(?m)^(\s*)versionName\s+["\'][^"\']+["\']\s*$', rf'\g<1>versionName "{config["versionName"]}"', text)
    if code_count != 1 or name_count != 1:
        raise RuntimeError("Could not set Android versionCode/versionName")
    path.write_text(text, encoding="utf-8")

    variables_path = root / "android/variables.gradle"
    variables = variables_path.read_text(encoding="utf-8")
    match = re.search(r"targetSdkVersion\s*=\s*(\d+)", variables)
    if not match:
        raise RuntimeError("Generated targetSdkVersion is missing")
    target_sdk = int(match.group(1))
    if target_sdk < config["minimumPlayTargetSdk"]:
        raise RuntimeError(
            f"targetSdkVersion {target_sdk} is below Play minimum {config['minimumPlayTargetSdk']}"
        )


def configure_launcher_icons(root: Path) -> None:
    res = root / "android/app/src/main/res"
    files = {
        "values/joker_release_colors.xml": COLORS_XML,
        "drawable/joker_launcher_foreground.xml": FOREGROUND_ICON,
        "drawable/joker_launcher_monochrome.xml": MONOCHROME_ICON,
        "mipmap-anydpi/ic_launcher.xml": LEGACY_ICON,
        "mipmap-anydpi/ic_launcher_round.xml": LEGACY_ICON,
        "mipmap-anydpi-v26/ic_launcher.xml": ADAPTIVE_ICON,
        "mipmap-anydpi-v26/ic_launcher_round.xml": ADAPTIVE_ICON,
        "mipmap-anydpi-v33/ic_launcher.xml": ADAPTIVE_ICON_V33,
        "mipmap-anydpi-v33/ic_launcher_round.xml": ADAPTIVE_ICON_V33,
    }
    for relative, content in files.items():
        path = res / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")


def configure_webview_debug_guard(root: Path) -> None:
    path = root / "android/app/src/main/java/com/valievcompany/joker/MainActivity.java"
    text = path.read_text(encoding="utf-8")
    if WEBVIEW_DEBUG_MARKER in text:
        return
    needle = (
        "        WebView webView = getBridge().getWebView();\n"
        "        webView.setBackgroundColor(APP_BACKGROUND);\n"
    )
    replacement = (
        "        WebView webView = getBridge().getWebView();\n"
        + f"        {WEBVIEW_DEBUG_MARKER}\n"
        + "        if ((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) == 0) {\n"
        + "            WebView.setWebContentsDebuggingEnabled(false);\n"
        + "        }\n"
        + "        webView.setBackgroundColor(APP_BACKGROUND);\n"
    )
    if text.count(needle) != 1:
        raise RuntimeError("Could not install release WebView debug guard")
    path.write_text(text.replace(needle, replacement), encoding="utf-8")


def configure_project(root: Path) -> None:
    config = load_release_config(root)
    validate_source_metadata(root, config)
    configure_strings(root, config)
    configure_manifest(root, config)
    configure_gradle(root, config)
    configure_launcher_icons(root)
    configure_webview_debug_guard(root)


def write_fixture(root: Path) -> None:
    (root / "android/app/src/main/res/values").mkdir(parents=True, exist_ok=True)
    (root / "android/app/src/main/java/com/valievcompany/joker").mkdir(parents=True, exist_ok=True)
    (root / "android/app").mkdir(parents=True, exist_ok=True)

    (root / "android-release.json").write_text(json.dumps({
        "applicationId": "com.valievcompany.joker",
        "appName": "Joker",
        "versionCode": 1,
        "versionName": "1.0.0",
        "minimumPlayTargetSdk": 35,
        "artifact": "aab",
        "allowedPermissions": ["android.permission.INTERNET"],
        "dataCollection": "none",
    }), encoding="utf-8")
    (root / "capacitor.config.json").write_text(json.dumps({
        "appId": "com.valievcompany.joker",
        "appName": "Joker",
        "webDir": "www",
    }), encoding="utf-8")
    (root / "package.json").write_text(json.dumps({
        "name": "joker-card-game",
        "version": "1.0.0",
        "private": True,
    }), encoding="utf-8")
    (root / "android/app/src/main/AndroidManifest.xml").write_text(
        '''<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n<uses-permission android:name="android.permission.INTERNET" />\n<application android:label="@string/app_name"><activity android:name=".MainActivity" /></application>\n</manifest>\n''',
        encoding="utf-8",
    )
    (root / "android/app/src/main/res/values/strings.xml").write_text(
        '''<?xml version="1.0" encoding="utf-8"?>\n<resources><string name="app_name">Old</string><string name="title_activity_main">Old</string><string name="package_name">old</string><string name="custom_url_scheme">old</string></resources>\n''',
        encoding="utf-8",
    )
    (root / "android/app/build.gradle").write_text(
        '''android {\n    defaultConfig {\n        applicationId "com.valievcompany.joker"\n        versionCode 1\n        versionName "1.0"\n    }\n}\n''',
        encoding="utf-8",
    )
    (root / "android/variables.gradle").write_text("ext { targetSdkVersion = 36 }\n", encoding="utf-8")
    (root / "android/app/src/main/java/com/valievcompany/joker/MainActivity.java").write_text(
        '''package com.valievcompany.joker;\nimport android.webkit.WebView;\npublic class MainActivity {\n    void configureWebView() {\n        WebView webView = getBridge().getWebView();\n        webView.setBackgroundColor(APP_BACKGROUND);\n    }\n    Bridge getBridge(){return null;}\n    static class Bridge { WebView getWebView(){return null;} }\n}\n''',
        encoding="utf-8",
    )


def assert_fixture(root: Path) -> None:
    manifest = ET.parse(root / "android/app/src/main/AndroidManifest.xml").getroot()
    application = manifest.find("application")
    assert application is not None
    assert application.attrib[android_attr("allowBackup")] == "false"
    assert application.attrib[android_attr("usesCleartextTraffic")] == "false"
    assert application.attrib[android_attr("appCategory")] == "game"

    gradle = (root / "android/app/build.gradle").read_text(encoding="utf-8")
    assert "versionCode 1" in gradle
    assert 'versionName "1.0.0"' in gradle

    activity = (root / "android/app/src/main/java/com/valievcompany/joker/MainActivity.java").read_text(encoding="utf-8")
    assert activity.count(WEBVIEW_DEBUG_MARKER) == 1
    assert "WebView.setWebContentsDebuggingEnabled(false)" in activity

    expected = [
        "mipmap-anydpi/ic_launcher.xml",
        "mipmap-anydpi-v26/ic_launcher.xml",
        "mipmap-anydpi-v33/ic_launcher.xml",
        "drawable/joker_launcher_foreground.xml",
        "drawable/joker_launcher_monochrome.xml",
    ]
    for relative in expected:
        assert (root / "android/app/src/main/res" / relative).is_file(), relative


def self_test() -> None:
    with tempfile.TemporaryDirectory(prefix="joker-android-release-") as directory:
        root = Path(directory)
        write_fixture(root)
        configure_project(root)
        first = {
            path.relative_to(root).as_posix(): path.read_bytes()
            for path in root.rglob("*") if path.is_file()
        }
        configure_project(root)
        second = {
            path.relative_to(root).as_posix(): path.read_bytes()
            for path in root.rglob("*") if path.is_file()
        }
        assert first == second, "release configuration must be idempotent"
        assert_fixture(root)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        print("Android release configurator self-test passed")
        return
    configure_project(Path(args.root).resolve())
    print("Android release configuration applied")


if __name__ == "__main__":
    main()
