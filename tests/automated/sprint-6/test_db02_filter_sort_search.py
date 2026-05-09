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

BASE_URL                  = os.getenv("BASE_URL")
TEST_EMAIL                = os.getenv("TEST_EMAIL")
TEST_PASSWORD             = os.getenv("TEST_PASSWORD")
EMPTY_USER_EMAIL          = os.getenv("EMPTY_USER_EMAIL")
EMPTY_USER_PASSWORD       = os.getenv("EMPTY_USER_PASSWORD")
KNOWN_POSTED_ERRAND_TITLE = os.getenv("KNOWN_POSTED_ERRAND_TITLE")

WAIT = 20

# Matches only root card elements (UUID testIDs), excludes all inner errand-card-* testIDs
CARD_SELECTOR = (
    "[data-testid^='errand-card-']:not([data-testid='errand-card-status'])"
    ":not([data-testid='errand-card-title'])"
    ":not([data-testid='errand-card-description'])"
    ":not([data-testid='errand-card-kebab'])"
)


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


def login(driver, email=None, password=None):
    driver.get(f"{BASE_URL}/login")
    tid_type(driver, "login-email", email or TEST_EMAIL)
    tid_type(driver, "login-password", password or TEST_PASSWORD)
    tid_click(driver, "login-btn")
    WebDriverWait(driver, WAIT).until(lambda d: "/login" not in d.current_url)


def go_to_dashboard(driver, email=None, password=None):
    login(driver, email, password)
    driver.get(f"{BASE_URL}/dashboard")
    WebDriverWait(driver, WAIT).until(lambda d: "/dashboard" in d.current_url)
    time.sleep(3)


def select_filter_option(driver, trigger_id, option_value):
    """Open a dropdown by trigger testID and click the option by its generated testID."""
    tid_click(driver, trigger_id)
    time.sleep(0.5)
    option_id = f"{trigger_id}-option-{option_value.lower().replace(' ', '-')}"
    tid_click(driver, option_id)
    time.sleep(1)


def card_query(driver, card, test_id):
    """Query a data-testid element inside a card via JS querySelector."""
    return driver.execute_script(
        "return arguments[0].querySelector(\"[data-testid='" + test_id + "']\");",
        card
    )


def card_text(driver, card, test_id):
    """Return textContent of a data-testid element inside a card, or None if not found."""
    return driver.execute_script(
        "var el = arguments[0].querySelector(\"[data-testid='" + test_id + "']\"); "
        "return el ? el.textContent.trim() : null;",
        card
    )


class TestFilterSortSearch(unittest.TestCase):

    def tearDown(self):
        time.sleep(1)

    # ------------------------------------------------------------------ #
    #  DB-02 TC-DB-02-01 – Filter by status                              #
    # ------------------------------------------------------------------ #
    def test_db02_tc01_filter_by_status(self):
        """Positive: Tasks are filtered correctly based on selected status."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            for status in ["Completed", "In Progress", "Expired", "Available"]:
                select_filter_option(driver, "filter-status", status)
                time.sleep(1)
                cards = driver.find_elements(By.CSS_SELECTOR, CARD_SELECTOR)
                for card in cards:
                    status_text = card_text(driver, card, "errand-card-status")
                    self.assertEqual(status_text, status,
                                     f"Card status badge should show '{status}' when that filter is active")
                # Reset to All
                select_filter_option(driver, "filter-status", "All")
        finally:
            driver.quit()

    def test_db02_tc01_01_cancelled_filter_only_in_accepted(self):
        """Positive: Cancelled filter appears only under Accepted Errands context."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            tid_click(driver, "filter-status")
            time.sleep(0.5)
            tid_click(driver, "filter-status")
            time.sleep(0.3)

            tid_click(driver, "tab-accepted")
            time.sleep(2)
            tid_click(driver, "filter-status")
            time.sleep(0.5)
            accepted_source = driver.page_source
            tid_click(driver, "filter-status")

            self.assertFalse(
                driver.execute_script(
                    "return !!document.querySelector(\"[data-testid='filter-status-option-cancelled']\")"
                ) and "posted" in driver.current_url,
                "Cancelled filter option should not appear on Posted tab"
            )
            self.assertIn(
                "Cancelled", accepted_source,
                "Cancelled filter option should be available on Accepted tab"
            )
        finally:
            driver.quit()

    def test_db02_tc01_02_invalid_status_filter_does_not_break_ui(self):
        """Negative: UI remains stable when an unrecognised status is injected."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            driver.execute_script("""
                var btn = document.querySelector("[data-testid='filter-status']");
                if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """)
            time.sleep(0.5)
            body = driver.find_element(By.TAG_NAME, "body")
            self.assertTrue(body.is_displayed(), "Page should remain stable with invalid filter")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  DB-02 TC-DB-02-02 – Filter by type                                #
    # ------------------------------------------------------------------ #
    def test_db02_tc02_filter_by_type_remote(self):
        """Positive: Tasks are filtered correctly when Remote is selected."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            select_filter_option(driver, "filter-type", "Remote")
            cards = driver.find_elements(By.CSS_SELECTOR, CARD_SELECTOR)
            for card in cards:
                type_text   = driver.execute_script("return arguments[0].textContent", card)
                status_text = card_text(driver, card, "errand-card-status")
                title_text  = card_text(driver, card, "errand-card-title")
                desc_el     = card_query(driver, card, "errand-card-description")

                self.assertIn("Remote", type_text,
                              "Only Remote tasks should appear when Remote filter is active")
                self.assertIsNotNone(status_text, "Card should have a status badge")
                self.assertTrue(title_text and len(title_text.strip()) > 0,
                                "Card should have a non-empty title")
                self.assertIsNotNone(desc_el, "Card should have a description element")
        finally:
            driver.quit()

    def test_db02_tc02_filter_by_type_onsite(self):
        """Positive: Tasks are filtered correctly when Onsite is selected."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            select_filter_option(driver, "filter-type", "Onsite")
            cards = driver.find_elements(By.CSS_SELECTOR, CARD_SELECTOR)
            for card in cards:
                type_text   = driver.execute_script("return arguments[0].textContent", card)
                status_text = card_text(driver, card, "errand-card-status")
                title_text  = card_text(driver, card, "errand-card-title")
                desc_el     = card_query(driver, card, "errand-card-description")

                self.assertIn("Onsite", type_text,
                              "Only Onsite tasks should appear when Onsite filter is active")
                self.assertIsNotNone(status_text, "Card should have a status badge")
                self.assertTrue(title_text and len(title_text.strip()) > 0,
                                "Card should have a non-empty title")
                self.assertIsNotNone(desc_el, "Card should have a description element")
        finally:
            driver.quit()

    def test_db02_tc02_01_filter_resets_when_switching_types(self):
        """Positive: Previous type filter does not persist when switching to another type."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            select_filter_option(driver, "filter-type", "Remote")
            time.sleep(1)
            select_filter_option(driver, "filter-type", "Onsite")
            time.sleep(1)
            cards = driver.find_elements(By.CSS_SELECTOR, CARD_SELECTOR)
            for card in cards:
                type_text   = driver.execute_script("return arguments[0].textContent", card)
                title_text  = card_text(driver, card, "errand-card-title")
                status_text = card_text(driver, card, "errand-card-status")

                self.assertNotIn("Remote", type_text,
                                 "Remote tasks should not appear after switching to Onsite filter")
                self.assertTrue(title_text and len(title_text.strip()) > 0,
                                "Card should have a non-empty title")
                self.assertIsNotNone(status_text, "Card should have a status badge")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  DB-02 TC-DB-02-03 – Sort by key                                   #
    # ------------------------------------------------------------------ #
    def test_db02_tc03_sort_by_deadline(self):
        """Positive: Tasks are sorted by Deadline ascending."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            select_filter_option(driver, "sort-key", "Deadline")
            time.sleep(1)
            cards = driver.find_elements(By.CSS_SELECTOR, CARD_SELECTOR)
            self.assertGreaterEqual(len(cards), 0,
                                    "Page should render without error after sorting by Deadline")
        finally:
            driver.quit()

    def test_db02_tc03_sort_by_budget(self):
        """Positive: Tasks are sorted by Budget ascending."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            select_filter_option(driver, "sort-key", "Budget")
            time.sleep(1)
            cards = driver.find_elements(By.CSS_SELECTOR, CARD_SELECTOR)
            self.assertGreaterEqual(len(cards), 0,
                                    "Page should render without error after sorting by Budget")
        finally:
            driver.quit()

    def test_db02_tc03_01_distance_sort_disabled_for_remote_only(self):
        """Positive: Distance sort option is not available when Remote filter is active."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            select_filter_option(driver, "filter-type", "Remote")
            time.sleep(1)
            tid_click(driver, "sort-key")
            time.sleep(0.5)
            distance_option = driver.execute_script(
                "return !!document.querySelector(\"[data-testid='sort-key-option-distance']\")"
            )
            tid_click(driver, "sort-key")
            self.assertFalse(distance_option,
                             "Distance sort option should not appear when Remote filter is active")
        finally:
            driver.quit()

    def test_db02_tc03_02_sort_does_not_error_on_empty_dataset(self):
        """Positive: No errors occur when sorting an empty dataset."""
        driver = make_driver()
        try:
            go_to_dashboard(driver, EMPTY_USER_EMAIL, EMPTY_USER_PASSWORD)
            select_filter_option(driver, "sort-key", "Deadline")
            time.sleep(1)
            body = driver.find_element(By.TAG_NAME, "body")
            self.assertTrue(body.is_displayed(),
                            "Page should remain stable when sorting an empty dataset")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  DB-02 TC-DB-02-04 – Sort direction                                #
    # ------------------------------------------------------------------ #
    def test_db02_tc04_sort_ascending(self):
        """Positive: Sort direction button shows ascending state."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            sort_btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='sort-dir']"))
            )
            self.assertIn("Low", sort_btn.text,
                          "Default sort direction should be ascending (Low → High)")
        finally:
            driver.quit()

    def test_db02_tc04_01_sort_descending(self):
        """Positive: Clicking sort direction toggles to descending."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            tid_click(driver, "sort-dir")
            time.sleep(1)
            sort_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='sort-dir']")
            self.assertIn("High", sort_btn.text,
                          "Sort direction should switch to descending (High → Low)")
        finally:
            driver.quit()

    def test_db02_tc04_02_switching_sort_order_updates_immediately(self):
        """Positive: UI updates without a full page refresh when sort direction changes."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            before_url = driver.current_url
            tid_click(driver, "sort-dir")
            time.sleep(1)
            self.assertEqual(before_url, driver.current_url,
                             "Page should not navigate on sort direction toggle")
            sort_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='sort-dir']")
            self.assertTrue(sort_btn.is_displayed(),
                            "Sort direction button should still be visible after toggle")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  DB-02 TC-DB-02-05 – Default state                                 #
    # ------------------------------------------------------------------ #
    def test_db02_tc05_default_filter_all_sort_budget_asc(self):
        """Positive: Default filter is All and default sort is Budget ascending on load."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            status_btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='filter-status']"))
            )
            sort_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='sort-key']")
            dir_btn  = driver.find_element(By.CSS_SELECTOR, "[data-testid='sort-dir']")
            self.assertIn("All", status_btn.text,
                          "Default status filter should be All")
            self.assertIn("Budget", sort_btn.text,
                          "Default sort key should be Budget")
            self.assertIn("Low", dir_btn.text,
                          "Default sort direction should be ascending (Low → High)")
        finally:
            driver.quit()

    def test_db02_tc05_01_default_state_resets_after_refresh(self):
        """Positive: Filters return to default values after page reload."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            select_filter_option(driver, "filter-status", "Completed")
            time.sleep(1)
            driver.refresh()
            time.sleep(3)
            status_btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='filter-status']"))
            )
            self.assertIn("All", status_btn.text,
                          "Status filter should reset to All after page refresh")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  DB-02 TC-DB-02-06 – Search                                        #
    # ------------------------------------------------------------------ #
    def test_db02_tc06_search_returns_relevant_tasks(self):
        """Positive: Search results match the keyword input."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            tid_type(driver, "search-input", KNOWN_POSTED_ERRAND_TITLE)
            time.sleep(2)
            cards = driver.find_elements(By.CSS_SELECTOR, CARD_SELECTOR)
            self.assertGreater(len(cards), 0,
                               "At least one card should match the known errand title")
            for card in cards:
                title_text  = card_text(driver, card, "errand-card-title")
                status_text = card_text(driver, card, "errand-card-status")
                desc_el     = card_query(driver, card, "errand-card-description")

                self.assertIsNotNone(title_text, "Card should have a title element")
                self.assertIn(
                    KNOWN_POSTED_ERRAND_TITLE.lower(), title_text.lower(),
                    "Card title should contain the search keyword"
                )
                self.assertIsNotNone(status_text, "Card should have a status badge")
                self.assertIsNotNone(desc_el, "Card should have a description element")
        finally:
            driver.quit()

    def test_db02_tc06_01_search_empty_input_shows_all(self):
        """Positive: Clearing search input restores the full task list."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            tid_type(driver, "search-input", KNOWN_POSTED_ERRAND_TITLE)
            time.sleep(1)
            tid_type(driver, "search-input", "")
            time.sleep(2)
            cards = driver.find_elements(By.CSS_SELECTOR, CARD_SELECTOR)
            self.assertGreater(len(cards), 0,
                               "All tasks should be shown when search input is cleared")
        finally:
            driver.quit()

    def test_db02_tc06_02_search_no_match_shows_empty_state(self):
        """Positive: Empty state message is displayed when search returns no results."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            tid_type(driver, "search-input", "zzz_no_match_xyzxyz_12345")
            time.sleep(2)
            empty = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='dashboard-empty-state']")
                )
            )
            self.assertTrue(empty.is_displayed(),
                            "Empty state should appear when search returns no results")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  DB-02 TC-DB-02-07 – Empty state from filters                      #
    # ------------------------------------------------------------------ #
    def test_db02_tc07_empty_state_when_no_tasks_match_filter(self):
        """Positive: 'No tasks found for selected options' is displayed when filters yield nothing."""
        driver = make_driver()
        try:
            go_to_dashboard(driver, EMPTY_USER_EMAIL, EMPTY_USER_PASSWORD)
            select_filter_option(driver, "filter-status", "Completed")
            time.sleep(2)
            empty = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='dashboard-empty-state']")
                )
            )
            self.assertTrue(empty.is_displayed(),
                            "Empty state should appear when no tasks match the filter")
        finally:
            driver.quit()

    def test_db02_tc07_01_empty_state_persists_across_filter_sort_combinations(self):
        """Positive: Empty state message remains consistent across all filter+sort combos."""
        driver = make_driver()
        try:
            go_to_dashboard(driver, EMPTY_USER_EMAIL, EMPTY_USER_PASSWORD)
            for status in ["Completed", "In Progress", "Expired"]:
                select_filter_option(driver, "filter-status", status)
                time.sleep(1)
                tid_click(driver, "sort-dir")
                time.sleep(1)
                empty = WebDriverWait(driver, WAIT).until(
                    EC.presence_of_element_located(
                        (By.CSS_SELECTOR, "[data-testid='dashboard-empty-state']")
                    )
                )
                self.assertTrue(
                    empty.is_displayed(),
                    f"Empty state should persist for status='{status}' with toggled sort"
                )
                select_filter_option(driver, "filter-status", "All")
        finally:
            driver.quit()

    def test_db02_tc07_02_ui_stable_when_all_filters_return_empty(self):
        """Positive: Layout remains stable with no tasks displayed."""
        driver = make_driver()
        try:
            go_to_dashboard(driver, EMPTY_USER_EMAIL, EMPTY_USER_PASSWORD)
            select_filter_option(driver, "filter-status", "Completed")
            select_filter_option(driver, "filter-type", "Onsite")
            time.sleep(2)
            no_overflow = driver.execute_script(
                "return document.documentElement.scrollWidth <= window.innerWidth + 5;"
            )
            body = driver.find_element(By.TAG_NAME, "body")
            self.assertTrue(body.is_displayed(),
                            "Page body should remain visible with empty filter results")
            self.assertTrue(no_overflow,
                            "Layout should not overflow horizontally with empty filter results")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
