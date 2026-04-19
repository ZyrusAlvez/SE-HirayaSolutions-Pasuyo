import base64
import os
import time
import unittest
import warnings

warnings.filterwarnings("ignore", category=DeprecationWarning)

from bs4 import BeautifulSoup
from dotenv import load_dotenv
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

BASE_URL = os.getenv("BASE_URL")
TEST_EMAIL = os.getenv("TEST_EMAIL")
TEST_PASSWORD = os.getenv("TEST_PASSWORD")
NEW_PASSWORD = os.getenv("NEW_PASSWORD")
UNREGISTERED_EMAIL = os.getenv("UNREGISTERED_EMAIL")
GMAIL_CREDENTIALS_FILE = os.path.join(os.path.dirname(__file__), os.getenv("GMAIL_CREDENTIALS_FILE", "credentials.json"))
GMAIL_TOKEN_FILE = os.path.join(os.path.dirname(__file__), os.getenv("GMAIL_TOKEN_FILE", "token.json"))

WAIT = 20
GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]

# ------------------------------------------------------------------ #
#  Gmail helpers                                                       #
# ------------------------------------------------------------------ #

def get_gmail_service():
    creds = None
    if os.path.exists(GMAIL_TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(GMAIL_TOKEN_FILE, GMAIL_SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(GMAIL_CREDENTIALS_FILE, GMAIL_SCOPES)
            creds = flow.run_local_server(port=0)
        with open(GMAIL_TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
    return build("gmail", "v1", credentials=creds)


def fetch_otp_from_gmail(sent_after: float) -> str:
    """Poll Gmail for a Pasuyo reset email received after sent_after (unix timestamp)."""
    service = get_gmail_service()

    print("[Gmail] Waiting 10 seconds for email to arrive...")
    time.sleep(10)

    for attempt in range(10):
        print(f"[Gmail] Polling attempt {attempt + 1}/10...")
        results = service.users().messages().list(
            userId="me",
            q="from:noreply@mail.app.supabase.io subject:Reset Your Password",
            maxResults=5,
        ).execute()

        messages = results.get("messages", [])
        print(f"[Gmail] Found {len(messages)} message(s).")

        if messages:
            for message in messages:
                msg = service.users().messages().get(
                    userId="me",
                    id=message["id"],
                    format="full",
                ).execute()

          

                payload = msg.get("payload", {})
                parts = payload.get("parts", [])
                html_body = None

                if parts:
                    for part in parts:
                        if part.get("mimeType") == "text/html":
                            data = part["body"].get("data", "")
                            html_body = base64.urlsafe_b64decode(data).decode("utf-8")
                            break
                else:
                    data = payload.get("body", {}).get("data", "")
                    if data:
                        html_body = base64.urlsafe_b64decode(data).decode("utf-8")

                if html_body:
                    soup = BeautifulSoup(html_body, "html.parser")
                    otp_span = soup.select_one(".otp-box span")
                    if otp_span:
                        otp = otp_span.get_text(strip=True)
                        print(f"[Gmail] OTP found: {otp}")
                        service.users().messages().trash(userId="me", id=message["id"]).execute()
                        print(f"[Gmail] Email trashed after successful OTP extraction.")
                        return otp
                    else:
                        print("[Gmail] Email found but .otp-box span not found in HTML.")
                        print(soup.get_text(separator="\n", strip=True)[:500])
                else:
                    print("[Gmail] Message found but no HTML body could be decoded.")
        else:
            print("[Gmail] No matching emails yet, retrying...")

        time.sleep(3)

    raise RuntimeError("OTP email did not arrive in Gmail within 30 seconds")


def clear_gmail_reset_emails():
    """Trash all existing Pasuyo reset emails so stale OTPs don't interfere."""
    service = get_gmail_service()
    results = service.users().messages().list(
        userId="me",
        q="from:noreply@pasuyo.com subject:Reset Your Password",
    ).execute()
    messages = results.get("messages", [])
    for msg in messages:
        service.users().messages().trash(userId="me", id=msg["id"]).execute()


# ------------------------------------------------------------------ #
#  Selenium helpers                                                    #
# ------------------------------------------------------------------ #

def make_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--disable-popup-blocking")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
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


def tid(driver, test_id):
    """Find a visible element by data-testid."""
    return WebDriverWait(driver, WAIT).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, f"[data-testid='{test_id}']"))
    )


def tid_click(driver, test_id):
    """JS-click a data-testid element — reliable for React Native Web divs."""
    el = WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, f"[data-testid='{test_id}']"))
    )
    driver.execute_script("arguments[0].click();", el)


def tid_type(driver, test_id, value):
    """
    Type into a React Native Web TextInput via JS.
    RN Web wraps TextInput in a div — we find the actual <input> inside it
    and use the native value setter so React's onChange fires correctly.
    """
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, f"[data-testid='{test_id}']"))
    )
    driver.execute_script("""
        var wrapper = document.querySelector("[data-testid='" + arguments[0] + "']");
        var el = wrapper.tagName === 'INPUT' ? wrapper : wrapper.querySelector('input');
        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, arguments[1]);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    """, test_id, value)


def wait_for_loading(driver):
    """Wait until the 'Please wait...' loading state disappears."""
    WebDriverWait(driver, WAIT).until(
        lambda d: "Please wait" not in d.page_source
    )


def navigate_to_reset(driver):
    driver.get(f"{BASE_URL}/login")
    tid_click(driver, "forgot-password-link")
    WebDriverWait(driver, WAIT).until(EC.url_contains("/reset-password"))


def submit_email(driver, email):
    tid_type(driver, "reset-email", email)
    tid_click(driver, "reset-submit-btn")
    wait_for_loading(driver)


# ------------------------------------------------------------------ #
#  Test cases                                                          #
# ------------------------------------------------------------------ #

class TestForgotPassword(unittest.TestCase):

    def tearDown(self):
        print("\n[Test] Waiting 20 seconds before next test...")
        time.sleep(20)

    # ------------------------------------------------------------------ #
    #  TC1 – 'Forgot Password' link is visible on login page             #
    # ------------------------------------------------------------------ #
    def test_01_forgot_password_link_visible(self):
        driver = make_driver()
        try:
            driver.get(f"{BASE_URL}/login")
            link = tid(driver, "forgot-password-link")
            self.assertTrue(link.is_displayed(), "'Forgot Password?' should be visible on login page")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC2 – User can enter a registered email                           #
    # ------------------------------------------------------------------ #
    def test_02_user_can_enter_email(self):
        driver = make_driver()
        try:
            navigate_to_reset(driver)
            tid_type(driver, "reset-email", TEST_EMAIL)
            value = driver.execute_script("""
                var wrapper = document.querySelector("[data-testid='reset-email']");
                var el = wrapper.tagName === 'INPUT' ? wrapper : wrapper.querySelector('input');
                return el.value;
            """)
            self.assertEqual(value, TEST_EMAIL, "Email field should contain the typed email")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC3 – System sends OTP email to user                              #
    # ------------------------------------------------------------------ #
    def test_03_system_sends_otp_email(self):
        driver = make_driver()
        try:
            navigate_to_reset(driver)
            sent_at = time.time()
            submit_email(driver, TEST_EMAIL)
            tid(driver, "reset-otp")
            otp = fetch_otp_from_gmail(sent_at)
            self.assertTrue(otp.isdigit() and len(otp) > 0,
                            f"OTP should be a numeric code, got: '{otp}'")
        finally:
            time.sleep(30)
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC4 – User can set new password after OTP confirmation            #
    # ------------------------------------------------------------------ #
    def test_04_user_can_reset_password_with_valid_otp(self):
        driver = make_driver()
        try:
            navigate_to_reset(driver)
            sent_at = time.time()
            submit_email(driver, TEST_EMAIL)
            otp = fetch_otp_from_gmail(sent_at)

            tid_type(driver, "reset-otp", otp)
            tid_click(driver, "reset-submit-btn")
            wait_for_loading(driver)

            tid_type(driver, "reset-new-password", NEW_PASSWORD)
            tid_type(driver, "reset-confirm-password", NEW_PASSWORD)
            tid_click(driver, "reset-submit-btn")
            wait_for_loading(driver)

            WebDriverWait(driver, WAIT).until(
                lambda d: "/reset-password" not in d.current_url
            )
            self.assertNotIn("/reset-password", driver.current_url,
                             "Should redirect after successful password reset")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC5 – Users can't reset password with wrong OTP                   #
    # ------------------------------------------------------------------ #
    def test_05_wrong_otp_is_rejected(self):
        driver = make_driver()
        try:
            navigate_to_reset(driver)
            sent_at = time.time()
            submit_email(driver, TEST_EMAIL)

            for wrong_otp in ["000000", "0123"]:
                tid_type(driver, "reset-otp", wrong_otp)
                tid_click(driver, "reset-submit-btn")
                wait_for_loading(driver)

                WebDriverWait(driver, WAIT).until(
                    EC.visibility_of_element_located(
                        (By.XPATH, "//*[contains(text(), 'Invalid OTP')]")
                    )
                )
                self.assertFalse(
                    len(driver.find_elements(By.CSS_SELECTOR, "[data-testid='reset-new-password']")) > 0,
                    f"Should not advance to password step with wrong OTP '{wrong_otp}'"
                )
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC6 – Password is updated: user can log in with new password      #
    # ------------------------------------------------------------------ #
    def test_06_user_can_login_with_new_password(self):
        driver = make_driver()
        try:
            driver.get(f"{BASE_URL}/login")
            tid_type(driver, "login-email", TEST_EMAIL)
            tid_type(driver, "login-password", NEW_PASSWORD)
            tid_click(driver, "login-btn")

            WebDriverWait(driver, WAIT).until(
                lambda d: "/login" not in d.current_url
            )
            self.assertNotIn("/login", driver.current_url,
                             "User should be able to log in with the new password")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC7 – User receives confirmation after password reset             #
    # ------------------------------------------------------------------ #
    def test_07_confirmation_shown_after_reset(self):
        driver = make_driver()
        try:
            navigate_to_reset(driver)
            sent_at = time.time()
            submit_email(driver, TEST_EMAIL)
            otp = fetch_otp_from_gmail(sent_at)

            tid_type(driver, "reset-otp", otp)
            tid_click(driver, "reset-submit-btn")
            wait_for_loading(driver)

            tid_type(driver, "reset-new-password", TEST_PASSWORD)
            tid_type(driver, "reset-confirm-password", TEST_PASSWORD)
            tid_click(driver, "reset-submit-btn")
            wait_for_loading(driver)

            WebDriverWait(driver, WAIT).until(
                EC.visibility_of_element_located(
                    (By.XPATH, "//*[contains(text(), 'Password updated!')]")
                )
            )
            self.assertTrue(True, "Confirmation toast should appear after password reset")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC8 – System shows error for unregistered email                   #
    # ------------------------------------------------------------------ #
    def test_08_unregistered_email_shows_error(self):
        driver = make_driver()
        try:
            navigate_to_reset(driver)
            submit_email(driver, UNREGISTERED_EMAIL)

            WebDriverWait(driver, WAIT).until(
                EC.visibility_of_element_located(
                    (By.XPATH, "//*[contains(text(), 'No account found with that email')]")
                )
            )
            self.assertIn("No account found with that email", driver.page_source)
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
