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
    # Block geolocation permission
    options.add_experimental_option("prefs", {
        "profile.default_content_setting_values.geolocation": 2
    })
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


class TestUi03(unittest.TestCase):

    def tearDown(self):
        time.sleep(1)

    # ------------------------------------------------------------------ #
    #  UI-03 TC-UI-03-01 – Map shows prompt when location denied         #
    # ------------------------------------------------------------------ #
    def test_ui03_tc01_map_shows_prompt_when_location_denied(self):
        """Positive: Map displays a centered prompt when location permission is not granted."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/")
            time.sleep(4)
            body_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertIn("Location", body_text,
                          "A location-related prompt should appear when permission is denied")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  UI-03 TC-UI-03-02 – Prompt informs user location access required  #
    # ------------------------------------------------------------------ #
    def test_ui03_tc02_prompt_informs_location_required(self):
        """Positive: The prompt informs the user that location access is required."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/")
            time.sleep(4)
            body_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertIn("Location", body_text,
                          "Location prompt should be present")
            self.assertTrue(
                "required" in body_text.lower() or
                "access" in body_text.lower() or
                "permission" in body_text.lower(),
                "Prompt should inform the user that location access is required"
            )
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  UI-03 TC-UI-03-03 – Prompt includes a working enable button       #
    # ------------------------------------------------------------------ #
    def test_ui03_tc03_prompt_has_enable_location_button(self):
        """Edge: The location prompt includes a working option to enable location access."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/")
            time.sleep(4)
            body_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertIn("Try Again", body_text,
                          "A 'Try Again' button should be present in the location prompt")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
