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


class TestProf03(unittest.TestCase):

    def tearDown(self):
        time.sleep(1)

    # ------------------------------------------------------------------ #
    #  PROF-03 TC-PROF-03-01 – Profile picture redirects to profile page #
    # ------------------------------------------------------------------ #
    def test_prof03_tc01_profile_redirects_from_chat(self):
        """Positive: Clicking another user's avatar in chat redirects to their profile."""
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
            # Click the avatar/name in the chat thread header
            header_clickable = driver.execute_script("""
                var panel = document.querySelector("[data-testid='chat-thread-panel']");
                if (!panel) return null;
                var img = panel.querySelector('img');
                return img ? img.closest('[role="button"], button') || img.parentElement : null;
            """)
            if header_clickable:
                driver.execute_script("""
                    var el = arguments[0];
                    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                """, header_clickable)
                time.sleep(2)
            self.assertIn(f"/user/{OTHER_USER_ID}", driver.current_url,
                          "Clicking user avatar in chat should redirect to their profile page")
        finally:
            driver.quit()

    def test_prof03_tc01_profile_redirects_from_errand(self):
        """Positive: Clicking the poster's profile from an errand page redirects to their profile."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/errand/{KNOWN_ERRAND_ID}")
            time.sleep(3)
            poster_link = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='poster-card-link']")
                )
            )
            driver.execute_script("""
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """, poster_link)
            time.sleep(2)
            self.assertIn("/user/", driver.current_url,
                          "Clicking poster profile from errand page should redirect to user profile")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  PROF-03 TC-PROF-03-02 – Profile page shows all info even if empty #
    # ------------------------------------------------------------------ #
    def test_prof03_tc02_profile_page_shows_required_info(self):
        """Edge: Profile page displays all required info even if some values are empty or zero."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/user/{OTHER_USER_ID}")
            time.sleep(3)
            body_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertGreater(len(body_text.strip()), 0,
                               "Profile page should render content")
            self.assertNotIn("Something went wrong", body_text,
                             "Profile page should not show an error")
            has_name = OTHER_USER_NAME.lower() in body_text.lower() if OTHER_USER_NAME else True
            self.assertTrue(has_name or "unknown" in body_text.lower(),
                            "Profile page should display the user's name or a fallback")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
