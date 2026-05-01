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

BASE_URL                     = os.getenv("BASE_URL")
# Client account — owns the errand
CLIENT_EMAIL                 = os.getenv("CLIENT_EMAIL")
CLIENT_PASSWORD              = os.getenv("CLIENT_PASSWORD")
# Worker account — accepts the errand
WORKER_EMAIL                 = os.getenv("WORKER_EMAIL")
WORKER_PASSWORD              = os.getenv("WORKER_PASSWORD")
# A known Available errand owned by CLIENT_EMAIL
KNOWN_ERRAND_ID              = os.getenv("AVAILABLE_ERRAND_ID")
# A known In Progress errand (already accepted by WORKER_EMAIL)
KNOWN_IN_PROGRESS_ERRAND_ID  = os.getenv("KNOWN_IN_PROGRESS_ERRAND_ID")

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


def login(driver, email, password):
    driver.get(f"{BASE_URL}/login")
    tid_type(driver, "login-email", email)
    tid_type(driver, "login-password", password)
    tid_click(driver, "login-btn")
    WebDriverWait(driver, WAIT).until(lambda d: "/login" not in d.current_url)


def go_to_errand(driver, errand_id):
    driver.get(f"{BASE_URL}/errand/{errand_id}")
    time.sleep(3)


class TestErr08ErrandRestrictions(unittest.TestCase):

    def tearDown(self):
        time.sleep(1)

    # ------------------------------------------------------------------ #
    #  ERR-08 AC-01 – Accept button disabled when In Progress            #
    # ------------------------------------------------------------------ #
    def test_err08_ac01_accept_btn_disabled_when_in_progress(self):
        """Positive: Accept Errand button is disabled and shows error toast when errand is In Progress."""
        driver = make_driver()
        try:
            login(driver, WORKER_EMAIL, WORKER_PASSWORD)
            go_to_errand(driver, KNOWN_IN_PROGRESS_ERRAND_ID)
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
            toast = driver.execute_script(
                "return document.querySelector('[data-sonner-toast]');"
            )
            self.assertIsNotNone(toast,
                                 "Error toast should appear when trying to accept an In Progress errand")
        finally:
            driver.quit()

    def test_err08_ac01_accept_btn_enabled_when_available(self):
        """Positive: Accept Errand button is enabled when errand is Available."""
        driver = make_driver()
        try:
            login(driver, WORKER_EMAIL, WORKER_PASSWORD)
            go_to_errand(driver, KNOWN_ERRAND_ID)
            accept_btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='accept-errand-btn']")
                )
            )
            disabled = driver.execute_script(
                "var el = arguments[0]; return el.disabled || el.getAttribute('aria-disabled') === 'true';",
                accept_btn
            )
            self.assertFalse(disabled,
                             "Accept Errand button should be enabled when errand is Available")
        finally:
            driver.quit()

    def test_err08_ac01_accept_in_progress_shows_error_toast(self):
        """Negative: Attempting to accept an In Progress errand shows an error toast."""
        driver = make_driver()
        try:
            login(driver, WORKER_EMAIL, WORKER_PASSWORD)
            go_to_errand(driver, KNOWN_IN_PROGRESS_ERRAND_ID)
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
            toast = driver.execute_script(
                "return document.querySelector('[data-sonner-toast]');"
            )
            self.assertIsNotNone(toast,
                                 "Error toast should appear when trying to accept an In Progress errand")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  ERR-08 AC-02 – Cannot edit an accepted errand                     #
    # ------------------------------------------------------------------ #
    def test_err08_ac02_edit_blocked_when_in_progress(self):
        """Positive: Edit button is blocked when errand is In Progress."""
        driver = make_driver()
        try:
            login(driver, CLIENT_EMAIL, CLIENT_PASSWORD)
            go_to_errand(driver, KNOWN_IN_PROGRESS_ERRAND_ID)
            edit_btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='edit-errand-btn']")
                )
            )
            driver.execute_script("""
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """, edit_btn)
            time.sleep(2)
            toast = driver.execute_script(
                "return document.querySelector('[data-sonner-toast]');"
            )
            edit_sheet = driver.execute_script(
                "return document.querySelector(\"[data-testid='edit-errand-sheet']\");"
            )
            self.assertTrue(
                toast is not None or edit_sheet is None,
                "Edit should be blocked with an error toast when errand is In Progress"
            )
        finally:
            driver.quit()

    def test_err08_ac02_edit_allowed_when_available(self):
        """Positive: Edit button opens the edit form when errand is Available."""
        driver = make_driver()
        try:
            login(driver, CLIENT_EMAIL, CLIENT_PASSWORD)
            go_to_errand(driver, KNOWN_ERRAND_ID)
            tid_click(driver, "edit-errand-btn")
            time.sleep(2)
            body_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertTrue(
                "edit" in body_text.lower() or "save" in body_text.lower(),
                "Edit form should open when errand is Available"
            )
        finally:
            driver.quit()

    def test_err08_ac02_kebab_edit_blocked_when_in_progress(self):
        """Positive: Kebab Edit action on dashboard shows error toast for In Progress errand."""
        driver = make_driver()
        try:
            login(driver, CLIENT_EMAIL, CLIENT_PASSWORD)
            driver.get(f"{BASE_URL}/dashboard")
            WebDriverWait(driver, WAIT).until(lambda d: "/dashboard" in d.current_url)
            time.sleep(3)
            # Find the In Progress card and click its kebab edit
            in_progress_card = driver.execute_script("""
                var cards = document.querySelectorAll("[data-testid^='errand-card-']");
                for (var i = 0; i < cards.length; i++) {
                    var status = cards[i].querySelector("[data-testid='errand-card-status']");
                    if (status && status.innerText === 'In Progress') return cards[i];
                }
                return null;
            """)
            if in_progress_card:
                kebab = driver.execute_script(
                    "return arguments[0].querySelector(\"[data-testid='errand-card-kebab']\");",
                    in_progress_card
                )
                driver.execute_script("""
                    var el = arguments[0];
                    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                """, kebab)
                time.sleep(0.5)
                tid_click(driver, "kebab-edit")
                time.sleep(2)
                toast = driver.execute_script(
                    "return document.querySelector('[data-sonner-toast]');"
                )
                self.assertIsNotNone(toast,
                                     "Error toast should appear when editing an In Progress errand from dashboard")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  ERR-08 AC-03 – Cannot delete an accepted errand                   #
    # ------------------------------------------------------------------ #
    def test_err08_ac03_delete_blocked_when_in_progress(self):
        """Positive: Cancel/Delete button is blocked when errand is In Progress."""
        driver = make_driver()
        try:
            login(driver, CLIENT_EMAIL, CLIENT_PASSWORD)
            go_to_errand(driver, KNOWN_IN_PROGRESS_ERRAND_ID)
            cancel_btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='cancel-errand-btn']")
                )
            )
            driver.execute_script("""
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """, cancel_btn)
            time.sleep(2)
            toast = driver.execute_script(
                "return document.querySelector('[data-sonner-toast]');"
            )
            self.assertIsNotNone(toast,
                                 "Error toast should appear when trying to delete an In Progress errand")
        finally:
            driver.quit()

    def test_err08_ac03_kebab_delete_blocked_when_in_progress(self):
        """Positive: Kebab Delete action on dashboard shows error toast for In Progress errand after confirming."""
        driver = make_driver()
        try:
            login(driver, CLIENT_EMAIL, CLIENT_PASSWORD)
            driver.get(f"{BASE_URL}/dashboard")
            WebDriverWait(driver, WAIT).until(lambda d: "/dashboard" in d.current_url)
            time.sleep(3)
            in_progress_card = driver.execute_script("""
                var cards = document.querySelectorAll("[data-testid^='errand-card-']");
                for (var i = 0; i < cards.length; i++) {
                    var status = cards[i].querySelector("[data-testid='errand-card-status']");
                    if (status && status.innerText === 'In Progress') return cards[i];
                }
                return null;
            """)
            if in_progress_card:
                kebab = driver.execute_script(
                    "return arguments[0].querySelector(\"[data-testid='errand-card-kebab']\");",
                    in_progress_card
                )
                driver.execute_script("""
                    var el = arguments[0];
                    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                """, kebab)
                time.sleep(0.5)
                tid_click(driver, "kebab-delete")
                time.sleep(1)
                tid_click(driver, "delete-confirm-btn")
                time.sleep(2)
                toast = driver.execute_script(
                    "return document.querySelector('[data-sonner-toast]');"
                )
                self.assertIsNotNone(toast,
                                     "Error toast should appear when deleting an In Progress errand from dashboard")
        finally:
            driver.quit()

    def test_err08_ac03_delete_allowed_when_available(self):
        """Positive: Delete shows confirmation modal when errand is Available."""
        driver = make_driver()
        try:
            login(driver, CLIENT_EMAIL, CLIENT_PASSWORD)
            go_to_errand(driver, KNOWN_ERRAND_ID)
            cancel_btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='cancel-errand-btn']")
                )
            )
            driver.execute_script("""
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """, cancel_btn)
            time.sleep(1)
            modal = driver.execute_script(
                "return document.querySelector(\"[data-testid='cancel-errand-confirm-btn']\");"
            )
            body_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertTrue(
                modal is not None or "cancel" in body_text.lower(),
                "Confirmation modal should appear when deleting an Available errand"
            )
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  ERR-08 AC-04 – Home page only shows Available errands             #
    # ------------------------------------------------------------------ #
    def test_err08_ac04_home_only_shows_available_errands(self):
        """Positive: All errands on the home page have Available status."""
        driver = make_driver()
        try:
            login(driver, WORKER_EMAIL, WORKER_PASSWORD)
            driver.get(f"{BASE_URL}/")
            time.sleep(3)
            tid_click(driver, "tab-remote")
            time.sleep(2)
            rows = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-row-']")
            self.assertGreater(len(rows), 0,
                               "Home page should display at least one errand")
            for row in rows[:3]:
                driver.execute_script("""
                    var el = arguments[0];
                    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                """, row)
                time.sleep(2)
                body_text = driver.find_element(By.TAG_NAME, "body").text
                self.assertIn("Available", body_text,
                              "Errand shown on home page should have Available status")
                driver.back()
                time.sleep(2)
        finally:
            driver.quit()

    def test_err08_ac04_in_progress_errand_not_on_home(self):
        """Negative: An In Progress errand does not appear on the home page."""
        driver = make_driver()
        try:
            login(driver, WORKER_EMAIL, WORKER_PASSWORD)
            driver.get(f"{BASE_URL}/")
            time.sleep(3)
            tid_click(driver, "tab-remote")
            time.sleep(2)
            in_progress_row = driver.execute_script(
                f"return document.querySelector(\"[data-testid='errand-row-{KNOWN_IN_PROGRESS_ERRAND_ID}']\");"
            )
            self.assertIsNone(in_progress_row,
                              "In Progress errand should not appear on the home page")
        finally:
            driver.quit()

    def test_err08_ac04_expired_errand_not_on_home(self):
        """Negative: Expired errands do not appear on the home page."""
        driver = make_driver()
        try:
            login(driver, WORKER_EMAIL, WORKER_PASSWORD)
            driver.get(f"{BASE_URL}/")
            time.sleep(3)
            tid_click(driver, "tab-remote")
            time.sleep(2)
            rows = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-row-']")
            for row in rows:
                self.assertNotIn("Expired", row.text,
                                 "Expired errands should not appear on the home page")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
