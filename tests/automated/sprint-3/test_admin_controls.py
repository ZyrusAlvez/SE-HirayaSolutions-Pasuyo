import os
import time
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
ADMIN_EMAIL          = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD       = os.getenv("ADMIN_PASSWORD")
KNOWN_USER_EMAIL     = os.getenv("KNOWN_USER_EMAIL")
SUSPEND_TEST_EMAIL   = os.getenv("SUSPEND_TEST_EMAIL")
SUSPEND_TEST_PASSWORD = os.getenv("SUSPEND_TEST_PASSWORD")

WAIT = 20


def make_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
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


def tid(driver, test_id):
    return WebDriverWait(driver, WAIT).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, f"[data-testid='{test_id}']"))
    )


def tid_click(driver, test_id):
    el = WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, f"[data-testid='{test_id}']"))
    )
    driver.execute_script("arguments[0].click();", el)


def tid_type(driver, test_id, value):
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, f"[data-testid='{test_id}']"))
    )
    driver.execute_script("""
        var wrapper = document.querySelector("[data-testid='" + arguments[0] + "']");
        var el = wrapper.tagName === 'INPUT' ? wrapper : wrapper.querySelector('input');
        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, arguments[1]);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    """, test_id, value)


def login(driver, email, password):
    driver.get(f"{BASE_URL}/login")
    tid_type(driver, "login-email", email)
    tid_type(driver, "login-password", password)
    tid_click(driver, "login-btn")
    WebDriverWait(driver, WAIT).until(lambda d: "/login" not in d.current_url)


def login_as_admin(driver):
    login(driver, ADMIN_EMAIL, ADMIN_PASSWORD)
    WebDriverWait(driver, WAIT).until(EC.url_contains("/admin"))


def navigate_to_user(driver, email):
    """Go to admin accounts, search for user by email, and open their detail page."""
    driver.get(f"{BASE_URL}/admin/accounts")
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='admin-search-input']"))
    )
    tid_type(driver, "admin-search-input", email)
    # Wait up to 10 seconds for search results to load
    WebDriverWait(driver, 10).until(
        lambda d: len(d.find_elements(By.CSS_SELECTOR, "[data-testid^='user-email-']")) > 0
    )
    # Find user card by email testID
    email_els = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='user-email-']")
    for el in email_els:
        if email.lower() in el.text.lower():
            user_id = el.get_attribute("data-testid").replace("user-email-", "")
            tid_click(driver, f"user-card-{user_id}")
            WebDriverWait(driver, WAIT).until(EC.url_contains("/admin/user/"))
            return
    raise RuntimeError(f"No user card found for {email}")


class TestAdminControls(unittest.TestCase):

    def tearDown(self):
        time.sleep(3)

    # ------------------------------------------------------------------ #
    #  TC-ADMIN-04-01 – Admin can suspend a user account                 #
    # ------------------------------------------------------------------ #
    def test_ac_01_suspend_button_visible_on_active_user(self):
        """Positive: Suspend Account button is visible for an active user."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            navigate_to_user(driver, SUSPEND_TEST_EMAIL)
            btn = tid(driver, "user-suspend-restore-btn")
            self.assertIn("Suspend", btn.text,
                          "Button should say 'Suspend Account' for an active user")
        finally:
            driver.quit()

    def test_ac_02_admin_can_suspend_user(self):
        """Positive: Admin can suspend a user and status changes to Suspended."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            navigate_to_user(driver, SUSPEND_TEST_EMAIL)
            tid_click(driver, "user-suspend-restore-btn")

            # Confirm modal
            tid(driver, "user-action-confirm-btn")
            tid_click(driver, "user-action-confirm-btn")
            time.sleep(2)

            # Status badge should now show Suspended
            status = tid(driver, "user-status-badge")
            self.assertIn("Suspended", status.text,
                          "User status should show Suspended after suspension")
        finally:
            driver.quit()

    def test_ac_03_suspended_user_cannot_login(self):
        """Negative: Suspended user is redirected to suspended page on login."""
        driver = make_driver()
        try:
            login(driver, SUSPEND_TEST_EMAIL, SUSPEND_TEST_PASSWORD)
            WebDriverWait(driver, WAIT).until(
                lambda d: "/suspended" in d.current_url or "/login" in d.current_url
            )
            self.assertIn("/suspended", driver.current_url,
                          "Suspended user should be redirected to /suspended")
        finally:
            driver.quit()

    def test_ac_04_cancel_suspend_keeps_active_status(self):
        """Negative: Cancelling the suspend modal keeps the user active."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            navigate_to_user(driver, KNOWN_USER_EMAIL)
            tid_click(driver, "user-suspend-restore-btn")

            # Click Cancel
            cancel_btn = WebDriverWait(driver, WAIT).until(
                EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), 'Cancel')]"))
            )
            driver.execute_script("arguments[0].click();", cancel_btn)
            time.sleep(1)

            status = tid(driver, "user-status-badge")
            self.assertIn("Active", status.text,
                          "User should remain Active after cancelling suspend")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ADMIN-04-02 – Admin can restore a suspended account            #
    # ------------------------------------------------------------------ #
    def test_ac_05_restore_button_visible_on_suspended_user(self):
        """Positive: Restore Account button is visible for a suspended user."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            navigate_to_user(driver, SUSPEND_TEST_EMAIL)
            btn = tid(driver, "user-suspend-restore-btn")
            self.assertIn("Restore", btn.text,
                          "Button should say 'Restore Account' for a suspended user")
        finally:
            driver.quit()

    def test_ac_06_admin_can_restore_user(self):
        """Positive: Admin can restore a suspended user and status changes to Active."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            navigate_to_user(driver, SUSPEND_TEST_EMAIL)
            tid_click(driver, "user-suspend-restore-btn")

            tid(driver, "user-action-confirm-btn")
            tid_click(driver, "user-action-confirm-btn")
            time.sleep(2)

            status = tid(driver, "user-status-badge")
            self.assertIn("Active", status.text,
                          "User status should show Active after restoration")
        finally:
            driver.quit()

    def test_ac_07_restored_user_can_login(self):
        """Positive: Restored user can log in successfully."""
        driver = make_driver()
        try:
            login(driver, SUSPEND_TEST_EMAIL, SUSPEND_TEST_PASSWORD)
            WebDriverWait(driver, WAIT).until(
                lambda d: "/login" not in d.current_url
            )
            self.assertNotIn("/suspended", driver.current_url,
                             "Restored user should not be redirected to /suspended")
            self.assertNotIn("/login", driver.current_url,
                             "Restored user should be able to log in")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ADMIN-04-03 – Admin can view action logs                       #
    # ------------------------------------------------------------------ #
    def test_ac_08_logs_page_is_accessible(self):
        """Positive: Admin can navigate to the logs page."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            driver.get(f"{BASE_URL}/admin/logs")
            WebDriverWait(driver, WAIT).until(
                lambda d: "Action Logs" in d.page_source
            )
            self.assertIn("Action Logs", driver.page_source,
                          "Logs page should be accessible to admin")
        finally:
            driver.quit()

    def test_ac_09_logs_contain_suspend_action(self):
        """Positive: Logs contain a SUSPENDED_USER entry after suspension."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            driver.get(f"{BASE_URL}/admin/logs")
            WebDriverWait(driver, WAIT).until(
                lambda d: len(d.find_elements(
                    By.CSS_SELECTOR, "[data-testid^='log-entry-']"
                )) > 0
            )
            entries = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='log-entry-']")
            self.assertGreater(len(entries), 0, "Logs should contain at least one entry")
        finally:
            driver.quit()

    def test_ac_10_logs_contain_restore_action(self):
        """Positive: Logs contain a RESTORED_USER entry after restoration."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            driver.get(f"{BASE_URL}/admin/logs")
            WebDriverWait(driver, WAIT).until(
                lambda d: len(d.find_elements(
                    By.CSS_SELECTOR, "[data-testid='log-entry-RESTORED_USER']"
                )) > 0
            )
            entries = driver.find_elements(
                By.CSS_SELECTOR, "[data-testid='log-entry-RESTORED_USER']"
            )
            self.assertGreater(len(entries), 0,
                               "Logs should contain a RESTORED_USER entry")
        finally:
            driver.quit()

    def test_ac_11_non_admin_cannot_access_logs(self):
        """Negative: Non-admin user cannot access the logs page."""
        driver = make_driver()
        try:
            driver.get(f"{BASE_URL}/admin/logs")
            WebDriverWait(driver, WAIT).until(
                lambda d: "/admin" not in d.current_url or "/login" in d.current_url
            )
            self.assertNotIn("/admin/logs", driver.current_url,
                             "Non-admin should not access logs page")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ADMIN-04-04 – Admin can view analytics/reports                 #
    # ------------------------------------------------------------------ #
    def test_ac_12_analytics_page_is_accessible(self):
        """Positive: Admin can navigate to the analytics page."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            driver.get(f"{BASE_URL}/admin/analytics")
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='analytics-line-chart']")
                )
            )
            self.assertTrue(
                len(driver.find_elements(
                    By.CSS_SELECTOR, "[data-testid='analytics-line-chart']"
                )) > 0,
                "Line chart should be visible on analytics page"
            )
        finally:
            driver.quit()

    def test_ac_13_analytics_shows_pie_chart(self):
        """Positive: Analytics page shows errand status breakdown pie chart."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            driver.get(f"{BASE_URL}/admin/analytics")
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='analytics-pie-chart']")
                )
            )
            self.assertTrue(
                len(driver.find_elements(
                    By.CSS_SELECTOR, "[data-testid='analytics-pie-chart']"
                )) > 0,
                "Pie chart should be visible on analytics page"
            )
        finally:
            driver.quit()

    def test_ac_14_non_admin_cannot_access_analytics(self):
        """Negative: Non-admin user cannot access the analytics page."""
        driver = make_driver()
        try:
            driver.get(f"{BASE_URL}/admin/analytics")
            WebDriverWait(driver, WAIT).until(
                lambda d: "/admin" not in d.current_url or "/login" in d.current_url
            )
            self.assertNotIn("/admin/analytics", driver.current_url,
                             "Non-admin should not access analytics page")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ADMIN-04-05 – All admin actions are logged                     #
    # ------------------------------------------------------------------ #
    def test_ac_15_suspend_action_appears_in_logs(self):
        """Positive: Suspending a user creates a SUSPENDED_USER log entry."""
        admin_driver = make_driver()
        try:
            login_as_admin(admin_driver)

            # Suspend the user
            navigate_to_user(admin_driver, SUSPEND_TEST_EMAIL)
            tid_click(admin_driver, "user-suspend-restore-btn")
            tid(admin_driver, "user-action-confirm-btn")
            tid_click(admin_driver, "user-action-confirm-btn")
            time.sleep(2)

            # Check logs
            admin_driver.get(f"{BASE_URL}/admin/logs")
            WebDriverWait(admin_driver, WAIT).until(
                lambda d: len(d.find_elements(
                    By.CSS_SELECTOR, "[data-testid='log-entry-SUSPENDED_USER']"
                )) > 0
            )
            entries = admin_driver.find_elements(
                By.CSS_SELECTOR, "[data-testid='log-entry-SUSPENDED_USER']"
            )
            self.assertGreater(len(entries), 0,
                               "SUSPENDED_USER log entry should appear after suspension")
        finally:
            admin_driver.quit()

    def test_ac_16_verification_action_appears_in_logs(self):
        """Positive: Verification actions (approve/reject) appear in logs."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            driver.get(f"{BASE_URL}/admin/logs")
            time.sleep(10)
            WebDriverWait(driver, WAIT).until(
                lambda d: len(d.find_elements(
                    By.CSS_SELECTOR, "[data-testid^='log-entry-']"
                )) > 0
            )
            all_entries = driver.find_elements(
                By.CSS_SELECTOR, "[data-testid^='log-entry-']"
            )
            actions = [
                e.get_attribute("data-testid").replace("log-entry-", "")
                for e in all_entries
            ]
            has_verification_log = any(
                a in ["APPROVED_VERIFICATION", "REJECTED_VERIFICATION"]
                for a in actions
            )
            self.assertTrue(has_verification_log,
                            "Logs should contain verification action entries")
        finally:
            driver.quit()

    def test_ac_17_restore_suspended_user_after_tests(self):
        """Cleanup: Restore the suspended test user so subsequent runs work."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            navigate_to_user(driver, SUSPEND_TEST_EMAIL)
            btn = tid(driver, "user-suspend-restore-btn")
            if "Restore" in btn.text:
                tid_click(driver, "user-suspend-restore-btn")
                tid(driver, "user-action-confirm-btn")
                tid_click(driver, "user-action-confirm-btn")
                time.sleep(2)
                status = tid(driver, "user-status-badge")
                self.assertIn("Active", status.text,
                              "User should be Active after cleanup restore")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
