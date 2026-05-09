import os
import time
import tempfile
import unittest
import warnings

warnings.filterwarnings("ignore", category=DeprecationWarning)

from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

BASE_URL      = os.getenv("BASE_URL")
TEST_EMAIL    = os.getenv("TEST_EMAIL")
TEST_PASSWORD = os.getenv("TEST_PASSWORD")

WAIT = 20


def make_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument(f"--user-data-dir={tempfile.mkdtemp()}")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    driver = webdriver.Chrome(options=options)
    driver.set_window_size(1280, 900)
    return driver


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


def login(driver):
    driver.get(f"{BASE_URL}/login")
    tid_type(driver, "login-email", TEST_EMAIL)
    tid_type(driver, "login-password", TEST_PASSWORD)
    tid_click(driver, "login-btn")
    WebDriverWait(driver, WAIT).until(lambda d: "/login" not in d.current_url)


class TestAuth05(unittest.TestCase):

    def tearDown(self):
        time.sleep(1)

    # ------------------------------------------------------------------ #
    #  AUTH-05 TC-AUTH-05-01 – Auto receives code on step 2              #
    # ------------------------------------------------------------------ #
    def test_auth05_tc01_auto_receives_code_on_step2(self):
        """Positive: User automatically receives a verification code on step 2 of reset-password."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/reset-password?from=profile")
            time.sleep(4)
            toast = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-sonner-toast]"))
            )
            self.assertIn("code", toast.text.lower(),
                          "A toast should confirm the verification code was sent automatically")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AUTH-05 TC-AUTH-05-02 – 30-second countdown starts after send     #
    # ------------------------------------------------------------------ #
    def test_auth05_tc02_countdown_starts_after_code_sent(self):
        """Positive: A 30-second countdown starts after the verification code is sent."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/reset-password?from=profile")
            time.sleep(4)
            countdown = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='circle-countdown']")
                )
            )
            self.assertTrue(countdown.is_displayed(),
                            "Circle countdown should be visible after code is sent")
            countdown_text = countdown.text.strip()
            self.assertTrue(
                countdown_text.isdigit() and 1 <= int(countdown_text) <= 30,
                f"Countdown should show a number between 1 and 30, got: '{countdown_text}'"
            )
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AUTH-05 TC-AUTH-05-03 – Resend button disabled during countdown   #
    # ------------------------------------------------------------------ #
    def test_auth05_tc03_resend_disabled_during_countdown(self):
        """Negative: Resend button is not visible during the 30-second countdown."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/reset-password?from=profile")
            time.sleep(4)
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='circle-countdown']")
                )
            )
            resend_btn = driver.execute_script(
                "return document.querySelector(\"[data-testid='resend-code-btn']\");"
            )
            self.assertIsNone(resend_btn,
                              "Resend button should not be visible during the 30-second countdown")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AUTH-05 TC-AUTH-05-04 – Resend button enabled after countdown     #
    # ------------------------------------------------------------------ #
    def test_auth05_tc04_resend_enabled_after_countdown(self):
        """Edge: Resend button becomes enabled exactly after the 30-second countdown ends."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/reset-password?from=profile")
            time.sleep(4)
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='circle-countdown']")
                )
            )
            # Wait up to 35 seconds for the countdown to finish
            WebDriverWait(driver, 35).until(
                lambda d: d.execute_script(
                    "return document.querySelector(\"[data-testid='resend-code-btn']\") !== null;"
                )
            )
            resend_btn = driver.find_element(
                By.CSS_SELECTOR, "[data-testid='resend-code-btn']"
            )
            self.assertTrue(resend_btn.is_displayed(),
                            "Resend button should appear after the 30-second countdown ends")
            disabled = driver.execute_script(
                "var el = arguments[0]; return el.disabled || el.getAttribute('aria-disabled') === 'true';",
                resend_btn
            )
            self.assertFalse(disabled,
                             "Resend button should be enabled after the countdown ends")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
