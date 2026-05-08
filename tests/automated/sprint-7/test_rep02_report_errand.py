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
KNOWN_ERRAND_ID = os.getenv("KNOWN_ERRAND_ID")

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


def open_report_errand_modal(driver):
    tid_click(driver, "report-errand-btn")
    time.sleep(1)
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, "[data-testid^='report-reason-']")
        )
    )


class TestRep02(unittest.TestCase):

    def tearDown(self):
        time.sleep(1)

    # ------------------------------------------------------------------ #
    #  REP-02 TC-REP-02-01 – Report button visible on errand page        #
    # ------------------------------------------------------------------ #
    def test_rep02_tc01_report_btn_visible_on_errand_page(self):
        """Positive: Report button is visible on the errand post page."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/errand/{KNOWN_ERRAND_ID}")
            time.sleep(3)
            btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='report-errand-btn']")
                )
            )
            self.assertTrue(btn.is_displayed(),
                            "Report button should be visible on the errand post page")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  REP-02 TC-REP-02-02 – Guest redirected to login on report click   #
    # ------------------------------------------------------------------ #
    # def test_rep02_tc02_guest_redirected_to_login_on_report(self):
    #     """Negative: Unauthenticated users are redirected to login when clicking report."""
    #     driver = make_driver()
    #     try:
    #         driver.get(f"{BASE_URL}/errand/{KNOWN_ERRAND_ID}")
    #         # Wait for errand content to fully load before looking for the button
    #         WebDriverWait(driver, 30).until(
    #             lambda d: d.execute_script(
    #                 "return document.querySelector('[data-testid=\"report-errand-btn\"]') !== null;"
    #             )
    #         )
    #         btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='report-errand-btn']")
    #         driver.execute_script("""
    #             var el = arguments[0];
    #             el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    #         """, btn)
    #         WebDriverWait(driver, 30).until(lambda d: "/login" in d.current_url)
    #         self.assertIn("/login", driver.current_url,
    #                       "Guest should be redirected to /login when clicking report")
    #     finally:
    #         driver.quit()

    # ------------------------------------------------------------------ #
    #  REP-02 TC-REP-02-03 – Can submit errand report with valid reason  #
    # ------------------------------------------------------------------ #
    def test_rep02_tc03_submit_errand_report_with_reason(self):
        """Positive: User can submit an errand report with a valid reason."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/errand/{KNOWN_ERRAND_ID}")
            time.sleep(3)
            open_report_errand_modal(driver)
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
                          "Toast should confirm the errand report was submitted")
        finally:
            driver.quit()

  

if __name__ == "__main__":
    unittest.main(verbosity=2)
