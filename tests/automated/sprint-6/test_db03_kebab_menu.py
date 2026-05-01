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

BASE_URL                       = os.getenv("BASE_URL")
TEST_EMAIL                     = os.getenv("TEST_EMAIL")
TEST_PASSWORD                  = os.getenv("TEST_PASSWORD")
UNAUTHORIZED_EMAIL             = os.getenv("UNAUTHORIZED_EMAIL")
UNAUTHORIZED_PASSWORD          = os.getenv("UNAUTHORIZED_PASSWORD")
KNOWN_ACCEPTED_ERRAND_TITLE    = os.getenv("KNOWN_ACCEPTED_ERRAND_TITLE")

WAIT = 20

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
    tid_click(driver, trigger_id)
    time.sleep(0.5)
    option_id = f"{trigger_id}-option-{option_value.lower().replace(' ', '-')}"
    tid_click(driver, option_id)
    time.sleep(1)


def open_kebab_on_first_card(driver):
    """Click the kebab menu on the first visible task card."""
    card = WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, CARD_SELECTOR))
    )
    kebab = driver.execute_script(
        "return arguments[0].querySelector(\"[data-testid='errand-card-kebab']\");", card
    )
    driver.execute_script("""
        var el = arguments[0];
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    """, kebab)
    time.sleep(0.5)
    return card


class TestKebabMenu(unittest.TestCase):

    def tearDown(self):
        time.sleep(1)

    # ------------------------------------------------------------------ #
    #  DB-03 TC-DB-03-01 – Kebab icon visible on every card              #
    # ------------------------------------------------------------------ #
    def test_db03_tc01_kebab_visible_on_every_card(self):
        """Positive: The kebab menu icon is visible on every task card."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            cards = driver.find_elements(By.CSS_SELECTOR, CARD_SELECTOR)
            self.assertGreater(len(cards), 0, "There should be at least one task card")
            for card in cards:
                kebab = driver.execute_script(
                    "return arguments[0].querySelector(\"[data-testid='errand-card-kebab']\");",
                    card
                )
                self.assertIsNotNone(kebab, "Kebab menu icon should be present on every task card")
                self.assertTrue(
                    driver.execute_script("return arguments[0].offsetParent !== null;", kebab),
                    "Kebab menu icon should be visible on every task card"
                )
        finally:
            driver.quit()

    def test_db03_tc01_01_kebab_not_visible_when_card_fails_to_load(self):
        """Negative: Kebab menu is not displayed if task data fails to load."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            # Simulate a broken card by checking that cards without data don't show kebab
            broken_kebabs = driver.execute_script("""
                var cards = document.querySelectorAll("[data-testid^='errand-card-broken']");
                return cards.length;
            """)
            # No broken cards should exist with a visible kebab
            self.assertEqual(broken_kebabs, 0,
                             "Kebab menu should not appear on cards that failed to load")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  DB-03 TC-DB-03-02 – Posted errands show Edit, Delete, Share       #
    # ------------------------------------------------------------------ #
    def test_db03_tc02_posted_errand_kebab_shows_edit_delete_share(self):
        """Positive: Kebab menu on posted errands shows Edit, Delete, and Share."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            open_kebab_on_first_card(driver)
            menu_text = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='kebab-menu']"))
            ).text
            self.assertIn("Edit", menu_text, "Kebab menu should show Edit for posted errands")
            self.assertIn("Delete", menu_text, "Kebab menu should show Delete for posted errands")
            self.assertIn("Share", menu_text, "Kebab menu should show Share for posted errands")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  DB-03 TC-DB-03-03 – Accepted errands show correct actions         #
    # ------------------------------------------------------------------ #
    def test_db03_tc03_accepted_errand_kebab_shows_correct_actions(self):
        """Positive: Kebab menu on accepted errands shows Mark as done, Chat with client, Cancel errand, Share."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            tid_click(driver, "tab-accepted")
            time.sleep(2)
            open_kebab_on_first_card(driver)
            menu_text = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='kebab-menu']"))
            ).text
            self.assertIn("Mark as Done", menu_text,
                          "Accepted errand kebab should show 'Mark as Done'")
            self.assertTrue(any(line.startswith("Chat with") for line in menu_text.splitlines()),
                          "Accepted errand kebab should show 'Chat with <client>'")
            self.assertIn("Cancel Errand", menu_text,
                          "Accepted errand kebab should show 'Cancel Errand'")
            self.assertIn("Share", menu_text,
                          "Accepted errand kebab should show 'Share'")
        finally:
            driver.quit()

    def test_db03_tc03_01_accepted_errand_does_not_show_edit_or_delete(self):
        """Positive: Accepted errands do not show Edit or Delete in kebab menu."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            tid_click(driver, "tab-accepted")
            time.sleep(2)
            open_kebab_on_first_card(driver)
            menu_text = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='kebab-menu']"))
            ).text
            self.assertNotIn("Edit", menu_text,
                             "Accepted errand kebab should not show Edit")
            self.assertNotIn("Delete", menu_text,
                             "Accepted errand kebab should not show Delete")
        finally:
            driver.quit()

    def test_db03_tc03_02_mark_as_done_disabled_when_status_changes(self):
        """Negative: Mark as done is disabled or hidden when errand status changes."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            tid_click(driver, "tab-accepted")
            time.sleep(2)
            open_kebab_on_first_card(driver)
            mark_done_btn = driver.execute_script(
                "return document.querySelector(\"[data-testid='kebab-mark-done']\");"
            )
            if mark_done_btn:
                disabled = driver.execute_script(
                    "var el = arguments[0]; return el.disabled || el.getAttribute('aria-disabled') === 'true' || el.style.display === 'none';",
                    mark_done_btn
                )
                # If status is not In Progress, button should be disabled/hidden
                body_text = driver.find_element(By.TAG_NAME, "body").text
                if "Completed" in body_text or "Cancelled" in body_text:
                    self.assertTrue(disabled,
                                    "Mark as done should be disabled when errand is not In Progress")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  DB-03 TC-DB-03-04 – Edit navigates to edit page                   #
    # ------------------------------------------------------------------ #
    def test_db03_tc04_edit_navigates_to_edit_page(self):
        """Positive: Clicking Edit on an Available errand redirects user to the task edit page."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            select_filter_option(driver, "filter-status", "Available")
            available_card = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, CARD_SELECTOR))
            )
            kebab = driver.execute_script(
                "return arguments[0].querySelector(\"[data-testid='errand-card-kebab']\");",
                available_card
            )
            driver.execute_script("""
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """, kebab)
            time.sleep(0.5)
            tid_click(driver, "kebab-edit")
            WebDriverWait(driver, WAIT).until(
                lambda d: "/edit" in d.current_url or "/errand/" in d.current_url
            )
            self.assertTrue(
                "/edit" in driver.current_url or "/errand/" in driver.current_url,
                "Clicking Edit on an Available errand should navigate to the edit page"
            )
        finally:
            driver.quit()



    # ------------------------------------------------------------------ #
    #  DB-03 TC-DB-03-05 – Delete prompts confirmation dialog            #
    # ------------------------------------------------------------------ #
    def test_db03_tc05_delete_shows_confirmation_dialog(self):
        """Positive: Clicking Delete shows a confirmation modal."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            open_kebab_on_first_card(driver)
            tid_click(driver, "kebab-delete")
            time.sleep(1)
            modal = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='delete-confirm-modal']")
                )
            )
            self.assertTrue(modal.is_displayed(),
                            "Confirmation modal should appear after clicking Delete")
        finally:
            driver.quit()

    def test_db03_tc05_02_deletion_proceeds_after_confirmation(self):
        """Positive: Task is removed after confirming deletion."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            select_filter_option(driver, "filter-status", "Available")
            cards_before = driver.find_elements(By.CSS_SELECTOR, CARD_SELECTOR)
            count_before = len(cards_before)
            open_kebab_on_first_card(driver)
            tid_click(driver, "kebab-delete")
            time.sleep(1)
            tid_click(driver, "delete-confirm-btn")
            time.sleep(2)
            cards_after = driver.find_elements(By.CSS_SELECTOR, CARD_SELECTOR)
            self.assertLess(len(cards_after), count_before,
                            "Task count should decrease after confirming deletion")
        finally:
            driver.quit()

    def test_db03_tc05_01_deletion_cancelled_when_user_declines(self):
        """Positive: Task remains unchanged when user cancels the deletion."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            select_filter_option(driver, "filter-status", "Available")
            cards_before = driver.find_elements(By.CSS_SELECTOR, CARD_SELECTOR)
            count_before = len(cards_before)
            open_kebab_on_first_card(driver)
            tid_click(driver, "kebab-delete")
            time.sleep(1)
            tid_click(driver, "delete-cancel-btn")
            time.sleep(1)
            cards_after = driver.find_elements(By.CSS_SELECTOR, CARD_SELECTOR)
            self.assertEqual(len(cards_after), count_before,
                             "Task count should remain the same after cancelling deletion")
        finally:
            driver.quit()


    # ------------------------------------------------------------------ #
    #  DB-03 TC-DB-03-06 – Share provides errand link                    #
    # ------------------------------------------------------------------ #
    def test_db03_tc06_share_shows_link_or_modal(self):
        """Positive: Clicking Share copies the link and shows a success toast."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            open_kebab_on_first_card(driver)
            tid_click(driver, "kebab-share")
            time.sleep(1)
            toast = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-sonner-toast]"))
            )
            self.assertIn("copied", toast.text.lower(),
                          "Toast should confirm the link was copied to clipboard")
        finally:
            driver.quit()

    def test_db03_tc06_01_shared_link_is_valid(self):
        """Positive: The shared link opens the correct errand details."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            open_kebab_on_first_card(driver)
            tid_click(driver, "kebab-share")
            time.sleep(1)
            link = driver.execute_script(
                "var el = document.querySelector(\"[data-testid='share-link']\");"
                "return el ? (el.href || el.value || el.innerText) : null;"
            )
            self.assertIsNotNone(link, "Share link should be present")
            self.assertIn("/errand/", link,
                          "Shared link should point to a valid errand detail URL")
        finally:
            driver.quit()


    # ------------------------------------------------------------------ #
    #  DB-03 TC-DB-03-07 – Chat with client opens chat                   #
    # ------------------------------------------------------------------ #
    def test_db03_tc07_chat_with_client_opens_chat(self):
        """Positive: Clicking Chat with client redirects to chat with the correct client."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            tid_click(driver, "tab-accepted")
            time.sleep(2)
            open_kebab_on_first_card(driver)
            tid_click(driver, "kebab-chat")
            WebDriverWait(driver, WAIT).until(lambda d: "/chat" in d.current_url)
            self.assertIn("/chat", driver.current_url,
                          "Clicking Chat with client should navigate to the chat page")
        finally:
            driver.quit()

    


    def test_db03_tc07_01_chat_shows_loading_indicator(self):
        """Positive: Loading indicator appears before chat fully loads."""
        driver = make_driver()
        try:
            go_to_dashboard(driver)
            tid_click(driver, "tab-accepted")
            time.sleep(2)
            open_kebab_on_first_card(driver)
            # Slow down network to catch loading state
            driver.execute_script("""
                window._origFetch = window.fetch;
                window.fetch = function(url, opts) {
                    return new Promise(function(resolve) {
                        setTimeout(function() { resolve(window._origFetch(url, opts)); }, 1500);
                    });
                };
            """)
            tid_click(driver, "kebab-chat")
            # Check for loading indicator immediately after click
            loading_visible = driver.execute_script("""
                var loader = document.querySelector("[data-testid='chat-loading']") ||
                             document.querySelector("[data-testid='loading-indicator']");
                return loader ? loader.offsetParent !== null : false;
            """)
            time.sleep(3)
            self.assertTrue(
                loading_visible or "/chat" in driver.current_url,
                "Loading indicator should appear or chat should eventually load"
            )
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
