import os
import time
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

BASE_URL             = os.getenv("BASE_URL")
ADMIN_EMAIL          = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD       = os.getenv("ADMIN_PASSWORD")
PENDING_TEST_EMAIL   = os.getenv("PENDING_TEST_EMAIL")
PENDING_TEST_PASSWORD = os.getenv("PENDING_TEST_PASSWORD")

WAIT = 20
ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")
VALID_JPG  = os.path.join(ASSETS_DIR, "valid.jpg")


def make_driver():
    options = webdriver.ChromeOptions()
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
    return WebDriverWait(driver, WAIT).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, f"[data-testid='{test_id}']"))
    )


def tid_click(driver, test_id):
    el = WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, f"[data-testid='{test_id}']"))
    )
    driver.execute_script("arguments[0].click();", el)


def tid_type(driver, test_id, value):
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


def upload_file_to_slot(driver, btn_test_id, filepath):
    abs_path = os.path.abspath(filepath)
    tid_click(driver, btn_test_id)
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
    file_input.send_keys(abs_path)
    time.sleep(1)


def login(driver, email, password):
    driver.get(f"{BASE_URL}/login")
    tid_type(driver, "login-email", email)
    tid_type(driver, "login-password", password)
    tid_click(driver, "login-btn")
    WebDriverWait(driver, WAIT).until(lambda d: "/login" not in d.current_url)


def login_as_admin(driver):
    login(driver, ADMIN_EMAIL, ADMIN_PASSWORD)
    WebDriverWait(driver, WAIT).until(EC.url_contains("/admin"))


def submit_verification_form(driver):
    """Log in as pending test user and submit the full verification form."""
    login(driver, PENDING_TEST_EMAIL, PENDING_TEST_PASSWORD)
    driver.get(f"{BASE_URL}/profile")
    tid_click(driver, "verify-account-btn")
    WebDriverWait(driver, WAIT).until(EC.url_contains("/verify"))

    # Step 1
    tid_type(driver, "step1-first-name", "Test")
    tid_type(driver, "step1-last-name", "Pending")
    tid_click(driver, "step1-gender-male")
    # Wait for hidden native date input then set value directly
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='step1-dob-input-native']"))
    )
    driver.execute_script("""
        var el = document.querySelector("[data-testid='step1-dob-input-native']");
        el.removeAttribute('style');
        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, '2000-01-01');
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    """)
    tid_click(driver, "verify-next-btn")

    # Step 2
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='step2-province']"))
    )
    tid_click(driver, "step2-province")
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='step2-province-option-0']"))
    )
    tid_click(driver, "step2-province-option-0")
    tid_click(driver, "step2-city")
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='step2-city-option-0']"))
    )
    tid_click(driver, "step2-city-option-0")
    tid_click(driver, "step2-barangay")
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='step2-barangay-option-0']"))
    )
    tid_click(driver, "step2-barangay-option-0")
    tid_type(driver, "step2-house-no", "123")
    tid_type(driver, "step2-street", "Test Street")
    tid_click(driver, "verify-next-btn")

    # Step 3
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='step3-bill-water']"))
    )
    tid_click(driver, "step3-bill-water")
    upload_file_to_slot(driver, "step3-front-upload-btn", VALID_JPG)
    upload_file_to_slot(driver, "step3-back-upload-btn", VALID_JPG)
    tid_click(driver, "verify-next-btn")

    # Step 4
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='id-type-national-id']"))
    )
    tid_click(driver, "id-type-national-id")
    upload_file_to_slot(driver, "id-front-upload-btn", VALID_JPG)
    upload_file_to_slot(driver, "id-back-upload-btn", VALID_JPG)
    tid_click(driver, "verify-next-btn")

    # Wait for success screen
    WebDriverWait(driver, WAIT * 2).until(
        EC.visibility_of_element_located(
            (By.XPATH, "//*[contains(text(), 'Verification Submitted')]")
        )
    )


def navigate_to_pending_user(driver):
    """Go to admin pending list and click the verification card matching PENDING_TEST_EMAIL."""
    driver.get(f"{BASE_URL}/admin/accounts")
    tid_click(driver, "sort-pending")
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid^='verification-card-']"))
    )
    # Find the email element matching PENDING_TEST_EMAIL and extract the user ID from its testID
    email_els = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='verification-email-']")
    for el in email_els:
        if PENDING_TEST_EMAIL.lower() in el.text.lower():
            user_id = el.get_attribute("data-testid").replace("verification-email-", "")
            tid_click(driver, f"verification-card-{user_id}")
            WebDriverWait(driver, WAIT).until(EC.url_contains("/admin/verification/"))
            return
    raise RuntimeError(f"No verification card found for {PENDING_TEST_EMAIL}")


class TestAdminVerification(unittest.TestCase):

    def tearDown(self):
        time.sleep(3)

    # ------------------------------------------------------------------ #
    #  Submit verification form first so there is a pending request      #
    # ------------------------------------------------------------------ #
    def test_ac_00_submit_verification_form(self):
        """Setup: Submit verification form as pending test user."""
        driver = make_driver()
        try:
            submit_verification_form(driver)
            self.assertIn("Verification Submitted", driver.page_source,
                          "Verification form should be submitted successfully")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ADMIN-02-01 – Reject verification first                        #
    # ------------------------------------------------------------------ #
    def test_ac_01_admin_can_see_pending_verification_list(self):
        """Positive: Admin can see pending verification requests."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            driver.get(f"{BASE_URL}/admin/accounts")
            tid_click(driver, "sort-pending")
            cards = WebDriverWait(driver, WAIT).until(
                lambda d: d.find_elements(By.CSS_SELECTOR, "[data-testid^='verification-card-']")
            )
            self.assertGreater(len(cards), 0,
                               "Admin should see at least one pending verification card")
        finally:
            driver.quit()

    def test_ac_01_01_verification_card_shows_user_info(self):
        """Positive: Verification card shows user name and email."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            driver.get(f"{BASE_URL}/admin/accounts")
            tid_click(driver, "sort-pending")
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid^='verification-card-']"))
            )
            self.assertIn("Submitted", driver.page_source,
                          "Verification card should show submission date")
        finally:
            driver.quit()

    def test_ac_02_admin_can_view_verification_details(self):
        """Positive: Admin can open a verification request and view details."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            navigate_to_pending_user(driver)
            self.assertIn("/admin/verification/", driver.current_url,
                          "Admin should navigate to verification detail page")
            # Wait for the page content to fully load
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='admin-approve-btn']"))
            )
            self.assertTrue(
                len(driver.find_elements(By.CSS_SELECTOR, "[data-testid='admin-approve-btn']")) > 0,
                "Verification detail page should be visible"
            )
        finally:
            driver.quit()

    def test_ac_02_01_verification_detail_shows_approve_reject_buttons(self):
        """Positive: Approve and Reject buttons are visible on verification detail page."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            navigate_to_pending_user(driver)
            approve_btn = tid(driver, "admin-approve-btn")
            reject_btn = tid(driver, "admin-reject-btn")
            self.assertTrue(approve_btn.is_displayed(), "Approve button should be visible")
            self.assertTrue(reject_btn.is_displayed(), "Reject button should be visible")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ADMIN-02-02 – Reject verification (runs before approve)        #
    # ------------------------------------------------------------------ #
    def test_ac_03_admin_can_reject_verification(self):
        """Positive: Admin can reject a verification request."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            navigate_to_pending_user(driver)
            tid_click(driver, "admin-reject-btn")

            # Confirm modal appears
            tid(driver, "admin-confirm-btn")
            tid_click(driver, "admin-confirm-btn")

            # Wait for navigation back to admin
            time.sleep(5)
            WebDriverWait(driver, WAIT).until(EC.url_contains("/admin"))
            self.assertNotIn("/verification/", driver.current_url,
                             "Should navigate away after rejection")
        finally:
            driver.quit()

    def test_ac_04_reject_modal_shows_confirmation(self):
        """Positive: Clicking Reject shows a confirmation modal."""
        user_driver = make_driver()
        admin_driver = make_driver()
        try:
            # Re-submit form in one browser since previous test rejected it
            submit_verification_form(user_driver)

            # Check modal in a separate admin browser
            login_as_admin(admin_driver)
            navigate_to_pending_user(admin_driver)
            tid_click(admin_driver, "admin-reject-btn")

            confirm_btn = tid(admin_driver, "admin-confirm-btn")
            self.assertTrue(confirm_btn.is_displayed(),
                            "Confirmation modal should appear after clicking Reject")
        finally:
            user_driver.quit()
            admin_driver.quit()

    def test_ac_05_cancel_reject_keeps_pending_status(self):
        """Negative: Cancelling the reject modal keeps the verification as pending."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            navigate_to_pending_user(driver)
            tid_click(driver, "admin-reject-btn")

            # Click Cancel instead of Confirm
            cancel_btn = WebDriverWait(driver, WAIT).until(
                EC.element_to_be_clickable(
                    (By.XPATH, "//*[contains(text(), 'Cancel')]")
                )
            )
            driver.execute_script("arguments[0].click();", cancel_btn)
            time.sleep(1)

            # Should still be on verification detail page
            self.assertIn("/admin/verification/", driver.current_url,
                          "Should remain on verification page after cancelling")
            reject_btn = tid(driver, "admin-reject-btn")
            self.assertTrue(reject_btn.is_displayed(),
                            "Reject button should still be visible after cancelling")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ADMIN-02-03 – Approve verification (runs last)                 #
    # ------------------------------------------------------------------ #
    def test_ac_06_admin_can_approve_verification(self):
        """Positive: Admin can approve a verification request (runs last)."""
        driver = make_driver()
        try:
            login_as_admin(driver)
            navigate_to_pending_user(driver)
            tid_click(driver, "admin-approve-btn")

            tid(driver, "admin-confirm-btn")
            tid_click(driver, "admin-confirm-btn")

            time.sleep(5)
            WebDriverWait(driver, WAIT).until(EC.url_contains("/admin"))
            self.assertNotIn("/verification/", driver.current_url,
                             "Should navigate away after approval")
        finally:
            driver.quit()

    def test_ac_07_approved_user_status_updates_on_profile(self):
        """Positive: Approved user's profile shows verified status (runs after approve)."""
        driver = make_driver()
        try:
            login(driver, PENDING_TEST_EMAIL, PENDING_TEST_PASSWORD)
            driver.get(f"{BASE_URL}/profile")
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='profile-info-card']"))
            )
            self.assertIn("Verified", driver.page_source,
                          "User profile should show Verified status after admin approval")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
