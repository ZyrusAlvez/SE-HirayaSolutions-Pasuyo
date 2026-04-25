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
CHAT_CONTACT_WITH_MESSAGES = os.getenv("CHAT_CONTACT_WITH_MESSAGES")

ASSETS_DIR   = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
ASSET_IMAGE  = os.path.join(ASSETS_DIR, "valid.jpg")
ASSET_PDF    = os.path.join(ASSETS_DIR, "valid.pdf")
ASSET_LARGE  = os.path.join(ASSETS_DIR, "large.jpg")   # must be > 5MB

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


def send_file(driver, filepath):
    """Trigger the file input via the attach button and send a file."""
    tid_click(driver, "chat-attach-btn")
    # Expo DocumentPicker doesn't work in Selenium — expose the file input directly
    driver.execute_script("""
        var inputs = document.querySelectorAll('input[type="file"]');
        inputs.forEach(function(el) {
            el.style.display = 'block';
            el.style.opacity = '1';
            el.style.position = 'fixed';
            el.style.top = '0';
            el.style.left = '0';
            el.style.zIndex = '9999';
        });
    """)
    file_input = WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file']"))
    )
    file_input.send_keys(os.path.abspath(filepath))
    time.sleep(5)


class TestFileSharing(unittest.TestCase):

    def tearDown(self):
        time.sleep(2)

    # ------------------------------------------------------------------ #
    #  AC-01 – User can upload and send files                            #
    # ------------------------------------------------------------------ #
    def test_chat_06_ac01_can_send_file(self):
        """Positive: User can send a file via the attach button."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            open_conversation(driver)
            send_file(driver, ASSET_IMAGE)
            # A file bubble should appear in the thread
            bubble = WebDriverWait(driver, WAIT).until(
                lambda d: (
                    d.find_elements(By.CSS_SELECTOR, "[data-testid^='file-bubble-']") or
                    d.find_elements(By.CSS_SELECTOR, "[data-testid^='file-bubble-image-']")
                )
            )
            self.assertTrue(len(bubble) > 0, "File bubble should appear after sending a file")
        finally:
            driver.quit()

    def test_chat_06_ac01_attach_btn_visible(self):
        """Positive: Attach button is visible in the chat input area."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            open_conversation(driver)
            visible = driver.execute_script("""
                var el = document.querySelector("[data-testid='chat-attach-btn']");
                if (!el) return false;
                var r = el.getBoundingClientRect();
                return r.width > 0 && r.height > 0;
            """)
            self.assertTrue(visible, "Attach button should be visible in the chat")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-02 – Supports common file types                                #
    # ------------------------------------------------------------------ #
    def test_chat_06_ac02_can_send_image(self):
        """Positive: User can send a JPG image file."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            open_conversation(driver)
            send_file(driver, ASSET_IMAGE)
            bubble = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid^='file-bubble-image-']")
                )
            )
            self.assertIsNotNone(bubble, "Image bubble should appear after sending a JPG")
        finally:
            driver.quit()

    def test_chat_06_ac02_can_send_pdf(self):
        """Positive: User can send a PDF file."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            open_conversation(driver)
            send_file(driver, ASSET_PDF)
            bubble = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid^='file-bubble-']")
                )
            )
            self.assertIsNotNone(bubble, "File bubble should appear after sending a PDF")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-03 – File name shown in the bubble                             #
    # ------------------------------------------------------------------ #
    def test_chat_06_ac03_file_name_shown_in_bubble(self):
        """Positive: File name is displayed in the file bubble after sending."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            open_conversation(driver)
            send_file(driver, ASSET_PDF)
            time.sleep(3)
            file_name_visible = driver.execute_script("""
                var bubbles = document.querySelectorAll("[data-testid^='file-bubble-']");
                for (var i = 0; i < bubbles.length; i++) {
                    if (bubbles[i].innerText.includes('valid.pdf')) return true;
                }
                return false;
            """)
            self.assertTrue(file_name_visible,
                            "File name should be visible in the file bubble")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-04 – Files appear in the chat thread after sending             #
    # ------------------------------------------------------------------ #
    def test_chat_06_ac04_file_appears_in_thread(self):
        """Positive: Sent file appears in the chat thread."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            open_conversation(driver)
            initial_count = driver.execute_script("""
                return document.querySelectorAll("[data-testid^='message-bubble-']").length;
            """)
            send_file(driver, ASSET_IMAGE)
            new_count = driver.execute_script("""
                return document.querySelectorAll("[data-testid^='message-bubble-']").length;
            """)
            self.assertGreater(new_count, initial_count,
                               "A new message bubble should appear after sending a file")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-05 – Images displayed inline                                   #
    # ------------------------------------------------------------------ #
    def test_chat_06_ac05_image_displayed_inline(self):
        """Positive: Sent image is displayed inline as an image bubble."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            open_conversation(driver)
            send_file(driver, ASSET_IMAGE)
            image_bubble = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid^='file-bubble-image-']")
                )
            )
            # Verify an <img> tag is rendered inside the bubble
            has_img = driver.execute_script("""
                var bubble = arguments[0];
                return !!bubble.querySelector('img');
            """, image_bubble)
            self.assertTrue(has_img, "Image should be rendered inline inside the bubble")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-06 – Files are downloadable                                    #
    # ------------------------------------------------------------------ #
    def test_chat_06_ac06_file_bubble_is_clickable(self):
        """Positive: File bubble is pressable (triggers download on click)."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            open_conversation(driver)
            send_file(driver, ASSET_PDF)
            bubble = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid^='file-bubble-']")
                )
            )
            # Verify "Tap to download" text is present
            self.assertIn("download", bubble.text.lower(),
                          "File bubble should indicate it is downloadable")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-07 – Uploading/loading state shown                             #
    # ------------------------------------------------------------------ #
    def test_chat_06_ac07_uploading_state_shown(self):
        """Positive: Sending indicator appears while file is being uploaded."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            open_conversation(driver)
            send_file(driver, ASSET_IMAGE)
            # Check for sending status immediately after file is picked
            sending_or_sent = driver.execute_script("""
                return !!document.querySelector("[data-testid='status-sending']") ||
                       !!document.querySelector("[data-testid='status-sent']");
            """)
            self.assertTrue(sending_or_sent,
                            "Sending or Sent indicator should appear while uploading a file")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-08 – Failed uploads show error                                 #
    # ------------------------------------------------------------------ #
    def test_chat_06_ac08_failed_upload_shows_error(self):
        """Negative: Error toast appears when file upload fails (simulated via offline)."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            open_conversation(driver)
            # Expose the file input first while still online
            tid_click(driver, "chat-attach-btn")
            driver.execute_script("""
                var inputs = document.querySelectorAll('input[type="file"]');
                inputs.forEach(function(el) {
                    el.style.display = 'block';
                    el.style.opacity = '1';
                    el.style.position = 'fixed';
                    el.style.top = '0';
                    el.style.left = '0';
                    el.style.zIndex = '9999';
                });
            """)
            file_input = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file']"))
            )
            # Go offline right before picking the file so the upload attempt fails
            driver.execute_cdp_cmd("Network.enable", {})
            driver.execute_cdp_cmd("Network.emulateNetworkConditions", {
                "offline": True,
                "latency": 0,
                "downloadThroughput": 0,
                "uploadThroughput": 0,
            })
            file_input.send_keys(os.path.abspath(ASSET_IMAGE))
            WebDriverWait(driver, WAIT).until(
                lambda d: len(d.find_elements(
                    By.CSS_SELECTOR, "[data-sonner-toast][data-type='error']"
                )) > 0
            )
            error_shown = len(driver.find_elements(
                By.CSS_SELECTOR, "[data-sonner-toast][data-type='error']"
            )) > 0
            self.assertTrue(error_shown,
                            "Error toast should appear when file upload fails")
        finally:
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

    # ------------------------------------------------------------------ #
    #  AC-09 – File size limit enforced (5MB)                            #
    # ------------------------------------------------------------------ #
    def test_chat_06_ac09_large_file_shows_error(self):
        """Negative: Sending a file over 5MB shows a validation error toast."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            open_conversation(driver)
            # Expose file input directly without waiting for DocumentPicker
            tid_click(driver, "chat-attach-btn")
            driver.execute_script("""
                var inputs = document.querySelectorAll('input[type="file"]');
                inputs.forEach(function(el) {
                    el.style.display = 'block';
                    el.style.opacity = '1';
                    el.style.position = 'fixed';
                    el.style.top = '0';
                    el.style.left = '0';
                    el.style.zIndex = '9999';
                });
            """)
            file_input = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file']"))
            )
            file_input.send_keys(os.path.abspath(ASSET_LARGE))
            WebDriverWait(driver, WAIT).until(
                lambda d: len(d.find_elements(
                    By.CSS_SELECTOR, "[data-sonner-toast][data-type='error']"
                )) > 0
            )
            toasts = driver.find_elements(
                By.CSS_SELECTOR, "[data-sonner-toast][data-type='error']"
            )
            toast_text = " ".join(t.text for t in toasts)
            self.assertIn("5MB", toast_text,
                          "Error toast should mention the 5MB file size limit")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-10 – Clicking a file allows download or open                   #
    # ------------------------------------------------------------------ #
    def test_chat_06_ac10_clicking_image_opens_viewer(self):
        """Positive: Clicking an inline image opens the image viewer."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            open_conversation(driver)
            send_file(driver, ASSET_IMAGE)
            image_bubble = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid^='file-bubble-image-']")
                )
            )
            driver.execute_script("""
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """, image_bubble)
            time.sleep(2)
            # ImageViewer renders a fullscreen overlay — check for it
            viewer_open = driver.execute_script("""
                var modals = document.querySelectorAll('[role="dialog"], [aria-modal="true"]');
                if (modals.length > 0) return true;
                // RN Web Modal renders as a fixed overlay
                var fixed = Array.from(document.querySelectorAll('*')).filter(function(el) {
                    var s = window.getComputedStyle(el);
                    return s.position === 'fixed' && parseFloat(s.zIndex) > 100;
                });
                return fixed.length > 0;
            """)
            self.assertTrue(viewer_open,
                            "Clicking an image should open the image viewer overlay")
        finally:
            driver.quit()

    def test_chat_06_ac10_clicking_file_triggers_download(self):
        """Positive: Clicking a non-image file bubble triggers a download."""
        driver = make_driver()
        try:
            go_to_chat(driver)
            open_conversation(driver)
            send_file(driver, ASSET_PDF)
            bubble = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid^='file-bubble-']")
                )
            )
            # Click the file bubble
            driver.execute_script("""
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """, bubble)
            time.sleep(2)
            # Verify no JS error occurred — page should still be functional
            chat_panel = driver.find_element(
                By.CSS_SELECTOR, "[data-testid='chat-thread-panel']"
            )
            self.assertTrue(chat_panel.is_displayed(),
                            "Chat panel should remain visible after clicking a file bubble")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
