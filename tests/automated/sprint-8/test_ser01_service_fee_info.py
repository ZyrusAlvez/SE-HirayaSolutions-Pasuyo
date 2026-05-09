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


class TestSer01(unittest.TestCase):

    def tearDown(self):
        time.sleep(1)

    # ------------------------------------------------------------------ #
    #  SER-01 TC-SER-01-01 – Service Fee nav item visible and redirects  #
    # ------------------------------------------------------------------ #
    def test_ser01_tc01_service_fee_nav_visible(self):
        """Positive: Service Fee item is visible in the navigation bar."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/")
            time.sleep(3)
            btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='nav-service-fee']")
                )
            )
            self.assertTrue(btn.is_displayed(),
                            "Service Fee item should be visible in the navigation bar")
        finally:
            driver.quit()

    def test_ser01_tc01_service_fee_nav_redirects(self):
        """Positive: Clicking Service Fee in the navbar redirects to the Service Fee page."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/")
            time.sleep(3)
            tid_click(driver, "nav-service-fee")
            WebDriverWait(driver, WAIT).until(lambda d: "/service-fee" in d.current_url)
            self.assertIn("/service-fee", driver.current_url,
                          "Clicking Service Fee nav should redirect to /service-fee")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  SER-01 TC-SER-01-02 – Service Fee page displays complete info     #
    # ------------------------------------------------------------------ #
    def test_ser01_tc02_service_fee_page_displays_complete_info(self):
        """Positive: Service Fee page displays fee explanation, limits, restrictions, and payment method."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/service-fee/about")
            time.sleep(3)
            body_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertIn("10%", body_text,
                          "Page should display the 10% service fee explanation")
            self.assertIn("1,000", body_text,
                          "Page should display the ₱1,000 non-verified limit")
            self.assertIn("5,000", body_text,
                          "Page should display the ₱5,000 verified limit")
            self.assertIn("GCash", body_text,
                          "Page should display GCash payment instructions")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  SER-01 TC-SER-01-03 – Placeholder payment details handled safely  #
    # ------------------------------------------------------------------ #
    def test_ser01_tc03_placeholder_payment_details_handled(self):
        """Edge: Page displays payment details safely without breaking layout."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/service-fee/about")
            time.sleep(3)
            body_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertGreater(len(body_text.strip()), 0,
                               "Page should render content without crashing")
            self.assertNotIn("undefined", body_text.lower(),
                             "Page should not display 'undefined' for payment details")
            self.assertNotIn("null", body_text.lower(),
                             "Page should not display 'null' for payment details")
            no_overflow = driver.execute_script(
                "return document.documentElement.scrollWidth <= window.innerWidth + 5;"
            )
            self.assertTrue(no_overflow,
                            "Page layout should not overflow horizontally")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
