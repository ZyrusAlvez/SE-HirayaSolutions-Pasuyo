"""
create_errand.py
----------------
Automatically creates a test errand for a given account.

Usage:
    python create_errand.py

Configure the variables below before running.
"""

import os
import time
import tempfile

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

# ------------------------------------------------------------------ #
#  CONFIGURE THESE BEFORE RUNNING                                     #
# ------------------------------------------------------------------ #
BASE_URL    = "http://localhost:8081"
EMAIL       = "sampleemail@gmail.com"
# Password Format Sample (SampleEmail@3)
PASSWORD    = "sampleemail"
TITLE       = "Sample Errand Title"
DESCRIPTION = "Just a simple errand for Testing"
BUDGET      = "600"
# ------------------------------------------------------------------ #

WAIT = 20


def make_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--no-first-run")
    options.add_argument("--no-default-browser-check")
    options.add_argument(f"--user-data-dir={tempfile.mkdtemp()}")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()), options=options
    )
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    })
    driver.set_window_size(1280, 900)
    return driver


def tid_click(driver, test_id):
    el = WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, f"[data-testid='{test_id}']"))
    )
    driver.execute_script("""
        var el = arguments[0];
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    """, el)


def tid_type(driver, test_id, value):
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, f"[data-testid='{test_id}']"))
    )
    driver.execute_script("""
        var wrapper = document.querySelector("[data-testid='" + arguments[0] + "']");
        var el = wrapper.tagName === 'INPUT' || wrapper.tagName === 'TEXTAREA'
            ? wrapper : (wrapper.querySelector('textarea') || wrapper.querySelector('input'));
        var proto = el.tagName === 'TEXTAREA'
            ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        var setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
        setter.call(el, arguments[1]);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    """, test_id, value)


def main():
    driver = make_driver()
    try:
        # ── Login ──────────────────────────────────────────────────
        print("Logging in...")
        driver.get(f"{BASE_URL}/login")
        tid_type(driver, "login-email", EMAIL)
        tid_type(driver, "login-password", PASSWORD)
        tid_click(driver, "login-btn")
        WebDriverWait(driver, WAIT).until(lambda d: "/login" not in d.current_url)
        print("  ✓ Logged in")

        # ── Navigate to post-errand ────────────────────────────────
        print("Opening post errand form...")
        driver.get(f"{BASE_URL}/post-errand")
        WebDriverWait(driver, WAIT).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='post-errand-title']"))
        )
        time.sleep(5)
        print("  ✓ Form loaded")

        # ── Fill in the form ───────────────────────────────────────
        print("Filling in errand details...")
        tid_type(driver, "post-errand-title", TITLE)
        tid_type(driver, "post-errand-description", DESCRIPTION)
        tid_click(driver, "task-type-remote")
        tid_type(driver, "post-errand-budget", BUDGET)
        print("  ✓ Details filled")

        # ── Submit ─────────────────────────────────────────────────
        print("Submitting errand...")
        tid_click(driver, "post-errand-submit")
        WebDriverWait(driver, WAIT).until(lambda d: "/post-errand" not in d.current_url)

        print("\n✅ Errand created successfully!")
        print(f"\n  Title       : {TITLE}")
        print(f"  Description : {DESCRIPTION}")
        print(f"  Budget      : ₱{BUDGET}")
        print(f"\nCopy the title into your .env:")
        print(f"  EDIT_ERRAND_TITLE={TITLE}")
        print(f"  KNOWN_ERRAND_TITLE={TITLE}")
        time.sleep(3)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise
    finally:
        driver.quit()


if __name__ == "__main__":
    main()
