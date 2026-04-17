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

BASE_URL = os.getenv("BASE_URL")
TEST_EMAIL = os.getenv("PROFILE_TEST_EMAIL")
TEST_PASSWORD = os.getenv("PROFILE_TEST_PASSWORD")

WAIT = 20
ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")

VALID_JPG    = os.path.join(ASSETS_DIR, "valid.jpg")
VALID_PNG    = os.path.join(ASSETS_DIR, "valid.png")
INVALID_FILE = os.path.join(ASSETS_DIR, "invalid.pdf")
LARGE_FILE   = os.path.join(ASSETS_DIR, "large.jpg")   # must be > 5MB


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


def get_error_toast(driver):
    WebDriverWait(driver, WAIT).until(
        lambda d: len(d.find_elements(By.CSS_SELECTOR, "[data-sonner-toast][data-type='error']")) > 0
    )
    toasts = driver.find_elements(By.CSS_SELECTOR, "[data-sonner-toast][data-type='error']")
    return " ".join(t.text for t in toasts)


def get_image_src(driver, test_id):
    return driver.execute_script("""
        var wrapper = document.querySelector("[data-testid='" + arguments[0] + "']");
        if (!wrapper) return null;
        var img = wrapper.tagName === 'IMG' ? wrapper : wrapper.querySelector('img');
        return img ? img.src : null;
    """, test_id)


def login(driver):
    driver.get(f"{BASE_URL}/login")
    tid_type(driver, "login-email", TEST_EMAIL)
    tid_type(driver, "login-password", TEST_PASSWORD)
    tid_click(driver, "login-btn")
    WebDriverWait(driver, WAIT).until(lambda d: "/login" not in d.current_url)


def navigate_to_step4(driver):
    """Login, go to profile, click Verify Account, and navigate through steps 1-3."""
    login(driver)
    driver.get(f"{BASE_URL}/profile")
    tid_click(driver, "verify-account-btn")
    WebDriverWait(driver, WAIT).until(EC.url_contains("/verify"))

    # Step 1 — fill minimum required fields
    tid_type(driver, "step1-first-name", "Test")
    tid_type(driver, "step1-last-name", "User")
    tid_click(driver, "step1-gender-male")
    # Set date via the hidden native input
    driver.execute_script("""
        var el = document.querySelector("[data-testid='step1-dob-input-native']");
        el.removeAttribute('style');
        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, '2000-01-01');
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    """)
    tid_click(driver, "verify-next-btn")

    # Step 2 — select province/city/barangay dropdowns and fill address
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

    # Step 3 — select utility bill type and upload front/back
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='step3-bill-water']"))
    )
    tid_click(driver, "step3-bill-water")
    upload_file_to_slot(driver, "step3-front-upload-btn", VALID_JPG)
    upload_file_to_slot(driver, "step3-back-upload-btn", VALID_JPG)
    tid_click(driver, "verify-next-btn")

    # Now on Step 4
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='id-type-national-id']"))
    )


def upload_file_to_slot(driver, btn_test_id, filepath):
    """Click an upload slot button then inject the file into the file input."""
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


class TestIDUpload(unittest.TestCase):

    def tearDown(self):
        time.sleep(3)

    # ------------------------------------------------------------------ #
    #  AC-01 – Upload option is visible on verification page             #
    # ------------------------------------------------------------------ #
    def test_ac_01_verify_button_visible_on_profile(self):
        """Positive: Verify Account button is visible on profile for unverified users."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/profile")
            btn = tid(driver, "verify-account-btn")
            self.assertTrue(btn.is_displayed(),
                            "Verify Account button should be visible on profile page")
        finally:
            driver.quit()

    def test_ac_01_01_upload_slots_visible_on_step4(self):
        """Positive: ID upload slots are visible on Step 4 after selecting an ID type."""
        driver = make_driver()
        try:
            navigate_to_step4(driver)
            tid_click(driver, "id-type-national-id")
            front_btn = tid(driver, "id-front-upload-btn")
            back_btn = tid(driver, "id-back-upload-btn")
            self.assertTrue(front_btn.is_displayed(), "Front upload slot should be visible")
            self.assertTrue(back_btn.is_displayed(), "Back upload slot should be visible")
        finally:
            driver.quit()

    def test_ac_01_02_upload_slots_hidden_before_id_type_selected(self):
        """Edge: Upload slots are not visible before selecting an ID type."""
        driver = make_driver()
        try:
            navigate_to_step4(driver)
            slots = driver.find_elements(By.CSS_SELECTOR, "[data-testid='id-front-upload-btn']")
            self.assertEqual(len(slots), 0,
                             "Upload slots should not appear before ID type is selected")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-02 – User can select ID file                                   #
    # ------------------------------------------------------------------ #
    def test_ac_02_user_can_upload_jpg(self):
        """Positive: User can upload a JPG as ID front."""
        driver = make_driver()
        try:
            navigate_to_step4(driver)
            tid_click(driver, "id-type-national-id")
            upload_file_to_slot(driver, "id-front-upload-btn", VALID_JPG)
            preview = tid(driver, "id-front-preview")
            self.assertTrue(preview.is_displayed(), "Front ID preview should appear after upload")
        finally:
            driver.quit()

    def test_ac_02_01_user_can_upload_png(self):
        """Positive: User can upload a PNG as ID front."""
        driver = make_driver()
        try:
            navigate_to_step4(driver)
            tid_click(driver, "id-type-national-id")
            upload_file_to_slot(driver, "id-front-upload-btn", VALID_PNG)
            preview = tid(driver, "id-front-preview")
            self.assertTrue(preview.is_displayed(), "Front ID preview should appear after PNG upload")
        finally:
            driver.quit()

    def test_ac_02_02_user_can_upload_both_front_and_back(self):
        """Positive: User can upload both front and back ID images."""
        driver = make_driver()
        try:
            navigate_to_step4(driver)
            tid_click(driver, "id-type-national-id")
            upload_file_to_slot(driver, "id-front-upload-btn", VALID_JPG)
            upload_file_to_slot(driver, "id-back-upload-btn", VALID_JPG)
            self.assertTrue(tid(driver, "id-front-preview").is_displayed())
            self.assertTrue(tid(driver, "id-back-preview").is_displayed())
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-03 – System validates file type and size                       #
    # ------------------------------------------------------------------ #
    def test_ac_03_rejects_invalid_file_type(self):
        """Negative: Invalid file type shows error toast."""
        driver = make_driver()
        try:
            navigate_to_step4(driver)
            tid_click(driver, "id-type-national-id")
            upload_file_to_slot(driver, "id-front-upload-btn", INVALID_FILE)
            toast_text = get_error_toast(driver)
            self.assertEqual("Only JPG, PNG, or WebP images are allowed", toast_text,
                          "Should show error for unsupported file type")
        finally:
            driver.quit()

    def test_ac_03_01_rejects_oversized_file(self):
        """Negative: File over 5MB shows error toast."""
        driver = make_driver()
        try:
            navigate_to_step4(driver)
            tid_click(driver, "id-type-national-id")
            upload_file_to_slot(driver, "id-front-upload-btn", LARGE_FILE)
            toast_text = get_error_toast(driver)
            self.assertIn("exceeds", toast_text,
                          "Should show error for oversized file")
        finally:
            driver.quit()

    def test_ac_03_02_submit_without_id_shows_error(self):
        """Negative: Submitting Step 4 without uploading ID shows validation error."""
        driver = make_driver()
        try:
            navigate_to_step4(driver)
            tid_click(driver, "id-type-national-id")
            # Do not upload anything, just click submit
            tid_click(driver, "verify-next-btn")
            toast_text = get_error_toast(driver)
            self.assertIn("required", toast_text.lower(),
                          "Should show validation error when ID is not uploaded")
        finally:
            driver.quit()

    def test_ac_03_03_submit_without_id_type_shows_error(self):
        """Negative: Submitting Step 4 without selecting ID type shows validation error."""
        driver = make_driver()
        try:
            navigate_to_step4(driver)
            # Do not select ID type, just click submit
            tid_click(driver, "verify-next-btn")
            toast_text = get_error_toast(driver)
            self.assertIn("select an ID type", toast_text,
                          "Should show error when no ID type is selected")
        finally:
            driver.quit()

   
    # ------------------------------------------------------------------ #
    #  AC-05 – User can view uploaded ID                                 #
    # ------------------------------------------------------------------ #
    def test_ac_05_uploaded_id_preview_visible(self):
        """Positive: Uploaded ID image preview is visible after upload."""
        driver = make_driver()
        try:
            navigate_to_step4(driver)
            tid_click(driver, "id-type-national-id")
            upload_file_to_slot(driver, "id-front-upload-btn", VALID_JPG)

            src = get_image_src(driver, "id-front-preview")
            self.assertIsNotNone(src, "Front ID preview src should not be None")
            self.assertTrue(len(src) > 0, "Front ID preview should have a valid src")
        finally:
            driver.quit()

    def test_ac_05_01_both_previews_visible_after_upload(self):
        """Positive: Both front and back ID previews are visible after uploading."""
        driver = make_driver()
        try:
            navigate_to_step4(driver)
            tid_click(driver, "id-type-national-id")
            upload_file_to_slot(driver, "id-front-upload-btn", VALID_JPG)
            upload_file_to_slot(driver, "id-back-upload-btn", VALID_JPG)

            front_src = get_image_src(driver, "id-front-preview")
            back_src = get_image_src(driver, "id-back-preview")
            self.assertIsNotNone(front_src, "Front preview should be visible")
            self.assertIsNotNone(back_src, "Back preview should be visible")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-06 – User can replace the ID                                   #
    # ------------------------------------------------------------------ #
    def test_ac_06_user_can_remove_and_replace_id(self):
        """Positive: User can remove uploaded ID and upload a new one."""
        driver = make_driver()
        try:
            navigate_to_step4(driver)
            tid_click(driver, "id-type-national-id")
            upload_file_to_slot(driver, "id-front-upload-btn", VALID_JPG)

            src_before = get_image_src(driver, "id-front-preview")

            # Remove the uploaded image
            tid_click(driver, "id-front-remove-btn")
            time.sleep(1)

            # Upload slot should be empty again
            slots = driver.find_elements(By.CSS_SELECTOR, "[data-testid='id-front-preview']")
            self.assertEqual(len(slots), 0, "Preview should disappear after removal")

            # Upload a new image
            upload_file_to_slot(driver, "id-front-upload-btn", VALID_PNG)
            src_after = get_image_src(driver, "id-front-preview")

            self.assertIsNotNone(src_after, "New preview should appear after replacement")
            self.assertNotEqual(src_before, src_after, "New image src should differ from original")
        finally:
            driver.quit()

    def test_ac_06_01_remove_button_visible_only_after_upload(self):
        """Edge: Remove button is only visible after an image has been uploaded."""
        driver = make_driver()
        try:
            navigate_to_step4(driver)
            tid_click(driver, "id-type-national-id")

            # Before upload — remove button should not exist
            before = driver.find_elements(By.CSS_SELECTOR, "[data-testid='id-front-remove-btn']")
            self.assertEqual(len(before), 0, "Remove button should not appear before upload")

            # After upload — remove button should appear
            upload_file_to_slot(driver, "id-front-upload-btn", VALID_JPG)
            remove_btn = tid(driver, "id-front-remove-btn")
            self.assertTrue(remove_btn.is_displayed(), "Remove button should appear after upload")
        finally:
            driver.quit()
    # ------------------------------------------------------------------ #
    #  AC-04 – Uploaded ID is stored securely | Renamed for Sort Purposes #
    # ------------------------------------------------------------------ #
    def test_ac_08_successful_submission_shows_success_screen(self):
        """Positive: Completing all steps and submitting shows the success screen."""
        driver = make_driver()
        try:
            navigate_to_step4(driver)
            tid_click(driver, "id-type-national-id")
            upload_file_to_slot(driver, "id-front-upload-btn", VALID_JPG)
            upload_file_to_slot(driver, "id-back-upload-btn", VALID_JPG)
            tid_click(driver, "verify-next-btn")

            WebDriverWait(driver, WAIT * 2).until(
                EC.visibility_of_element_located(
                    (By.XPATH, "//*[contains(text(), 'Verification Submitted')]")
                )
            )
            self.assertIn("Verification Submitted", driver.page_source,
                          "Success screen should appear after submission")
        finally:
            driver.quit()

    def test_ac_09_pending_status_shown_on_profile_after_submission(self):
        """Positive: Profile shows pending status after test_ac_08 submits the form."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/profile")
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='profile-info-card']"))
            )
            self.assertIn("Pending", driver.page_source,
                          "Profile should show pending verification status after submission")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
