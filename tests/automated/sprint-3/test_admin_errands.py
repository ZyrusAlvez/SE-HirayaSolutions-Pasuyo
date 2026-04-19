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

BASE_URL            = os.getenv("BASE_URL")
ADMIN_EMAIL         = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD      = os.getenv("ADMIN_PASSWORD")
ERRAND_TEST_EMAIL   = os.getenv("ERRAND_TEST_EMAIL")
ERRAND_TEST_PASSWORD = os.getenv("ERRAND_TEST_PASSWORD")
KNOWN_ERRAND_TITLE  = os.getenv("KNOWN_ERRAND_TITLE")
KNOWN_ERRAND_POSTER = os.getenv("KNOWN_ERRAND_POSTER")

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
        var el = wrapper.tagName === 'INPUT' || wrapper.tagName === 'TEXTAREA'
            ? wrapper : (wrapper.querySelector('textarea') || wrapper.querySelector('input'));
        var proto = el.tagName === 'TEXTAREA'
            ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        var setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
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
    driver.get(f"{BASE_URL}/admin/errands")
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='admin-errand-search']"))
    )
    # Wait for errand cards to load
    WebDriverWait(driver, WAIT).until(
        lambda d: len(d.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-card-']")) > 0
    )


def post_errand(driver, title, description="Test errand description"):
    """Log in as a verified user and post a new errand."""
    login(driver, ERRAND_TEST_EMAIL, ERRAND_TEST_PASSWORD)
    driver.get(f"{BASE_URL}/post-errand")
    tid_type(driver, "post-errand-title", title)
    tid_type(driver, "post-errand-description", description)
    # Select Remote so no location is required
    tid_click(driver, "task-type-remote")
    tid_type(driver, "post-errand-budget", "100")
    # Set deadline via hidden native input
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='post-errand-deadline-native']"))
    )
    # Set deadline to tomorrow
    from datetime import datetime, timedelta
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%dT%H:%M")
    driver.execute_script("""
        var el = document.querySelector("[data-testid='post-errand-deadline-native']");
        el.removeAttribute('style');
        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, arguments[0]);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    """, tomorrow)
    tid_click(driver, "post-errand-submit")
    WebDriverWait(driver, WAIT).until(
        lambda d: "/post-errand" not in d.current_url
    )


class TestAdminErrands(unittest.TestCase):

    def tearDown(self):
        time.sleep(2)

    # ------------------------------------------------------------------ #
    #  TC-ADMIN-03-01 – Admin dashboard displays a list of all errands   #
    # ------------------------------------------------------------------ #
    def test_admin_03_01_errand_list_visible(self):
        """Positive: Admin errands page displays a list of errands."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            cards = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-card-']")
            self.assertGreater(len(cards), 0,
                               "Admin dashboard should display at least one errand")
        finally:
            driver.quit()

    def test_admin_03_01_errand_count_shown_in_header(self):
        """Positive: Total errand count is shown in the page header."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            count_el = tid(driver, "admin-errand-count")
            self.assertIn("total errands", count_el.text,
                          "Header should display total errand count")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ADMIN-03-02 – Each errand displays title, client, budget,      #
    #                   and status                                        #
    # ------------------------------------------------------------------ #
    def test_admin_03_02_errand_card_shows_title(self):
        """Positive: Each errand card displays a title."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            titles = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-title-']")
            self.assertGreater(len(titles), 0, "Errand title should be visible on cards")
            self.assertTrue(len(titles[0].text) > 0, "Errand title text should not be empty")
        finally:
            driver.quit()

    def test_admin_03_02_errand_card_shows_poster(self):
        """Positive: Each errand card displays the poster/client name."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            posters = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-poster-']")
            self.assertGreater(len(posters), 0, "Errand poster should be visible on cards")
            self.assertTrue(len(posters[0].text) > 0, "Errand poster text should not be empty")
        finally:
            driver.quit()

    def test_admin_03_02_errand_card_shows_budget(self):
        """Positive: Each errand card displays the budget."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            budgets = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-budget-']")
            self.assertGreater(len(budgets), 0, "Errand budget should be visible on cards")
        finally:
            driver.quit()

    def test_admin_03_02_errand_card_shows_status(self):
        """Positive: Each errand card displays a status badge."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            statuses = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-status-']")
            self.assertGreater(len(statuses), 0, "Errand status should be visible on cards")
            valid_statuses = {"Available", "In Progress", "Completed", "Expired"}
            self.assertIn(statuses[0].text, valid_statuses,
                          f"Status should be one of {valid_statuses}")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ADMIN-03-03 – Admin can filter errands by status               #
    # ------------------------------------------------------------------ #
    def test_admin_03_03_filter_available(self):
        """Positive: Filtering by Available shows only Available errands."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            tid_click(driver, "errand-filter-available")
            time.sleep(1)
            statuses = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-status-']")
            for s in statuses:
                self.assertEqual(s.text, "Available",
                                 "All visible errands should have status 'Available'")
        finally:
            driver.quit()

    def test_admin_03_03_filter_in_progress(self):
        """Positive: Filtering by In Progress shows only In Progress errands."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            tid_click(driver, "errand-filter-in-progress")
            time.sleep(1)
            statuses = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-status-']")
            for s in statuses:
                self.assertEqual(s.text, "In Progress",
                                 "All visible errands should have status 'In Progress'")
        finally:
            driver.quit()

    def test_admin_03_03_filter_completed(self):
        """Positive: Filtering by Completed shows only Completed errands."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            tid_click(driver, "errand-filter-completed")
            time.sleep(1)
            statuses = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-status-']")
            for s in statuses:
                self.assertEqual(s.text, "Completed",
                                 "All visible errands should have status 'Completed'")
        finally:
            driver.quit()

    def test_admin_03_03_filter_all_restores_list(self):
        """Edge: Switching back to All filter restores the full errand list."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            total_before = len(driver.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-card-']"))
            tid_click(driver, "errand-filter-completed")
            time.sleep(1)
            tid_click(driver, "errand-filter-all")
            time.sleep(1)
            total_after = len(driver.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-card-']"))
            self.assertEqual(total_before, total_after,
                             "Switching back to All should restore the full errand list")
        finally:
            driver.quit()

    def test_admin_03_03_filter_no_results_shows_empty_state(self):
        """Edge: Filtering by a status with no errands shows empty state."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            tid_click(driver, "errand-filter-expired")
            time.sleep(1)
            cards = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-card-']")
            if len(cards) == 0:
                empty = driver.find_elements(
                    By.XPATH, "//*[contains(text(), 'No errands found')]"
                )
                self.assertGreater(len(empty), 0,
                                   "Empty state message should appear when no errands match filter")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ADMIN-03-04 – Admin can search errands by title or user        #
    # ------------------------------------------------------------------ #
    def test_admin_03_04_search_by_title(self):
        """Positive: Searching by title filters the errand list correctly."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            tid_type(driver, "admin-errand-search", KNOWN_ERRAND_TITLE)
            time.sleep(1)
            titles = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-title-']")
            self.assertGreater(len(titles), 0, "Search by title should return results")
            found = any(KNOWN_ERRAND_TITLE.lower() in t.text.lower() for t in titles)
            self.assertTrue(found, f"Search results should contain '{KNOWN_ERRAND_TITLE}'")
        finally:
            driver.quit()

    def test_admin_03_04_search_by_poster(self):
        """Positive: Searching by client/poster name filters the errand list correctly."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            tid_type(driver, "admin-errand-search", KNOWN_ERRAND_POSTER)
            time.sleep(1)
            posters = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-poster-']")
            self.assertGreater(len(posters), 0, "Search by poster should return results")
            found = any(KNOWN_ERRAND_POSTER.lower() in p.text.lower() for p in posters)
            self.assertTrue(found, f"Search results should contain '{KNOWN_ERRAND_POSTER}'")
        finally:
            driver.quit()

    def test_admin_03_04_search_no_results(self):
        """Negative: Searching for a non-existent errand shows empty state."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            tid_type(driver, "admin-errand-search", "zzznoresultsxxx")
            time.sleep(1)
            cards = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-card-']")
            self.assertEqual(len(cards), 0, "No errand cards should appear for unmatched search")
            empty = driver.find_elements(By.XPATH, "//*[contains(text(), 'No errands found')]")
            self.assertGreater(len(empty), 0, "Empty state message should appear")
        finally:
            driver.quit()

    def test_admin_03_04_clear_search_restores_list(self):
        """Edge: Clearing the search input restores the full errand list."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            total_before = len(driver.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-card-']"))
            tid_type(driver, "admin-errand-search", KNOWN_ERRAND_TITLE)
            time.sleep(1)
            tid_type(driver, "admin-errand-search", "")
            time.sleep(1)
            total_after = len(driver.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-card-']"))
            self.assertEqual(total_before, total_after,
                             "Clearing search should restore the full errand list")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ADMIN-03-05 – Errand list updates when new errands are created #
    # ------------------------------------------------------------------ #
    def test_admin_03_05_list_updates_after_new_errand_posted(self):
        """Positive: Errand list auto-updates within polling interval after a new errand is posted."""
        admin_driver = make_driver()
        user_driver = make_driver()
        new_title = f"Automated Test Errand {int(time.time())}"
        try:
            login_as_admin(admin_driver)
            count_before = len(admin_driver.find_elements(
                By.CSS_SELECTOR, "[data-testid^='errand-card-']"
            ))

            post_errand(user_driver, new_title)

            # Admin list polls every 5 seconds — wait for it to update
            time.sleep(7)

            count_after = len(admin_driver.find_elements(
                By.CSS_SELECTOR, "[data-testid^='errand-card-']"
            ))
            self.assertGreater(count_after, count_before,
                               "Errand list should update after a new errand is posted")
        finally:
            admin_driver.quit()
            user_driver.quit()

    def test_admin_03_05_new_errand_searchable_after_post(self):
        """Positive: Newly posted errand is searchable by title in the admin dashboard."""
        admin_driver = make_driver()
        user_driver = make_driver()
        new_title = f"Searchable Errand {int(time.time())}"
        try:
            post_errand(user_driver, new_title)

            login_as_admin(admin_driver)
            time.sleep(7)

            tid_type(admin_driver, "admin-errand-search", new_title)
            time.sleep(1)
            titles = admin_driver.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-title-']")
            found = any(new_title.lower() in t.text.lower() for t in titles)
            self.assertTrue(found,
                            f"Newly posted errand '{new_title}' should appear in search results")
        finally:
            admin_driver.quit()
            user_driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
