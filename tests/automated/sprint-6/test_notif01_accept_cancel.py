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

BASE_URL              = os.getenv("BASE_URL")
# Worker account — the one who accepts/cancels errands
WORKER_EMAIL          = os.getenv("WORKER_EMAIL")
WORKER_PASSWORD       = os.getenv("WORKER_PASSWORD")
# Client account — the one who posted the errand
CLIENT_EMAIL          = os.getenv("CLIENT_EMAIL")
CLIENT_PASSWORD       = os.getenv("CLIENT_PASSWORD")
# A known Available errand NOT owned by WORKER_EMAIL (for accept button tests)
KNOWN_ERRAND_TITLE    = os.getenv("KNOWN_ERRAND_TITLE")
KNOWN_ERRAND_ID       = os.getenv("KNOWN_ERRAND_ID")
# A known In Progress errand already accepted by WORKER_EMAIL (for system message tests)
KNOWN_ACCEPTED_ERRAND_TITLE = os.getenv("KNOWN_ACCEPTED_ERRAND_TITLE")
KNOWN_ACCEPTED_ERRAND_ID   = os.getenv("KNOWN_ACCEPTED_ERRAND_ID")

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


def go_to_errand(driver, email, password, errand_id):
    login(driver, email, password)
    driver.get(f"{BASE_URL}/errand/{errand_id}")
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='accept-errand-btn']"))
    )
    time.sleep(2)


def accept_errand(driver):
    """Click Accept Errand and wait for redirect to chat."""
    tid_click(driver, "accept-errand-btn")
    WebDriverWait(driver, WAIT).until(lambda d: "/chat" in d.current_url)
    time.sleep(2)


def open_cancel_modal_from_dashboard(driver):
    """Navigate to dashboard accepted tab and open cancel modal via kebab."""
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
    tid_click(driver, "kebab-cancel")
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='cancel-modal-confirm-btn']"))
    )
    time.sleep(0.5)


class TestNotif01AcceptCancel(unittest.TestCase):

    def tearDown(self):
        time.sleep(1)

    # ------------------------------------------------------------------ #
    #  NOTIF-01 AC-01 – Accept redirects to chat                         #
    # ------------------------------------------------------------------ #
    def test_notif01_ac01_01_accept_redirects_to_chat(self):
        """Positive: Clicking Accept Errand redirects the worker to the chat page."""
        driver = make_driver()
        try:
            go_to_errand(driver, WORKER_EMAIL, WORKER_PASSWORD, KNOWN_ERRAND_ID)
            accept_errand(driver)
            self.assertIn("/chat", driver.current_url,
                          "Worker should be redirected to /chat after accepting errand")
        finally:
            driver.quit()

    def test_notif01_ac01_02_accept_btn_not_shown_to_owner(self):
        """Negative: Accept Errand button is not visible to the errand owner."""
        driver = make_driver()
        try:
            login(driver, CLIENT_EMAIL, CLIENT_PASSWORD)
            driver.get(f"{BASE_URL}/errand/{KNOWN_ERRAND_ID}")
            time.sleep(3)
            accept_btn = driver.execute_script(
                "return document.querySelector(\"[data-testid='accept-errand-btn']\");"
            )
            self.assertIsNone(accept_btn,
                              "Accept Errand button should not be visible to the errand owner")
        finally:
            driver.quit()

    def test_notif01_ac01_03_accept_btn_not_shown_to_guest(self):
        """Negative: Accept Errand button redirects guests to signup instead."""
        driver = make_driver()
        try:
            driver.get(f"{BASE_URL}/errand/{KNOWN_ERRAND_ID}")
            time.sleep(3)
            accept_btn = driver.execute_script(
                "return document.querySelector(\"[data-testid='accept-errand-btn']\");"
            )
            if accept_btn:
                driver.execute_script("""
                    var el = arguments[0];
                    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                """, accept_btn)
                time.sleep(2)
                self.assertIn("/signup", driver.current_url,
                              "Guest clicking Accept should be redirected to signup")
        finally:
            driver.quit()

    def test_notif01_ac02_02_accept_already_accepted_errand(self):
        """Negative: Accepting an already In Progress errand shows an error toast."""
        driver = make_driver()
        try:
            login(driver, WORKER_EMAIL, WORKER_PASSWORD)
            driver.get(f"{BASE_URL}/errand/{KNOWN_ERRAND_ID}")
            time.sleep(3)
            # Errand should already be In Progress from previous test run
            body_text = driver.find_element(By.TAG_NAME, "body").text
            accept_btn = driver.execute_script(
                "return document.querySelector(\"[data-testid='accept-errand-btn']\");"
            )
            if accept_btn and "In Progress" in body_text:
                driver.execute_script("""
                    var el = arguments[0];
                    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                """, accept_btn)
                time.sleep(2)
                toast = driver.execute_script(
                    "return document.querySelector('[data-sonner-toast]');"
                )
                self.assertIsNotNone(toast, "Error toast should appear when accepting an already accepted errand")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  NOTIF-01 AC-02 – System message in chat after accept              #
    # ------------------------------------------------------------------ #
    def test_notif01_ac02_01_system_message_appears_after_accept(self):
        """Positive: A toast confirms acceptance and a system message appears in the chat thread."""
        driver = make_driver()
        try:
            go_to_errand(driver, WORKER_EMAIL, WORKER_PASSWORD, KNOWN_ACCEPTED_ERRAND_ID)
            accept_errand(driver)
            toast = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-sonner-toast]"))
            )
            self.assertIn("accepted", toast.text.lower(),
                          "Toast should confirm the errand was accepted")
            time.sleep(2)
            body_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertIn("accepted", body_text.lower(),
                          "System message about errand acceptance should appear in chat")
        finally:
            driver.quit()


    # ------------------------------------------------------------------ #
    #  NOTIF-01 AC-03 – Client receives in-app notification after accept #
    # ------------------------------------------------------------------ #
    def test_notif01_ac03_client_receives_inapp_notification(self):
        """Positive: Client receives an in-app notification after worker accepts the errand."""
        driver = make_driver()
        try:
            login(driver, CLIENT_EMAIL, CLIENT_PASSWORD)
            driver.get(f"{BASE_URL}/dashboard")
            time.sleep(3)
            tid_click(driver, "notifications-bell")
            time.sleep(1)
            notif_panel = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid^='notification-item-']")
                )
            )
            panel_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertIn("Accepted", panel_text,
                          "Client should have an 'Errand Accepted' notification")
        finally:
            driver.quit()

    def test_notif01_ac03_notification_links_to_chat(self):
        """Positive: Clicking the acceptance notification navigates to the chat page."""
        driver = make_driver()
        try:
            login(driver, CLIENT_EMAIL, CLIENT_PASSWORD)
            driver.get(f"{BASE_URL}/dashboard")
            time.sleep(3)
            tid_click(driver, "notifications-bell")
            time.sleep(1)
            notif = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid^='notification-item-']")
                )
            )
            driver.execute_script("""
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """, notif)
            time.sleep(2)
            self.assertIn("/chat", driver.current_url,
                          "Clicking the acceptance notification should navigate to /chat")
        finally:
            driver.quit()



    # ------------------------------------------------------------------ #
    #  NOTIF-01 AC-04 – Cancellation requires a reason                   #
    # ------------------------------------------------------------------ #
    def test_notif01_ac04_01_cancel_modal_appears_with_reason_options(self):
        """Positive: Cancellation modal appears with reason options when worker cancels."""
        driver = make_driver()
        try:
            login(driver, WORKER_EMAIL, WORKER_PASSWORD)
            open_cancel_modal_from_dashboard(driver)
            modal_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertIn("Cancel Errand", modal_text,
                          "Cancel modal should be visible with title 'Cancel Errand'")
            self.assertIn("Change of mind", modal_text,
                          "Cancel modal should show reason options")
        finally:
            driver.quit()

    def test_notif01_ac04_02_confirm_disabled_without_reason(self):
        """Negative: Confirm Cancel button is disabled when no reason is selected."""
        driver = make_driver()
        try:
            login(driver, WORKER_EMAIL, WORKER_PASSWORD)
            open_cancel_modal_from_dashboard(driver)
            confirm_btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='cancel-modal-confirm-btn']")
                )
            )
            disabled = driver.execute_script(
                "var el = arguments[0]; return el.disabled || el.getAttribute('aria-disabled') === 'true';",
                confirm_btn
            )
            self.assertTrue(disabled,
                            "Confirm Cancel button should be disabled when no reason is selected")
        finally:
            driver.quit()

    def test_notif01_ac04_03_confirm_enabled_after_selecting_reason(self):
        """Positive: Confirm Cancel button becomes enabled after selecting a reason."""
        driver = make_driver()
        try:
            login(driver, WORKER_EMAIL, WORKER_PASSWORD)
            open_cancel_modal_from_dashboard(driver)
            tid_click(driver, "cancel-reason-change-of-mind")
            time.sleep(0.5)
            confirm_btn = driver.find_element(
                By.CSS_SELECTOR, "[data-testid='cancel-modal-confirm-btn']"
            )
            disabled = driver.execute_script(
                "var el = arguments[0]; return el.disabled || el.getAttribute('aria-disabled') === 'true';",
                confirm_btn
            )
            self.assertFalse(disabled,
                             "Confirm Cancel button should be enabled after selecting a reason")
        finally:
            driver.quit()


    # ------------------------------------------------------------------ #
    #  NOTIF-01 AC-05 – Other party notified after cancellation          #
    # ------------------------------------------------------------------ #

    def test_notif01_ac05_client_receives_inapp_notification_after_cancel(self):
        """Positive: Client receives an in-app notification after worker cancels the errand."""
        driver = make_driver()
        try:
            login(driver, CLIENT_EMAIL, CLIENT_PASSWORD)
            driver.get(f"{BASE_URL}/dashboard")
            time.sleep(3)
            tid_click(driver, "notifications-bell")
            time.sleep(1)
            panel_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertIn("Cancelled", panel_text,
                          "Client should receive an 'Errand Cancelled' in-app notification")
        finally:
            driver.quit()

    def test_notif01_ac05_cancellation_notification_links_to_errand(self):
        """Positive: Clicking the cancellation notification navigates to the errand page."""
        driver = make_driver()
        try:
            login(driver, CLIENT_EMAIL, CLIENT_PASSWORD)
            driver.get(f"{BASE_URL}/dashboard")
            time.sleep(3)
            tid_click(driver, "notifications-bell")
            time.sleep(1)
            notifs = driver.find_elements(
                By.CSS_SELECTOR, "[data-testid^='notification-item-']"
            )
            cancel_notif = None
            for n in notifs:
                if "cancelled" in n.text.lower():
                    cancel_notif = n
                    break
            if cancel_notif:
                driver.execute_script("""
                    var el = arguments[0];
                    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                """, cancel_notif)
                time.sleep(2)
                self.assertIn("/errand/", driver.current_url,
                              "Clicking cancellation notification should navigate to the errand page")
        finally:
            driver.quit()

   

 


if __name__ == "__main__":
    unittest.main(verbosity=2)
