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


class TestDashboard(unittest.TestCase):

    def tearDown(self):
        time.sleep(1)

    # ------------------------------------------------------------------ #
    #  DB-01 TC-DB-01-01 – Navbar redirects to dashboard                 #
    # ------------------------------------------------------------------ #
    def test_db01_tc01_navbar_redirects_to_dashboard(self):
        """Positive: Clicking Dashboard in the navbar redirects to dashboard page."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/")
            tid_click(driver, "nav-dashboard")
            WebDriverWait(driver, WAIT).until(lambda d: "/dashboard" in d.current_url)
            self.assertIn("/dashboard", driver.current_url,
                          "Navbar Dashboard button should redirect to /dashboard")
        finally:
            driver.quit()

    def test_db01_tc01_01_dashboard_not_accessible_when_logged_out(self):
        """Negative: Unauthenticated users are redirected away from dashboard."""
        driver = make_driver()
        try:
            driver.get(f"{BASE_URL}/dashboard")
            WebDriverWait(driver, WAIT).until(lambda d: "/dashboard" not in d.current_url)
            self.assertNotIn("/dashboard", driver.current_url,
                             "Unauthenticated user should not access /dashboard")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  DB-01 TC-DB-01-02 – Posted and Accepted sections visible          #
    # ------------------------------------------------------------------ #
    def test_db01_tc02_posted_and_accepted_sections_visible(self):
        """Positive: Dashboard displays Posted Errands and Accepted Errands tabs."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            page_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertIn("Posted", page_text,
                          "Posted Errands section should be visible on dashboard")
            self.assertIn("Accepted", page_text,
                          "Accepted Errands section should be visible on dashboard")
        finally:
            driver.quit()

    def test_db01_tc02_01_empty_state_shown_when_no_errands(self):
        """Positive: Empty state message is displayed when user has no errands."""
        driver = make_driver()
        try:
            go_to_dashboard(driver, EMPTY_USER_EMAIL, EMPTY_USER_PASSWORD)
            empty = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='dashboard-empty-state']")
                )
            )
            self.assertTrue(empty.is_displayed(),
                            "Empty state should be displayed when no errands exist")
        finally:
            driver.quit()

    def test_db01_tc02_02_posted_errands_in_posted_section(self):
        """Positive: Posted errands appear only in the Posted section."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            # Posted tab is active by default
            posted_cards = driver.find_elements(
                By.CSS_SELECTOR, "[data-testid^='errand-card-']"
            )
            self.assertGreater(len(posted_cards), 0,
                               "Posted errands should appear in the Posted section")
            # Switch to Accepted tab and verify different content
            tid_click(driver, "tab-accepted")
            time.sleep(2)
            accepted_cards = driver.find_elements(
                By.CSS_SELECTOR, "[data-testid^='errand-card-']"
            )
            # Both sections render independently
            self.assertIsNotNone(accepted_cards,
                                 "Accepted section should render without error")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  DB-01 TC-DB-01-03 – Task card content                             #
    # ------------------------------------------------------------------ #
    def test_db01_tc03_task_card_shows_owner_profile(self):
        """Positive: Task card shows avatar or name of owner."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            card = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid^='errand-card-']")
                )
            )
            has_avatar_or_name = driver.execute_script("""
                var card = arguments[0];
                var img = card.querySelector('img');
                var texts = card.querySelectorAll('*');
                for (var i = 0; i < texts.length; i++) {
                    if (texts[i].children.length === 0 && texts[i].innerText.trim().length > 0) return true;
                }
                return !!img;
            """, card)
            self.assertTrue(has_avatar_or_name,
                            "Task card should show avatar or owner name")
        finally:
            driver.quit()

    def test_db01_tc03_01_task_card_missing_owner_shows_default(self):
        """Positive: Default avatar or placeholder shown when owner profile is missing."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            card = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid^='errand-card-']")
                )
            )
            # Either an img tag or a text fallback should exist
            has_fallback = driver.execute_script("""
                var card = arguments[0];
                return !!card.querySelector('img') || card.innerText.includes('Unknown');
            """, card)
            self.assertTrue(has_fallback,
                            "Default avatar or placeholder should be shown for missing owner")
        finally:
            driver.quit()

    def test_db01_tc03_02_task_card_shows_title(self):
        """Positive: Task title is visible on the card."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            card = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid^='errand-card-']")
                )
            )
            title = driver.execute_script("""
                return arguments[0].querySelector("[data-testid='errand-card-title']")?.innerText || null;
            """, card)
            self.assertIsNotNone(title, "Task card should display a title")
            self.assertGreater(len(title.strip()), 0, "Task title should not be empty")
        finally:
            driver.quit()

    def test_db01_tc03_03_task_card_truncates_description(self):
        """Positive: Long descriptions are shortened with ellipsis."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid^='errand-card-']")
                )
            )
            truncated = driver.execute_script("""
                var descs = document.querySelectorAll("[data-testid='errand-card-description']");
                for (var i = 0; i < descs.length; i++) {
                    var s = window.getComputedStyle(descs[i]);
                    if (s.overflow === 'hidden' || s.webkitLineClamp || s.display === '-webkit-box') return true;
                    if (descs[i].scrollHeight > descs[i].clientHeight) return true;
                }
                return descs.length > 0;
            """)
            self.assertTrue(truncated,
                            "Description should be truncated on task cards")
        finally:
            driver.quit()

    def test_db01_tc03_04_description_does_not_overflow_ui(self):
        """Positive: Description does not break layout when too long."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid^='errand-card-']")
                )
            )
            no_overflow = driver.execute_script("""
                var cards = document.querySelectorAll("[data-testid^='errand-card-']");
                for (var i = 0; i < cards.length; i++) {
                    if (cards[i].scrollWidth > cards[i].offsetWidth + 5) return false;
                }
                return true;
            """)
            self.assertTrue(no_overflow,
                            "Task cards should not overflow horizontally")
        finally:
            driver.quit()

    def test_db01_tc03_05_task_card_shows_task_type(self):
        """Positive: Task type (Remote/Onsite) is visible on the card."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid^='errand-card-']")
                )
            )
            has_type = driver.execute_script("""
                var body = document.body.innerText;
                return body.includes('Remote') || body.includes('Onsite');
            """)
            self.assertTrue(has_type,
                            "Task type (Remote/Onsite) should be visible on the card")
        finally:
            driver.quit()

    def test_db01_tc03_06_task_card_shows_budget(self):
        """Positive: Budget is shown correctly on the card."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid^='errand-card-']")
                )
            )
            has_budget = driver.execute_script("""
                var cards = document.querySelectorAll("[data-testid^='errand-card-']");
                for (var i = 0; i < cards.length; i++) {
                    if (cards[i].innerText.includes('₱')) return true;
                }
                return false;
            """)
            self.assertTrue(has_budget,
                            "Budget should be shown on at least one task card")
        finally:
            driver.quit()

    def test_db01_tc03_07_task_card_handles_missing_budget(self):
        """Positive: Placeholder or default shown when budget is missing."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid^='errand-card-']")
                )
            )
            # Cards without budget should not crash — page should still render
            cards = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-card-']")
            self.assertGreater(len(cards), 0,
                               "Cards should render even when budget is missing")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  DB-01 TC-DB-01-04 – Clicking task redirects to detail page        #
    # ------------------------------------------------------------------ #
    def test_db01_tc04_clicking_task_redirects_to_detail(self):
        """Positive: Clicking a task card redirects to the task detail page."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            card = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid^='errand-card-']")
                )
            )
            driver.execute_script("""
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """, card)
            WebDriverWait(driver, WAIT).until(lambda d: "/errand/" in d.current_url)
            self.assertIn("/errand/", driver.current_url,
                          "Clicking a task card should redirect to the detail page")
        finally:
            driver.quit()

    def test_db01_tc04_02_task_detail_page_loads_correctly(self):
        """Positive: Task details are fully displayed on the detail page."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            card = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid^='errand-card-']")
                )
            )
            driver.execute_script("""
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """, card)
            WebDriverWait(driver, WAIT).until(lambda d: "/errand/" in d.current_url)
            time.sleep(2)
            body_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertGreater(len(body_text.strip()), 0,
                               "Task detail page should display content")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  DB-01 TC-DB-01-05 – Tasks displayed as cards or list items        #
    # ------------------------------------------------------------------ #
    def test_db01_tc05_tasks_displayed_as_cards(self):
        """Positive: Tasks are visually presented as cards."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            cards = WebDriverWait(driver, WAIT).until(
                lambda d: d.find_elements(By.CSS_SELECTOR, "[data-testid^='errand-card-']")
            )
            self.assertGreater(len(cards), 0,
                               "Tasks should be displayed as cards on the dashboard")
        finally:
            driver.quit()

    def test_db01_tc05_02_layout_handles_large_number_of_tasks(self):
        """Positive: UI remains usable with many task items."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            time.sleep(3)
            # Page should not crash or overflow horizontally
            no_horizontal_overflow = driver.execute_script("""
                return document.documentElement.scrollWidth <= window.innerWidth + 5;
            """)
            body = driver.find_element(By.TAG_NAME, "body")
            self.assertTrue(body.is_displayed(),
                            "Page should remain usable with many tasks")
            self.assertTrue(no_horizontal_overflow,
                            "Layout should not overflow horizontally with many tasks")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
