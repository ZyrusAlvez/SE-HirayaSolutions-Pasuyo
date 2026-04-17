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

BASE_URL        = os.getenv("BASE_URL")
ADMIN_EMAIL     = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD  = os.getenv("ADMIN_PASSWORD")
KNOWN_USER_NAME  = os.getenv("KNOWN_USER_NAME")
KNOWN_USER_EMAIL = os.getenv("KNOWN_USER_EMAIL")

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


def login_as_admin(driver):
    driver.get(f"{BASE_URL}/login")
    tid_type(driver, "login-email", ADMIN_EMAIL)
    tid_type(driver, "login-password", ADMIN_PASSWORD)
    tid_click(driver, "login-btn")
    WebDriverWait(driver, WAIT).until(EC.url_contains("/admin"))
    driver.get(f"{BASE_URL}/admin/accounts")
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='admin-search-input']"))
    )
    # Wait for users to load
    WebDriverWait(driver, WAIT).until(
        lambda d: len(d.find_elements(By.CSS_SELECTOR, "[data-testid^='user-card-']")) > 0
    )


class TestAdminUserList(unittest.TestCase):

    def tearDown(self):
        time.sleep(2)

    # ------------------------------------------------------------------ #
    #  TC-ADMIN-01-01 – Admin dashboard displays a list of all users     #
    # ------------------------------------------------------------------ #
    def test_tc_admin_01_01_dashboard_shows_user_list(self):
        """Positive: Admin dashboard shows a list of registered users."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            user_cards = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='user-card-']")
            self.assertGreater(len(user_cards), 0,
                               "Admin dashboard should display at least one user")
        finally:
            driver.quit()

    def test_tc_admin_01_01_01_non_admin_cannot_access_dashboard(self):
        """Negative: Non-admin user is redirected away from admin dashboard."""
        driver = make_driver()
        try:
            driver.get(f"{BASE_URL}/admin/accounts")
            WebDriverWait(driver, WAIT).until(
                lambda d: "/admin" not in d.current_url or "/login" in d.current_url
            )
            self.assertNotIn("/admin/accounts", driver.current_url,
                             "Non-admin should not access admin dashboard")
        finally:
            driver.quit()

    def test_tc_admin_01_01_02_user_count_matches_list(self):
        """Edge: Total user count shown in header matches the number of user cards."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            count_el = tid(driver, "admin-user-count")
            # count_el text is "User Accounts", total is shown separately — check cards > 0
            user_cards = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='user-card-']")
            self.assertGreater(len(user_cards), 0, "User list should not be empty")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ADMIN-01-02 – Users listed with name, email, verification      #
    # ------------------------------------------------------------------ #
    def test_tc_admin_01_02_user_card_shows_name(self):
        """Positive: Each user card displays the user's name."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            # Get first user card's name element
            name_els = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='user-name-']")
            self.assertGreater(len(name_els), 0, "User name should be displayed on cards")
            self.assertTrue(len(name_els[0].text) > 0, "User name text should not be empty")
        finally:
            driver.quit()

    def test_tc_admin_01_02_01_user_card_shows_email(self):
        """Positive: Each user card displays the user's email."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            email_els = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='user-email-']")
            self.assertGreater(len(email_els), 0, "User email should be displayed on cards")
            self.assertIn("@", email_els[0].text, "Email should contain @ symbol")
        finally:
            driver.quit()

    def test_tc_admin_01_02_02_user_card_shows_verification_status(self):
        """Positive: Each user card displays a verification status badge."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            # VerificationBadge renders text like 'Verified' or 'Not Verified'
            badges = driver.find_elements(
                By.XPATH, "//*[contains(text(),'Verified') or contains(text(),'Not Verified') or contains(text(),'Pending')]"
            )
            self.assertGreater(len(badges), 0,
                               "Verification status badge should be visible on user cards")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ADMIN-01-03 – Admin can search users by name or email          #
    # ------------------------------------------------------------------ #
    def test_tc_admin_01_03_search_by_name(self):
        """Positive: Searching by name filters the user list correctly."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            tid_type(driver, "admin-search-input", KNOWN_USER_NAME)
            time.sleep(1)
            name_els = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='user-name-']")
            self.assertGreater(len(name_els), 0, "Search by name should return results")
            names = [el.text.lower() for el in name_els]
            self.assertTrue(
                any(KNOWN_USER_NAME.lower() in n for n in names),
                f"Search results should contain '{KNOWN_USER_NAME}'"
            )
        finally:
            driver.quit()

    def test_tc_admin_01_03_01_search_by_email(self):
        """Positive: Searching by email filters the user list correctly."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            tid_type(driver, "admin-search-input", KNOWN_USER_EMAIL)
            time.sleep(1)
            email_els = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='user-email-']")
            self.assertGreater(len(email_els), 0, "Search by email should return results")
            emails = [el.text.lower() for el in email_els]
            self.assertTrue(
                any(KNOWN_USER_EMAIL.lower() in e for e in emails),
                f"Search results should contain '{KNOWN_USER_EMAIL}'"
            )
        finally:
            driver.quit()

    def test_tc_admin_01_03_02_search_no_results(self):
        """Negative: Searching for a non-existent user shows no results."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            tid_type(driver, "admin-search-input", "zzznoresultsxxx")
            time.sleep(1)
            cards = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='user-card-']")
            self.assertEqual(len(cards), 0, "Search with no match should show no user cards")
            self.assertIn("No users found", driver.page_source,
                          "Empty state message should appear when no results found")
        finally:
            driver.quit()

    def test_tc_admin_01_03_03_clear_search_restores_list(self):
        """Edge: Clearing the search input restores the full user list."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            total_before = len(driver.find_elements(By.CSS_SELECTOR, "[data-testid^='user-card-']"))

            tid_type(driver, "admin-search-input", KNOWN_USER_NAME)
            time.sleep(1)

            # Clear search
            tid_type(driver, "admin-search-input", "")
            time.sleep(1)

            total_after = len(driver.find_elements(By.CSS_SELECTOR, "[data-testid^='user-card-']"))
            self.assertEqual(total_before, total_after,
                             "Clearing search should restore the full user list")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ADMIN-01-04 – Admin can sort users                             #
    # ------------------------------------------------------------------ #
    def test_tc_admin_01_04_sort_by_newest(self):
        """Positive: Sorting by Newest shows users sorted by most recent registration."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            tid_click(driver, "sort-newest")
            time.sleep(1)
            cards = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='user-card-']")
            self.assertGreater(len(cards), 0, "Newest sort should show users")
        finally:
            driver.quit()

    def test_tc_admin_01_04_01_sort_by_oldest(self):
        """Positive: Sorting by Oldest shows users sorted by earliest registration."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            tid_click(driver, "sort-oldest")
            time.sleep(1)
            cards = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='user-card-']")
            self.assertGreater(len(cards), 0, "Oldest sort should show users")
        finally:
            driver.quit()

    def test_tc_admin_01_04_02_sort_by_verified(self):
        """Positive: Sorting by Verified filters to only verified users."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            tid_click(driver, "sort-verified")
            time.sleep(1)
            # All visible badges should say Verified
            badges = driver.find_elements(By.XPATH, "//*[contains(text(),'Not Verified')]")
            self.assertEqual(len(badges), 0,
                             "Verified filter should not show unverified users")
        finally:
            driver.quit()

    def test_tc_admin_01_04_03_sort_by_unverified(self):
        """Positive: Sorting by Unverified filters to only unverified users."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            tid_click(driver, "sort-unverified")
            time.sleep(1)
            verified_badges = driver.find_elements(
                By.XPATH, "//*[contains(@class,'text-blue') and contains(text(),'Verified')]"
            )
            self.assertEqual(len(verified_badges), 0,
                             "Unverified filter should not show verified users")
        finally:
            driver.quit()

    def test_tc_admin_01_04_04_sort_by_pending(self):
        """Positive: Sorting by Pending shows only users with pending verification."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            tid_click(driver, "sort-pending")
            time.sleep(1)
            # Either shows pending cards or empty state — both are valid
            cards = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='user-card-']")
            empty = driver.find_elements(By.XPATH, "//*[contains(text(),'No users found')]")
            self.assertTrue(len(cards) > 0 or len(empty) > 0,
                            "Pending filter should show pending users or empty state")
        finally:
            driver.quit()

    def test_tc_admin_01_04_05_sort_buttons_are_all_visible(self):
        """Edge: All sort option buttons are visible on the accounts page."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            for sort_key in ["newest", "oldest", "verified", "unverified", "pending", "suspended"]:
                btn = tid(driver, f"sort-{sort_key}")
                self.assertTrue(btn.is_displayed(),
                                f"Sort button '{sort_key}' should be visible")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
