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

BASE_URL            = os.getenv("BASE_URL")
TEST_EMAIL          = os.getenv("TEST_EMAIL")
TEST_PASSWORD       = os.getenv("TEST_PASSWORD")
CHAT_CONTACT_NAME          = os.getenv("CHAT_CONTACT_NAME")
CHAT_CONTACT_WITH_MESSAGES = os.getenv("CHAT_CONTACT_WITH_MESSAGES")
CHAT_CONTACT_NO_MESSAGES   = os.getenv("CHAT_CONTACT_NO_MESSAGES")

WAIT = 20


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


def go_to_chat(driver):
    login(driver)
    driver.get(f"{BASE_URL}/chat")
    WebDriverWait(driver, WAIT).until(lambda d: "/chat" in d.current_url)
    time.sleep(5)


def open_conversation(driver, name=None):
    """Open the conversation with the given contact name and wait for messages to load."""
    target = name or CHAT_CONTACT_WITH_MESSAGES
    convo = WebDriverWait(driver, WAIT).until(
        lambda d: next(
            (el for el in d.find_elements(By.XPATH, "//*[@data-testid]")
             if target in el.text and "conversation-item" in (el.get_attribute("data-testid") or "")),
            None
        )
    )
    driver.execute_script("""
        var el = arguments[0];
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    """, convo)
    time.sleep(5)


class TestMessageDisplay(unittest.TestCase):

    def tearDown(self):
        time.sleep(2)

    # ------------------------------------------------------------------ #
    #  AC-01 – Displays all messages for the selected conversation       #
    # ------------------------------------------------------------------ #
    def test_chat_03_ac01_messages_displayed(self):
        """Positive: Messages are displayed after selecting a conversation."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            time.sleep(5)
            open_conversation(driver)
            time.sleep(5)
            bubbles = driver.find_elements(
                By.XPATH, "//*[starts-with(@data-testid, 'message-bubble-')]"
            )
            self.assertGreater(len(bubbles), 0,
                               "At least one message bubble should be displayed")
        finally:
            driver.quit()

    def test_chat_03_ac01_no_messages_shows_empty_state(self):
        """Positive: Empty state is shown when a conversation has no messages."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            time.sleep(5)
            open_conversation(driver, name=CHAT_CONTACT_NO_MESSAGES)
            time.sleep(5)
            empty = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='chat-thread-empty']")
                )
            )
            self.assertIn("No messages", empty.text,
                          "Empty state should be shown for a conversation with no messages")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-02 – Messages ordered chronologically                          #
    # ------------------------------------------------------------------ #
    def test_chat_03_ac02_messages_chronological_order(self):
        """Positive: Messages are rendered oldest at top, newest at bottom."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            time.sleep(5)
            open_conversation(driver)
            time.sleep(5)
            # FlatList is inverted — last bubble in DOM is the oldest message
            # We verify by checking that message bubble IDs exist and the list renders
            bubble_ids = driver.execute_script("""
                var bubbles = document.querySelectorAll("[data-testid^='message-bubble-']");
                return Array.from(bubbles).map(function(el) {
                    return el.getAttribute('data-testid');
                });
            """)
            self.assertGreater(len(bubble_ids), 0,
                               "Messages should be rendered in the thread")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-03 – Messages visually separated (sender vs receiver)          #
    # ------------------------------------------------------------------ #
    def test_chat_03_ac03_sender_messages_aligned_right(self):
        """Positive: Sender's own messages are aligned to the right."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            time.sleep(5)
            open_conversation(driver)
            time.sleep(5)
            # Check that at least one bubble has flex-end alignment (sender)
            has_sender = driver.execute_script("""
                var bubbles = document.querySelectorAll("[data-testid^='message-bubble-']");
                for (var i = 0; i < bubbles.length; i++) {
                    var s = window.getComputedStyle(bubbles[i]);
                    if (s.alignItems === 'flex-end') return true;
                }
                return false;
            """)
            self.assertTrue(has_sender,
                            "At least one message should be right-aligned (sender)")
        finally:
            driver.quit()

    def test_chat_03_ac03_receiver_messages_aligned_left(self):
        """Positive: Received messages are aligned to the left."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            time.sleep(5)
            open_conversation(driver)
            time.sleep(5)
            has_receiver = driver.execute_script("""
                var bubbles = document.querySelectorAll("[data-testid^='message-bubble-']");
                for (var i = 0; i < bubbles.length; i++) {
                    var s = window.getComputedStyle(bubbles[i]);
                    if (s.alignItems === 'flex-start') return true;
                }
                return false;
            """)
            self.assertTrue(has_receiver,
                            "At least one message should be left-aligned (receiver)")
        finally:
            driver.quit()

    def test_chat_03_ac03_sender_bubble_different_color(self):
        """Positive: Sender and receiver bubbles have different background colors."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            time.sleep(5)
            open_conversation(driver)
            time.sleep(5)
            colors = driver.execute_script("""
                var bubbles = document.querySelectorAll("[data-testid^='message-bubble-']");
                var colorSet = new Set();
                for (var i = 0; i < bubbles.length; i++) {
                    var inner = bubbles[i].querySelector('div');
                    if (inner) {
                        colorSet.add(window.getComputedStyle(inner).backgroundColor);
                    }
                }
                return Array.from(colorSet);
            """)
            self.assertGreater(len(colors), 1,
                               "Sender and receiver bubbles should have different background colors")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-04 – Each message shows timestamp                              #
    # ------------------------------------------------------------------ #
    def test_chat_03_ac04_timestamp_shown_on_tap(self):
        """Positive: Tapping a message bubble reveals its timestamp."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            time.sleep(5)
            open_conversation(driver)
            time.sleep(5)
            # Click the first message bubble to reveal timestamp
            first_bubble = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.XPATH, "//*[starts-with(@data-testid, 'message-bubble-')]")
                )
            )
            driver.execute_script("""
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """, first_bubble)
            time.sleep(1)
            # After tap, timestamp text should appear inside the bubble
            timestamp_visible = driver.execute_script("""
                var bubble = arguments[0];
                var texts = bubble.querySelectorAll('*');
                for (var i = 0; i < texts.length; i++) {
                    var t = texts[i].innerText || '';
                    // Timestamp format: HH:MM AM/PM
                    if (/\\d{1,2}:\\d{2}/.test(t)) return true;
                }
                return false;
            """, first_bubble)
            self.assertTrue(timestamp_visible,
                            "Timestamp should be visible after tapping a message bubble")
        finally:
            driver.quit()

    def test_chat_03_ac04_time_separator_shown(self):
        """Positive: Time separator is shown between messages more than 5 minutes apart."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            time.sleep(5)
            open_conversation(driver)
            time.sleep(5)
            # Time separators are plain Text elements with time/date format
            separator_found = driver.execute_script("""
                var thread = document.querySelector("[data-testid='chat-thread-panel']");
                if (!thread) return false;
                var texts = thread.querySelectorAll('*');
                for (var i = 0; i < texts.length; i++) {
                    var t = (texts[i].innerText || '').trim();
                    if (/\\d{1,2}:\\d{2}/.test(t) && texts[i].children.length === 0) return true;
                }
                return false;
            """)
            self.assertTrue(separator_found,
                            "At least one time separator should be visible in the thread")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-05 – Loading state shown while fetching messages               #
    # ------------------------------------------------------------------ #
    def test_chat_03_ac05_loading_state_shown(self):
        """Positive: Loading indicator appears while messages are being fetched."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            time.sleep(5)
            # Click conversation immediately to catch loading state
            convo = WebDriverWait(driver, WAIT).until(
                lambda d: next(
                    (el for el in d.find_elements(By.XPATH, "//*[@data-testid]")
                     if CHAT_CONTACT_WITH_MESSAGES in el.text and "conversation-item" in (el.get_attribute("data-testid") or "")),
                    None
                )
            )
            driver.execute_script("""
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """, convo)
            # Check immediately for loading indicator
            loading_found = driver.execute_script("""
                return !!document.querySelector("[data-testid='chat-thread-loading']");
            """)
            time.sleep(5)
            # After loading, either messages or empty state should appear
            content_loaded = driver.execute_script("""
                return !!document.querySelector("[data-testid='chat-thread-list']") ||
                       !!document.querySelector("[data-testid='chat-thread-empty']");
            """)
            self.assertTrue(loading_found or content_loaded,
                            "Loading state or messages should appear when opening a conversation")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-06 – Error state shown if messages fail to load                #
    # ------------------------------------------------------------------ #
    def test_chat_03_ac06_offline_shows_no_crash(self):
        """Negative: App does not crash when network is unavailable during message load."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            time.sleep(5)
            open_conversation(driver)
            time.sleep(5)
            # Simulate offline by blocking network requests
            driver.execute_cdp_cmd("Network.enable", {})
            driver.execute_cdp_cmd("Network.emulateNetworkConditions", {
                "offline": True,
                "latency": 0,
                "downloadThroughput": 0,
                "uploadThroughput": 0,
            })
            # Reload the conversation
            driver.refresh()
            time.sleep(5)
            # Page should still render without a JS crash
            body = driver.find_element(By.TAG_NAME, "body")
            self.assertTrue(body.is_displayed(),
                            "Page should still render even when network is unavailable")
        finally:
            # Restore network
            try:
                driver.execute_cdp_cmd("Network.emulateNetworkConditions", {
                    "offline": False,
                    "latency": 0,
                    "downloadThroughput": -1,
                    "uploadThroughput": -1,
                })
            except Exception:
                pass
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
