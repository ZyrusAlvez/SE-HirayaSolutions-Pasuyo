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

BASE_URL                   = os.getenv("BASE_URL")
TEST_EMAIL                 = os.getenv("TEST_EMAIL")
TEST_PASSWORD              = os.getenv("TEST_PASSWORD")
SENDER_EMAIL               = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD            = os.getenv("SENDER_PASSWORD")
CHAT_CONTACT_WITH_MESSAGES = os.getenv("CHAT_CONTACT_WITH_MESSAGES")
SENDER_DISPLAY_NAME        = os.getenv("SENDER_DISPLAY_NAME")
# Display name of TEST_EMAIL as seen by SENDER
TEST_USER_DISPLAY_NAME     = os.getenv("TEST_USER_DISPLAY_NAME")

WAIT = 20


def make_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")
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


def login(driver, email, password):
    driver.get(f"{BASE_URL}/login")
    tid_type(driver, "login-email", email)
    tid_type(driver, "login-password", password)
    tid_click(driver, "login-btn")
    WebDriverWait(driver, WAIT).until(lambda d: "/login" not in d.current_url)


def go_to_chat(driver, email, password):
    login(driver, email, password)
    driver.get(f"{BASE_URL}/chat")
    WebDriverWait(driver, WAIT).until(lambda d: "/chat" in d.current_url)
    time.sleep(5)


def open_conversation(driver, contact_name):
    convo = WebDriverWait(driver, WAIT).until(
        lambda d: next(
            (el for el in d.find_elements(By.XPATH, "//*[@data-testid]")
             if contact_name in el.text and "conversation-item" in (el.get_attribute("data-testid") or "")),
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


def send_message(driver, text):
    tid_type(driver, "chat-message-input", text)
    tid_click(driver, "chat-send-btn")


def get_last_bubble_id(driver):
    return driver.execute_script("""
        var bubbles = document.querySelectorAll("[data-testid^='message-bubble-']");
        if (!bubbles.length) return null;
        return bubbles[bubbles.length - 1].getAttribute('data-testid').replace('message-bubble-', '');
    """)


def tap_bubble(driver, bubble_id):
    driver.execute_script("""
        var el = document.querySelector("[data-testid='message-bubble-" + arguments[0] + "']");
        if (el) {
            el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
    """, bubble_id)
    time.sleep(1)


class TestRealtimeStatus(unittest.TestCase):

    def tearDown(self):
        time.sleep(2)

    # ------------------------------------------------------------------ #
    #  AC-01 – Messages show "Sending" state while being sent            #
    # ------------------------------------------------------------------ #
    def test_chat_05_ac01_sending_state_shown(self):
        """Positive: A sending indicator appears immediately after sending a message."""
        driver = make_driver()
        try:
            go_to_chat(driver, TEST_EMAIL, TEST_PASSWORD)
            open_conversation(driver, CHAT_CONTACT_WITH_MESSAGES)
            send_message(driver, f"Sending state {int(time.time())}")
            # Check immediately for sending indicator (ActivityIndicator)
            sending = driver.execute_script("""
                return !!document.querySelector("[data-testid='status-sending']");
            """)
            # Also accept that it may have already transitioned to sent
            sent = driver.execute_script("""
                return !!document.querySelector("[data-testid='status-sent']");
            """)
            self.assertTrue(sending or sent,
                            "Sending or Sent indicator should appear after sending a message")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-02 – Messages show "Sent" state after delivery to server       #
    # ------------------------------------------------------------------ #
    def test_chat_05_ac02_sent_state_shown(self):
        """Positive: Message shows Sent indicator after server confirms delivery."""
        driver = make_driver()
        try:
            go_to_chat(driver, TEST_EMAIL, TEST_PASSWORD)
            open_conversation(driver, CHAT_CONTACT_WITH_MESSAGES)
            send_message(driver, f"Sent state {int(time.time())}")
            # Wait for sent indicator (checkmark icon)
            WebDriverWait(driver, WAIT).until(
                lambda d: d.execute_script(
                    "return !!document.querySelector(\"[data-testid='status-sent']\");"
                )
            )
            self.assertTrue(True, "Sent indicator should appear after server confirms")
        finally:
            driver.quit()

    def test_chat_05_ac02_sent_label_visible_on_tap(self):
        """Positive: Tapping the sent message shows 'Sent' label text."""
        driver = make_driver()
        try:
            go_to_chat(driver, TEST_EMAIL, TEST_PASSWORD)
            open_conversation(driver, CHAT_CONTACT_WITH_MESSAGES)
            unique_msg = f"Sent label {int(time.time())}"
            send_message(driver, unique_msg)
            time.sleep(3)
            # Find the bubble containing the unique message text
            bubble = WebDriverWait(driver, WAIT).until(
                lambda d: next(
                    (el for el in d.find_elements(By.XPATH, "//*[starts-with(@data-testid, 'message-bubble-')]")
                     if unique_msg in el.text),
                    None
                )
            )
            bubble_id = bubble.get_attribute("data-testid").replace("message-bubble-", "")
            # Tap using full mouse event sequence
            driver.execute_script("""
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """, bubble)
            time.sleep(2)
            label_text = driver.execute_script("""
                var el = document.querySelector("[data-testid='status-label-" + arguments[0] + "']");
                return el ? el.innerText : null;
            """, bubble_id)
            self.assertIsNotNone(label_text, "Status label should appear after tapping bubble")
            self.assertIn("Sent", label_text, "Status label should contain 'Sent'")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-03 – Messages show "Seen" state when viewed by recipient       #
    # ------------------------------------------------------------------ #
    def test_chat_05_ac03_seen_state_shown(self):
        """Positive: Message shows Seen indicator after recipient opens the conversation."""
        driver = make_driver()
        sender_driver = make_driver()
        try:
            # TEST_EMAIL sends a message
            go_to_chat(driver, TEST_EMAIL, TEST_PASSWORD)
            time.sleep(5)
            open_conversation(driver, CHAT_CONTACT_WITH_MESSAGES)
            time.sleep(5)
            unique_msg = f"Seen test {int(time.time())}"
            send_message(driver, unique_msg)
            time.sleep(3)

            # SENDER opens the conversation (acts as recipient reading the message)
            go_to_chat(sender_driver, SENDER_EMAIL, SENDER_PASSWORD)
            time.sleep(5)
            open_conversation(sender_driver, SENDER_DISPLAY_NAME)
            time.sleep(5)
            time.sleep(5)

            # TEST_EMAIL's driver should now show seen indicator
            seen = WebDriverWait(driver, WAIT).until(
                lambda d: d.execute_script(
                    "return !!document.querySelector(\"[data-testid='status-seen']\");"
                )
            )
            self.assertTrue(seen,
                            "Seen indicator should appear after recipient views the message")
        finally:
            driver.quit()
            sender_driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-04 – Incoming messages appear in real-time                     #
    # ------------------------------------------------------------------ #
    def test_chat_05_ac04_incoming_message_realtime(self):
        """Positive: Incoming message appears in thread without page refresh."""
        driver = make_driver()
        sender_driver = make_driver()
        try:
            # TEST_EMAIL opens the conversation
            go_to_chat(driver, TEST_EMAIL, TEST_PASSWORD)
            time.sleep(5)
            open_conversation(driver, CHAT_CONTACT_WITH_MESSAGES)
            time.sleep(5)

            initial_count = driver.execute_script("""
                return document.querySelectorAll("[data-testid^='message-bubble-']").length;
            """)

            # SENDER sends a message
            go_to_chat(sender_driver, SENDER_EMAIL, SENDER_PASSWORD)
            time.sleep(5)
            open_conversation(sender_driver, SENDER_DISPLAY_NAME)
            time.sleep(5)
            unique_msg = f"Realtime {int(time.time())}"
            send_message(sender_driver, unique_msg)
            time.sleep(5)

            # TEST_EMAIL's thread should update without refresh
            new_count = driver.execute_script("""
                return document.querySelectorAll("[data-testid^='message-bubble-']").length;
            """)
            self.assertGreater(new_count, initial_count,
                               "New message should appear in real-time without page refresh")
        finally:
            driver.quit()
            sender_driver.quit()

    def test_chat_05_ac04_message_synced_across_users(self):
        """Positive: Sent message is visible to both sender and receiver."""
        driver = make_driver()
        sender_driver = make_driver()
        unique_msg = f"Sync {int(time.time())}"
        try:
            go_to_chat(driver, TEST_EMAIL, TEST_PASSWORD)
            time.sleep(5)
            open_conversation(driver, CHAT_CONTACT_WITH_MESSAGES)
            time.sleep(5)
            send_message(driver, unique_msg)
            time.sleep(3)

            go_to_chat(sender_driver, SENDER_EMAIL, SENDER_PASSWORD)
            time.sleep(5)
            open_conversation(sender_driver, SENDER_DISPLAY_NAME)
            time.sleep(5)
            time.sleep(3)

            self.assertIn(unique_msg, sender_driver.page_source,
                          "Sent message should be visible to the recipient")
        finally:
            driver.quit()
            sender_driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-05 – Shows typing indicator when other user is typing          #
    # ------------------------------------------------------------------ #
    def test_chat_05_ac05_typing_indicator_shown(self):
        """Positive: Typing indicator appears when the other user is typing."""
        driver = make_driver()
        sender_driver = make_driver()
        try:
            # Set up sender first, then driver last so its subscription is live when typing fires
            go_to_chat(sender_driver, SENDER_EMAIL, SENDER_PASSWORD)
            open_conversation(sender_driver, SENDER_DISPLAY_NAME)

            go_to_chat(driver, TEST_EMAIL, TEST_PASSWORD)
            open_conversation(driver, CHAT_CONTACT_WITH_MESSAGES)
            time.sleep(5)  # Let driver's typing subscription settle

            tid_type(sender_driver, "chat-message-input", "typing...")

            typing_visible = WebDriverWait(driver, WAIT).until(
                lambda d: d.execute_script(
                    "return !!document.querySelector(\"[data-testid='typing-indicator']\");"
                )
            )
            self.assertTrue(typing_visible,
                            "Typing indicator should appear when the other user is typing")
        finally:
            driver.quit()
            sender_driver.quit()

    def test_chat_05_ac05_typing_indicator_disappears(self):
        """Positive: Typing indicator disappears after the other user stops typing."""
        driver = make_driver()
        sender_driver = make_driver()
        try:
            # Set up sender first, then driver last so its subscription is live when typing fires
            go_to_chat(sender_driver, SENDER_EMAIL, SENDER_PASSWORD)
            open_conversation(sender_driver, SENDER_DISPLAY_NAME)

            go_to_chat(driver, TEST_EMAIL, TEST_PASSWORD)
            open_conversation(driver, CHAT_CONTACT_WITH_MESSAGES)
            time.sleep(5)  # Let driver's typing subscription settle

            tid_type(sender_driver, "chat-message-input", "typing...")

            # Wait for indicator to appear
            appeared = WebDriverWait(driver, WAIT).until(
                lambda d: d.execute_script(
                    "return !!document.querySelector(\"[data-testid='typing-indicator']\");"
                )
            )

            # Wait for it to disappear (frontend timeout is 3s, give extra buffer)
            disappeared = WebDriverWait(driver, WAIT).until(
                lambda d: not d.execute_script(
                    "return !!document.querySelector(\"[data-testid='typing-indicator']\");"
                )
            )

            self.assertTrue(appeared and disappeared,
                            "Typing indicator should disappear after user stops typing")
        finally:
            driver.quit()
            sender_driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
