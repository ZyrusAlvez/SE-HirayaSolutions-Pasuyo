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

BASE_URL             = os.getenv("BASE_URL")
WORKER_EMAIL         = os.getenv("WORKER_EMAIL")
WORKER_PASSWORD      = os.getenv("WORKER_PASSWORD")
CLIENT_EMAIL         = os.getenv("CLIENT_EMAIL")
CLIENT_PASSWORD      = os.getenv("CLIENT_PASSWORD")
# Display name of WORKER_EMAIL as seen by CLIENT_EMAIL in the conversation list
WORKER_DISPLAY_NAME  = os.getenv("WORKER_DISPLAY_NAME")

WAIT = 20

CARD_SELECTOR = (
    "[data-testid^='errand-card-']:not([data-testid='errand-card-status'])"
    ":not([data-testid='errand-card-title'])"
    ":not([data-testid='errand-card-description'])"
    ":not([data-testid='errand-card-kebab'])"
)


def make_driver():
    options = webdriver.ChromeOptions()
    # options.add_argument("--headless=new")
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


def login(driver, email, password):
    driver.get(f"{BASE_URL}/login")
    tid_type(driver, "login-email", email)
    tid_type(driver, "login-password", password)
    tid_click(driver, "login-btn")
    WebDriverWait(driver, WAIT).until(lambda d: "/login" not in d.current_url)


def open_mark_done_modal_from_dashboard(driver):
    """Navigate to dashboard accepted tab and open mark done modal via kebab."""
    driver.get(f"{BASE_URL}/dashboard")
    WebDriverWait(driver, WAIT).until(lambda d: "/dashboard" in d.current_url)
    time.sleep(3)
    tid_click(driver, "tab-accepted")
    time.sleep(2)
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
    tid_click(driver, "kebab-mark-done")
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='mark-done-confirm-btn']"))
    )
    time.sleep(0.5)


def open_conversation_with_worker(driver):
    """Navigate to chat and select the conversation with the worker."""
    driver.get(f"{BASE_URL}/chat")
    time.sleep(3)
    convos = WebDriverWait(driver, WAIT).until(
        lambda d: d.find_elements(By.CSS_SELECTOR, "[data-testid^='conversation-item-']")
    )
    target = None
    for c in convos:
        name_el = driver.execute_script(
            "return arguments[0].querySelector(\"[data-testid^='conversation-name-']\");", c
        )
        if name_el and WORKER_DISPLAY_NAME.lower() in driver.execute_script(
            "return arguments[0].innerText.toLowerCase();", name_el
        ):
            target = c
            break
    if target is None:
        target = convos[0]
    driver.execute_script("""
        var el = arguments[0];
        el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    """, target)
    time.sleep(2)



class TestNotif02MarkDone(unittest.TestCase):

    def tearDown(self):
        time.sleep(1)

    # ------------------------------------------------------------------ #
    #  NOTIF-02 AC-01 – Mark as done prompts confirmation                #
    # ------------------------------------------------------------------ #
    def test_notif02_ac01_01_mark_done_shows_confirmation_modal(self):
        """Positive: Clicking Mark as Done shows a confirmation modal."""
        driver = make_driver()
        try:
            login(driver, WORKER_EMAIL, WORKER_PASSWORD)
            open_mark_done_modal_from_dashboard(driver)
            modal_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertIn("Mark as Done", modal_text,
                          "Confirmation modal should appear with 'Mark as Done' title")
        finally:
            driver.quit()

    def test_notif02_ac01_02_modal_dismissed_on_go_back(self):
        """Positive: Modal closes without marking done when Go Back is clicked."""
        driver = make_driver()
        try:
            login(driver, WORKER_EMAIL, WORKER_PASSWORD)
            open_mark_done_modal_from_dashboard(driver)
            tid_click(driver, "mark-done-back-btn")
            time.sleep(1)
            modal = driver.execute_script(
                "return document.querySelector(\"[data-testid='mark-done-confirm-btn']\");"
            )
            self.assertIsNone(modal,
                              "Mark Done modal should be dismissed after clicking Go Back")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  NOTIF-02 AC-02 – Client notified after mark as done               #
    # ------------------------------------------------------------------ #
    def test_notif02_ac02_00_submit_mark_done(self):
        """Setup: Worker confirms Mark as Done before AC-02 and AC-03 checks."""
        driver = make_driver()
        try:
            login(driver, WORKER_EMAIL, WORKER_PASSWORD)
            open_mark_done_modal_from_dashboard(driver)
            tid_click(driver, "mark-done-confirm-btn")
            time.sleep(3)
            toast = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-sonner-toast]"))
            )
            self.assertIn("done", toast.text.lower(),
                          "Toast should confirm the errand was marked as done")
        finally:
            driver.quit()

    def test_notif02_ac02_01_client_receives_inapp_notification(self):
        """Positive: Client receives an in-app notification after worker marks errand as done."""
        driver = make_driver()
        try:
            login(driver, CLIENT_EMAIL, CLIENT_PASSWORD)
            driver.get(f"{BASE_URL}/dashboard")
            time.sleep(3)
            tid_click(driver, "notifications-bell")
            time.sleep(1)
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid^='notification-item-']")
                )
            )
            panel_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertIn("Completed", panel_text,
                          "Client should receive an 'Errand Completed' in-app notification")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  NOTIF-02 AC-03 – Client can rate the worker after completion      #
    # ------------------------------------------------------------------ #
    def test_notif02_ac03_01_rate_card_appears_in_chat(self):
        """Positive: Rate errand card appears in the client's chat thread after completion."""
        driver = make_driver()
        try:
            login(driver, CLIENT_EMAIL, CLIENT_PASSWORD)
            open_conversation_with_worker(driver)
            rate_card = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='rate-errand-card']")
                )
            )
            self.assertTrue(rate_card.is_displayed(),
                            "Rate errand card should appear in client's chat after completion")
        finally:
            driver.quit()

    def test_notif02_ac03_02_submit_btn_disabled_without_rating(self):
        """Negative: Submit Review button is not shown until a star rating is selected."""
        driver = make_driver()
        try:
            login(driver, CLIENT_EMAIL, CLIENT_PASSWORD)
            open_conversation_with_worker(driver)
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='rate-errand-card']")
                )
            )
            submit_btn = driver.execute_script(
                "return document.querySelector(\"[data-testid='rate-submit-btn']\");"
            )
            self.assertIsNone(submit_btn,
                              "Submit Review button should not appear before a star is selected")
        finally:
            driver.quit()

    def test_notif02_ac03_04_submit_btn_appears_after_selecting_star(self):
        """Positive: Submit Review button appears after client selects a star rating."""
        driver = make_driver()
        try:
            login(driver, CLIENT_EMAIL, CLIENT_PASSWORD)
            open_conversation_with_worker(driver)
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='rate-errand-card']")
                )
            )
            tid_click(driver, "star-btn-5")
            time.sleep(1)
            submit_btn = driver.execute_script(
                "return document.querySelector(\"[data-testid='rate-submit-btn']\");"
            )
            self.assertIsNotNone(submit_btn,
                                 "Submit Review button should appear after selecting a star rating")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  NOTIF-02 AC-04 – Rating appears as system message in chat         #
    # ------------------------------------------------------------------ #
    def test_notif02_ac04_00_submit_rating(self):
        """Setup: Client submits a rating before AC-04 system message check."""
        driver = make_driver()
        try:
            login(driver, CLIENT_EMAIL, CLIENT_PASSWORD)
            open_conversation_with_worker(driver)
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='rate-errand-card']")
                )
            )
            tid_click(driver, "star-btn-5")
            time.sleep(1)
            tid_type(driver, "rate-feedback-input", "Great work!")
            time.sleep(0.5)
            tid_click(driver, "rate-submit-btn")
            time.sleep(2)
            toast = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-sonner-toast]"))
            )
            self.assertIn("review", toast.text.lower(),
                          "Toast should confirm the review was submitted")
        finally:
            driver.quit()

    def test_notif02_ac04_01_rating_appears_as_system_message(self):
        """Positive: Rating and feedback appear as a system message in the chat thread."""
        driver = make_driver()
        try:
            login(driver, CLIENT_EMAIL, CLIENT_PASSWORD)
            open_conversation_with_worker(driver)
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='chat-thread-list']")
                )
            )
            body_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertIn("review", body_text.lower(),
                          "Rating should appear as a system message in the chat thread")
        finally:
            driver.quit()

    def test_notif02_ac04_02_worker_sees_rating_system_message(self):
        """Positive: Worker also sees the rating system message in their chat thread."""
        driver = make_driver()
        try:
            login(driver, WORKER_EMAIL, WORKER_PASSWORD)
            open_conversation_with_worker(driver)
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='chat-thread-list']")
                )
            )
            body_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertIn("review", body_text.lower(),
                          "Worker should also see the rating system message in chat")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
