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

BASE_URL           = os.getenv("BASE_URL")
TEST_EMAIL         = os.getenv("TEST_EMAIL")
TEST_PASSWORD      = os.getenv("TEST_PASSWORD")
OTHER_USER_EMAIL   = os.getenv("OTHER_USER_EMAIL")
OTHER_USER_PASSWORD = os.getenv("OTHER_USER_PASSWORD")

# A known remote errand NOT owned by TEST_EMAIL (so Chat/Accept buttons are visible)
KNOWN_ERRAND_TITLE = os.getenv("KNOWN_ERRAND_TITLE")
CHAT_CONTACT_NAME  = os.getenv("CHAT_CONTACT_NAME")

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


def login(driver, email=None, password=None):
    driver.get(f"{BASE_URL}/login")
    tid_type(driver, "login-email", email or TEST_EMAIL)
    tid_type(driver, "login-password", password or TEST_PASSWORD)
    tid_click(driver, "login-btn")
    WebDriverWait(driver, WAIT).until(lambda d: "/login" not in d.current_url)


def go_to_known_errand(driver):
    """Navigate to the detail page of a known errand not owned by TEST_EMAIL."""
    driver.get(f"{BASE_URL}/")
    tid_click(driver, "tab-remote")
    time.sleep(2)
    row = WebDriverWait(driver, WAIT).until(
        lambda d: next(
            (el for el in d.find_elements(By.XPATH, "//*[@data-testid]")
             if KNOWN_ERRAND_TITLE in el.text and "errand-row" in (el.get_attribute("data-testid") or "")),
            None
        )
    )
    driver.execute_script("""
        var el = arguments[0];
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    """, row)
    WebDriverWait(driver, WAIT).until(lambda d: "/errand/" in d.current_url)
    time.sleep(2)


class TestChatInterface(unittest.TestCase):

    def tearDown(self):
        time.sleep(2)

    # ------------------------------------------------------------------ #
    #  AC-01 – Chat button in NavBar redirects to chat interface         #
    # ------------------------------------------------------------------ #
    def test_chat_01_ac01_navbar_chat_redirects(self):
        """Positive: Clicking Chat in the NavBar navigates to /chat."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/")
            tid_click(driver, "nav-chat")
            WebDriverWait(driver, WAIT).until(lambda d: "/chat" in d.current_url)
            self.assertIn("/chat", driver.current_url,
                          "NavBar Chat button should redirect to /chat")
        finally:
            driver.quit()

    def test_chat_01_ac01_navbar_chat_not_accessible_when_logged_out(self):
        """Negative: Unauthenticated user is redirected away from /chat."""
        driver = make_driver()
        try:
            driver.get(f"{BASE_URL}/chat")
            WebDriverWait(driver, WAIT).until(lambda d: "/chat" not in d.current_url)
            self.assertNotIn("/chat", driver.current_url,
                             "Unauthenticated user should not access /chat")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-02 – "Chat with {client}" button redirects to chat             #
    # ------------------------------------------------------------------ #
    def test_chat_01_ac02_chat_with_client_redirects(self):
        """Positive: Clicking 'Chat with {client}' on errand detail navigates to /chat."""
        driver = make_driver()
        try:
            login(driver, OTHER_USER_EMAIL, OTHER_USER_PASSWORD)
            go_to_known_errand(driver)
            # Find the Chat button by partial text
            chat_btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.XPATH, "//*[contains(text(), 'Chat with')]")
                )
            )
            driver.execute_script("""
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """, chat_btn)
            WebDriverWait(driver, WAIT).until(lambda d: "/chat" in d.current_url)
            self.assertIn("/chat", driver.current_url,
                          "'Chat with client' button should redirect to /chat")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-03 – "Accept Errand" button redirects to chat                  #
    # ------------------------------------------------------------------ #
    def test_chat_01_ac03_accept_errand_redirects_to_chat(self):
        """Positive: Clicking 'Accept Errand' on errand detail navigates to /chat."""
        driver = make_driver()
        try:
            login(driver, OTHER_USER_EMAIL, OTHER_USER_PASSWORD)
            go_to_known_errand(driver)
            accept_btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.XPATH, "//*[contains(text(), 'Accept Errand')]")
                )
            )
            driver.execute_script("""
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """, accept_btn)
            WebDriverWait(driver, WAIT).until(lambda d: "/chat" in d.current_url)
            self.assertIn("/chat", driver.current_url,
                          "'Accept Errand' button should redirect to /chat")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-04 – Chat page has two panels: Conversation List + Chat Thread #
    # ------------------------------------------------------------------ #
    def test_chat_01_ac04_two_panels_visible(self):
        """Positive: Chat page shows both the Conversation List panel and Chat Thread panel."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/chat")
            WebDriverWait(driver, WAIT).until(lambda d: "/chat" in d.current_url)
            time.sleep(2)
            # Click on the known contact's conversation to open the thread panel
            convo = WebDriverWait(driver, WAIT).until(
                lambda d: next(
                    (el for el in d.find_elements(By.XPATH, "//*[@data-testid]")
                     if CHAT_CONTACT_NAME in el.text and "conversation-item" in (el.get_attribute("data-testid") or "")),
                    None
                )
            )
            driver.execute_script("""
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """, convo)
            time.sleep(2)
            result = driver.execute_script("""
                var list = document.querySelector("[data-testid='conversation-list-panel']");
                var thread = document.querySelector("[data-testid='chat-thread-panel']");
                var listVisible = list ? list.getBoundingClientRect().width > 0 : false;
                var threadVisible = thread ? thread.getBoundingClientRect().width > 0 : false;
                return { list: listVisible, thread: threadVisible };
            """)
            self.assertTrue(result["list"],
                            "Conversation List panel should be visible on the chat page")
            self.assertTrue(result["thread"],
                            "Chat Thread panel should be visible on the chat page")
        finally:
            driver.quit()

    def test_chat_01_ac04_conversation_list_panel_has_messages_header(self):
        """Positive: Conversation List panel displays a 'Messages' heading."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/chat")
            WebDriverWait(driver, WAIT).until(lambda d: "/chat" in d.current_url)
            time.sleep(2)
            panel = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='conversation-list-panel']")
                )
            )
            self.assertIn("Messages", panel.text,
                          "Conversation List panel should contain a 'Messages' heading")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
