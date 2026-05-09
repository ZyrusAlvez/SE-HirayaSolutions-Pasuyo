import os
import time
import tempfile
import unittest
import warnings

warnings.filterwarnings("ignore", category=DeprecationWarning)

from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

BASE_URL             = os.getenv("BASE_URL")
ERRAND_TEST_EMAIL    = os.getenv("ERRAND_TEST_EMAIL")
ERRAND_TEST_PASSWORD = os.getenv("ERRAND_TEST_PASSWORD")
EDIT_ERRAND_TITLE    = os.getenv("EDIT_ERRAND_TITLE")
ADMIN_EMAIL          = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD       = os.getenv("ADMIN_PASSWORD")
OTHER_USER_EMAIL     = os.getenv("OTHER_USER_EMAIL")
OTHER_USER_PASSWORD  = os.getenv("OTHER_USER_PASSWORD")

WAIT = 20
CURRENT_ERRAND_TITLE = None  # updated by test_err_02_02_03 and reused by later tests
PERSIST_TITLE = None

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
        var el = wrapper.tagName === 'INPUT' || wrapper.tagName === 'TEXTAREA'
            ? wrapper : (wrapper.querySelector('textarea') || wrapper.querySelector('input'));
        var proto = el.tagName === 'TEXTAREA'
            ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        var setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
        setter.call(el, arguments[1]);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    """, test_id, value)


def get_text(driver, test_id):
    el = WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, f"[data-testid='{test_id}']"))
    )
    return el.text


def wait_for_toast(driver, keyword):
    WebDriverWait(driver, WAIT).until(
        lambda d: any(
            keyword in t.text.lower()
            for t in d.find_elements(By.CSS_SELECTOR, "[data-sonner-toast]")
        )
    )


def login(driver):
    driver.get(f"{BASE_URL}/login")
    tid_type(driver, "login-email", ERRAND_TEST_EMAIL)
    tid_type(driver, "login-password", ERRAND_TEST_PASSWORD)
    tid_click(driver, "login-btn")
    WebDriverWait(driver, WAIT).until(lambda d: "/login" not in d.current_url)


def go_to_own_errand(driver):
    """Login, switch to Remote tab, click the errand matching the current title."""
    global CURRENT_ERRAND_TITLE, PERSIST_TITLE
    title = PERSIST_TITLE or CURRENT_ERRAND_TITLE or EDIT_ERRAND_TITLE
    login(driver)
    driver.get(f"{BASE_URL}/")
    tid_click(driver, "tab-remote")
    time.sleep(2)
    row = WebDriverWait(driver, WAIT).until(
        lambda d: next(
            (el for el in d.find_elements(By.XPATH, "//*[@data-testid]")
             if title in el.text and "errand-row" in (el.get_attribute("data-testid") or "")),
            None
        )
    )
    driver.execute_script("""
        var el = arguments[0];
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    """, row)
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='edit-errand-btn']"))
    )
    time.sleep(1)


def open_edit_sheet(driver):
    go_to_own_errand(driver)
    tid_click(driver, "edit-errand-btn")
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='edit-errand-title']"))
    )
    time.sleep(1)


class TestEditErrand(unittest.TestCase):

    def tearDown(self):
        time.sleep(2)

    # ------------------------------------------------------------------ #
    #  TC-ERR-02-01 – Edit option visible only for owner                 #
    # ------------------------------------------------------------------ #
    def test_err_02_01_01_edit_btn_visible_for_owner(self):
        """Positive: Edit button is visible on the errand detail page for the owner."""
        driver = make_driver()
        try:
            go_to_own_errand(driver)
            visible = driver.execute_script("""
                var el = document.querySelector("[data-testid='edit-errand-btn']");
                if (!el) return false;
                var r = el.getBoundingClientRect();
                return r.width > 0 && r.height > 0;
            """)
            self.assertTrue(visible, "Edit button should be visible for the errand owner")
        finally:
            driver.quit()

    def test_err_02_01_02_edit_btn_not_visible_for_non_owner(self):
        """Negative: Edit button is not visible when logged in as a different user."""
        driver = make_driver()
        try:
            # Login as another regular user (not the errand owner)
            driver.get(f"{BASE_URL}/login")
            tid_type(driver, "login-email", OTHER_USER_EMAIL)
            tid_type(driver, "login-password", OTHER_USER_PASSWORD)
            tid_click(driver, "login-btn")
            WebDriverWait(driver, WAIT).until(lambda d: "/login" not in d.current_url)
            # Navigate to remote tab and find the errand
            driver.get(f"{BASE_URL}/")
            tid_click(driver, "tab-remote")
            time.sleep(2)
            row = WebDriverWait(driver, WAIT).until(
                lambda d: next(
                    (el for el in d.find_elements(By.XPATH, "//*[@data-testid]")
                     if EDIT_ERRAND_TITLE in el.text and "errand-row" in (el.get_attribute("data-testid") or "")),
                    None
                )
            )
            driver.execute_script("""
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """, row)
            time.sleep(3)
            btns = driver.find_elements(By.CSS_SELECTOR, "[data-testid='edit-errand-btn']")
            self.assertEqual(len(btns), 0, "Edit button should not appear for non-owners")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ERR-02-02 – User can modify errand details                     #
    # ------------------------------------------------------------------ #
    def test_err_02_02_03_can_edit_title(self):
        """Positive: Owner can update the errand title."""
        global CURRENT_ERRAND_TITLE
        driver = make_driver()
        new_title = f"Edited Title {int(time.time())}"
        try:
            open_edit_sheet(driver)
            tid_type(driver, "edit-errand-title", new_title)
            tid_click(driver, "edit-errand-save")
            wait_for_toast(driver, "updated")
            time.sleep(1)
            self.assertEqual(get_text(driver, "detail-title"), new_title,
                             "Title should reflect the updated value")
            CURRENT_ERRAND_TITLE = new_title
        finally:
            driver.quit()

    def test_err_02_02_01_can_edit_description(self):
        """Positive: Owner can update the errand description."""
        driver = make_driver()
        new_desc = f"Updated description {int(time.time())}"
        try:
            open_edit_sheet(driver)
            tid_type(driver, "edit-errand-description", new_desc)
            tid_click(driver, "edit-errand-save")
            wait_for_toast(driver, "updated")
            time.sleep(1)
            self.assertEqual(get_text(driver, "detail-description"), new_desc,
                             "Description should reflect the updated value")
        finally:
            driver.quit()

    def test_err_02_02_02_can_edit_budget(self):
        """Positive: Owner can update the budget."""
        driver = make_driver()
        try:
            open_edit_sheet(driver)
            tid_type(driver, "post-errand-budget", "999")
            tid_click(driver, "edit-errand-save")
            wait_for_toast(driver, "updated")
            self.assertIn("999", driver.page_source,
                          "Updated budget should appear on the detail page")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ERR-02-03 – System validates updates                           #
    # ------------------------------------------------------------------ #
    def test_err_02_03_01_empty_title_shows_error(self):
        """Negative: Saving with an empty title shows a validation error."""
        driver = make_driver()
        try:
            open_edit_sheet(driver)
            tid_type(driver, "edit-errand-title", "")
            tid_click(driver, "edit-errand-save")
            time.sleep(1)
            WebDriverWait(driver, WAIT).until(
                lambda d: len(d.find_elements(
                    By.CSS_SELECTOR, "[data-sonner-toast][data-type='error']"
                )) > 0
            )
            toasts = driver.find_elements(By.CSS_SELECTOR, "[data-sonner-toast][data-type='error']")
            self.assertTrue(len(" ".join(t.text for t in toasts)) > 0,
                            "Error toast should appear for empty title")
        finally:
            driver.quit()

    def test_err_02_03_02_empty_description_shows_error(self):
        """Negative: Saving with an empty description shows a validation error."""
        driver = make_driver()
        try:
            open_edit_sheet(driver)
            tid_type(driver, "edit-errand-description", "")
            tid_click(driver, "edit-errand-save")
            WebDriverWait(driver, WAIT).until(
                lambda d: len(d.find_elements(
                    By.CSS_SELECTOR, "[data-sonner-toast][data-type='error']"
                )) > 0
            )
            toasts = driver.find_elements(By.CSS_SELECTOR, "[data-sonner-toast][data-type='error']")
            self.assertTrue(len(" ".join(t.text for t in toasts)) > 0,
                            "Error toast should appear for empty description")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ERR-02-04 – Changes are saved to the database                  #
    # ------------------------------------------------------------------ #
    def test_err_02_04_01_changes_persist_after_reload(self):
        """Positive: Updated title persists after page reload."""
        global PERSIST_TITLE
        driver = make_driver()
        new_title = f"Persist Test {int(time.time())}"
        try:
            open_edit_sheet(driver)
            tid_type(driver, "edit-errand-title", new_title)
            tid_click(driver, "edit-errand-save")
            wait_for_toast(driver, "updated")
            driver.refresh()
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='detail-title']"))
            )
            time.sleep(2)
            PERSIST_TITLE = new_title
            self.assertEqual(get_text(driver, "detail-title"), new_title,
                             "Updated title should persist after reload")
        finally:
            driver.quit()

    def test_err_02_04_02_changes_visible_in_admin_panel(self):
        """Positive: Updated errand title appears in admin errand list."""
        global PERSIST_TITLE
        driver = make_driver()
        admin_driver = make_driver()
        new_title = f"Admin Verify {int(time.time())}"
        try:
            open_edit_sheet(driver)
            tid_type(driver, "edit-errand-title", new_title)
            tid_click(driver, "edit-errand-save")
            wait_for_toast(driver, "updated")
            admin_driver.get(f"{BASE_URL}/login")
            tid_type(admin_driver, "login-email", ADMIN_EMAIL)
            tid_type(admin_driver, "login-password", ADMIN_PASSWORD)
            tid_click(admin_driver, "login-btn")
            WebDriverWait(admin_driver, WAIT).until(lambda d: "/admin" in d.current_url)
            time.sleep(2)
            admin_driver.get(f"{BASE_URL}/admin/errands")
            WebDriverWait(admin_driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='admin-errand-search']"))
            )
            tid_type(admin_driver, "admin-errand-search", new_title)
            time.sleep(2)
            PERSIST_TITLE = new_title
            self.assertIn(new_title, admin_driver.page_source,
                          "Updated errand title should appear in admin errand list")
        finally:
            driver.quit()
            admin_driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ERR-02-05 – Updated errand displayed correctly                 #
    # ------------------------------------------------------------------ #
    def test_err_02_05_01_updated_title_shown_in_detail(self):
        """Positive: Updated title is immediately shown on the detail page after save."""
        global PERSIST_TITLE
        driver = make_driver()
        new_title = f"Detail View Test {int(time.time())}"
        try:
            open_edit_sheet(driver)
            tid_type(driver, "edit-errand-title", new_title)
            tid_click(driver, "edit-errand-save")
            wait_for_toast(driver, "updated")
            time.sleep(1)
            PERSIST_TITLE = new_title
            self.assertEqual(get_text(driver, "detail-title"), new_title,
                             "Detail page should immediately show the updated title")
        finally:
            driver.quit()

    def test_err_02_05_02_cancel_discards_changes(self):
        """Negative: Cancelling edit does not change the displayed title."""
        driver = make_driver()
        try:
            go_to_own_errand(driver)
            original_title = get_text(driver, "detail-title")
            tid_click(driver, "edit-errand-btn")
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='edit-errand-title']"))
            )
            tid_type(driver, "edit-errand-title", "Should Not Save")
            # Click Edit button again — it toggles back to cancel
            tid_click(driver, "edit-errand-btn")
            time.sleep(1)
            self.assertEqual(get_text(driver, "detail-title"), original_title,
                             "Cancelling edit should not change the displayed title")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
