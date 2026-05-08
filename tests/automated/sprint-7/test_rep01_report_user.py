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

BASE_URL        = os.getenv("BASE_URL")
TEST_EMAIL      = os.getenv("TEST_EMAIL")
TEST_PASSWORD   = os.getenv("TEST_PASSWORD")
OTHER_USER_ID   = os.getenv("OTHER_USER_ID")
OTHER_USER_NAME = os.getenv("OTHER_USER_NAME")

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


def open_report_modal(driver):
    tid_click(driver, "report-btn")
    time.sleep(1)
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, "[data-testid^='report-reason-']")
        )
    )


class TestRep01(unittest.TestCase):

    def tearDown(self):
        time.sleep(1)

    # ------------------------------------------------------------------ #
    #  REP-01 TC-REP-01-01 – Report button visible on profile & chat     #
    # ------------------------------------------------------------------ #
    def test_rep01_tc01_report_btn_visible_on_user_profile(self):
        """Positive: Report button is visible on another user's profile page."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/user/{OTHER_USER_ID}")
            time.sleep(3)
            btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='report-btn']")
                )
            )
            self.assertTrue(btn.is_displayed(),
                            "Report button should be visible on another user's profile page")
        finally:
            driver.quit()

    def test_rep01_tc01_report_btn_visible_on_chat(self):
        """Positive: Report button is visible on the chat page."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/chat?userId={OTHER_USER_ID}")
            time.sleep(3)
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='chat-thread-panel']")
                )
            )
            flag_present = driver.execute_script(
                "return document.querySelector('[data-testid=\"chat-thread-panel\"]')"
                "?.innerHTML.includes('flag') || false;"
            )
            self.assertTrue(flag_present,
                            "Report/flag button should be visible on the chat page")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  REP-01 TC-REP-01-02 – Cannot submit without a reason              #
    # ------------------------------------------------------------------ #
    def test_rep01_tc02_submit_disabled_without_reason(self):
        """Negative: Submit Report button is disabled when no reason is selected."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/user/{OTHER_USER_ID}")
            time.sleep(3)
            open_report_modal(driver)
            submit_btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='report-submit-btn']")
                )
            )
            disabled = driver.execute_script(
                "var el = arguments[0]; return el.disabled || el.getAttribute('aria-disabled') === 'true';",
                submit_btn
            )
            self.assertTrue(disabled,
                            "Submit Report button should be disabled when no reason is selected")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  REP-01 TC-REP-01-03 – Can submit without uploading a file         #
    # ------------------------------------------------------------------ #
    def test_rep01_tc03_submit_without_file(self):
        """Edge: User can submit a report without uploading a file."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/user/{OTHER_USER_ID}")
            time.sleep(3)
            open_report_modal(driver)
            first_reason = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid^='report-reason-']")
                )
            )
            driver.execute_script("""
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """, first_reason)
            time.sleep(0.5)
            tid_click(driver, "report-submit-btn")
            time.sleep(2)
            toast = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-sonner-toast]"))
            )
            self.assertIn("report", toast.text.lower(),
                          "Toast should confirm the report was submitted without a file")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
