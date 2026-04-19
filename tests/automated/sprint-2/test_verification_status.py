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

BASE_URL          = os.getenv("BASE_URL")
ASSETS_DIR        = os.path.join(os.path.dirname(__file__), "assets")
VALID_JPG         = os.path.join(ASSETS_DIR, "valid.jpg")
ADMIN_EMAIL       = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD    = os.getenv("ADMIN_PASSWORD")
PENDING_EMAIL     = os.getenv("PENDING_TEST_EMAIL")
PENDING_PASSWORD  = os.getenv("PENDING_TEST_PASSWORD")
APPROVED_EMAIL    = os.getenv("APPROVED_TEST_EMAIL")
APPROVED_PASSWORD = os.getenv("APPROVED_TEST_PASSWORD")
NOT_VERIFIED_EMAIL    = os.getenv("NOT_VERIFIED_TEST_EMAIL")
NOT_VERIFIED_PASSWORD = os.getenv("NOT_VERIFIED_TEST_PASSWORD")

WAIT = 20


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


def login(driver, email, password):
    driver.get(f"{BASE_URL}/login")
    tid_type(driver, "login-email", email)
    tid_type(driver, "login-password", password)
    tid_click(driver, "login-btn")
    WebDriverWait(driver, WAIT).until(lambda d: "/login" not in d.current_url)


def go_to_profile(driver):
    driver.get(f"{BASE_URL}/profile")
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='profile-info-card']"))
    )


def get_verification_status_text(driver):
    badge = tid(driver, "verification-status")
    return badge.text


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


def resubmit_verification(driver):
    """After a reject/approve, resubmit the verification form so the account
    is back to Pending for the next test run."""
    go_to_profile(driver)
    tid_click(driver, "verify-account-btn")
    WebDriverWait(driver, WAIT).until(EC.url_contains("/verify"))

    # Step 1
    tid_type(driver, "step1-first-name", "Test")
    tid_type(driver, "step1-last-name", "User")
    tid_click(driver, "step1-gender-male")
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
        EC.presence_of_element_located(
            (By.XPATH, "//*[contains(text(), 'Verification Submitted')]")
        )
    )


def admin_action_on_user(admin_driver, target_email, action):
    """
    Logs in as admin, finds the pending user by email in the accounts list,
    navigates to their verification detail, and performs 'approve' or 'reject'.
    """
    login(admin_driver, ADMIN_EMAIL, ADMIN_PASSWORD)
    admin_driver.get(f"{BASE_URL}/admin/accounts")

    # Filter to pending tab
    WebDriverWait(admin_driver, WAIT).until(
        EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Pending')]"))
    )
    pending_btn = admin_driver.find_element(By.XPATH, "//*[contains(text(), 'Pending')]")
    admin_driver.execute_script("arguments[0].click();", pending_btn)

    # Click the card matching the target email
    user_card = WebDriverWait(admin_driver, WAIT).until(
        EC.presence_of_element_located((By.XPATH, f"//*[contains(text(), '{target_email}')]"))
    )
    admin_driver.execute_script("arguments[0].click();", user_card)

    # On verification detail page — click approve or reject
    WebDriverWait(admin_driver, WAIT).until(EC.url_contains("/admin/verification/"))
    tid_click(admin_driver, f"admin-{action}-btn")

    # Confirm in modal
    tid_click(admin_driver, "admin-confirm-btn")

    # Wait for navigation back (modal closes and router.back() fires)
    WebDriverWait(admin_driver, WAIT).until(
        lambda d: "/admin/verification/" not in d.current_url
    )


class TestVerificationStatus(unittest.TestCase):

    def tearDown(self):
        time.sleep(2)

    # ------------------------------------------------------------------ #
    #  TC-VER-02-01 – Verification status is visible on profile page     #
    # ------------------------------------------------------------------ #
    def test_ver_02_01_status_visible_on_profile(self):
        """Positive: Verification status badge is visible on the profile page."""
        driver = make_driver()
        try:
            login(driver, PENDING_EMAIL, PENDING_PASSWORD)
            go_to_profile(driver)
            badge = tid(driver, "verification-status")
            self.assertTrue(badge.is_displayed(),
                            "Verification status badge should be visible on profile page")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-VER-02-02 – Status displays correct values                     #
    # ------------------------------------------------------------------ #
    def test_ver_02_02_pending_status_displays_correctly(self):
        """Positive: Profile shows 'Pending Verification' for a pending account."""
        driver = make_driver()
        try:
            login(driver, PENDING_EMAIL, PENDING_PASSWORD)
            go_to_profile(driver)
            text = get_verification_status_text(driver)
            self.assertIn("Pending", text,
                          "Status badge should display 'Pending Verification'")
        finally:
            driver.quit()

    def test_ver_02_02_approved_status_displays_correctly(self):
        """Positive: Profile shows 'Verified' for an approved account."""
        driver = make_driver()
        try:
            login(driver, APPROVED_EMAIL, APPROVED_PASSWORD)
            go_to_profile(driver)
            text = get_verification_status_text(driver)
            self.assertIn("Verified", text,
                          "Status badge should display 'Verified'")
        finally:
            driver.quit()

    def test_ver_02_02_not_verified_status_displays_correctly(self):
        """Positive: Profile shows 'Not Verified' for an unverified account."""
        driver = make_driver()
        try:
            login(driver, NOT_VERIFIED_EMAIL, NOT_VERIFIED_PASSWORD)
            go_to_profile(driver)
            text = get_verification_status_text(driver)
            self.assertIn("Not Verified", text,
                          "Status badge should display 'Not Verified'")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-VER-02-03 – Status updates automatically after admin action    #
    # ------------------------------------------------------------------ #
    def test_ver_02_03a_status_updates_to_not_verified_after_admin_rejects(self):
        """Positive: Status changes to Not Verified on profile after admin rejects."""
        user_driver = make_driver()
        admin_driver = make_driver()
        try:
            login(user_driver, PENDING_EMAIL, PENDING_PASSWORD)
            go_to_profile(user_driver)
            before = get_verification_status_text(user_driver)
            self.assertIn("Pending", before, "Status should be Pending before admin action")

            admin_action_on_user(admin_driver, PENDING_EMAIL, "reject")

            go_to_profile(user_driver)
            after = get_verification_status_text(user_driver)
            self.assertIn("Not Verified", after,
                          "Status should update to Not Verified after admin rejects")

            # Resubmit so account is back to Pending for the approve test
            resubmit_verification(user_driver)
        finally:
            user_driver.quit()
            admin_driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-VER-02-04 – User receives notification when status changes     #
    # ------------------------------------------------------------------ #
    def test_ver_02_03a_notification_received_after_admin_rejects(self):
        """Positive: User receives a notification after admin rejects verification."""
        user_driver = make_driver()
        admin_driver = make_driver()
        try:
            login(user_driver, PENDING_EMAIL, PENDING_PASSWORD)

            admin_action_on_user(admin_driver, PENDING_EMAIL, "reject")

            # Resubmit so account is back to Pending for the approve test
            resubmit_verification(user_driver)

            user_driver.get(f"{BASE_URL}/notifications")
            WebDriverWait(user_driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.XPATH, "//*[contains(text(), 'verif') or contains(text(), 'Verif') or contains(text(), 'rejected') or contains(text(), 'Rejected')]")
                )
            )
            notification_text = user_driver.find_element(
                By.XPATH,
                "//*[contains(text(), 'verif') or contains(text(), 'Verif') or contains(text(), 'rejected') or contains(text(), 'Rejected')]"
            ).text
            self.assertTrue(len(notification_text) > 0,
                            "User should receive a notification after admin rejects")
        finally:
            user_driver.quit()
            admin_driver.quit()

    def test_ver_02_04a_status_updates_to_verified_after_admin_approves(self):
        """Positive: Status changes to Verified on profile after admin approves."""
        user_driver = make_driver()
        admin_driver = make_driver()
        try:
            login(user_driver, PENDING_EMAIL, PENDING_PASSWORD)
            go_to_profile(user_driver)
            before = get_verification_status_text(user_driver)
            self.assertIn("Pending", before, "Status should be Pending before admin action")

            admin_action_on_user(admin_driver, PENDING_EMAIL, "approve")

            go_to_profile(user_driver)
            after = get_verification_status_text(user_driver)
            self.assertIn("Verified", after,
                          "Status should update to Verified after admin approves")
        finally:
            user_driver.quit()
            admin_driver.quit()

    def test_ver_02_04b_notification_received_after_admin_approves(self):
        """Positive: User receives a notification after admin approves verification."""
        user_driver = make_driver()
        admin_driver = make_driver()
        try:
            login(user_driver, APPROVED_EMAIL, APPROVED_PASSWORD)

            user_driver.get(f"{BASE_URL}/notifications")
            WebDriverWait(user_driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.XPATH, "//*[contains(text(), 'verif') or contains(text(), 'Verif') or contains(text(), 'approved') or contains(text(), 'Approved')]")
                )
            )
            notification_text = user_driver.find_element(
                By.XPATH,
                "//*[contains(text(), 'verif') or contains(text(), 'Verif') or contains(text(), 'approved') or contains(text(), 'Approved')]"
            ).text
            self.assertTrue(len(notification_text) > 0,
                            "User should receive a notification after admin approves")
        finally:
            user_driver.quit()
            admin_driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
