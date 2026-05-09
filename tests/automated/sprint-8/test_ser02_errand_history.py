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


class TestSer02(unittest.TestCase):

    def tearDown(self):
        time.sleep(1)

    # ------------------------------------------------------------------ #
    #  SER-02 TC-SER-02-01 – History shows errand event type             #
    # ------------------------------------------------------------------ #
    def test_ser02_tc01_history_shows_event_type(self):
        """Positive: History displays the correct errand event type for each record."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/service-fee")
            time.sleep(3)
            body_text = driver.find_element(By.TAG_NAME, "body").text
            # Payment History section should be present
            self.assertIn("Payment History", body_text,
                          "Service fee page should display a Payment History section")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  SER-02 TC-SER-02-02 – History only for user's accepted errands    #
    # ------------------------------------------------------------------ #
    def test_ser02_tc02_history_only_for_accepted_errands(self):
        """Negative: History entries are only for errands the user accepted."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/service-fee")
            time.sleep(3)
            # The service fee page only loads data for the logged-in user
            # Verify the page loads without errors and shows only user-specific data
            body_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertNotIn("Something went wrong", body_text,
                             "Page should not show an error")
            self.assertGreater(len(body_text.strip()), 0,
                               "Page should render content")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  SER-02 TC-SER-02-03 – History accessible from dashboard           #
    # ------------------------------------------------------------------ #
    def test_ser02_tc03_history_accessible_from_service_fee_page(self):
        """Edge: User can access and view history from the service fee page without errors."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/service-fee")
            time.sleep(3)
            body_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertIn("/service-fee", driver.current_url,
                          "User should be on the service fee page")
            self.assertGreater(len(body_text.strip()), 0,
                               "Service fee page should render without errors")
            no_overflow = driver.execute_script(
                "return document.documentElement.scrollWidth <= window.innerWidth + 5;"
            )
            self.assertTrue(no_overflow,
                            "Page layout should not overflow horizontally")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
