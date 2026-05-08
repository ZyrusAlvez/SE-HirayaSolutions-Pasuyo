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

BASE_URL                 = os.getenv("BASE_URL")
TEST_EMAIL               = os.getenv("TEST_EMAIL")
TEST_PASSWORD            = os.getenv("TEST_PASSWORD")
NON_VERIFIED_EMAIL       = os.getenv("NON_VERIFIED_EMAIL")
NON_VERIFIED_PASSWORD    = os.getenv("NON_VERIFIED_PASSWORD")
VERIFIED_EMAIL           = os.getenv("VERIFIED_EMAIL")
VERIFIED_PASSWORD        = os.getenv("VERIFIED_PASSWORD")
LIMIT_REACHED_EMAIL      = os.getenv("LIMIT_REACHED_EMAIL")
LIMIT_REACHED_PASSWORD   = os.getenv("LIMIT_REACHED_PASSWORD")
KNOWN_ERRAND_ID          = os.getenv("KNOWN_ERRAND_ID")

WAIT = 20


def make_driver():
    options = webdriver.ChromeOptions()
    # options.add_argument("--headless=new")
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


def login(driver, email, password):
    driver.get(f"{BASE_URL}/login")
    tid_type(driver, "login-email", email)
    tid_type(driver, "login-password", password)
    tid_click(driver, "login-btn")
    WebDriverWait(driver, WAIT).until(lambda d: "/login" not in d.current_url)


class TestSer03(unittest.TestCase):

    def tearDown(self):
        time.sleep(1)

    # ------------------------------------------------------------------ #
    #  SER-03 TC-SER-03-01 – Correct limits per user type                #
    # ------------------------------------------------------------------ #
    def test_ser03_tc01_non_verified_limit_shown(self):
        """Positive: Non-verified user sees ₱1,000 limit on service fee page."""
        driver = make_driver()
        try:
            login(driver, NON_VERIFIED_EMAIL, NON_VERIFIED_PASSWORD)
            driver.get(f"{BASE_URL}/service-fee")
            time.sleep(8)
            body_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertIn("1,000", body_text,
                          "Non-verified user should see ₱1,000 limit on service fee page")
        finally:
            driver.quit()

    def test_ser03_tc01_verified_limit_shown(self):
        """Positive: Verified user sees ₱5,000 limit on service fee page."""
        driver = make_driver()
        try:
            login(driver, VERIFIED_EMAIL, VERIFIED_PASSWORD)
            driver.get(f"{BASE_URL}/service-fee")
            time.sleep(8)
            body_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertIn("5,000", body_text,
                          "Verified user should see ₱5,000 limit on service fee page")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  SER-03 TC-SER-03-02 – Unpaid fees tracked after completed errands #
    # ------------------------------------------------------------------ #
    def test_ser03_tc02_unpaid_fees_displayed(self):
        """Positive: User's unpaid service fees are displayed on the service fee page."""
        driver = make_driver()
        try:
            login(driver, TEST_EMAIL, TEST_PASSWORD)
            driver.get(f"{BASE_URL}/service-fee")
            time.sleep(3)
            body_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertGreater(len(body_text.strip()), 0,
                               "Service fee page should display unpaid fee information")
            # Page should show a peso amount
            self.assertIn("₱", body_text,
                          "Service fee page should display a peso amount")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  SER-03 TC-SER-03-03 – User blocked when limit reached             #
    # ------------------------------------------------------------------ #
    def test_ser03_tc03_user_blocked_when_limit_reached(self):
        """Negative: User cannot accept new errands when unpaid fee limit is reached."""
        driver = make_driver()
        try:
            login(driver, LIMIT_REACHED_EMAIL, LIMIT_REACHED_PASSWORD)
            driver.get(f"{BASE_URL}/errand/{KNOWN_ERRAND_ID}")
            time.sleep(3)
            accept_btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='accept-errand-btn']")
                )
            )
            driver.execute_script("""
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """, accept_btn)
            time.sleep(2)
            toast = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-sonner-toast]"))
            )
            self.assertTrue(
                "limit" in toast.text.lower() or "fee" in toast.text.lower() or "pay" in toast.text.lower(),
                "Error toast should mention the service fee limit restriction"
            )
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
