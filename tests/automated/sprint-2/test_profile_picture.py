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

VALID_JPG   = os.path.join(ASSETS_DIR, "valid.jpg")
VALID_PNG   = os.path.join(ASSETS_DIR, "valid.png")
INVALID_FILE = os.path.join(ASSETS_DIR, "invalid.pdf")
LARGE_FILE  = os.path.join(ASSETS_DIR, "large.jpg")   # must be > 5MB


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


def get_avatar_src(driver):
    return driver.execute_script("""
        var wrapper = document.querySelector("[data-testid='avatar-image']");
        if (!wrapper) return null;
        var img = wrapper.tagName === 'IMG' ? wrapper : wrapper.querySelector('img');
        return img ? img.src : null;
    """)


def login(driver):
    driver.get(f"{BASE_URL}/login")
    tid_type(driver, "login-email", TEST_EMAIL)
    tid_type(driver, "login-password", TEST_PASSWORD)
    tid_click(driver, "login-btn")
    WebDriverWait(driver, WAIT).until(lambda d: "/login" not in d.current_url)
    driver.get(f"{BASE_URL}/profile")
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='avatar-picker']"))
    )


def upload_file(driver, filepath):
    abs_path = os.path.abspath(filepath)
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


class TestProfilePictureUpload(unittest.TestCase):

    def tearDown(self):
        time.sleep(5)

    # ------------------------------------------------------------------ #
    #  TC1 – Upload button is visible on profile page                    #
    # ------------------------------------------------------------------ #
    def test_tc_01_upload_button_visible(self):
        """Positive: Avatar picker button is visible on profile page."""
        driver = make_driver()
        try:
            login(driver)
            btn = tid(driver, "avatar-picker")
            self.assertTrue(btn.is_displayed(), "Avatar picker should be visible on profile page")
        finally:
            driver.quit()

    def test_tc_01_01_upload_button_not_visible_when_logged_out(self):
        """Negative: Profile page is inaccessible when not logged in."""
        driver = make_driver()
        try:
            driver.get(f"{BASE_URL}/profile")
            WebDriverWait(driver, WAIT).until(EC.url_contains("/login"))
            self.assertIn("/login", driver.current_url,
                          "Unauthenticated user should be redirected to login")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC2 – User can select an image file                               #
    # ------------------------------------------------------------------ #
    def test_tc_02_user_can_select_image(self):
        """Positive: Selecting a valid image shows the Save Changes button."""
        driver = make_driver()
        try:
            login(driver)
            tid_click(driver, "avatar-picker")
            upload_file(driver, VALID_JPG)
            save_btn = WebDriverWait(driver, WAIT).until(
                EC.visibility_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='save-changes-btn']")
                )
            )
            self.assertTrue(save_btn.is_displayed(),
                            "Save Changes button should appear after selecting image")
        finally:
            driver.quit()

    def test_tc_02_01_avatar_preview_updates_after_selection(self):
        """Positive: Avatar preview changes immediately after selecting a new image."""
        driver = make_driver()
        try:
            login(driver)
            src_before = get_avatar_src(driver)
            tid_click(driver, "avatar-picker")
            upload_file(driver, VALID_JPG)
            time.sleep(1)
            src_after = get_avatar_src(driver)
            self.assertNotEqual(src_before, src_after,
                                "Avatar preview should update after selecting a new image")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC3 – System accepts valid file types (jpg, png)                  #
    # ------------------------------------------------------------------ #
    def test_tc_03_accepts_jpg(self):
        """Positive: JPG file is accepted without error."""
        driver = make_driver()
        try:
            login(driver)
            tid_click(driver, "avatar-picker")
            upload_file(driver, VALID_JPG)
            time.sleep(2)
            error_toasts = driver.find_elements(By.CSS_SELECTOR, "[data-sonner-toast][data-type='error']")
            self.assertEqual(len(error_toasts), 0, "No error toast should appear for JPG")
        finally:
            driver.quit()

    def test_tc_03_01_accepts_png(self):
        """Positive: PNG file is accepted without error."""
        driver = make_driver()
        try:
            login(driver)
            tid_click(driver, "avatar-picker")
            upload_file(driver, VALID_PNG)
            time.sleep(2)
            error_toasts = driver.find_elements(By.CSS_SELECTOR, "[data-sonner-toast][data-type='error']")
            self.assertEqual(len(error_toasts), 0, "No error toast should appear for PNG")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC4 – System rejects invalid file types                           #
    # ------------------------------------------------------------------ #
    def test_tc_04_rejects_pdf(self):
        """Negative: PDF file is rejected with an error toast."""
        driver = make_driver()
        try:
            login(driver)
            tid_click(driver, "avatar-picker")
            upload_file(driver, INVALID_FILE)
            toast_text = get_error_toast(driver)
            self.assertIn("images are allowed", toast_text,
                          "Should show error toast for invalid file type")
        finally:
            driver.quit()

    def test_tc_04_01_save_button_not_shown_after_invalid_file(self):
        """Negative: Save Changes button should not appear after invalid file upload."""
        driver = make_driver()
        try:
            login(driver)
            tid_click(driver, "avatar-picker")
            upload_file(driver, INVALID_FILE)
            time.sleep(2)
            buttons = driver.find_elements(By.CSS_SELECTOR, "[data-testid='save-changes-btn']")
            self.assertEqual(len(buttons), 0,
                             "Save button should not appear after invalid file upload")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC5 – System validates file size limit (5MB)                      #
    # ------------------------------------------------------------------ #
    def test_tc_05_rejects_oversized_file(self):
        """Negative: File over 5MB is rejected with an error toast."""
        driver = make_driver()
        try:
            login(driver)
            tid_click(driver, "avatar-picker")
            upload_file(driver, LARGE_FILE)
            toast_text = get_error_toast(driver)
            self.assertIn("Image must be under 5MB", toast_text,
                          "Should show error toast for oversized file")
        finally:
            driver.quit()

    def test_tc_05_01_save_button_not_shown_after_oversized_file(self):
        """Negative: Save Changes button should not appear after oversized file upload."""
        driver = make_driver()
        try:
            login(driver)
            tid_click(driver, "avatar-picker")
            upload_file(driver, LARGE_FILE)
            time.sleep(2)
            buttons = driver.find_elements(By.CSS_SELECTOR, "[data-testid='save-changes-btn']")
            self.assertEqual(len(buttons), 0,
                             "Save button should not appear after oversized file upload")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC6 – Image is uploaded and stored in Supabase                    #
    # ------------------------------------------------------------------ #
    def test_tc_06_image_uploaded_to_supabase(self):
        """Positive: Saved avatar src points to Supabase storage."""
        driver = make_driver()
        try:
            login(driver)
            tid_click(driver, "avatar-picker")
            upload_file(driver, VALID_JPG)
            tid_click(driver, "save-changes-btn")
            WebDriverWait(driver, WAIT).until(
                EC.visibility_of_element_located(
                    (By.XPATH, "//*[contains(text(), 'Profile updated')]")
                )
            )
            driver.get(f"{BASE_URL}/profile")
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='avatar-image']"))
            )
            src = get_avatar_src(driver)
            print(f"[Upload] Avatar src after upload: {src}")
            self.assertIsNotNone(src, "Avatar src should not be None after upload")
            self.assertIn("supabase", src, "Avatar should be stored in Supabase storage")
        finally:
            driver.quit()

    def test_tc_06_01_avatar_persists_after_reload(self):
        """Positive: Uploaded avatar is still shown after page reload."""
        driver = make_driver()
        try:
            login(driver)
            tid_click(driver, "avatar-picker")
            upload_file(driver, VALID_JPG)
            tid_click(driver, "save-changes-btn")
            WebDriverWait(driver, WAIT).until(
                EC.visibility_of_element_located(
                    (By.XPATH, "//*[contains(text(), 'Profile updated')]")
                )
            )
            src_after_save = get_avatar_src(driver)

            driver.get(f"{BASE_URL}/profile")
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='avatar-image']"))
            )
            src_after_reload = get_avatar_src(driver)
            self.assertIsNotNone(src_after_reload, "Avatar should still be present after reload")
            self.assertIn("supabase", src_after_reload,
                          "Avatar should still point to Supabase after reload")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC7 – Profile picture updates instantly after upload              #
    # ------------------------------------------------------------------ #
    def test_tc_07_profile_picture_updates_instantly(self):
        """Positive: Avatar src changes immediately after save without page reload."""
        driver = make_driver()
        try:
            login(driver)
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='avatar-image']"))
            )
            src_before = get_avatar_src(driver)
            print(f"[Upload] Avatar src before: {src_before}")

            tid_click(driver, "avatar-picker")
            upload_file(driver, VALID_JPG)
            tid_click(driver, "save-changes-btn")
            WebDriverWait(driver, WAIT).until(
                EC.visibility_of_element_located(
                    (By.XPATH, "//*[contains(text(), 'Profile updated')]")
                )
            )
            src_after = get_avatar_src(driver)
            print(f"[Upload] Avatar src after: {src_after}")
            self.assertNotEqual(src_before, src_after,
                                "Avatar src should change immediately after upload")
        finally:
            driver.quit()

    def test_tc_07_01_unsaved_selection_does_not_persist(self):
        """Edge: Selecting an image but not saving should not persist after reload."""
        driver = make_driver()
        try:
            login(driver)
            src_before = get_avatar_src(driver)

            tid_click(driver, "avatar-picker")
            upload_file(driver, VALID_JPG)
            # Do NOT click save — just reload
            driver.get(f"{BASE_URL}/profile")
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='avatar-image']"))
            )
            src_after_reload = get_avatar_src(driver)
            self.assertEqual(src_before, src_after_reload,
                             "Unsaved avatar selection should not persist after reload")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
