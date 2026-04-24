"""
fill_verification.py
--------------------
Automatically fills and submits the verification form for a given account.

Usage:
    python fill_verification.py

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
EMAIL       = "sampleemail6@gmail.com"
PASSWORD    = "SampleEmail@6"
ASSETS_DIR  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
FRONT_IMAGE = os.path.join(ASSETS_DIR, "valid.jpg")
BACK_IMAGE  = os.path.join(ASSETS_DIR, "valid.jpg")
BILL_IMAGE  = os.path.join(ASSETS_DIR, "valid.jpg")
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
        var el = wrapper.tagName === 'INPUT' ? wrapper : wrapper.querySelector('input');
        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, arguments[1]);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    """, test_id, value)


def set_date(driver, test_id, date_value):
    """Set a DateInput value via its hidden native input (testID-native)."""
    driver.execute_script("""
        var el = document.querySelector("[data-testid='" + arguments[0] + "-native']");
        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, arguments[1]);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    """, test_id, date_value)


def upload_image(driver, btn_test_id, filepath):
    abs_path = os.path.abspath(filepath)
    tid_click(driver, btn_test_id)
    driver.execute_script("""
        var inputs = document.querySelectorAll('input[type="file"]');
        inputs.forEach(function(el) {
            el.style.display = 'block';
            el.style.opacity = '1';
            el.style.position = 'fixed';
            el.style.top = '0';
            el.style.left = '0';
            el.style.zIndex = '9999';
        });
    """)
    file_input = WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file']"))
    )
    file_input.send_keys(abs_path)
    time.sleep(2)


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

        # ── Navigate to verify page ────────────────────────────────
        driver.get(f"{BASE_URL}/profile")
        tid_click(driver, "verify-account-btn")
        WebDriverWait(driver, WAIT).until(EC.url_contains("/verify"))
        time.sleep(2)
        print("  ✓ Opened verification form")

        # ── Step 1: Personal Info ──────────────────────────────────
        print("Filling Step 1 (Personal Info)...")
        tid_type(driver, "step1-first-name", "Test")
        tid_type(driver, "step1-last-name", "User")
        tid_click(driver, "step1-gender-male")
        set_date(driver, "step1-dob-input", "2000-01-01")
        time.sleep(1)
        tid_click(driver, "verify-next-btn")
        print("  ✓ Step 1 complete")

        # ── Step 2: Address ────────────────────────────────────────
        print("Filling Step 2 (Address)...")
        WebDriverWait(driver, WAIT).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='step2-province']"))
        )
        time.sleep(2)
        tid_click(driver, "step2-province")
        WebDriverWait(driver, WAIT).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='step2-province-option-0']"))
        )
        tid_click(driver, "step2-province-option-0")
        time.sleep(2)
        tid_click(driver, "step2-city")
        WebDriverWait(driver, WAIT).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='step2-city-option-0']"))
        )
        tid_click(driver, "step2-city-option-0")
        time.sleep(2)
        tid_click(driver, "step2-barangay")
        WebDriverWait(driver, WAIT).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='step2-barangay-option-0']"))
        )
        tid_click(driver, "step2-barangay-option-0")
        time.sleep(1)
        tid_type(driver, "step2-house-no", "123")
        tid_type(driver, "step2-street", "Test Street")
        tid_click(driver, "verify-next-btn")
        print("  ✓ Step 2 complete")

        # ── Step 3: Utility Bill ───────────────────────────────────
        print("Filling Step 3 (Utility Bill)...")
        WebDriverWait(driver, WAIT).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='step3-bill-water']"))
        )
        tid_click(driver, "step3-bill-water")
        time.sleep(1)
        upload_image(driver, "step3-front-upload-btn", BILL_IMAGE)
        upload_image(driver, "step3-back-upload-btn", BILL_IMAGE)
        tid_click(driver, "verify-next-btn")
        print("  ✓ Step 3 complete")

        # ── Step 4: Government ID ──────────────────────────────────
        print("Filling Step 4 (Government ID)...")
        WebDriverWait(driver, WAIT).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='id-type-national-id']"))
        )
        tid_click(driver, "id-type-national-id")
        time.sleep(1)
        upload_image(driver, "id-front-upload-btn", FRONT_IMAGE)
        upload_image(driver, "id-back-upload-btn", BACK_IMAGE)
        tid_click(driver, "verify-next-btn")
        print("  ✓ Step 4 complete")

        # ── Wait for success screen ────────────────────────────────
        WebDriverWait(driver, WAIT * 2).until(
            EC.presence_of_element_located(
                (By.XPATH, "//*[contains(text(), 'Verification Submitted')]")
            )
        )
        print("\n✅ Verification form submitted successfully!")
        time.sleep(3)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise
    finally:
        driver.quit()


if __name__ == "__main__":
    main()
