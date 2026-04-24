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
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

BASE_URL                   = os.getenv("BASE_URL")
TEST_EMAIL                 = os.getenv("TEST_EMAIL")
TEST_PASSWORD              = os.getenv("TEST_PASSWORD")
CHAT_CONTACT_WITH_MESSAGES = os.getenv("CHAT_CONTACT_WITH_MESSAGES")

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


def get_input_value(driver, test_id):
    return driver.execute_script("""
        var wrapper = document.querySelector("[data-testid='" + arguments[0] + "']");
        var el = wrapper.tagName === 'INPUT' || wrapper.tagName === 'TEXTAREA'
            ? wrapper : (wrapper.querySelector('textarea') || wrapper.querySelector('input'));
        return el ? el.value : null;
    """, test_id)


def login(driver):
    driver.get(f"{BASE_URL}/login")
    tid_type(driver, "login-email", TEST_EMAIL)
    tid_type(driver, "login-password", TEST_PASSWORD)
    tid_click(driver, "login-btn")
    WebDriverWait(driver, WAIT).until(lambda d: "/login" not in d.current_url)


def go_to_chat(driver):
    login(driver)
    driver.get(f"{BASE_URL}/chat")
    WebDriverWait(driver, WAIT).until(lambda d: "/chat" in d.current_url)
    time.sleep(5)


def open_conversation(driver):
    convo = WebDriverWait(driver, WAIT).until(
        lambda d: next(
            (el for el in d.find_elements(By.XPATH, "//*[@data-testid]")
             if CHAT_CONTACT_WITH_MESSAGES in el.text and "conversation-item" in (el.get_attribute("data-testid") or "")),
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


def get_input_el(driver):
    """Return the actual input/textarea element inside chat-message-input."""
    return driver.execute_script("""
        var wrapper = document.querySelector("[data-testid='chat-message-input']");
        return wrapper.tagName === 'INPUT' || wrapper.tagName === 'TEXTAREA'
            ? wrapper : (wrapper.querySelector('textarea') || wrapper.querySelector('input'));
    """)


class TestMessageSending(unittest.TestCase):

    def tearDown(self):
        time.sleep(2)

    # ------------------------------------------------------------------ #
    #  AC-01 – User can send a message via input field                   #
    # ------------------------------------------------------------------ #
    def test_chat_04_ac01_user_can_send_message(self):
        """Positive: User can type and send a message."""
        driver = make_driver()
        unique_msg = f"Hello AC01 {int(time.time())}"
        try:
            go_to_chat(driver)
            open_conversation(driver)
            tid_type(driver, "chat-message-input", unique_msg)
            tid_click(driver, "chat-send-btn")
            time.sleep(3)
            self.assertIn(unique_msg, driver.page_source,
                          "Sent message should appear in the thread")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-02 – Input field is cleared after sending                      #
    # ------------------------------------------------------------------ #
    def test_chat_04_ac02_input_cleared_after_send(self):
        """Positive: Input field is empty after a message is sent."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            open_conversation(driver)
            tid_type(driver, "chat-message-input", f"Clear test {int(time.time())}")
            tid_click(driver, "chat-send-btn")
            time.sleep(2)
            value = get_input_value(driver, "chat-message-input")
            self.assertEqual(value, "",
                             "Input field should be empty after sending a message")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-03 – Sending disabled when input is empty                      #
    # ------------------------------------------------------------------ #
    def test_chat_04_ac03_send_btn_inactive_when_empty(self):
        """Positive: Send button has inactive styling when input is empty."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            time.sleep(5)
            open_conversation(driver)
            time.sleep(5)
            # Ensure input is empty
            value = get_input_value(driver, "chat-message-input")
            self.assertEqual(value, "", "Input should be empty initially")
            # Send button should have grey background (#D1D5DB) when input is empty
            bg_color = driver.execute_script("""
                var btn = document.querySelector("[data-testid='chat-send-btn']");
                return btn ? window.getComputedStyle(btn).backgroundColor : null;
            """)
            # rgb(209, 213, 219) = #D1D5DB (inactive grey)
            self.assertIn("209", bg_color,
                          "Send button should be grey (inactive) when input is empty")
        finally:
            driver.quit()

    def test_chat_04_ac03_send_btn_active_when_typed(self):
        """Positive: Send button becomes active (blue) when input has text."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            time.sleep(5)
            open_conversation(driver)
            time.sleep(5)
            tid_type(driver, "chat-message-input", "Hello")
            time.sleep(1)
            bg_color = driver.execute_script("""
                var btn = document.querySelector("[data-testid='chat-send-btn']");
                return btn ? window.getComputedStyle(btn).backgroundColor : null;
            """)
            # rgb(59, 130, 246) = #3B82F6 (active blue)
            self.assertIn("59", bg_color,
                          "Send button should be blue (active) when input has text")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-04 – Supports sending via Enter key                            #
    # ------------------------------------------------------------------ #
    def test_chat_04_ac04_send_via_enter_key(self):
        """Positive: Pressing Enter sends the message."""
        driver = make_driver()
        unique_msg = f"Enter key test {int(time.time())}"
        try:
            go_to_chat(driver)
            time.sleep(5)
            open_conversation(driver)
            time.sleep(5)
            tid_type(driver, "chat-message-input", unique_msg)
            # Press Enter on the actual input element
            input_el = get_input_el(driver)
            input_el.send_keys(Keys.RETURN)
            time.sleep(3)
            self.assertIn(unique_msg, driver.page_source,
                          "Message should be sent when Enter key is pressed")
        finally:
            driver.quit()

    def test_chat_04_ac04_enter_clears_input(self):
        """Positive: Input is cleared after sending via Enter key."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            time.sleep(5)
            open_conversation(driver)
            time.sleep(5)
            tid_type(driver, "chat-message-input", f"Enter clear {int(time.time())}")
            input_el = get_input_el(driver)
            input_el.send_keys(Keys.RETURN)
            time.sleep(2)
            value = get_input_value(driver, "chat-message-input")
            self.assertEqual(value, "",
                             "Input should be cleared after sending via Enter key")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-05 – Sent messages appear instantly in the thread              #
    # ------------------------------------------------------------------ #
    def test_chat_04_ac05_message_appears_instantly(self):
        """Positive: Sent message appears in the thread without page reload."""
        driver = make_driver()
        unique_msg = f"Instant {int(time.time())}"
        try:
            go_to_chat(driver)
            time.sleep(5)
            open_conversation(driver)
            time.sleep(5)
            tid_type(driver, "chat-message-input", unique_msg)
            tid_click(driver, "chat-send-btn")
            # Check within 3 seconds — no reload needed
            WebDriverWait(driver, 3).until(
                lambda d: unique_msg in d.page_source
            )
            self.assertIn(unique_msg, driver.page_source,
                          "Sent message should appear instantly in the thread")
        finally:
            driver.quit()

    def test_chat_04_ac05_optimistic_bubble_shown(self):
        """Positive: Message bubble appears immediately (optimistic update) before server confirms."""
        driver = make_driver()
        unique_msg = f"Optimistic {int(time.time())}"
        try:
            go_to_chat(driver)
            time.sleep(5)
            open_conversation(driver)
            time.sleep(5)
            tid_type(driver, "chat-message-input", unique_msg)
            tid_click(driver, "chat-send-btn")
            # Immediately check — optimistic bubble should be in DOM
            found = driver.execute_script("""
                var bubbles = document.querySelectorAll("[data-testid^='message-bubble-']");
                for (var i = 0; i < bubbles.length; i++) {
                    if (bubbles[i].innerText.includes(arguments[0])) return true;
                }
                return false;
            """, unique_msg)
            self.assertTrue(found,
                            "Optimistic message bubble should appear immediately after sending")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-06 – Chat scrolls to latest message                            #
    # ------------------------------------------------------------------ #
    def test_chat_04_ac06_scrolls_to_latest_message(self):
        """Positive: After sending, the thread scrolls to show the latest message."""
        driver = make_driver()
        unique_msg = f"Scroll test {int(time.time())}"
        try:
            go_to_chat(driver)
            time.sleep(5)
            open_conversation(driver)
            time.sleep(5)
            tid_type(driver, "chat-message-input", unique_msg)
            tid_click(driver, "chat-send-btn")
            time.sleep(3)
            # The sent message bubble should be visible in the viewport
            visible = driver.execute_script("""
                var bubbles = document.querySelectorAll("[data-testid^='message-bubble-']");
                for (var i = 0; i < bubbles.length; i++) {
                    if (bubbles[i].innerText.includes(arguments[0])) {
                        var r = bubbles[i].getBoundingClientRect();
                        return r.top >= 0 && r.bottom <= window.innerHeight;
                    }
                }
                return false;
            """, unique_msg)
            self.assertTrue(visible,
                            "Latest sent message should be visible in the viewport after sending")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
